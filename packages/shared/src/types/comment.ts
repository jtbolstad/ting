import type { User } from './user.js';

export interface Comment {
  id: string;
  itemId: string;
  userId: string;
  user?: User;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommentInput {
  itemId: string;
  content: string;
}

export interface UpdateCommentInput {
  content: string;
}
