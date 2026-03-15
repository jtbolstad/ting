import { Router } from 'express';
import type { Request, Response } from 'express';
import { prisma } from '../prisma.js';
import { hashPassword, comparePassword, generateToken, serializeUser, serializeMembership } from '../services/auth.js';
import { authenticate, type AuthRequest } from '../middleware/auth.js';
import type { LoginInput, CreateUserInput, AuthResponse, ApiResponse, Membership } from '@ting/shared';

const router = Router();
const membershipInclude = {
  organization: true,
  groups: {
    include: {
      group: true,
    },
  },
} as const;

async function getMemberships(userId: string) {
  return prisma.membership.findMany({
    where: {
      userId,
      status: 'ACTIVE',
    },
    include: membershipInclude,
    orderBy: {
      createdAt: 'asc',
    },
  });
}

function buildAuthResponse(user: any, membershipsData: any[]) {
  const serializedMemberships = membershipsData.map(serializeMembership);
  const serializedUser = serializeUser(user, membershipsData);
  const activeMembership = membershipsData.find((m) => m.isDefault) ?? membershipsData[0] ?? null;

  const token = generateToken(serializedUser);

  return {
    serializedUser,
    token,
    serializedMemberships,
    activeMembershipId: activeMembership?.id ?? null,
  };
}

// Register new user
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name, organizationId } = req.body as CreateUserInput & { organizationId?: string };

    if (!email || !password || !name) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email, password, and name are required' 
      });
    }

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        error: 'organizationId is required',
      });
    }

    const organization = await prisma.organization.findUnique({ where: { id: organizationId } });
    if (!organization) {
      return res.status(404).json({ success: false, error: 'Organization not found' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email already registered' 
      });
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        role: 'MEMBER',
      },
    });

    await prisma.membership.create({
      data: {
        userId: user.id,
        organizationId,
        role: 'MEMBER',
        status: 'ACTIVE',
        isDefault: true,
      },
    });

    const membershipsData = await getMemberships(user.id);
    const { serializedUser, token, serializedMemberships, activeMembershipId } = buildAuthResponse(user, membershipsData);

    const response: ApiResponse<AuthResponse> = {
      success: true,
      data: { 
        user: serializedUser, 
        token,
        memberships: serializedMemberships as Membership[],
        activeMembershipId,
      },
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, error: 'Registration failed' });
  }
});

// Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as LoginInput;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email and password are required' 
      });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid credentials' 
      });
    }

    const validPassword = await comparePassword(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid credentials' 
      });
    }

    const membershipsData = await getMemberships(user.id);
    const { serializedUser, token, serializedMemberships, activeMembershipId } = buildAuthResponse(user, membershipsData);

    const response: ApiResponse<AuthResponse> = {
      success: true,
      data: { 
        user: serializedUser, 
        token,
        memberships: serializedMemberships as Membership[],
        activeMembershipId,
      },
    };

    res.json(response);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Login failed' });
  }
});

// Get current user
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ 
      where: { id: req.user!.id } 
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const membershipsData = await getMemberships(user.id);
    const serializedUser = serializeUser(user, membershipsData);
    const serializedMemberships = membershipsData.map(serializeMembership);
    const activeMembership = membershipsData.find((m) => m.isDefault) ?? membershipsData[0] ?? null;

    const response: ApiResponse<any> = {
      success: true,
      data: { 
        user: serializedUser, 
        memberships: serializedMemberships as Membership[],
        activeMembershipId: activeMembership?.id ?? null,
      },
    };

    res.json(response);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ success: false, error: 'Failed to get user' });
  }
});

export default router;
