export type ItemStatus = 'AVAILABLE' | 'CHECKED_OUT' | 'MAINTENANCE' | 'RETIRED';

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
  createdAt: string;
  updatedAt: string;
}

export interface CreateItemInput {
  name: string;
  description?: string;
  categoryId: string;
  imageUrl?: string | null;
}

export interface UpdateItemInput {
  name?: string;
  description?: string;
  categoryId?: string;
  status?: ItemStatus;
  imageUrl?: string | null;
}

export interface ItemSearchParams {
  q?: string;
  categoryId?: string;
  status?: ItemStatus;
  page?: number;
  limit?: number;
}
