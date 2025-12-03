// Re-export types from shared schema for mobile app use
export type {
  Event,
  InsertEvent,
  Expense,
  InsertExpense,
  TeamMember,
  InsertTeamMember,
  Asset,
  InsertAsset,
  Requirement,
  InsertRequirement,
  Vendor,
  InsertVendor,
  Configuration,
  InsertConfiguration,
  FulfillmentPlan,
  InsertFulfillmentPlan,
  AccountBalance,
  InsertAccountBalance,
  Repayment,
  InsertRepayment,
  CatalogItem,
  InsertCatalogItem,
} from '../../../shared/schema';

// API Response types
export interface ApiError {
  message: string;
  code?: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
}
