import React from 'react';
import { Camera, LayoutDashboard, FileSpreadsheet, ExternalLink, LogOut, CheckCircle2, RefreshCw } from 'lucide-react';
import { User } from 'firebase/auth';
import { ActiveTab, SpreadsheetInfo } from '../types';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  user: User | null;
  spreadsheet: SpreadsheetInfo | null;
  onSignIn: () => void;
  onSignOut: () => void;
  onOpenSpreadsheetModal: () => void;
  isLoggingIn: boolean;
  totalExpensesCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  user,
  spreadsheet,
  onSignIn,
  onSignOut,
  onOpenSpreadsheetModal,
  isLoggingIn,
  totalExpensesCount,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-slate-900 border border-orange-500/30 p-1 shadow-lg shadow-orange-500/10 flex items-center justify-center overflow-hidden shrink-0 group">
              <img
                src="/assets/aistudio/IGO_PANDA_LOGO_3_fdd6870a.png"
                alt="iGO Enterprises Logo"
                className="w-full h-full object-contain filter drop-shadow group-hover:scale-105 transition-transform"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-extrabold text-white tracking-tight leading-none">
                  <span className="text-orange-500">iGO</span> ENTERPRISES
                </h1>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/30">
                  Expense Hub
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Receipt Scanner &amp; Google Sheets Tracker
              </p>
            </div>
          </div>

          {/* Dedicated Mode Switcher (The 2 distinct interfaces requested) */}
          <nav className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800 shadow-inner">
            <button
              type="button"
              onClick={() => setActiveTab('scanner')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'scanner'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 scale-[1.02]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>Receipt Scanner</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 scale-[1.02]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Expense Dashboard</span>
              {totalExpensesCount > 0 && (
                <span
                  className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                    activeTab === 'dashboard'
                      ? 'bg-emerald-800 text-emerald-100'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {totalExpensesCount}
                </span>
              )}
            </button>
          </nav>

          {/* Right: Google Auth & Sheet Sync Status */}
          <div className="flex items-center gap-3">
            {/* Connected Spreadsheet Badge */}
            {user && (
              <button
                type="button"
                onClick={onOpenSpreadsheetModal}
                className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-900 hover:bg-slate-800 border border-emerald-500/30 hover:border-emerald-500/60 text-slate-200 transition-colors group"
                title="Manage connected Google Spreadsheet"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-slate-400">Sheet:</span>
                <span className="font-semibold text-emerald-300 max-w-[130px] truncate">
                  {spreadsheet ? spreadsheet.name : 'Create / Connect'}
                </span>
                {spreadsheet?.webViewLink && (
                  <a
                    href={spreadsheet.webViewLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-slate-400 hover:text-emerald-400 ml-1 p-0.5 rounded transition-colors"
                    title="Open in Google Sheets"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </button>
            )}

            {/* User Profile or Google Sign In */}
            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                <div className="flex items-center gap-2">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      className="w-8 h-8 rounded-full border border-slate-700 object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-emerald-600/20 text-emerald-300 font-bold text-xs flex items-center justify-center border border-emerald-500/30">
                      {(user.displayName || user.email || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  <div className="hidden lg:block text-left text-xs leading-tight">
                    <p className="font-semibold text-slate-200 truncate max-w-[120px]">
                      {user.displayName || user.email?.split('@')[0]}
                    </p>
                    <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      Sheets Connected
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onSignOut}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              /* Official Google Sign-In button per guidelines */
              <button
                type="button"
                onClick={onSignIn}
                disabled={isLoggingIn}
                className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-800 font-medium text-xs sm:text-sm shadow-sm transition-all active:scale-95 disabled:opacity-50"
              >
                {isLoggingIn ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-600" />
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 48 48">
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                    />
                    <path
                      fill="#34A853"
                      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                    />
                  </svg>
                )}
                <span>Sign in with Google</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
