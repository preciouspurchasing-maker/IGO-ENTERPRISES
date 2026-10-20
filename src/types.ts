import { ParsedReceiptData, ParsedReceiptItem } from './server/receiptParser';
import { SpreadsheetInfo } from './services/sheetsService';

export type ActiveTab = 'scanner' | 'dashboard';

export interface ExpenseFilter {
  searchQuery: string;
  category: string;
  startDate: string;
  endDate: string;
  sortBy: 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc';
}

export interface SyncStatus {
  isSyncing: boolean;
  lastSyncedAt?: string;
  error?: string | null;
  message?: string | null;
}

export type { ParsedReceiptData, ParsedReceiptItem, SpreadsheetInfo };
