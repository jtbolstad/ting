export type FeatureFlagKey =
  | 'LOAN_APPROVAL_REQUIRED'
  | 'MEMBER_ITEM_SUBMISSION'
  | 'REVIEWS_ENABLED'
  | 'RESERVATIONS_ENABLED'
  | 'GOOGLE_LOGIN';

export const FEATURE_FLAG_KEYS: FeatureFlagKey[] = [
  'LOAN_APPROVAL_REQUIRED',
  'MEMBER_ITEM_SUBMISSION',
  'REVIEWS_ENABLED',
  'RESERVATIONS_ENABLED',
  'GOOGLE_LOGIN',
];

export interface FeatureFlag {
  id: string;
  organizationId: string;
  key: FeatureFlagKey;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export type FeatureFlagMap = Record<FeatureFlagKey, boolean>;
