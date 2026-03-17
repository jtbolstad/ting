import type { Prisma } from "@prisma/client";
import type {
  MemberGroup as SharedMemberGroup,
  Membership as SharedMembership,
  Organization as SharedOrganization,
  User,
} from "@ting/shared";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

type MembershipWithRelations = Prisma.MembershipGetPayload<{
  include: {
    organization: true;
    groups: {
      include: {
        group: true;
      };
    };
  };
}>;

export async function hashPassword(password: string): Promise<string> {
  return bcryptjs.hash(password, SALT_ROUNDS);
}

export async function comparePassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcryptjs.compare(password, hash);
}

export function generateToken(user: User): string {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: "7d" },
  );
}

export function verifyToken(token: string): {
  id: string;
  email: string;
  role: string;
} {
  return jwt.verify(token, JWT_SECRET) as {
    id: string;
    email: string;
    role: string;
  };
}

export function serializeOrganization(org: {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}): SharedOrganization {
  return {
    id: org.id,
    name: org.name,
    slug: org.slug,
    description: org.description,
    createdAt: org.createdAt.toISOString(),
    updatedAt: org.updatedAt.toISOString(),
  };
}

export function serializeMemberGroup(group: {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}): SharedMemberGroup {
  return {
    id: group.id,
    organizationId: group.organizationId,
    name: group.name,
    description: group.description,
    createdAt: group.createdAt.toISOString(),
    updatedAt: group.updatedAt.toISOString(),
  };
}

export function serializeMembership(
  membership: MembershipWithRelations,
): SharedMembership {
  return {
    id: membership.id,
    organizationId: membership.organizationId,
    organization: serializeOrganization(membership.organization),
    userId: membership.userId,
    role: membership.role as SharedMembership["role"],
    status: membership.status as SharedMembership["status"],
    isDefault: membership.isDefault,
    createdAt: membership.createdAt.toISOString(),
    updatedAt: membership.updatedAt.toISOString(),
    groups: membership.groups.map((groupMembership) =>
      serializeMemberGroup(groupMembership.group),
    ),
  };
}

export function serializeUser(
  user: any,
  memberships?: MembershipWithRelations[],
): User {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    memberships: memberships?.map(serializeMembership),
  };
}
