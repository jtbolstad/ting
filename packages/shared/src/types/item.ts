export type ItemStatus = 'AVAILABLE' | 'CHECKED_OUT' | 'MAINTENANCE' | 'RETIRED';
export type ItemOwnerType = 'ORGANIZATION' | 'MEMBER';
export type ItemApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Location {
  id: string;
  organizationId: string;
  name: string;
  address: string | null;
  description: string | null;
}

export interface CreateLocationInput {
  name: string;
  address?: string;
  description?: string;
}

export interface UpdateLocationInput {
  name?: string;
  address?: string | null;
  description?: string | null;
}

export interface ItemManual {
  id: string;
  itemId: string;
  type: 'PDF' | 'LINK' | 'TEXT';
  label: string;
  url: string | null;
  content: string | null;
  createdAt: string;
}

export interface CreateManualInput {
  type: 'PDF' | 'LINK' | 'TEXT';
  label: string;
  url?: string;
  content?: string;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  parentId: string | null;
  children?: Category[];
  itemCount?: number;
}

export interface CreateCategoryInput {
  name: string;
  description?: string;
  parentId?: string;
}

export interface UpdateCategoryInput {
  name?: string;
  description?: string;
  parentId?: string | null;
}

export interface Item {
  id: string;
  name: string;
  description: string | null;
  categoryId: string;
  category?: Category;
  status: ItemStatus;
  imageUrl: string | null;
  locationId: string | null;
  location?: Location;
  ownerId: string | null;
  ownerType: ItemOwnerType;
  approvalStatus: ItemApprovalStatus;
  rejectionNote?: string | null;
  tags?: string[];
  manuals?: ItemManual[];
  createdAt: string;
  updatedAt: string;
  averageRating?: number;
  reviewCount?: number;
}

export interface CreateItemInput {
  name: string;
  description?: string;
  categoryId: string;
  imageUrl?: string | null;
  locationId?: string | null;
  tags?: string[];
}

export interface UpdateItemInput {
  name?: string;
  description?: string;
  categoryId?: string;
  status?: ItemStatus;
  imageUrl?: string | null;
  locationId?: string | null;
  tags?: string[];
}

export interface ItemSearchParams {
  q?: string;
  categoryId?: string;
  locationId?: string;
  status?: ItemStatus;
  approvalStatus?: ItemApprovalStatus;
  page?: number;
  limit?: number;
}
