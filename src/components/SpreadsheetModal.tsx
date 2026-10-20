import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Plus,
  Check,
  RefreshCw,
  ExternalLink,
  Search,
  X,
  Sparkles,
} from 'lucide-react';
import { SpreadsheetInfo } from '../types';
import {
  searchExpenseSpreadsheets,
  createExpenseSpreadsheet,
  DEFAULT_SHEET_TITLE,
} from '../services/sheetsService';

interface SpreadsheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  accessToken: string | null;
  currentSpreadsheet: SpreadsheetInfo | null;
  onSelectSpreadsheet: (sheet: SpreadsheetInfo) => void;
}

export const SpreadsheetModal: React.FC<SpreadsheetModalProps> = ({
  isOpen,
  onClose,
  accessToken,
  currentSpreadsheet,
  onSelectSpreadsheet,
}) => {
  const [spreadsheets, setSpreadsheets] = useState<SpreadsheetInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState(DEFAULT_SHEET_TITLE);
  const [customSheetId, setCustomSheetId] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && accessToken) {
      loadSpreadsheets();
    }
  }, [isOpen, accessToken]);

  const loadSpreadsheets = async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setError(null);
    try {
      const list = await searchExpenseSpreadsheets(accessToken);
      setSpreadsheets(list);
    } catch (err: any) {
      setError(err.message || 'Failed to list spreadsheets');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNew = async () => {
    if (!accessToken) return;
    setIsCreating(true);
    setError(null);
    try {
      const created = await createExpenseSpreadsheet(accessToken, newTitle.trim() || DEFAULT_SHEET_TITLE);
      onSelectSpreadsheet(created);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create spreadsheet');
    } finally {
      setIsCreating(false);
    }
  };

  const handleAttachById = () => {
    if (!customSheetId.trim()) return;
    const cleanId = customSheetId.includes('/d/')
      ? customSheetId.split('/d/')[1].split('/')[0]
      : customSheetId.trim();

    const customSheet: SpreadsheetInfo = {
      id: cleanId,
      name: `Spreadsheet (${cleanId.substring(0, 8)}...)`,
      webViewLink: `https://docs.google.com/spreadsheets/d/${cleanId}/edit`,
      sheetTitle: 'Expenses',
      rowCount: 0,
    };
    onSelectSpreadsheet(customSheet);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-slate-100 space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Google Sheets Destination
              </h3>
              <p className="text-xs text-slate-400">
                Choose or create the spreadsheet for receipt expense logging
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        {/* Current Active Sheet */}
        {currentSpreadsheet && (
          <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/30 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
              Currently Connected Sheet
            </span>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-white truncate max-w-[300px]">
                {currentSpreadsheet.name}
              </span>
              {currentSpreadsheet.webViewLink && (
                <a
                  href={currentSpreadsheet.webViewLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 text-slate-400 hover:text-emerald-400 transition-colors"
                  title="Open in Google Sheets"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              Sheet tab: <span className="text-slate-200">{currentSpreadsheet.sheetTitle}</span>
            </p>
          </div>
        )}

        {/* Option 1: Create a brand new formatted expense sheet */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-300">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            Create Brand New Expense Sheet
          </div>
          <p className="text-xs text-slate-400">
            Creates a new Google Spreadsheet formatted with frozen colored headers (Date, Merchant, Category, Amount, Items, Tax, Notes).
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Spreadsheet Title"
              className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white outline-none focus:border-emerald-500"
            />
            <button
              type="button"
              onClick={handleCreateNew}
              disabled={isCreating}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 transition-colors disabled:opacity-50 shrink-0 shadow-md shadow-emerald-950"
            >
              {isCreating ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
              Create &amp; Connect
            </button>
          </div>
        </div>

        {/* Option 2: Select existing sheets in Google Drive */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Or Select from Your Google Drive
            </span>
            <button
              type="button"
              onClick={loadSpreadsheets}
              className="text-xs text-slate-400 hover:text-emerald-400 flex items-center gap-1"
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
              Reload
            </button>
          </div>

          <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
            {isLoading ? (
              <div className="p-6 text-center text-xs text-slate-500">
                Searching spreadsheets in Google Drive...
              </div>
            ) : spreadsheets.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 text-center text-xs text-slate-500">
                No recent spreadsheets detected. You can create a new one above.
              </div>
            ) : (
              spreadsheets.map((sheet) => {
                const isSelected = currentSpreadsheet?.id === sheet.id;
                return (
                  <div
                    key={sheet.id}
                    onClick={() => {
                      onSelectSpreadsheet(sheet);
                      onClose();
                    }}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-emerald-950/30 border-emerald-500/60'
                        : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="text-xs font-semibold text-slate-200 truncate">
                        {sheet.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isSelected ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          Connected
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 hover:text-white font-medium">
                          Select
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Option 3: Manual Spreadsheet ID or URL */}
        <div className="pt-2 border-t border-slate-800 space-y-2">
          <label className="text-[11px] font-semibold text-slate-400">
            Or paste Google Sheets URL or ID:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={customSheetId}
              onChange={(e) => setCustomSheetId(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/.../edit"
              className="flex-1 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-emerald-500"
            />
            <button
              type="button"
              onClick={handleAttachById}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white transition-colors"
            >
              Attach
            </button>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
