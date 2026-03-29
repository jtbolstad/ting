import { authHandlers } from './auth';
import { organizationHandlers } from './organizations';
import { itemHandlers } from './items';

export const handlers = [
  ...authHandlers,
  ...organizationHandlers,
  ...itemHandlers,
];
