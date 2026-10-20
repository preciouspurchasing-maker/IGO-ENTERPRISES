import React, { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import { Header } from './components/Header';
import { ScannerView } from './components/ScannerView';
import { DashboardView } from './components/DashboardView';
import { SpreadsheetModal } from './components/SpreadsheetModal';
import { ConfirmationModal } from './components/ConfirmationModal';
import {
  initAuth,
  googleSignIn,
  logout,
  getAccessToken,
} from './services/authService';
import {
  SpreadsheetInfo,
  ParsedReceiptData,
  ActiveTab,
} from './types';
import {
  searchExpenseSpreadsheets,
  createExpenseSpreadsheet,
  fetchExpensesFromSheet,
  appendExpenseToSheet,
  ensureSheetHeaders,
  deleteExpenseRowFromSheet,
  DEFAULT_SHEET_TITLE,
} from './services/sheetsService';
import { SAMPLE_RECEIPTS } from './data/sampleReceipts';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('scanner');
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [spreadsheet, setSpreadsheet] = useState<SpreadsheetInfo | null>(null);
  const [isSpreadsheetModalOpen, setIsSpreadsheetModalOpen] = useState(false);

  // Local/Remote combined expenses
  const [expenses, setExpenses] = useState<ParsedReceiptData[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Confirmation Modal state for Workspace mutations
  const [confirmModalConfig, setConfirmModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    isDestructive?: boolean;
    onConfirm: () => void;
    details?: { label: string; value: string }[];
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Seed initial demo expenses if freshly loaded
  useEffect(() => {
    const initialDemo: ParsedReceiptData[] = SAMPLE_RECEIPTS.map((s, idx) => ({
      id: `seed_${idx + 1}`,
      merchantName: s.vendor,
      date: s.date,
      totalAmount: s.total,
      currency: s.currency,
      currencySymbol: s.currencySymbol,
      category: s.category,
      taxAmount: s.tax,
      tipAmount: s.tip,
      paymentMethod: s.paymentMethod,
      items: s.items,
      notes: s.notes,
      invoiceNumber: s.invoiceNumber,
      confidenceScore: 0.98,
      createdAt: new Date().toISOString(),
      sheetSynced: true,
      sheetRowIndex: idx + 2,
      receiptImageUrl: s.svgImage,
    }));
    setExpenses(initialDemo);
  }, []);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        setAccessToken(token);
        initializeUserSpreadsheet(token);
      },
      () => {
        setUser(null);
        setAccessToken(null);
      }
    );

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Initialize or connect to user's Expense spreadsheet
  const initializeUserSpreadsheet = async (token: string) => {
    try {
      const savedSheetId = localStorage.getItem('sheet_expense_target_id');
      const savedSheetName = localStorage.getItem('sheet_expense_target_name');

      if (savedSheetId) {
        const existing: SpreadsheetInfo = {
          id: savedSheetId,
          name: savedSheetName || DEFAULT_SHEET_TITLE,
          webViewLink: `https://docs.google.com/spreadsheets/d/${savedSheetId}/edit`,
          sheetTitle: 'Expenses',
          rowCount: 0,
        };
        setSpreadsheet(existing);
        await syncFromSheet(token, existing.id);
        return;
      }

      // Look up existing sheets
      const sheetsList = await searchExpenseSpreadsheets(token);
      const match = sheetsList.find((s) =>
        s.name.toLowerCase().includes('expense') || s.name.toLowerCase().includes('receipt')
      );

      if (match) {
        setSpreadsheet(match);
        localStorage.setItem('sheet_expense_target_id', match.id);
        localStorage.setItem('sheet_expense_target_name', match.name);
        await syncFromSheet(token, match.id);
      } else {
        // Create standard expense sheet for user
        const newSheet = await createExpenseSpreadsheet(token, DEFAULT_SHEET_TITLE);
        setSpreadsheet(newSheet);
        localStorage.setItem('sheet_expense_target_id', newSheet.id);
        localStorage.setItem('sheet_expense_target_name', newSheet.name);
      }
    } catch (err) {
      console.warn('Error initializing spreadsheet:', err);
    }
  };

  // Sync rows from Google Sheet
  const syncFromSheet = async (token: string, spreadsheetId: string) => {
    setIsRefreshing(true);
    try {
      const result = await fetchExpensesFromSheet(token, spreadsheetId, 'Expenses');
      if (result.expenses.length > 0) {
        setExpenses(result.expenses);
      }
    } catch (err: any) {
      console.warn('Could not read expenses from sheet:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Manual refresh from sheet trigger
  const handleRefreshFromSheet = async () => {
    const token = accessToken || (await getAccessToken());
    if (!token || !spreadsheet) {
      setIsSpreadsheetModalOpen(true);
      return;
    }
    await syncFromSheet(token, spreadsheet.id);
  };

  // Handle Google Sign-In
  const handleSignIn = async () => {
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setAccessToken(result.accessToken);
        await initializeUserSpreadsheet(result.accessToken);
      }
    } catch (err: any) {
      console.error('Sign-in error:', err);
      alert(`Sign in could not be completed: ${err.message}`);
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle Sign-Out
  const handleSignOut = async () => {
    await logout();
    setUser(null);
    setAccessToken(null);
    setSpreadsheet(null);
  };

  // Select/switch spreadsheet
  const handleSelectSpreadsheet = async (sheet: SpreadsheetInfo) => {
    setSpreadsheet(sheet);
    localStorage.setItem('sheet_expense_target_id', sheet.id);
    localStorage.setItem('sheet_expense_target_name', sheet.name);

    const token = accessToken || (await getAccessToken());
    if (token) {
      await ensureSheetHeaders(token, sheet.id, 'Expenses');
      await syncFromSheet(token, sheet.id);
    }
  };

  // Append scanned receipt to Google Sheet
  const handleSyncReceiptToSheet = async (receipt: ParsedReceiptData): Promise<boolean> => {
    const token = accessToken || (await getAccessToken());
    if (!token) {
      await handleSignIn();
      return false;
    }

    let targetSheet = spreadsheet;
    if (!targetSheet) {
      // Auto-create spreadsheet if none connected
      try {
        targetSheet = await createExpenseSpreadsheet(token, DEFAULT_SHEET_TITLE);
        setSpreadsheet(targetSheet);
        localStorage.setItem('sheet_expense_target_id', targetSheet.id);
        localStorage.setItem('sheet_expense_target_name', targetSheet.name);
      } catch (err: any) {
        throw new Error(`Please select or create a Google Sheet first: ${err.message}`);
      }
    }

    try {
      await ensureSheetHeaders(token, targetSheet.id, 'Expenses');
      await appendExpenseToSheet(token, targetSheet.id, receipt, 'Expenses');

      // Update local state and calculate row index
      const newRowIndex = expenses.length + 2;
      const updatedReceipt: ParsedReceiptData = {
        ...receipt,
        sheetSynced: true,
        sheetRowIndex: newRowIndex,
      };

      setExpenses((prev) => [updatedReceipt, ...prev.filter((e) => e.id !== receipt.id)]);
      return true;
    } catch (err: any) {
      console.error('Failed to append to Google Sheet:', err);
      throw err;
    }
  };

  // Delete expense confirmation (Mandatory per workspace-integration rules)
  const handleDeleteExpense = (expenseId: string) => {
    const item = expenses.find((e) => e.id === expenseId);
    if (!item) return;

    setConfirmModalConfig({
      isOpen: true,
      title: 'Delete Expense Record?',
      message: item.sheetSynced && spreadsheet
        ? `Are you sure you want to delete this expense record? It will be removed from your dashboard and updated in your "${spreadsheet.name}" spreadsheet.`
        : 'Are you sure you want to delete this expense record from your dashboard?',
      confirmLabel: 'Delete Record',
      isDestructive: true,
      details: [
        { label: 'Merchant', value: item.merchantName },
        { label: 'Date', value: item.date },
        { label: 'Amount', value: `${item.currencySymbol || '$'}${item.totalAmount.toFixed(2)}` },
        { label: 'Category', value: item.category },
      ],
      onConfirm: async () => {
        // If synced and we have sheet credentials, delete from Google Sheet as well
        if (item.sheetRowIndex && spreadsheet && accessToken) {
          try {
            await deleteExpenseRowFromSheet(accessToken, spreadsheet.id, item.sheetRowIndex);
          } catch (err) {
            console.warn('Could not delete row directly from Google Sheet:', err);
          }
        }
        setExpenses((prev) => prev.filter((e) => e.id !== expenseId));
        setConfirmModalConfig((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Batch delete multiple expenses confirmation
  const handleDeleteMultipleExpenses = (expenseIds: string[]) => {
    if (expenseIds.length === 0) return;
    const targetItems = expenses.filter((e) => expenseIds.includes(e.id));
    const totalAmount = targetItems.reduce((acc, curr) => acc + curr.totalAmount, 0);

    setConfirmModalConfig({
      isOpen: true,
      title: `Delete ${expenseIds.length} Selected Expenses?`,
      message:
        `This will permanently remove the ${expenseIds.length} selected expense transactions from your dashboard. This action cannot be undone.`,
      confirmLabel: `Delete ${expenseIds.length} Records`,
      isDestructive: true,
      details: [
        { label: 'Total Selected', value: `${expenseIds.length} receipts` },
        { label: 'Combined Amount', value: `$${totalAmount.toFixed(2)}` },
      ],
      onConfirm: async () => {
        // If synced and we have credentials, delete rows
        if (spreadsheet && accessToken) {
          for (const item of targetItems) {
            if (item.sheetRowIndex) {
              try {
                await deleteExpenseRowFromSheet(accessToken, spreadsheet.id, item.sheetRowIndex);
              } catch (err) {
                console.warn('Failed to delete row from sheet:', err);
              }
            }
          }
        }
        setExpenses((prev) => prev.filter((e) => !expenseIds.includes(e.id)));
        setConfirmModalConfig((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Application Header & Mode Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        spreadsheet={spreadsheet}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
        onOpenSpreadsheetModal={() => setIsSpreadsheetModalOpen(true)}
        isLoggingIn={isLoggingIn}
        totalExpensesCount={expenses.length}
      />

      {/* Main Interface Content: Switching between the 2 user-requested interfaces */}
      <main className="flex-1 pb-16">
        {activeTab === 'scanner' ? (
          <ScannerView
            spreadsheet={spreadsheet}
            onSyncReceiptToSheet={handleSyncReceiptToSheet}
            onOpenSpreadsheetModal={() => setIsSpreadsheetModalOpen(true)}
            onNavigateToDashboard={() => setActiveTab('dashboard')}
            isSignedIn={!!user}
            onSignIn={handleSignIn}
          />
        ) : (
          <DashboardView
            expenses={expenses}
            spreadsheet={spreadsheet}
            onRefreshFromSheet={handleRefreshFromSheet}
            isRefreshing={isRefreshing}
            onOpenSpreadsheetModal={() => setIsSpreadsheetModalOpen(true)}
            onNavigateToScanner={() => setActiveTab('scanner')}
            onDeleteExpense={handleDeleteExpense}
            onDeleteMultipleExpenses={handleDeleteMultipleExpenses}
            currencySymbol="$"
          />
        )}
      </main>

      {/* Google Spreadsheet Selector Modal */}
      <SpreadsheetModal
        isOpen={isSpreadsheetModalOpen}
        onClose={() => setIsSpreadsheetModalOpen(false)}
        accessToken={accessToken}
        currentSpreadsheet={spreadsheet}
        onSelectSpreadsheet={handleSelectSpreadsheet}
      />

      {/* Workspace Destructive Action Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModalConfig.isOpen}
        title={confirmModalConfig.title}
        message={confirmModalConfig.message}
        confirmLabel={confirmModalConfig.confirmLabel}
        isDestructive={confirmModalConfig.isDestructive}
        details={confirmModalConfig.details}
        onConfirm={confirmModalConfig.onConfirm}
        onCancel={() => setConfirmModalConfig((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
