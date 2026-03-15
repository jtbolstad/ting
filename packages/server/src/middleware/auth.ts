import type { Request, Response, NextFunction } from 'express';
import type { Prisma, Organization } from '@prisma/client';
import { verifyToken } from '../services/auth.js';

export type MembershipWithOrg = Prisma.MembershipGetPayload<{
  include: {
    organization: true;
    groups: {
      include: {
        group: true;
      };
    };
  };
}>;

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
  organization?: Organization;
  membership?: MembershipWithOrg | null;
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'No token provided' });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ success: false, error: 'Admin access required' });
  }
  next();
}
