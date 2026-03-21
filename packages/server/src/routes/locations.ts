import type { Router as ExpressRouter, Response } from 'express';
import { Router } from 'express';
import { authenticate, type AuthRequest } from '../middleware/auth.js';
import { requireOrgRole, withOrganizationContext } from '../middleware/organization.js';
import { prisma } from '../prisma.js';

const router: ExpressRouter = Router();

// List locations for an organization (public)
router.get('/', withOrganizationContext({ requireMembership: false }), async (req: AuthRequest, res: Response) => {
  try {
    const locations = await prisma.location.findMany({
      where: { organizationId: req.organization!.id },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: locations });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Kunne ikke hente lokasjoner' });
  }
});

// Create location (MANAGER+)
router.post('/', authenticate, withOrganizationContext(), requireOrgRole('MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    const { name, address, description } = req.body;
    if (!name) return res.status(400).json({ success: false, error: 'Navn er påkrevd' });

    const location = await prisma.location.create({
      data: { organizationId: req.organization!.id, name, address: address || null, description: description || null },
    });
    res.status(201).json({ success: true, data: location });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Kunne ikke opprette lokasjon' });
  }
});

// Update location (MANAGER+)
router.patch('/:id', authenticate, withOrganizationContext(), requireOrgRole('MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await prisma.location.findFirst({ where: { id, organizationId: req.organization!.id } });
    if (!existing) return res.status(404).json({ success: false, error: 'Lokasjon ikke funnet' });

    const { name, address, description } = req.body;
    const data: any = {};
    if (name !== undefined) data.name = name;
    if (address !== undefined) data.address = address || null;
    if (description !== undefined) data.description = description || null;

    const location = await prisma.location.update({ where: { id }, data });
    res.json({ success: true, data: location });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Kunne ikke oppdatere lokasjon' });
  }
});

// Delete location (ADMIN+)
router.delete('/:id', authenticate, withOrganizationContext(), requireOrgRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await prisma.location.findFirst({ where: { id, organizationId: req.organization!.id } });
    if (!existing) return res.status(404).json({ success: false, error: 'Lokasjon ikke funnet' });

    // Unlink items before deleting
    await prisma.item.updateMany({ where: { locationId: id }, data: { locationId: null } });
    await prisma.location.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Kunne ikke slette lokasjon' });
  }
});

export default router;
