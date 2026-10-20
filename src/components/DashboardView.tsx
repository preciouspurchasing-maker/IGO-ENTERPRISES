import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  ExternalLink,
  RefreshCw,
  Search,
  Filter,
  ArrowUpDown,
  Download,
  Calendar,
  CreditCard,
  Tag,
  DollarSign,
  TrendingUp,
  Receipt,
  Eye,
  Trash2,
  Plus,
  CheckCircle2,
  Camera,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { ParsedReceiptData, SpreadsheetInfo } from '../types';

interface DashboardViewProps {
  expenses: ParsedReceiptData[];
  spreadsheet: SpreadsheetInfo | null;
  onRefreshFromSheet: () => void;
  isRefreshing: boolean;
  onOpenSpreadsheetModal: () => void;
  onNavigateToScanner: () => void;
  onDeleteExpense: (expenseId: string) => void;
  onDeleteMultipleExpenses?: (expenseIds: string[]) => void;
  currencySymbol?: string;
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string; bar: string }> = {
  'Meals & Dining': { bg: 'bg-amber-500/10', text: 'text-amber-400', bar: 'bg-amber-500' },
  'Travel & Transportation': { bg: 'bg-blue-500/10', text: 'text-blue-400', bar: 'bg-blue-500' },
  'Office Supplies': { bg: 'bg-emerald-500/10', text: 'text-emerald-400', bar: 'bg-emerald-500' },
  'Software & SaaS': { bg: 'bg-purple-500/10', text: 'text-purple-400', bar: 'bg-purple-500' },
  'Utilities & Bills': { bg: 'bg-orange-500/10', text: 'text-orange-400', bar: 'bg-orange-500' },
  'Marketing & Ads': { bg: 'bg-pink-500/10', text: 'text-pink-400', bar: 'bg-pink-500' },
  'Client Entertainment': { bg: 'bg-indigo-500/10', text: 'text-indigo-400', bar: 'bg-indigo-500' },
  'Facilities & Rent': { bg: 'bg-teal-500/10', text: 'text-teal-400', bar: 'bg-teal-500' },
  'Professional Services': { bg: 'bg-cyan-500/10', text: 'text-cyan-400', bar: 'bg-cyan-500' },
  'Other Expenses': { bg: 'bg-slate-500/10', text: 'text-slate-400', bar: 'bg-slate-500' },
};

export const DashboardView: React.FC<DashboardViewProps> = ({
  expenses,
  spreadsheet,
  onRefreshFromSheet,
  isRefreshing,
  onOpenSpreadsheetModal,
  onNavigateToScanner,
  onDeleteExpense,
  onDeleteMultipleExpenses,
  currencySymbol = '$',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc');
  const [inspectingExpense, setInspectingExpense] = useState<ParsedReceiptData | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Financial Computations
  const totalAmountSpent = useMemo(() => {
    return expenses.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
  }, [expenses]);

  const totalTaxAmount = useMemo(() => {
    return expenses.reduce((acc, curr) => acc + (curr.taxAmount || 0), 0);
  }, [expenses]);

  const averageExpense = useMemo(() => {
    return expenses.length > 0 ? totalAmountSpent / expenses.length : 0;
  }, [expenses, totalAmountSpent]);

  // Breakdown by Category
  const categoryBreakdown = useMemo(() => {
    const map: Record<string, { count: number; total: number }> = {};
    for (const exp of expenses) {
      const cat = exp.category || 'Other Expenses';
      if (!map[cat]) map[cat] = { count: 0, total: 0 };
      map[cat].count += 1;
      map[cat].total += exp.totalAmount || 0;
    }

    return Object.entries(map)
      .map(([name, data]) => ({
        name,
        count: data.count,
        total: data.total,
        percentage: totalAmountSpent > 0 ? (data.total / totalAmountSpent) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [expenses, totalAmountSpent]);

  const topCategory = categoryBreakdown[0] || null;

  // Filtered & Sorted Expenses Table
  const filteredExpenses = useMemo(() => {
    return expenses
      .filter((exp) => {
        const matchesCategory = selectedCategory === 'All' || exp.category === selectedCategory;
        const q = searchQuery.toLowerCase().trim();
        const matchesSearch =
          !q ||
          exp.merchantName.toLowerCase().includes(q) ||
          (exp.invoiceNumber && exp.invoiceNumber.toLowerCase().includes(q)) ||
          (exp.notes && exp.notes.toLowerCase().includes(q)) ||
          (exp.paymentMethod && exp.paymentMethod.toLowerCase().includes(q)) ||
          exp.items.some((it) => it.description.toLowerCase().includes(q));

        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'date-desc') return new Date(b.date).getTime() - new Date(a.date).getTime();
        if (sortBy === 'date-asc') return new Date(a.date).getTime() - new Date(b.date).getTime();
        if (sortBy === 'amount-desc') return b.totalAmount - a.totalAmount;
        if (sortBy === 'amount-asc') return a.totalAmount - b.totalAmount;
        return 0;
      });
  }, [expenses, selectedCategory, searchQuery, sortBy]);

  // Export to CSV
  const handleExportCSV = () => {
    if (expenses.length === 0) return;
    const headers = ['ID', 'Date', 'Merchant', 'Category', 'Total Amount', 'Currency', 'Tax', 'Payment Method', 'Notes'];
    const rows = expenses.map((e) => [
      `"${e.id}"`,
      `"${e.date}"`,
      `"${e.merchantName.replace(/"/g, '""')}"`,
      `"${e.category}"`,
      e.totalAmount.toFixed(2),
      `"${e.currency}"`,
      (e.taxAmount || 0).toFixed(2),
      `"${e.paymentMethod || ''}"`,
      `"${(e.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Expense_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.size === filteredExpenses.length && filteredExpenses.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredExpenses.map((e) => e.id)));
    }
  };

  const handleToggleSelectOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleDeleteSelected = () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    if (onDeleteMultipleExpenses) {
      onDeleteMultipleExpenses(ids);
    } else {
      ids.forEach((id) => onDeleteExpense(id));
    }
    setSelectedIds(new Set());
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Connected Google Spreadsheet Command Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/30 border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-md">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight">
                {spreadsheet ? spreadsheet.name : 'Google Sheet Connection'}
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Live Sync Active
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Target Tab: <span className="text-slate-200 font-mono font-medium">{spreadsheet?.sheetTitle || 'Expenses'}</span> • Total logged rows:{' '}
              <span className="text-emerald-400 font-bold">{expenses.length}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {spreadsheet?.webViewLink && (
            <a
              href={spreadsheet.webViewLink}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 transition-colors shadow-md"
            >
              Open in Google Sheets
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}

          <button
            type="button"
            onClick={onRefreshFromSheet}
            disabled={isRefreshing}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors disabled:opacity-50"
            title="Fetch latest rows directly from spreadsheet"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
            Refresh Data
          </button>

          <button
            type="button"
            onClick={onOpenSpreadsheetModal}
            className="px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            Switch Sheet
          </button>
        </div>
      </div>

      {/* KPI Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Spend */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Expenses Logged</span>
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
              {currencySymbol}{totalAmountSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
          </div>
          <p className="text-[11px] text-slate-400 flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-emerald-400" />
            Across {expenses.length} validated receipts
          </p>
        </div>

        {/* Receipts Scanned */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Receipts Logged</span>
            <span className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Receipt className="w-4 h-4" />
            </span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
            {expenses.length}
          </h3>
          <p className="text-[11px] text-slate-400">
            Synced directly to spreadsheet rows
          </p>
        </div>

        {/* Top Spending Category */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Top Spending Category</span>
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Tag className="w-4 h-4" />
            </span>
          </div>
          <h3 className="text-lg font-bold text-white truncate">
            {topCategory ? topCategory.name : 'None yet'}
          </h3>
          <p className="text-[11px] text-slate-400 font-mono">
            {topCategory
              ? `${currencySymbol}${topCategory.total.toFixed(2)} (${topCategory.percentage.toFixed(0)}% of spend)`
              : 'Start scanning to see breakdown'}
          </p>
        </div>

        {/* Average Receipt & Tax */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Avg Expense / Tax</span>
            <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <CreditCard className="w-4 h-4" />
            </span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
            {currencySymbol}{averageExpense.toFixed(2)}
          </h3>
          <p className="text-[11px] text-slate-400 font-mono">
            Total Tax Logged: {currencySymbol}{totalTaxAmount.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Visual Analytics: Category Breakdown Distribution */}
      {categoryBreakdown.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Expense Category Distribution
              </h3>
            </div>
            <span className="text-xs text-slate-400">
              {categoryBreakdown.length} active categories
            </span>
          </div>

          {/* Visual proportional multi-colored bar */}
          <div className="w-full h-3 rounded-full overflow-hidden bg-slate-950 flex border border-slate-800">
            {categoryBreakdown.map((cat, i) => {
              const color = CATEGORY_COLORS[cat.name] || CATEGORY_COLORS['Other Expenses'];
              return (
                <div
                  key={i}
                  style={{ width: `${cat.percentage}%` }}
                  className={`h-full ${color.bar} transition-all`}
                  title={`${cat.name}: ${currencySymbol}${cat.total.toFixed(2)} (${cat.percentage.toFixed(1)}%)`}
                />
              );
            })}
          </div>

          {/* Category Chips Breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-2">
            {categoryBreakdown.map((cat, i) => {
              const color = CATEGORY_COLORS[cat.name] || CATEGORY_COLORS['Other Expenses'];
              return (
                <div
                  key={i}
                  onClick={() =>
                    setSelectedCategory(selectedCategory === cat.name ? 'All' : cat.name)
                  }
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedCategory === cat.name
                      ? 'bg-slate-800 border-emerald-500 shadow-md'
                      : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200 truncate">
                      {cat.name}
                    </span>
                    <span className="text-[10px] font-bold font-mono text-slate-400">
                      {cat.percentage.toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1 text-xs">
                    <span className="font-mono font-bold text-emerald-400">
                      {currencySymbol}{cat.total.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {cat.count} {cat.count === 1 ? 'receipt' : 'receipts'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Expense Table & Transactions Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        {/* Table Toolbar */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search merchant, invoice #, memo, item..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 text-xs text-white outline-none font-medium"
            />
          </div>

          {/* Filters & Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Category Dropdown Filter */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-transparent text-xs text-slate-200 outline-none cursor-pointer"
              >
                <option value="All">All Categories</option>
                {Object.keys(CATEGORY_COLORS).map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-xs text-slate-200 outline-none cursor-pointer"
              >
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="amount-desc">Highest Amount</option>
                <option value="amount-asc">Lowest Amount</option>
              </select>
            </div>

            {/* Batch Delete Button when items are selected */}
            {selectedIds.size > 0 && (
              <button
                type="button"
                onClick={handleDeleteSelected}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white flex items-center gap-1.5 transition-all shadow-md shadow-rose-950 animate-fade-in"
                title="Delete selected expense records"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Selected ({selectedIds.size})</span>
              </button>
            )}

            {/* Export CSV */}
            <button
              type="button"
              onClick={handleExportCSV}
              disabled={expenses.length === 0}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors disabled:opacity-50"
              title="Export expenses to CSV"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>

            {/* Jump to Scanner */}
            <button
              type="button"
              onClick={onNavigateToScanner}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 transition-colors shadow-md shadow-emerald-950"
            >
              <Camera className="w-3.5 h-3.5" />
              Scan New Receipt
            </button>
          </div>
        </div>

        {/* Expenses Table */}
        {filteredExpenses.length === 0 ? (
          <div className="text-center py-16 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-950 text-slate-500 flex items-center justify-center mx-auto border border-slate-800">
              <Receipt className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-bold text-slate-200">
                {expenses.length === 0 ? 'No Expenses Logged Yet' : 'No Matching Expenses Found'}
              </h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {expenses.length === 0
                  ? 'Switch to the Receipt Scanner to scan your first receipt, or refresh from your Google Sheet.'
                  : 'Try adjusting your search keywords or category filters.'}
              </p>
            </div>
            {expenses.length === 0 && (
              <button
                type="button"
                onClick={onNavigateToScanner}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950 inline-flex items-center gap-2 transition-transform active:scale-95"
              >
                <Camera className="w-4 h-4" />
                Open Receipt Scanner
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase font-bold tracking-wider text-[10px]">
                  <th className="py-3 px-3 w-8 text-center">
                    <input
                      type="checkbox"
                      checked={
                        filteredExpenses.length > 0 &&
                        selectedIds.size === filteredExpenses.length
                      }
                      onChange={handleToggleSelectAll}
                      className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-0 cursor-pointer"
                      title="Select all rows"
                    />
                  </th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Merchant</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4">Items / Notes</th>
                  <th className="py-3 px-4 text-center">Sheet Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredExpenses.map((exp) => {
                  const color = CATEGORY_COLORS[exp.category] || CATEGORY_COLORS['Other Expenses'];
                  const isRowSelected = selectedIds.has(exp.id);
                  return (
                    <tr
                      key={exp.id}
                      className={`hover:bg-slate-800/40 transition-colors group ${
                        isRowSelected ? 'bg-emerald-950/20' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isRowSelected}
                          onChange={() => handleToggleSelectOne(exp.id)}
                          className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-0 cursor-pointer"
                        />
                      </td>

                      {/* Date */}
                      <td className="py-3 px-4 font-mono text-slate-300 whitespace-nowrap">
                        {exp.date}
                      </td>

                      {/* Merchant */}
                      <td className="py-3 px-4 font-semibold text-white whitespace-nowrap">
                        {exp.merchantName}
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-semibold text-[10px] ${color.bg} ${color.text} border border-current/20`}
                        >
                          {exp.category}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-4 text-right font-mono font-bold text-sm text-emerald-400 whitespace-nowrap">
                        {exp.currencySymbol || '$'}{exp.totalAmount.toFixed(2)}
                      </td>

                      {/* Payment Method */}
                      <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                        {exp.paymentMethod || 'Credit Card'}
                      </td>

                      {/* Items / Notes summary */}
                      <td className="py-3 px-4 text-slate-300 max-w-[200px] truncate">
                        {exp.items && exp.items.length > 0
                          ? exp.items.map((it) => it.description).join(', ')
                          : exp.notes || '—'}
                      </td>

                      {/* Sheet Status */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          {exp.sheetRowIndex ? `Row #${exp.sheetRowIndex}` : 'Synced'}
                        </span>
                      </td>

                      {/* Actions with prominent Delete Icon */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setInspectingExpense(exp)}
                            className="px-2 py-1 rounded-lg text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors flex items-center gap-1 text-[11px]"
                            title="View receipt breakdown"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-400" />
                            <span>View</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteExpense(exp.id)}
                            className="px-2 py-1 rounded-lg text-rose-400 hover:text-white bg-rose-500/15 hover:bg-rose-600 border border-rose-500/30 transition-all flex items-center gap-1 text-[11px] font-semibold shadow-sm hover:shadow-rose-900/40"
                            title="Delete this expense"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inspect Receipt Modal */}
      {inspectingExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6 text-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white">
                  {inspectingExpense.merchantName}
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  {inspectingExpense.date} • {inspectingExpense.category}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setInspectingExpense(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white bg-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Receipt Image if available */}
            {inspectingExpense.receiptImageUrl && (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-center">
                <img
                  src={inspectingExpense.receiptImageUrl}
                  alt="Receipt Preview"
                  className="max-h-56 object-contain rounded"
                />
              </div>
            )}

            {/* Financial Stats */}
            <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs">
              <div>
                <span className="text-slate-400">Total Paid:</span>
                <p className="text-lg font-mono font-bold text-emerald-400 mt-0.5">
                  {inspectingExpense.currencySymbol || '$'}{inspectingExpense.totalAmount.toFixed(2)}
                </p>
              </div>
              <div>
                <span className="text-slate-400">Tax / VAT:</span>
                <p className="text-sm font-mono text-slate-200 mt-1">
                  {inspectingExpense.currencySymbol || '$'}{(inspectingExpense.taxAmount || 0).toFixed(2)}
                </p>
              </div>
              <div>
                <span className="text-slate-400">Payment:</span>
                <p className="text-xs text-slate-200 mt-1">
                  {inspectingExpense.paymentMethod || 'Credit Card'}
                </p>
              </div>
              <div>
                <span className="text-slate-400">Sync Status:</span>
                <p className="text-xs text-emerald-400 font-semibold mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Logged in Google Sheets
                </p>
              </div>
            </div>

            {/* Items list */}
            {inspectingExpense.items && inspectingExpense.items.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Itemized Line Breakdown
                </h4>
                <div className="divide-y divide-slate-800 text-xs">
                  {inspectingExpense.items.map((item, idx) => (
                    <div key={idx} className="py-2 flex items-center justify-between">
                      <span className="text-slate-200">
                        {item.quantity > 1 ? `${item.quantity}x ` : ''}{item.description}
                      </span>
                      <span className="font-mono text-emerald-400 font-semibold">
                        {inspectingExpense.currencySymbol || '$'}{item.totalPrice.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {inspectingExpense.notes && (
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400">Notes / Remarks</span>
                <p className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
                  {inspectingExpense.notes}
                </p>
              </div>
            )}

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  const idToDelete = inspectingExpense.id;
                  setInspectingExpense(null);
                  onDeleteExpense(idToDelete);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-500/15 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 flex items-center gap-1.5 transition-colors shadow-sm"
                title="Delete this expense record"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Expense
              </button>

              <button
                type="button"
                onClick={() => setInspectingExpense(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
