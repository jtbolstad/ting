import type { Response, NextFunction } from 'express';
import { prisma } from '../prisma.js';
import type { AuthRequest } from './auth.js';

type OrgRole = 'MEMBER' | 'MANAGER' | 'ADMIN' | 'OWNER';

const ROLE_RANK: Record<OrgRole, number> = {
  MEMBER: 1,
  MANAGER: 2,
  ADMIN: 3,
  OWNER: 4,
};

interface OrgContextOptions {
  requireMembership?: boolean;
  allowDefault?: boolean;
  allowOrgQuery?: boolean;
}

const defaultOptions: Required<OrgContextOptions> = {
  requireMembership: true,
  allowDefault: true,
  allowOrgQuery: true,
};

export function withOrganizationContext(options?: OrgContextOptions) {
  const resolvedOptions = { ...defaultOptions, ...options };

  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const headerOrgId = (req.headers['x-organization-id'] as string | undefined)?.trim();
      const queryOrgId =
        resolvedOptions.allowOrgQuery && typeof req.query.organizationId === 'string'
          ? req.query.organizationId
          : undefined;
      const queryOrgSlug =
        resolvedOptions.allowOrgQuery && typeof req.query.organizationSlug === 'string'
          ? req.query.organizationSlug
          : undefined;

      const identifierProvided = Boolean(headerOrgId || queryOrgId || queryOrgSlug);
      let organizationId = headerOrgId || queryOrgId || undefined;
      let organization =
        organizationId
          ? await prisma.organization.findUnique({ where: { id: organizationId } })
          : queryOrgSlug
            ? await prisma.organization.findUnique({ where: { slug: queryOrgSlug } })
            : null;

      let membership = req.membership ?? null;

      if (!organization && resolvedOptions.requireMembership && resolvedOptions.allowDefault && req.user) {
        membership = await prisma.membership.findFirst({
          where: {
            userId: req.user.id,
            status: 'ACTIVE',
            ...(organizationId ? { organizationId } : {}),
          },
          include: {
            organization: true,
            groups: {
              include: { group: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        });
        organization = membership?.organization ?? organization;
      }

      if (!organization) {
        const status = identifierProvided ? 404 : 400;
        const message = identifierProvided ? 'Organization not found' : 'Organization context is required';
        return res.status(status).json({ success: false, error: message });
      }

      if (req.user && !membership) {
        membership = await prisma.membership.findFirst({
          where: {
            userId: req.user.id,
            organizationId: organization.id,
            status: 'ACTIVE',
          },
          include: {
            organization: true,
            groups: {
              include: { group: true },
            },
          },
        });
      }

      if (resolvedOptions.requireMembership && !membership && req.user?.role !== 'ADMIN') {
        return res.status(403).json({ success: false, error: 'Organization membership required' });
      }

      req.organization = organization;
      req.membership = membership ?? null;

      return next();
    } catch (error) {
      console.error('Organization context error:', error);
      return res.status(500).json({ success: false, error: 'Failed to resolve organization context' });
    }
  };
}

export function requireOrgRole(minRole: OrgRole | OrgRole[]) {
  const requiredRoles = Array.isArray(minRole) ? minRole : [minRole];

  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.user?.role === 'ADMIN') {
      return next();
    }

    if (!req.membership) {
      return res.status(403).json({ success: false, error: 'Organization membership required' });
    }

    const hasRole = requiredRoles.some((role) => {
      if (ROLE_RANK[role] === undefined) return false;
      const membershipRank = ROLE_RANK[req.membership!.role as OrgRole] ?? 0;
      return membershipRank >= ROLE_RANK[role];
    });

    if (!hasRole) {
      return res.status(403).json({ success: false, error: 'Insufficient organization role' });
    }

    return next();
  };
}

export const resolveOrganizationPublic = withOrganizationContext({
  requireMembership: false,
  allowDefault: false,
});

export function hasOrgRole(req: AuthRequest, minRole: OrgRole) {
  if (req.user?.role === 'ADMIN') {
    return true;
  }
  if (!req.membership) {
    return false;
  }
  const membershipRank = ROLE_RANK[req.membership.role as OrgRole] ?? 0;
  return membershipRank >= ROLE_RANK[minRole];
}
