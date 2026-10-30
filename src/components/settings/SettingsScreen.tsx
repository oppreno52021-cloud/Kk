import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { CategoryIcon } from '../common/CategoryIcon';
import { AccountIcon } from '../common/AccountIcon';
import { StyledIconSelector } from '../common/StyledIconSelector';
import { WalletManagementModal } from '../tools/WalletManagementModal';
import { 
  formatCurrency, 
  getLocalDateString, 
  normalizeArabicNumerals,
  getCurrencySymbol,
  toArabicNumerals,
  formatNumber
} from '../../utils/calculations';
import { 
  getCategoryDisplayName, 
  getAccountDisplayName, 
  getFrequencyDisplayName 
} from '../../utils/i18n';
import { 
  Globe, 
  Moon, 
  Sun, 
  Hash, 
  PieChart, 
  Wallet, 
  Tag, 
  Repeat, 
  ShieldCheck, 
  Lock, 
  Fingerprint, 
  Eye, 
  EyeOff, 
  Database, 
  FileSpreadsheet, 
  Trash2, 
  ChevronLeft, 
  ArrowLeft, 
  Check, 
  X, 
  Plus, 
  KeyRound,
  Download,
  Upload,
  AlertTriangle
} from 'lucide-react';
import { Category, RecurringTransaction } from '../../types';
import { useBackHandler } from '../../hooks/useBackHandler';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { 
  isBiometricsSupported, 
  registerBiometrics, 
  removeBiometricCredential, 
  authenticateWithBiometrics 
} from '../../utils/biometrics';

export const SettingsScreen: React.FC = () => {
  const { 
    budget, 
    updateBudgetAmount, 
    settings, 
    updateSettings, 
    categories, 
    saveCategoryItem, 
    deleteCategoryItem,
    accounts,
    accountSummaries,
    recurring, 
    addRecurringItem, 
    saveRecurringItem,
    removeRecurringItem, 
    downloadCSV,
    importCSVText,
    downloadFullBackupJSON,
    importFullBackupJSON,
    resetAllData,
    showToast,
    language, 
    setLanguage,
    numberFormat,
    setNumberFormat,
    theme,
    setTheme,
    setActiveTab,
    t
  } = useApp();

  const isAr = language === 'ar';
  const formatNum = (v: number | string) => formatNumber(v, language, numberFormat);

  // Sub-sheets & Modals state
  const [isWalletsSheetOpen, setIsWalletsSheetOpen] = useState(false);
  const [isCategoriesSheetOpen, setIsCategoriesSheetOpen] = useState(false);
  const [isRecurringSheetOpen, setIsRecurringSheetOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isBackupSheetOpen, setIsBackupSheetOpen] = useState(false);
  const [isCsvSheetOpen, setIsCsvSheetOpen] = useState(false);

  // Budget Edit state
  const [budgetInput, setBudgetInput] = useState(
    isAr ? toArabicNumerals(budget.amount.toString()) : budget.amount.toString()
  );

  useEffect(() => {
    setBudgetInput(isAr ? toArabicNumerals(budget.amount.toString()) : budget.amount.toString());
  }, [budget.amount, isAr]);

  // Security & PIN modal state
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [isDisablingPin, setIsDisablingPin] = useState(false);
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [pinConfirmInput, setPinConfirmInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);
  const [isEnrollingBiometrics, setIsEnrollingBiometrics] = useState(false);

  // Category Add/Edit Sheet state
  const [isAddEditCatOpen, setIsAddEditCatOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [catName, setCatName] = useState('');
  const [catColor, setCatColor] = useState('#3B82F6');
  const [catIcon, setCatIcon] = useState('Tag');

  // Recurring Add/Edit Sheet state
  const [isAddEditRecOpen, setIsAddEditRecOpen] = useState(false);
  const [editingRecurring, setEditingRecurring] = useState<RecurringTransaction | null>(null);
  const [recAmount, setRecAmount] = useState('');
  const [recNote, setRecNote] = useState('');
  const [recCatId, setRecCatId] = useState(categories[0]?.id || 'cat-bills');
  const [recAccountId, setRecAccountId] = useState(accounts[0]?.id || 'acc-card');
  const [recFreq, setRecFreq] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [recNextDate, setRecNextDate] = useState(() => getLocalDateString(new Date()));

  // Confirmation Modal state
  const [confirmAction, setConfirmAction] = useState<{
    title: string;
    desc: string;
    confirmLabel: string;
    isDanger?: boolean;
    onConfirm: () => void;
  } | null>(null);

  // File input refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const backupFileInputRef = useRef<HTMLInputElement>(null);

  // Body scroll locks for overlays
  useBodyScrollLock(isCategoriesSheetOpen || isRecurringSheetOpen || isBudgetModalOpen || isPinModalOpen || isBackupSheetOpen || isCsvSheetOpen || Boolean(confirmAction));

  // Back button handlers
  useBackHandler(isCategoriesSheetOpen, () => {
    if (isAddEditCatOpen) {
      setIsAddEditCatOpen(false);
    } else {
      setIsCategoriesSheetOpen(false);
    }
  }, 'settings-categories-sheet');

  useBackHandler(isRecurringSheetOpen, () => {
    if (isAddEditRecOpen) {
      setIsAddEditRecOpen(false);
    } else {
      setIsRecurringSheetOpen(false);
    }
  }, 'settings-recurring-sheet');

  useBackHandler(isBudgetModalOpen, () => setIsBudgetModalOpen(false), 'settings-budget-modal');

  useBackHandler(isBackupSheetOpen, () => setIsBackupSheetOpen(false), 'settings-backup-sheet');

  useBackHandler(isCsvSheetOpen, () => setIsCsvSheetOpen(false), 'settings-csv-sheet');

  useBackHandler(isPinModalOpen, () => {
    setIsPinModalOpen(false);
    setIsChangingPin(false);
    setIsDisablingPin(false);
    setCurrentPinInput('');
    setPinInput('');
    setPinConfirmInput('');
    setPinError('');
  }, 'settings-pin-modal');

  useBackHandler(Boolean(confirmAction), () => setConfirmAction(null), 'settings-confirm-modal');

  useEffect(() => {
    isBiometricsSupported().then(supported => {
      setBiometricsAvailable(supported);
    });
  }, []);

  // PIN Handlers
  const handleOpenSetPin = (changing: boolean = false) => {
    setIsChangingPin(changing);
    setIsDisablingPin(false);
    setCurrentPinInput('');
    setPinInput('');
    setPinConfirmInput('');
    setPinError('');
    setIsPinModalOpen(true);
  };

  const handleSavePin = async () => {
    if (isDisablingPin) {
      if (currentPinInput !== settings.passcode) {
        setPinError(isAr ? 'رمز المرور الحالي غير صحيح' : 'Current PIN is incorrect');
        return;
      }
      await updateSettings({
        pinLockEnabled: false,
        biometricLock: false,
      });
      setIsPinModalOpen(false);
      setIsDisablingPin(false);
      showToast(isAr ? 'تم إيقاف قفل التطبيق' : 'Lock disabled');
      return;
    }

    if (isChangingPin) {
      if (currentPinInput !== settings.passcode) {
        setPinError(isAr ? 'رمز المرور الحالي غير صحيح' : 'Current PIN is incorrect');
        return;
      }
    }

    if (pinInput.length !== 6) {
      setPinError(isAr ? 'الرمز يجب أن يتكون من 6 أرقام' : 'PIN must be 6 digits');
      return;
    }
    if (pinInput !== pinConfirmInput) {
      setPinError(isAr ? 'الرمزان غير متطابقين' : 'PINs do not match');
      return;
    }

    await updateSettings({
      passcode: pinInput,
      pinLockEnabled: true,
    });
    setIsPinModalOpen(false);
    setIsChangingPin(false);
    showToast(isAr ? 'تم حفظ رمز القفل وتفعيل الحماية' : 'Lock PIN set successfully');
  };

  const handleTogglePinLock = async () => {
    if (settings.pinLockEnabled) {
      setIsDisablingPin(true);
      setIsChangingPin(false);
      setCurrentPinInput('');
      setPinError('');
      setIsPinModalOpen(true);
    } else {
      if (settings.passcode && settings.passcode.length === 6) {
        await updateSettings({ pinLockEnabled: true });
        showToast(isAr ? 'تم تفعيل قفل التطبيق' : 'Lock enabled');
      } else {
        handleOpenSetPin(false);
      }
    }
  };

  const handleToggleBiometrics = async () => {
    if (settings.biometricLock) {
      removeBiometricCredential();
      await updateSettings({ biometricLock: false });
      showToast(isAr ? 'تم إيقاف القفل بالبصمة' : 'Biometrics lock disabled');
    } else {
      setIsEnrollingBiometrics(true);
      const res = await registerBiometrics();
      setIsEnrollingBiometrics(false);

      if (res.success) {
        await updateSettings({ biometricLock: true });
        showToast(isAr ? 'تم تفعيل القفل بالبصمة بنجاح' : 'Biometric lock enabled');
      } else if (res.error === 'unsupported') {
        showToast(isAr ? 'جهازك أو متصفحك لا يدعم البصمة' : 'Biometrics not supported on this device');
      } else if (res.error !== 'cancelled_or_denied') {
        showToast(isAr ? 'تعذر إعداد البصمة، يرجى المحاولة مرة أخرى' : 'Failed to register biometrics');
      }
    }
  };

  // Budget Handlers
  const handleSaveBudget = async () => {
    const normalized = normalizeArabicNumerals(budgetInput);
    const val = parseFloat(normalized);
    if (!isNaN(val) && val >= 0) {
      await updateBudgetAmount(val);
      setIsBudgetModalOpen(false);
      showToast(isAr ? 'تم تحديث الميزانية الشهرية' : 'Monthly budget updated');
    }
  };

  // Category Handlers
  const handleOpenAddCategory = () => {
    setEditingCategory(null);
    setCatName('');
    setCatColor('#3B82F6');
    setCatIcon('Tag');
    setIsAddEditCatOpen(true);
  };

  const handleOpenEditCategory = (cat: Category) => {
    setEditingCategory(cat);
    setCatName(cat.name);
    setCatColor(cat.color || '#3B82F6');
    setCatIcon(cat.icon || 'Tag');
    setIsAddEditCatOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;

    const catToSave: Category = {
      id: editingCategory ? editingCategory.id : `cat-${Date.now()}`,
      name: catName.trim(),
      icon: catIcon,
      color: catColor,
      isDefault: editingCategory ? editingCategory.isDefault : false,
      isActive: editingCategory ? editingCategory.isActive : true,
      sortOrder: editingCategory ? editingCategory.sortOrder : categories.length + 1,
      createdAt: editingCategory?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await saveCategoryItem(catToSave);
      setCatName('');
      setEditingCategory(null);
      setIsAddEditCatOpen(false);
    } catch {}
  };

  // Recurring Handlers
  const handleOpenAddRecurring = () => {
    setEditingRecurring(null);
    setRecAmount('');
    setRecNote('');
    setRecCatId(categories[0]?.id || 'cat-bills');
    setRecAccountId(accounts[0]?.id || 'acc-card');
    setRecFreq('monthly');
    setRecNextDate(getLocalDateString(new Date()));
    setIsAddEditRecOpen(true);
  };

  const handleOpenEditRecurring = (rec: RecurringTransaction) => {
    setEditingRecurring(rec);
    setRecAmount(rec.amount.toString());
    setRecNote(rec.note || '');
    setRecCatId(rec.categoryId);
    setRecAccountId(rec.accountId || accounts[0]?.id || 'acc-card');
    setRecFreq(rec.frequency);
    setRecNextDate(rec.nextOccurrence || getLocalDateString(new Date()));
    setIsAddEditRecOpen(true);
  };

  const handleSaveRecurring = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(normalizeArabicNumerals(recAmount));
    if (isNaN(num) || num <= 0 || !recNote.trim()) return;

    if (editingRecurring) {
      await saveRecurringItem({
        ...editingRecurring,
        amount: num,
        categoryId: recCatId,
        accountId: recAccountId || accounts[0]?.id || 'acc-card',
        frequency: recFreq,
        nextOccurrence: recNextDate || getLocalDateString(new Date()),
        note: recNote.trim(),
      });
    } else {
      await addRecurringItem({
        type: 'expense',
        amount: num,
        categoryId: recCatId,
        accountId: recAccountId || accounts[0]?.id || 'acc-card',
        frequency: recFreq,
        nextOccurrence: recNextDate || getLocalDateString(new Date()),
        note: recNote.trim(),
        isActive: true,
      });
    }

    setRecAmount('');
    setRecNote('');
    setEditingRecurring(null);
    setIsAddEditRecOpen(false);
  };

  // File Upload Handlers
  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (text) {
        await importCSVText(text);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleBackupUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setConfirmAction({
          title: t.settings.restoreConfirmTitle,
          desc: t.settings.restoreConfirmDesc,
          confirmLabel: t.settings.restoreConfirmAction,
          isDanger: true,
          onConfirm: async () => {
            await importFullBackupJSON(text);
            setConfirmAction(null);
          },
        });
      }
    };
    reader.readAsText(file);
    if (backupFileInputRef.current) backupFileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6 pb-28">
      {/* Top Bar with Back Button */}
      <div className="flex items-center gap-3 pt-1">
        <button
          type="button"
          onClick={() => setActiveTab('home')}
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer shadow-xs shrink-0"
          title={isAr ? 'الرجوع للرئيسية' : 'Back to Home'}
          aria-label={isAr ? 'الرجوع للرئيسية' : 'Back to Home'}
        >
          <ArrowLeft size={18} className="rtl:rotate-180" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
            {t.settings.title}
          </h1>
        </div>
      </div>

      {/* ========================================================
          GROUP 1: Preferences / المظهر والتفضيلات العامة
         ======================================================== */}
      <div>
        <div className="px-3 mb-2 flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            {isAr ? 'المظهر والتفضيلات العامة' : 'General & Appearance'}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs divide-y divide-slate-100 dark:divide-slate-800/80 overflow-hidden">
          {/* Row 1: Language */}
          <div className="px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Globe size={17} />
              </div>
              <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
                {t.settings.language}
              </span>
            </div>

            <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex items-center gap-1 border border-slate-200/60 dark:border-slate-700/60 shrink-0">
              <button
                type="button"
                onClick={() => setLanguage('ar')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  language === 'ar'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                العربية
              </button>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  language === 'en'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                English
              </button>
            </div>
          </div>

          {/* Row 2: Theme */}
          <div className="px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                theme === 'dark' 
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-400' 
                  : 'bg-amber-50 dark:bg-amber-950/60 text-amber-500'
              }`}>
                {theme === 'dark' ? <Moon size={17} /> : <Sun size={17} />}
              </div>
              <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
                {t.settings.theme}
              </span>
            </div>

            <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex items-center gap-1 border border-slate-200/60 dark:border-slate-700/60 shrink-0">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  theme === 'light'
                    ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                <Sun size={13} className="text-amber-500" />
                <span>{isAr ? 'فاتح' : 'Light'}</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-white dark:bg-slate-900 text-blue-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                <Moon size={13} className="text-blue-400" />
                <span>{isAr ? 'داكن' : 'Dark'}</span>
              </button>
            </div>
          </div>

          {/* Row 3: Numeral System */}
          <div className="px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                <Hash size={17} />
              </div>
              <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
                {isAr ? 'نظام الأرقام' : 'Numeral System'}
              </span>
            </div>

            <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex items-center gap-1 border border-slate-200/60 dark:border-slate-700/60 shrink-0">
              <button
                type="button"
                onClick={() => setNumberFormat('western')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  numberFormat === 'western'
                    ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                123
              </button>
              <button
                type="button"
                onClick={() => setNumberFormat('arabic')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  numberFormat === 'arabic'
                    ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                ١٢٣
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          GROUP 2: Finances / إدارة المال والمصروفات
         ======================================================== */}
      <div>
        <div className="px-3 mb-2 flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            {isAr ? 'إدارة المال والمصروفات' : 'Finances & Budgeting'}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs divide-y divide-slate-100 dark:divide-slate-800/80 overflow-hidden">
          {/* Row 1: Monthly Budget */}
          <div 
            onClick={() => setIsBudgetModalOpen(true)}
            className="px-4 py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-850/60 transition-colors cursor-pointer group select-none"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center shrink-0">
                <PieChart size={17} />
              </div>
              <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
                {t.settings.monthlyBudget}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 text-xs font-bold border border-amber-200/60 dark:border-amber-800/50">
                {budget.amount > 0 
                  ? formatCurrency(budget.amount, settings.currency, language, false, numberFormat)
                  : (isAr ? 'غير محددة' : 'Not set')
                }
              </span>
              <ChevronLeft size={16} className="text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-transform rtl:rotate-0 ltr:rotate-180" />
            </div>
          </div>

          {/* Row 2: Wallets & Accounts */}
          <div 
            onClick={() => setIsWalletsSheetOpen(true)}
            className="px-4 py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-850/60 transition-colors cursor-pointer group select-none"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Wallet size={17} />
              </div>
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {t.settings.accounts}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/40">
                  {formatNum(accounts.length)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 hidden sm:inline">
                {isAr ? 'إدارة' : 'Manage'}
              </span>
              <ChevronLeft size={16} className="text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-transform rtl:rotate-0 ltr:rotate-180" />
            </div>
          </div>

          {/* Row 3: Categories & Classifications */}
          <div 
            onClick={() => setIsCategoriesSheetOpen(true)}
            className="px-4 py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-850/60 transition-colors cursor-pointer group select-none"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <Tag size={17} />
              </div>
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {t.settings.categories}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/40">
                  {formatNum(categories.length)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 hidden sm:inline">
                {isAr ? 'تخصيص' : 'Customize'}
              </span>
              <ChevronLeft size={16} className="text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-transform rtl:rotate-0 ltr:rotate-180" />
            </div>
          </div>

          {/* Row 4: Recurring Transactions */}
          <div 
            onClick={() => setIsRecurringSheetOpen(true)}
            className="px-4 py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-850/60 transition-colors cursor-pointer group select-none"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
                <Repeat size={17} />
              </div>
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {t.settings.recurring}
                </span>
                {recurring.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 border border-cyan-200/60 dark:border-cyan-800/40">
                    {formatNum(recurring.length)}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 hidden sm:inline">
                {isAr ? 'عرض' : 'View'}
              </span>
              <ChevronLeft size={16} className="text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-transform rtl:rotate-0 ltr:rotate-180" />
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          GROUP 3: Privacy & Security / الخصوصية والأمان
         ======================================================== */}
      <div>
        <div className="px-3 mb-2 flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            {isAr ? 'الخصوصية والأمان' : 'Privacy & Security'}
          </span>
          {(settings.pinLockEnabled || settings.biometricLock) && (
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200/50 dark:border-emerald-800/40">
              {isAr ? 'الحماية مفعّلة' : 'Protected'}
            </span>
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs divide-y divide-slate-100 dark:divide-slate-800/80 overflow-hidden">
          {/* Row 1: PIN Passcode Lock */}
          <div className="px-4 py-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Lock size={17} />
              </div>
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {isAr ? 'قفل التطبيق برمز PIN' : 'PIN Passcode Lock'}
                </span>
                {settings.pinLockEnabled && (
                  <button
                    type="button"
                    onClick={() => handleOpenSetPin(true)}
                    className="px-2 py-0.5 rounded-md bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 font-bold text-[10px] cursor-pointer transition-colors border border-blue-200/50 dark:border-blue-800/40"
                  >
                    {isAr ? 'تعديل الرمز' : 'Edit PIN'}
                  </button>
                )}
              </div>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={Boolean(settings.pinLockEnabled)}
              onClick={handleTogglePinLock}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                settings.pinLockEnabled ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out ${
                  settings.pinLockEnabled ? 'ltr:translate-x-5 rtl:-translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Row 2: Biometrics / Fingerprint */}
          <div className="px-4 py-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Fingerprint size={17} />
              </div>
              <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {isAr ? 'القفل بالبصمة / Face ID' : 'Fingerprint / Face ID'}
                </span>
                {biometricsAvailable && (
                  <span className="text-[9px] bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.2 rounded-md font-bold border border-emerald-200/50 dark:border-emerald-800/40">
                    {isAr ? 'مدعومة' : 'Supported'}
                  </span>
                )}
              </div>
            </div>

            <button
              type="button"
              role="switch"
              disabled={isEnrollingBiometrics}
              aria-checked={Boolean(settings.biometricLock)}
              onClick={handleToggleBiometrics}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                settings.biometricLock ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out ${
                  settings.biometricLock ? 'ltr:translate-x-5 rtl:-translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Row 3: App Switcher Blur */}
          <div className="px-4 py-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
                <ShieldCheck size={17} />
              </div>
              <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
                {isAr ? 'تعتيم التطبيق عند التبديل' : 'App Switcher Blur'}
              </span>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={Boolean(settings.privacyBlurEnabled ?? true)}
              onClick={() => updateSettings({ privacyBlurEnabled: !(settings.privacyBlurEnabled ?? true) })}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                (settings.privacyBlurEnabled ?? true) ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out ${
                  (settings.privacyBlurEnabled ?? true) ? 'ltr:translate-x-5 rtl:-translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Row 4: Auto Privacy Mode */}
          <div className="px-4 py-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                <EyeOff size={17} />
              </div>
              <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
                {isAr ? 'وضع الخصوصية التلقائي' : 'Mask Amounts by Default'}
              </span>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={Boolean(settings.autoPrivacyModeOnLaunch)}
              onClick={() => {
                const next = !settings.autoPrivacyModeOnLaunch;
                updateSettings({ autoPrivacyModeOnLaunch: next });
                try {
                  localStorage.setItem('masrofy_auto_privacy_launch', String(next));
                } catch {}
              }}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                settings.autoPrivacyModeOnLaunch ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out ${
                  settings.autoPrivacyModeOnLaunch ? 'ltr:translate-x-5 rtl:-translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================
          GROUP 4: Data & Backup / البيانات والنسخ الاحتياطي
         ======================================================== */}
      <div>
        <div className="px-3 mb-2 flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            {isAr ? 'البيانات والنسخ الاحتياطي' : 'Data & Backup'}
          </span>
        </div>

        {/* Hidden File Inputs */}
        <input
          ref={backupFileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleBackupUpload}
          className="hidden"
        />
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={handleCSVUpload}
          className="hidden"
        />

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs divide-y divide-slate-100 dark:divide-slate-800/80 overflow-hidden">
          {/* Row 1: Full System Backup (JSON) */}
          <div 
            onClick={() => setIsBackupSheetOpen(true)}
            className="px-4 py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-850/60 transition-colors cursor-pointer group select-none"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                <Database size={17} />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 block">
                  {isAr ? 'النسخة الشاملة (JSON)' : 'Full System Backup (JSON)'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 hidden sm:inline">
                {isAr ? 'إدارة' : 'Manage'}
              </span>
              <ChevronLeft size={16} className="text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-transform rtl:rotate-0 ltr:rotate-180" />
            </div>
          </div>

          {/* Row 2: Excel Spreadsheet (CSV) */}
          <div 
            onClick={() => setIsCsvSheetOpen(true)}
            className="px-4 py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-850/60 transition-colors cursor-pointer group select-none"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <FileSpreadsheet size={17} />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 block">
                  {isAr ? 'ملف إكسل (CSV)' : 'Excel Spreadsheet (CSV)'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 hidden sm:inline">
                {isAr ? 'إدارة' : 'Manage'}
              </span>
              <ChevronLeft size={16} className="text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-transform rtl:rotate-0 ltr:rotate-180" />
            </div>
          </div>

          {/* Row 3: Factory Reset Data */}
          <div className="px-4 py-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Trash2 size={17} />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs sm:text-sm font-semibold text-rose-600 dark:text-rose-400 block">
                  {isAr ? 'إعادة ضبط البيانات' : 'Reset All Data'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setConfirmAction({
                  title: t.settings.confirmReset,
                  desc: t.settings.confirmResetDesc,
                  confirmLabel: t.settings.resetNow,
                  isDanger: true,
                  onConfirm: async () => {
                    await resetAllData();
                    showToast(isAr ? 'تمت إعادة ضبط كافة البيانات بنجاح' : 'All data has been reset');
                  },
                });
              }}
              className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 text-xs font-bold transition-colors cursor-pointer shrink-0"
            >
              {isAr ? 'إعادة الضبط' : 'Reset'}
            </button>
          </div>
        </div>
      </div>


      {/* ========================================================
          BOTTOM SHEET 1: Wallets Management Modal
         ======================================================== */}
      <WalletManagementModal
        isOpen={isWalletsSheetOpen}
        onClose={() => setIsWalletsSheetOpen(false)}
      />

      {/* ========================================================
          BOTTOM SHEET 2: Categories Management Sheet
         ======================================================== */}
      {isCategoriesSheetOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="absolute inset-0" onClick={() => setIsCategoriesSheetOpen(false)} />

          <div 
            className="relative w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl max-h-[88vh] flex flex-col border border-slate-200 dark:border-slate-800 shadow-2xl z-10 overflow-hidden"
            role="dialog"
          >
            {/* Header */}
            <div className="p-4 px-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCategoriesSheetOpen(false)}
                  className="p-1.5 -ms-1 rounded-full text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title={isAr ? 'رجوع' : 'Back'}
                >
                  <ArrowLeft size={18} className="rtl:rotate-180" />
                </button>
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                  <Tag size={18} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    {t.settings.categories}
                  </h2>
                  <span className="text-[11px] text-slate-400 block">
                    {isAr ? `${formatNum(categories.length)} فئة مصاريف متاحة` : `${formatNum(categories.length)} active categories`}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleOpenAddCategory}
                  className="px-2.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1 transition-all shadow-xs cursor-pointer active:scale-95"
                >
                  <Plus size={14} />
                  <span>{isAr ? 'فئة جديدة' : 'New'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsCategoriesSheetOpen(false)}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="p-4 overflow-y-auto no-scrollbar space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {categories.map(cat => (
                  <div
                    key={cat.id}
                    onClick={() => handleOpenEditCategory(cat)}
                    className="p-3 rounded-xl border flex items-center justify-between gap-2 transition-all cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-700 bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 select-none group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1 pe-1">
                      <CategoryIcon name={cat.icon} color={cat.color} size={17} />
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate leading-normal" title={getCategoryDisplayName(cat.name, language)}>
                        {getCategoryDisplayName(cat.name, language)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => {
                          setConfirmAction({
                            title: isAr ? `حذف فئة "${getCategoryDisplayName(cat.name, language)}"` : `Delete Category "${cat.name}"`,
                            desc: isAr 
                              ? 'هل أنت متأكد من حذف هذه الفئة؟ سيتم تحويل المعاملات المرتبطة بها تلقائياً إلى فئة "أخرى".' 
                              : 'Are you sure you want to delete this category? Associated expenses will be reassigned to "Other".',
                            confirmLabel: isAr ? 'نعم، احذف' : 'Delete',
                            isDanger: true,
                            onConfirm: async () => {
                              await deleteCategoryItem(cat.id);
                              setConfirmAction(null);
                            },
                          });
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg text-xs cursor-pointer transition-colors"
                        title={isAr ? 'حذف الفئة' : 'Delete Category'}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          BOTTOM SHEET 3: Recurring Transactions Sheet
         ======================================================== */}
      {isRecurringSheetOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="absolute inset-0" onClick={() => setIsRecurringSheetOpen(false)} />

          <div 
            className="relative w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl max-h-[88vh] flex flex-col border border-slate-200 dark:border-slate-800 shadow-2xl z-10 overflow-hidden"
            role="dialog"
          >
            {/* Header */}
            <div className="p-4 px-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsRecurringSheetOpen(false)}
                  className="p-1.5 -ms-1 rounded-full text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title={isAr ? 'رجوع' : 'Back'}
                >
                  <ArrowLeft size={18} className="rtl:rotate-180" />
                </button>
                <div className="p-2 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400">
                  <Repeat size={18} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    {t.settings.recurring}
                  </h2>
                  <span className="text-[11px] text-slate-400 block">
                    {isAr ? `${formatNum(recurring.length)} مصاريف متكررة مجدولة` : `${formatNum(recurring.length)} recurring entries`}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleOpenAddRecurring}
                  className="px-2.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold flex items-center gap-1 transition-all shadow-xs cursor-pointer active:scale-95"
                >
                  <Plus size={14} />
                  <span>{isAr ? 'معاملة جديدة' : 'Add'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsRecurringSheetOpen(false)}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="p-4 overflow-y-auto no-scrollbar space-y-2.5">
              {recurring.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-500 mx-auto flex items-center justify-center">
                    <Repeat size={22} />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                    {isAr ? 'لا توجد معاملات متكررة مجدولة حتى الآن' : 'No recurring transactions configured yet'}
                  </p>
                  <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                    {isAr ? 'أضف اشتراكاتك الشهرية أو الأسبوعية لتسجيلها تلقائياً بدقة' : 'Schedule subscriptions or recurring bills to track them automatically'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recurring.map(rec => (
                    <div 
                      key={rec.id} 
                      onClick={() => handleOpenEditRecurring(rec)}
                      className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:border-cyan-300 dark:hover:border-cyan-700 flex items-center justify-between cursor-pointer transition-all select-none"
                    >
                      <div className="min-w-0 flex-1 pe-2">
                        <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 block truncate">
                          {rec.note}
                        </span>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400 flex-wrap">
                          <strong className="text-cyan-600 dark:text-cyan-400 font-bold">
                            {formatCurrency(rec.amount, settings.currency, language, false, numberFormat)}
                          </strong>
                          <span>·</span>
                          <span>{getFrequencyDisplayName(rec.frequency, language)}</span>
                          {rec.nextOccurrence && (
                            <>
                              <span>·</span>
                              <span>{rec.nextOccurrence}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => {
                            setConfirmAction({
                              title: isAr ? `حذف المعاملة المتكررة "${rec.note}"` : `Delete Recurring "${rec.note}"`,
                              desc: isAr 
                                ? 'هل أنت متأكد من رغبتك في حذف هذه المعاملة المتكررة؟ لن يتم تكرارها تلقائياً بعد الآن.' 
                                : 'Are you sure you want to delete this recurring transaction?',
                              confirmLabel: isAr ? 'نعم، احذف' : 'Delete',
                              isDanger: true,
                              onConfirm: async () => {
                                await removeRecurringItem(rec.id);
                                setConfirmAction(null);
                              },
                            });
                          }}
                          className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer transition-colors"
                          title={isAr ? 'حذف المعاملة المتكررة' : 'Delete'}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: Quick Monthly Budget Edit
         ======================================================== */}
      {isBudgetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="absolute inset-0" onClick={() => setIsBudgetModalOpen(false)} />

          <div 
            className="relative w-full max-w-xs bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xl z-10 space-y-4"
            role="dialog"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center">
                  <PieChart size={17} />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {t.settings.monthlyBudget}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsBudgetModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  {isAr ? 'حدد سقف المصروفات الشهري:' : 'Enter monthly budget amount:'}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="decimal"
                    autoFocus={false}
                    value={budgetInput}
                    onChange={e => setBudgetInput(normalizeArabicNumerals(e.target.value))}
                    placeholder="0"
                    className="w-full text-center text-2xl font-black py-3 px-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white focus:outline-hidden focus:border-amber-500 transition-colors"
                  />
                  <span className="absolute end-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 select-none">
                    {getCurrencySymbol(settings.currency, language)}
                  </span>
                </div>
              </div>

              {/* Quick Adjustment Pills */}
              <div className="flex items-center justify-center gap-1.5 flex-wrap">
                {[500, 1000, 2000, 5000].map(addVal => (
                  <button
                    key={addVal}
                    type="button"
                    onClick={() => {
                      const cur = parseFloat(normalizeArabicNumerals(budgetInput)) || 0;
                      const next = cur + addVal;
                      setBudgetInput(isAr ? toArabicNumerals(next.toString()) : next.toString());
                    }}
                    className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[11px] font-bold text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                  >
                    +{formatNum(addVal)}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setBudgetInput('0')}
                  className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-[11px] font-bold text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
                >
                  {isAr ? 'تصفير' : 'Reset'}
                </button>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsBudgetModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-750 transition-colors"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleSaveBudget}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs cursor-pointer transition-colors shadow-xs"
                >
                  {isAr ? 'حفظ الميزانية' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: Add / Edit Category
         ======================================================== */}
      {isAddEditCatOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddEditCatOpen(false)}
                  className="p-1 -ms-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <ArrowLeft size={16} className="rtl:rotate-180" />
                </button>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {editingCategory ? (isAr ? 'تعديل الفئة' : 'Edit Category') : t.settings.addCategory}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAddEditCatOpen(false);
                  setEditingCategory(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                  {t.settings.categoryName}
                </label>
                <input
                  type="text"
                  autoFocus={false}
                  value={catName}
                  onChange={e => setCatName(e.target.value)}
                  placeholder={isAr ? 'مثال: سفر، استثمار، دراسة' : 'e.g. Travel, Investments, Pet'}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <StyledIconSelector
                selectedIcon={catIcon}
                selectedColor={catColor}
                onSelect={(icon, color) => {
                  setCatIcon(icon);
                  setCatColor(color);
                }}
                language={language}
              />

              <div className="pt-2 flex items-center justify-between gap-2">
                {editingCategory ? (
                  <button
                    type="button"
                    onClick={() => {
                      const idToDelete = editingCategory.id;
                      const nameToDelete = editingCategory.name;
                      setIsAddEditCatOpen(false);
                      setEditingCategory(null);
                      setConfirmAction({
                        title: isAr ? `حذف فئة "${getCategoryDisplayName(nameToDelete, language)}"` : `Delete Category "${nameToDelete}"`,
                        desc: isAr 
                          ? 'هل أنت متأكد من رغبتك في حذف هذه الفئة؟ سيتم تحويل المعاملات المرتبطة بها تلقائياً إلى فئة "أخرى".' 
                          : 'Are you sure you want to delete this category? Associated transactions will be reassigned to "Other".',
                        confirmLabel: isAr ? 'نعم، احذف' : 'Delete',
                        isDanger: true,
                        onConfirm: async () => {
                          await deleteCategoryItem(idToDelete);
                          setConfirmAction(null);
                        },
                      });
                    }}
                    className="px-3 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-semibold rounded-xl cursor-pointer flex items-center gap-1 transition-colors text-xs"
                  >
                    <Trash2 size={13} />
                    <span>{isAr ? 'حذف' : 'Delete'}</span>
                  </button>
                ) : <div />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddEditCatOpen(false)}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl cursor-pointer text-xs"
                  >
                    {t.addExpense.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={!catName.trim()}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-xl cursor-pointer text-xs shadow-xs"
                  >
                    {t.addExpense.save}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: Add / Edit Recurring
         ======================================================== */}
      {isAddEditRecOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddEditRecOpen(false)}
                  className="p-1 -ms-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <ArrowLeft size={16} className="rtl:rotate-180" />
                </button>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {editingRecurring ? (isAr ? 'تعديل معاملة متكررة' : 'Edit Recurring') : t.settings.addRecurring}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAddEditRecOpen(false);
                  setEditingRecurring(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveRecurring} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                  {t.addExpense.noteOptional}
                </label>
                <input
                  type="text"
                  autoFocus={false}
                  value={recNote}
                  onChange={e => setRecNote(e.target.value)}
                  placeholder={isAr ? 'مثال: اشتراك نتفليكس، إيجار، جيم' : 'e.g. Netflix, Rent, Gym'}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                  {t.addExpense.amount} ({getCurrencySymbol(settings.currency, language)})
                </label>
                <input
                  type="number"
                  step="any"
                  autoFocus={false}
                  value={recAmount}
                  onChange={e => setRecAmount(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                    {t.settings.frequency}
                  </label>
                  <select
                    value={recFreq}
                    onChange={e => setRecFreq(e.target.value as any)}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="daily">{t.settings.daily}</option>
                    <option value="weekly">{t.settings.weekly}</option>
                    <option value="monthly">{t.settings.monthly}</option>
                    <option value="yearly">{t.settings.yearly}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                    {t.addExpense.category}
                  </label>
                  <select
                    value={recCatId}
                    onChange={e => setRecCatId(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>
                        {getCategoryDisplayName(c.name, language)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                    {t.addExpense.paidFrom}
                  </label>
                  <select
                    value={recAccountId}
                    onChange={e => setRecAccountId(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {accounts.filter(a => a.isActive).map(a => (
                      <option key={a.id} value={a.id}>
                        {getAccountDisplayName(a.name, language)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                    {t.addExpense.date}
                  </label>
                  <input
                    type="date"
                    autoFocus={false}
                    value={recNextDate}
                    onChange={e => setRecNextDate(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddEditRecOpen(false)}
                  className="px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-xl cursor-pointer"
                >
                  {t.addExpense.cancel}
                </button>
                <button
                  type="submit"
                  disabled={!recNote.trim() || !recAmount}
                  className="px-4 py-2 bg-cyan-600 disabled:opacity-50 text-white font-semibold rounded-xl cursor-pointer shadow-xs"
                >
                  {t.addExpense.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: Security PIN Setup & Verification
         ======================================================== */}
      {isPinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-xs bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                  <KeyRound size={16} />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {isDisablingPin 
                    ? (isAr ? 'إيقاف قفل التطبيق' : 'Disable Lock')
                    : isChangingPin 
                      ? (isAr ? 'تغيير رمز القفل' : 'Change Lock PIN')
                      : (isAr ? 'تعيين رمز القفل' : 'Set Lock PIN')
                  }
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsPinModalOpen(false);
                  setIsChangingPin(false);
                  setIsDisablingPin(false);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* If disabling or changing, require current PIN */}
              {(isDisablingPin || isChangingPin) && (
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                    {isAr ? 'أدخل رمز المرور الحالي (6 أرقام):' : 'Enter current 6-digit PIN:'}
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    autoFocus={false}
                    dir="ltr"
                    style={{ direction: 'ltr' }}
                    maxLength={6}
                    value={currentPinInput}
                    onChange={e => {
                      const normalized = normalizeArabicNumerals(e.target.value);
                      const val = normalized.replace(/\D/g, '').slice(0, 6);
                      setCurrentPinInput(val);
                      setPinError('');
                    }}
                    placeholder="••••••"
                    className="w-full text-center tracking-[0.8em] font-mono text-lg font-black py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500"
                  />
                  {settings.biometricLock && (
                    <button
                      type="button"
                      onClick={async () => {
                        const res = await authenticateWithBiometrics();
                        if (res.success) {
                          setCurrentPinInput(settings.passcode || '123456');
                          setPinError('');
                          showToast(isAr ? 'تم تأكيد الهوية بالبصمة' : 'Verified via biometrics');
                        } else {
                          setPinError(isAr ? 'فشلت المصادقة بالبصمة' : 'Biometric verification failed');
                        }
                      }}
                      className="mt-1.5 w-full py-1.5 px-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold text-[11px] flex items-center justify-center gap-1.5 hover:bg-blue-100 transition-colors cursor-pointer"
                    >
                      <Fingerprint size={13} />
                      <span>{isAr ? 'نسيت الرمز؟ تحقق ببصمة الإصبع' : 'Forgot PIN? Verify with Fingerprint'}</span>
                    </button>
                  )}
                </div>
              )}

              {/* If NOT disabling, show new PIN fields */}
              {!isDisablingPin && (
                <>
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                      {isChangingPin 
                        ? (isAr ? 'أدخل الرمز الجديد (6 أرقام):' : 'Enter new 6-digit PIN:')
                        : (isAr ? 'أدخل رمزاً مكوناً من 6 أرقام:' : 'Enter 6-digit PIN:')
                      }
                    </label>
                    <input
                      type="password"
                      inputMode="numeric"
                      autoFocus={false}
                      dir="ltr"
                      style={{ direction: 'ltr' }}
                      maxLength={6}
                      value={pinInput}
                      onChange={e => {
                        const normalized = normalizeArabicNumerals(e.target.value);
                        const val = normalized.replace(/\D/g, '').slice(0, 6);
                        setPinInput(val);
                        setPinError('');
                      }}
                      placeholder="••••••"
                      className="w-full text-center tracking-[0.8em] font-mono text-lg font-black py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                      {isAr ? 'تأكيد الرمز مرة أخرى:' : 'Confirm PIN:'}
                    </label>
                    <input
                      type="password"
                      inputMode="numeric"
                      autoFocus={false}
                      dir="ltr"
                      style={{ direction: 'ltr' }}
                      maxLength={6}
                      value={pinConfirmInput}
                      onChange={e => {
                        const normalized = normalizeArabicNumerals(e.target.value);
                        const val = normalized.replace(/\D/g, '').slice(0, 6);
                        setPinConfirmInput(val);
                        setPinError('');
                      }}
                      placeholder="••••••"
                      className="w-full text-center tracking-[0.8em] font-mono text-lg font-black py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500"
                    />
                  </div>
                </>
              )}

              {pinError && (
                <p className="text-xs text-rose-500 text-center font-bold">
                  {pinError}
                </p>
              )}

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsPinModalOpen(false);
                    setIsChangingPin(false);
                    setIsDisablingPin(false);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-750 transition-colors"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="button"
                  disabled={
                    isDisablingPin 
                      ? currentPinInput.length !== 6
                      : isChangingPin 
                        ? (currentPinInput.length !== 6 || pinInput.length !== 6 || pinConfirmInput.length !== 6)
                        : (pinInput.length !== 6 || pinConfirmInput.length !== 6)
                  }
                  onClick={handleSavePin}
                  className={`flex-1 py-2.5 rounded-xl font-bold text-white cursor-pointer transition-colors shadow-xs disabled:opacity-40 ${
                    isDisablingPin ? 'bg-rose-600 hover:bg-rose-700' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {isDisablingPin 
                    ? (isAr ? 'تأكيد الإيقاف' : 'Disable')
                    : isChangingPin 
                      ? (isAr ? 'تحديث الرمز' : 'Update PIN')
                      : (isAr ? 'حفظ وتفعيل' : 'Save & Enable')
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          BOTTOM SHEET: Full System Backup (JSON)
         ======================================================== */}
      {isBackupSheetOpen && (
        <div 
          className="fixed inset-0 z-60 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setIsBackupSheetOpen(false)}
        >
          <div 
            className="w-full max-w-sm sm:max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shadow-xs">
                  <Database size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                    {isAr ? 'النسخة الشاملة (JSON)' : 'Full System Backup (JSON)'}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBackupSheetOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-1">
              {/* Export Button */}
              <button
                type="button"
                onClick={() => {
                  downloadFullBackupJSON();
                  setIsBackupSheetOpen(false);
                }}
                className="w-full p-3.5 rounded-2xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/50 dark:hover:bg-purple-900/60 border border-purple-200/80 dark:border-purple-800/80 flex items-center justify-between transition-all cursor-pointer active:scale-98 text-start"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-2xs shrink-0">
                    <Download size={18} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-purple-900 dark:text-purple-200 block">
                      {isAr ? 'تصدير نسخة احتياطية جديدة' : 'Export New Backup'}
                    </span>
                  </div>
                </div>
                <ChevronLeft size={16} className="text-purple-400 rtl:rotate-0 ltr:rotate-180 shrink-0" />
              </button>

              {/* Import Button */}
              <button
                type="button"
                onClick={() => {
                  setIsBackupSheetOpen(false);
                  backupFileInputRef.current?.click();
                }}
                className="w-full p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 flex items-center justify-between transition-all cursor-pointer active:scale-98 text-start"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center shadow-2xs shrink-0">
                    <Upload size={18} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      {isAr ? 'استيراد واستعادة نسخة' : 'Import & Restore Backup'}
                    </span>
                  </div>
                </div>
                <ChevronLeft size={16} className="text-slate-400 rtl:rotate-0 ltr:rotate-180 shrink-0" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          BOTTOM SHEET: Excel Spreadsheet (CSV)
         ======================================================== */}
      {isCsvSheetOpen && (
        <div 
          className="fixed inset-0 z-60 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setIsCsvSheetOpen(false)}
        >
          <div 
            className="w-full max-w-sm sm:max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
                  <FileSpreadsheet size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                    {isAr ? 'ملف إكسل (CSV)' : 'Excel Spreadsheet (CSV)'}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCsvSheetOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-1">
              {/* Export Button */}
              <button
                type="button"
                onClick={() => {
                  downloadCSV();
                  setIsCsvSheetOpen(false);
                }}
                className="w-full p-3.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 border border-emerald-200/80 dark:border-emerald-800/80 flex items-center justify-between transition-all cursor-pointer active:scale-98 text-start"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-2xs shrink-0">
                    <Download size={18} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 block">
                      {isAr ? 'تصدير جدول المعاملات (CSV)' : 'Export CSV Sheet'}
                    </span>
                  </div>
                </div>
                <ChevronLeft size={16} className="text-emerald-400 rtl:rotate-0 ltr:rotate-180 shrink-0" />
              </button>

              {/* Import Button */}
              <button
                type="button"
                onClick={() => {
                  setIsCsvSheetOpen(false);
                  fileInputRef.current?.click();
                }}
                className="w-full p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 flex items-center justify-between transition-all cursor-pointer active:scale-98 text-start"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center shadow-2xs shrink-0">
                    <Upload size={18} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      {isAr ? 'استيراد معاملات من CSV' : 'Import from CSV'}
                    </span>
                  </div>
                </div>
                <ChevronLeft size={16} className="text-slate-400 rtl:rotate-0 ltr:rotate-180 shrink-0" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: Confirmation Dialog
         ======================================================== */}
      {confirmAction && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-3.5 text-xs">
            <div className="flex items-center gap-2.5">
              <div className={`p-2 rounded-xl ${
                confirmAction.isDanger 
                  ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400' 
                  : 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
              }`}>
                <AlertTriangle size={18} />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {confirmAction.title}
              </h3>
            </div>
            
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed ps-1">
              {confirmAction.desc}
            </p>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl cursor-pointer"
              >
                {t.settings.cancel}
              </button>
              <button
                type="button"
                onClick={async () => {
                  const fn = confirmAction.onConfirm;
                  setConfirmAction(null);
                  if (fn) {
                    await fn();
                  }
                }}
                className={`px-4 py-2 font-semibold text-white rounded-xl cursor-pointer shadow-xs ${
                  confirmAction.isDanger ? 'bg-rose-600 hover:bg-rose-700' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {confirmAction.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
