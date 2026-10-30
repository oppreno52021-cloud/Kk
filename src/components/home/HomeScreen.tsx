import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CategoryIcon } from '../common/CategoryIcon';
import { AccountIcon } from '../common/AccountIcon';
import { SwipeableTransactionItem } from '../transactions/SwipeableTransactionItem';
import { WalletManagementModal } from '../tools/WalletManagementModal';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { 
  formatCurrency, 
  getTodayExpenses, 
  getLocalDateString,
  toArabicNumerals,
  sumMoney,
  getCurrencySymbol
} from '../../utils/calculations';
import { 
  getCategoryDisplayName, 
  getAccountDisplayName, 
  getAccountTypeDisplayName,
  formatDateLabel 
} from '../../utils/i18n';
import { 
  Plus, 
  ChevronRight, 
  Calendar, 
  ArrowLeftRight,
  Wallet, 
  Eye, 
  EyeOff, 
  X,
  SlidersHorizontal,
  Target,
  TrendingUp
} from 'lucide-react';
import { useBackHandler } from '../../hooks/useBackHandler';
import { QuickBudgetModal } from './QuickBudgetModal';
import { triggerHaptic } from '../../utils/haptics';

export const HomeScreen: React.FC = () => {
  const { 
    expenses, 
    categories, 
    accounts,
    accountSummaries,
    budget,
    budgetPace, 
    updateBudgetAmount,
    referenceDate,
    settings, 
    openAddExpense, 
    setViewingExpense,
    setEditingExpense,
    removeExpense,
    duplicateExpense,
    setActiveTab,
    setFilters,
    isPrivacyMode,
    togglePrivacyMode,
    language,
    numberFormat,
    t
  } = useApp();

  const formatNum = (val: number | string) => {
    return language === 'ar' ? toArabicNumerals(val) : String(val);
  };

  const [heroCardMode, setHeroCardMode] = useState<'today' | 'budget' | 'netWorth'>('today');
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);

  useBodyScrollLock(isWalletModalOpen || Boolean(selectedWalletId));
  useBackHandler(Boolean(selectedWalletId), () => setSelectedWalletId(null), 'quick-wallet-sheet');

  const selectedWalletSummary = useMemo(() => {
    if (!selectedWalletId) return null;
    return accountSummaries.summaries.find(s => s.account.id === selectedWalletId) || null;
  }, [selectedWalletId, accountSummaries]);

  const selectedWalletExpenses = useMemo(() => {
    if (!selectedWalletId) return [];
    return expenses
      .filter(e => !e.isDeleted && (e.accountId === selectedWalletId || e.paymentMethodId === selectedWalletId || e.fromAccountId === selectedWalletId || e.toAccountId === selectedWalletId))
      .slice(0, 4);
  }, [selectedWalletId, expenses]);

  // Wallets configured to show on Home (controlled per-wallet in account list)
  const visibleHomeWallets = useMemo(() => {
    return accountSummaries.summaries.filter(s => s.account.isActive && Boolean(s.account.showOnHome));
  }, [accountSummaries]);

  // Today's spending summary
  const todayData = useMemo(() => {
    const todayStr = getLocalDateString(referenceDate);
    return getTodayExpenses(expenses, todayStr);
  }, [expenses, referenceDate]);

  // Today's income summary
  const todayIncome = useMemo(() => {
    const todayStr = getLocalDateString(referenceDate);
    const incItems = expenses.filter(e => !e.isDeleted && e.type === 'income' && e.date === todayStr);
    return sumMoney(incItems.map(e => e.amount));
  }, [expenses, referenceDate]);

  const getTodayTransactionsCountLabel = (count: number) => {
    if (language === 'ar') {
      if (count === 1) return 'معاملة واحدة اليوم';
      if (count === 2) return 'معاملتان اليوم';
      if (count >= 3 && count <= 10) return `${formatNum(count)} معاملات اليوم`;
      return `${formatNum(count)} معاملة اليوم`;
    }
    return count === 1 ? '1 transaction today' : `${formatNum(count)} transactions today`;
  };

  // Recent 4 transactions
  const recentTransactions = useMemo(() => {
    return [...expenses]
      .filter(e => !e.isDeleted)
      .sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`))
      .slice(0, 4);
  }, [expenses]);

  const categoryMap = useMemo(() => {
    return new Map(categories.map(c => [c.id, c]));
  }, [categories]);

  const hasBudget = budgetPace.status !== 'no_budget' && budgetPace.budget !== null && budgetPace.budget > 0;
  const todayStr = getLocalDateString(referenceDate);

  const availableAmount = hasBudget ? (budgetPace.requiredRemainingDailyAverage || 0) : todayData.total;
  const rawFormattedAvailable = Math.round(availableAmount).toLocaleString('en-US');
  const formattedAvailableNumber = isPrivacyMode 
    ? '••••' 
    : (language === 'ar' ? toArabicNumerals(rawFormattedAvailable) : rawFormattedAvailable);
  const currencyAbbr = getCurrencySymbol(settings.currency, language);

  return (
    <div className="space-y-3.5 pb-6 text-slate-900 dark:text-slate-100">
      {/* 1. TOP HEADER: DATE & ACTION ICONS */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
            {formatDateLabel(todayStr, language)}
          </h1>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Privacy Eye Toggle */}
          <button
            type="button"
            onClick={togglePrivacyMode}
            title={isPrivacyMode ? (language === 'ar' ? 'إظهار الأرقام' : 'Show amounts') : (language === 'ar' ? 'إخفاء الأرقام' : 'Hide amounts')}
            className={`p-2 rounded-full border transition-all cursor-pointer shadow-2xs ${
              isPrivacyMode 
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' 
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            {isPrivacyMode ? <EyeOff size={16} strokeWidth={1.5} /> : <Eye size={16} strokeWidth={1.5} />}
          </button>

          {/* Day of Month Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/80 text-xs text-slate-700 dark:text-slate-300 font-semibold shadow-2xs">
            <Calendar size={13} strokeWidth={1.5} className="text-blue-600 dark:text-blue-400" />
            <span>
              {hasBudget && budgetPace.daysRemaining > 0 
                ? (language === 'ar' ? `باقي ${formatNum(budgetPace.daysRemaining)} يوماً` : `${formatNum(budgetPace.daysRemaining)}d left`)
                : (language === 'ar' ? `اليوم ${formatNum(budgetPace.daysElapsed)}` : `Day ${formatNum(budgetPace.daysElapsed)}`)}
            </span>
          </div>
        </div>
      </div>

      {/* 2. THE VELVET SAPPHIRE TITANIUM FINANCIAL CARD */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl p-4 sm:p-5 bg-gradient-to-br from-[#091124] via-[#0f1b38] to-[#16274e] text-white border border-blue-400/20 shadow-xs space-y-3.5 select-none">
        {/* Subtle Ambient Radial Glow */}
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Card Header Row: Mode Switcher Pills */}
        <div className="relative flex items-center justify-between gap-1 pb-1">
          <div className="flex items-center gap-1 bg-white/10 p-0.5 rounded-xl backdrop-blur-xs border border-white/10 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setHeroCardMode('today');
              }}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                heroCardMode === 'today'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              {language === 'ar' ? 'اليوم' : 'Today'}
            </button>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setHeroCardMode('budget');
              }}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                heroCardMode === 'budget'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              {language === 'ar' ? 'الميزانية' : 'Budget'}
            </button>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setHeroCardMode('netWorth');
              }}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                heroCardMode === 'netWorth'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              {language === 'ar' ? 'صافي الرصيد' : 'Net Worth'}
            </button>
          </div>

          {heroCardMode === 'today' && todayData.count > 0 && (
            <span className="text-[10px] font-semibold text-blue-200 bg-white/10 px-2 py-0.5 rounded-full border border-white/10 backdrop-blur-xs">
              {getTodayTransactionsCountLabel(todayData.count)}
            </span>
          )}
        </div>

        {/* Primary Amount: Bold, Clean Luxury Typography */}
        <div className="relative flex items-baseline justify-between gap-2 min-w-0">
          <div className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-xs truncate">
            {heroCardMode === 'today' && formatCurrency(todayData.total, settings.currency, language, isPrivacyMode, numberFormat)}
            {heroCardMode === 'budget' && formatCurrency(budgetPace.remaining || 0, settings.currency, language, isPrivacyMode, numberFormat)}
            {heroCardMode === 'netWorth' && formatCurrency(accountSummaries.totalNetWorth, settings.currency, language, isPrivacyMode, numberFormat)}
          </div>

          {heroCardMode === 'today' && todayIncome > 0 && (
            <div className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/20 px-2.5 py-1 rounded-full shrink-0">
              <TrendingUp size={12} strokeWidth={1.5} />
              <span>+{formatCurrency(todayIncome, settings.currency, language, isPrivacyMode, numberFormat)}</span>
            </div>
          )}
          {heroCardMode === 'budget' && hasBudget && budgetPace.percentUsed !== null && (
            <div className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${
              budgetPace.status === 'over_budget' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
            }`}>
              <span>{formatNum(budgetPace.percentUsed)}%</span>
            </div>
          )}
        </div>

        {/* Budget Progress & Allowance Track */}
        {hasBudget && budgetPace.percentUsed !== null ? (
          <div className="relative pt-2.5 border-t border-white/10 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">
                {language === 'ar' ? 'المتبقي من الميزانية:' : t.home.remaining}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-white text-sm">
                  {formatCurrency(budgetPace.remaining || 0, settings.currency, language, isPrivacyMode, numberFormat)}
                </span>
                <button
                  type="button"
                  onClick={() => setIsBudgetModalOpen(true)}
                  className="text-[10px] text-amber-300 bg-amber-400/15 border border-amber-400/30 px-2 py-0.5 rounded-full font-bold hover:bg-amber-400/25 transition-colors cursor-pointer"
                >
                  {formatNum(budgetPace.percentUsed ?? 0)}%
                </button>
              </div>
            </div>

            {/* Micro progress pill bar */}
            <div className="w-full bg-white/15 rounded-full h-1.5 overflow-hidden">
              <div
                style={{ width: `${Math.min(100, Math.max(0, budgetPace.percentUsed))}%` }}
                className={`h-full rounded-full transition-all duration-500 ${
                  budgetPace.status === 'over_budget' 
                    ? 'bg-rose-500' 
                    : budgetPace.status === 'watch' || budgetPace.status === 'attention' 
                    ? 'bg-amber-400' 
                    : 'bg-emerald-400'
                }`}
              />
            </div>

            {/* Allowance & Countdown */}
            <div className="flex items-center justify-between text-[11px] text-slate-300 pt-0.5">
              <span>
                {budgetPace.daysRemaining > 1 
                  ? (language === 'ar' ? `باقي ${formatNum(budgetPace.daysRemaining)} يوماً` : `${formatNum(budgetPace.daysRemaining)} days left`) 
                  : (language === 'ar' ? 'اليوم الأخير' : 'Final day')}
              </span>
              <span>
                {language === 'ar' ? 'المتاح اليوم: ' : 'Daily allowance: '}
                <strong className="text-amber-300 font-bold">{formattedAvailableNumber}{currencyAbbr ? ` ${currencyAbbr}` : ''}</strong>
              </span>
            </div>
          </div>
        ) : (
          <div className="relative pt-2.5 border-t border-white/10 flex items-center justify-between gap-3">
            <span className="text-slate-300 text-xs font-medium">
              {language === 'ar' ? 'لم يتم تحديد ميزانية للشهر' : 'No monthly budget set'}
            </span>
            <button
              type="button"
              onClick={() => setIsBudgetModalOpen(true)}
              className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 border border-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
            >
              <Target size={13} strokeWidth={1.5} className="text-amber-300" />
              <span>{language === 'ar' ? 'تحديد الميزانية' : 'Set Budget'}</span>
            </button>
          </div>
        )}
      </div>



      {/* 4. MULTI-WALLET HORIZONTAL STRIP (Rendered when user activates showOnHome on wallets) */}
      {visibleHomeWallets.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 border border-slate-200/90 dark:border-slate-800/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-2xs">
                <Wallet size={17} strokeWidth={1.5} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight">
                  {language === 'ar' ? 'المحافظ والحسابات' : 'Wallets & Accounts'}
                </h2>
                <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                  {t.home.netWorth}: <strong className="text-slate-900 dark:text-white font-bold">{formatCurrency(accountSummaries.totalNetWorth, settings.currency, language, isPrivacyMode, numberFormat)}</strong>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsWalletModalOpen(true)}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title={language === 'ar' ? 'إدارة المحافظ' : 'Manage Wallets'}
              >
                <SlidersHorizontal size={15} strokeWidth={1.5} />
              </button>
            </div>
          </div>

          {/* Wallets Horizontal Scroll */}
          <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-0.5">
            {visibleHomeWallets.map(s => {
                const isOwed = s.currentBalance < 0;
                const accColor = s.account.color || '#3B82F6';

                return (
                  <div
                    key={s.account.id}
                    onClick={() => setSelectedWalletId(s.account.id)}
                    className="min-w-[135px] max-w-[165px] shrink-0 p-3 rounded-xl bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-750 flex flex-col justify-between gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer transition-all active:scale-98 relative overflow-hidden select-none shadow-2xs"
                  >
                    {/* Top colored accent indicator */}
                    <div 
                      className="absolute top-0 inset-x-0 h-1" 
                      style={{ backgroundColor: accColor }} 
                    />

                    <div className="flex items-center gap-2 min-w-0">
                      <div 
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 shadow-2xs"
                        style={{ backgroundColor: `${accColor}18`, color: accColor }}
                      >
                        <AccountIcon name={s.account.icon || s.account.type} color={accColor} size={14} strokeWidth={1.5} />
                      </div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate block">
                        {getAccountDisplayName(s.account.name, language)}
                      </span>
                    </div>
                    <div>
                      <span className={`text-sm font-black block tracking-tight ${
                        isOwed ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'
                      }`}>
                        {formatCurrency(s.currentBalance, settings.currency, language, isPrivacyMode, numberFormat)}
                      </span>
                    </div>
                  </div>
                );
              })}

            {/* Quick Add / Manage Button Card */}
            <button
              type="button"
              onClick={() => setIsWalletModalOpen(true)}
              className="min-w-[70px] shrink-0 p-2.5 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-1 hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-all active:scale-95"
              title={language === 'ar' ? 'إضافة أو إدارة المحافظ' : 'Add / Manage Wallets'}
            >
              <Plus size={16} strokeWidth={1.5} />
              <span className="text-[10px] font-bold">{language === 'ar' ? 'محفظة' : 'Wallet'}</span>
            </button>
          </div>
        </div>
      )}

      {/* 5. RECENT TRANSACTIONS CONTAINER */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 border border-slate-200/90 dark:border-slate-800/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between px-0.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center shadow-2xs">
              <Calendar size={15} strokeWidth={1.5} />
            </div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {t.home.recentTransactions}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('transactions')}
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 cursor-pointer py-1 px-1.5"
          >
            <span>{t.home.viewAll}</span>
            <ChevronRight size={14} strokeWidth={1.5} className="rtl:rotate-180" />
          </button>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">
              {t.home.noTransactionsYet}
            </p>
            <button
              type="button"
              onClick={() => openAddExpense()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs active:scale-95"
            >
              <span>{t.nav.addExpense}</span>
            </button>
          </div>
        ) : (
          <div className="bg-slate-50/60 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800/80 overflow-hidden shadow-2xs">
            {recentTransactions.map(exp => {
              const cat = categoryMap.get(exp.categoryId);
              const fromAcc = accounts.find(a => a.id === (exp.fromAccountId || exp.accountId));
              const toAcc = accounts.find(a => a.id === exp.toAccountId);

              return (
                <SwipeableTransactionItem
                  key={exp.id}
                  expense={exp}
                  category={cat}
                  fromAccount={fromAcc}
                  toAccount={toAcc}
                  currency={settings.currency}
                  language={language}
                  numberFormat={numberFormat}
                  isPrivacyMode={isPrivacyMode}
                  onClick={() => {
                    setEditingExpense(exp);
                    openAddExpense();
                  }}
                  onEdit={() => {
                    setEditingExpense(exp);
                    openAddExpense();
                  }}
                  onDelete={() => removeExpense(exp.id)}
                  onDuplicate={() => duplicateExpense(exp)}
                  transferLabel={t.home.transfer}
                  editLabel={language === 'ar' ? 'تعديل' : 'Edit'}
                  deleteLabel={language === 'ar' ? 'حذف' : 'Delete'}
                  duplicateLabel={language === 'ar' ? 'تكرار' : 'Duplicate'}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Wallet Peek Bottom Sheet */}
      {selectedWalletSummary && (
        <div 
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setSelectedWalletId(null)}
        >
          <div 
            className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with Color Accent */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <AccountIcon 
                  type={selectedWalletSummary.account.type} 
                  color={selectedWalletSummary.account.color} 
                  size={20} 
                  showBackground 
                  className="p-2.5 rounded-xl shadow-xs" 
                />
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                    {getAccountDisplayName(selectedWalletSummary.account.name, language)}
                  </h3>
                  <span className="text-xs text-slate-400">
                    {getAccountTypeDisplayName(selectedWalletSummary.account.type, language)}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedWalletId(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Balance Card */}
            <div 
              className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/70 dark:from-slate-800/60 dark:to-slate-800/30 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between"
              style={{ 
                borderRightWidth: language === 'ar' ? 4 : 1, 
                borderLeftWidth: language === 'ar' ? 1 : 4, 
                borderColor: selectedWalletSummary.account.color || '#3B82F6' 
              }}
            >
              <div>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                  {language === 'ar' ? 'الرصيد الفعلي الحالي' : 'Current Balance'}
                </span>
                <span className={`text-2xl font-black tracking-tight ${
                  selectedWalletSummary.currentBalance < 0 
                    ? 'text-rose-600 dark:text-rose-400' 
                    : 'text-slate-900 dark:text-white'
                }`}>
                  {formatCurrency(selectedWalletSummary.currentBalance, settings.currency, language, isPrivacyMode, numberFormat)}
                </span>
              </div>
            </div>

            {/* Quick Actions Bar */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  const accId = selectedWalletSummary.account.id;
                  setSelectedWalletId(null);
                  openAddExpense({ type: 'transfer', fromAccountId: accId });
                }}
                className="py-2.5 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              >
                <ArrowLeftRight size={14} className="rtl:rotate-180" />
                <span>{language === 'ar' ? 'تحويل أموال' : 'Transfer'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const accId = selectedWalletSummary.account.id;
                  setSelectedWalletId(null);
                  setFilters(prev => ({
                    ...prev,
                    paymentMethodIds: [accId],
                  }));
                  setActiveTab('transactions');
                }}
                className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              >
                <span>{language === 'ar' ? 'كل المعاملات' : 'All Transactions'}</span>
                <ChevronRight size={14} className="rtl:rotate-180" />
              </button>
            </div>

            {/* Recent 4 Transactions for this wallet */}
            <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-bold px-0.5">
                <span>{language === 'ar' ? 'آخر العمليات بالمحفظة' : 'Recent Wallet Activity'}</span>
                <span className="text-[10px] text-slate-400 font-normal">
                  ({formatNum(selectedWalletExpenses.length)})
                </span>
              </div>

              {selectedWalletExpenses.length === 0 ? (
                <div className="py-4 text-center text-xs text-slate-400">
                  {language === 'ar' ? 'لا توجد معاملات مسجلة لهذه المحفظة بعد' : 'No transactions recorded for this wallet yet'}
                </div>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto no-scrollbar">
                  {selectedWalletExpenses.map(exp => {
                    const cat = categories.find(c => c.id === exp.categoryId);
                    const isExp = exp.type === 'expense';
                    const isTransfer = exp.type === 'transfer';
                    const todayStr = getLocalDateString(referenceDate);

                    return (
                      <div
                        key={exp.id}
                        onClick={() => {
                          setSelectedWalletId(null);
                          setEditingExpense(exp);
                          openAddExpense();
                        }}
                        className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800/80 flex items-center justify-between gap-2 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1 pe-2">
                          <CategoryIcon name={cat?.icon || 'Tag'} color={cat?.color || '#3B82F6'} size={14} />
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate block leading-normal" title={exp.merchant || exp.note || getCategoryDisplayName(cat?.name || 'Other', language)}>
                              {exp.merchant || exp.note || getCategoryDisplayName(cat?.name || 'Other', language)}
                            </span>
                            <span className="text-[10px] text-slate-400 block leading-normal">
                              {formatDateLabel(exp.date, language)}
                            </span>
                          </div>
                        </div>

                        <span className={`text-xs font-black shrink-0 ${
                          isExp 
                            ? 'text-slate-800 dark:text-slate-200' 
                            : isTransfer 
                              ? 'text-blue-600 dark:text-blue-400' 
                              : 'text-emerald-600 dark:text-emerald-400'
                        }`}>
                          {isTransfer ? '⇄ ' : isExp ? '− ' : '+ '}
                          {formatCurrency(exp.amount, settings.currency, language, isPrivacyMode, numberFormat)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <WalletManagementModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
      />

      <QuickBudgetModal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        currentBudget={budget?.amount || 0}
        currencySymbol={currencyAbbr}
        onSave={async (newAmount) => {
          await updateBudgetAmount(newAmount);
        }}
        language={language}
      />


    </div>
  );
};
