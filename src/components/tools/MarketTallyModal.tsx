import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ShoppingCart, 
  Plus, 
  Trash2, 
  X, 
  Check, 
  Copy, 
  RotateCcw, 
  ShoppingBag,
  Sparkles
} from 'lucide-react';
import { 
  toMinorUnits, 
  fromMinorUnits, 
  formatCurrency, 
  normalizeArabicNumerals,
  toArabicNumerals
} from '../../utils/calculations';
import { triggerHaptic } from '../../utils/haptics';
import { useBackHandler } from '../../hooks/useBackHandler';

export interface MarketItem {
  id: string;
  name: string;
  price: string;
}

interface MarketTallyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyAsExpense: (total: number, summary: string) => void;
  currency?: string;
  language?: 'en' | 'ar';
}

const STORAGE_KEY = 'masrofy_market_tally_items';

const SUGGESTED_ITEMS_AR = [
  'طماطم', 'خيار', 'بطاطس', 'بصل', 'فواكه', 'لحوم', 'دواجن', 'ألبان', 'خبز', 'منظفات'
];

const SUGGESTED_ITEMS_EN = [
  'Tomatoes', 'Cucumbers', 'Potatoes', 'Onions', 'Fruits', 'Meat', 'Poultry', 'Dairy', 'Bread', 'Groceries'
];

export const MarketTallyModal: React.FC<MarketTallyModalProps> = ({
  isOpen,
  onClose,
  onApplyAsExpense,
  currency = 'EGP',
  language = 'ar',
}) => {
  const isAr = language === 'ar';
  useBackHandler(isOpen, onClose, 'market-tally-modal');

  // Initialize items from localStorage or create 3 empty rows
  const [items, setItems] = useState<MarketItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return [
      { id: '1', name: '', price: '' },
      { id: '2', name: '', price: '' },
      { id: '3', name: '', price: '' },
    ];
  });

  const [copied, setCopied] = useState(false);
  const listEndRef = useRef<HTMLDivElement>(null);

  // Auto-save items to localStorage so users don't lose progress while shopping
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  }, [items]);

  // Accurate monetary summation
  const totalAmount = useMemo(() => {
    let totalMinor = 0;
    for (const item of items) {
      const cleanNum = parseFloat(normalizeArabicNumerals(item.price)) || 0;
      if (cleanNum > 0) {
        totalMinor += toMinorUnits(cleanNum);
      }
    }
    return fromMinorUnits(totalMinor);
  }, [items]);

  const validItemsCount = useMemo(() => {
    return items.filter(i => (parseFloat(normalizeArabicNumerals(i.price)) || 0) > 0 || i.name.trim()).length;
  }, [items]);

  if (!isOpen) return null;

  const handleUpdateItem = (id: string, field: 'name' | 'price', value: string) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const handleAddItem = (initialName = '') => {
    triggerHaptic('light');
    const newItem: MarketItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: initialName,
      price: '',
    };
    setItems(prev => [...prev, newItem]);
    setTimeout(() => {
      listEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  const handleDeleteItem = (id: string) => {
    triggerHaptic('light');
    setItems(prev => {
      const filtered = prev.filter(item => item.id !== id);
      if (filtered.length === 0) {
        return [{ id: `item-${Date.now()}`, name: '', price: '' }];
      }
      return filtered;
    });
  };

  const handleClearAll = () => {
    triggerHaptic('medium');
    setItems([
      { id: `item-${Date.now()}-1`, name: '', price: '' },
      { id: `item-${Date.now()}-2`, name: '', price: '' },
    ]);
  };

  const handleApplyQuickChip = (suggestion: string) => {
    triggerHaptic('light');
    // Check if there's an empty row to fill
    const emptyRow = items.find(i => !i.name.trim() && !i.price.trim());
    if (emptyRow) {
      handleUpdateItem(emptyRow.id, 'name', suggestion);
    } else {
      handleAddItem(suggestion);
    }
  };

  const buildSummaryText = () => {
    const validLines = items
      .filter(i => (parseFloat(normalizeArabicNumerals(i.price)) || 0) > 0 || i.name.trim())
      .map(i => {
        const p = parseFloat(normalizeArabicNumerals(i.price)) || 0;
        const n = i.name.trim() || (isAr ? 'بند' : 'Item');
        return `${n}: ${p} ${currency === 'EGP' ? (isAr ? 'ج.م' : 'EGP') : currency}`;
      });

    return validLines.join(' · ');
  };

  const handleConfirmAsExpense = () => {
    if (totalAmount <= 0) return;
    triggerHaptic('success');
    const summary = buildSummaryText();
    onApplyAsExpense(totalAmount, summary);
    onClose();
  };

  const handleCopySummary = () => {
    triggerHaptic('medium');
    const summary = buildSummaryText();
    const formatted = `${isAr ? '🛒 حسبة السوق' : '🛒 Market Tally'}:\n` +
      items
        .filter(i => (parseFloat(normalizeArabicNumerals(i.price)) || 0) > 0 || i.name.trim())
        .map((i, idx) => `${idx + 1}. ${i.name || (isAr ? 'بند' : 'Item')}: ${i.price || '0'} ${isAr ? 'ج.م' : 'EGP'}`)
        .join('\n') +
      `\n------------------\n${isAr ? 'المجموع' : 'Total'}: ${totalAmount} ${isAr ? 'ج.م' : 'EGP'}`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(formatted);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const suggestions = isAr ? SUGGESTED_ITEMS_AR : SUGGESTED_ITEMS_EN;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-lg border border-slate-200/90 dark:border-slate-800 flex flex-col max-h-[92vh] sm:max-h-[85vh] overflow-hidden animate-in slide-in-from-bottom duration-200"
      >
        {/* Header Bar */}
        <div className="px-4 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-xs">
              <ShoppingCart size={18} strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                {isAr ? 'حسبة السوق' : 'Market Tally'}
              </h2>
              <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                {isAr ? 'حاسبة فورية وسريعة للمشتريات' : 'Instant shopping calculator'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {validItemsCount > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="p-1.5 rounded-xl text-slate-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                title={isAr ? 'مسح الكل والبدء من جديد' : 'Clear All'}
              >
                <RotateCcw size={15} strokeWidth={1.5} />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X size={18} strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-4 py-2 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 shrink-0 select-none font-semibold">
              {isAr ? 'اقتراحات سريعة:' : 'Quick items:'}
            </span>
            {suggestions.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => handleApplyQuickChip(item)}
                className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-amber-950/30 hover:border-amber-300 transition-all shrink-0 cursor-pointer shadow-2xs active:scale-95"
              >
                + {item}
              </button>
            ))}
          </div>
        </div>

        {/* Items List Body */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {items.map((item, index) => (
            <div 
              key={item.id}
              className="flex items-center gap-2 p-1.5 bg-slate-50/70 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-800 transition-all focus-within:border-amber-400 dark:focus-within:border-amber-500 shadow-2xs"
            >
              {/* Row Number */}
              <span className="w-5 text-center text-[11px] font-bold text-slate-400 dark:text-slate-500 select-none">
                {isAr ? toArabicNumerals(index + 1) : index + 1}
              </span>

              {/* Item Name */}
              <input
                type="text"
                placeholder={isAr ? 'اسم البند (مثال: طماطم)' : 'Item name (e.g. Tomatoes)'}
                value={item.name}
                onChange={(e) => handleUpdateItem(item.id, 'name', e.target.value)}
                className="flex-1 min-w-0 bg-transparent text-xs font-bold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden px-1"
              />

              {/* Item Price */}
              <div className="flex items-center gap-1 bg-white dark:bg-slate-900 px-2 py-1.5 rounded-lg border border-slate-200/80 dark:border-slate-700/80 shrink-0 w-28">
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={item.price}
                  onChange={(e) => {
                    const norm = normalizeArabicNumerals(e.target.value).replace(/[^0-9.]/g, '');
                    handleUpdateItem(item.id, 'price', norm);
                  }}
                  className="w-full text-center text-xs font-black text-amber-600 dark:text-amber-400 focus:outline-hidden bg-transparent"
                />
                <span className="text-[10px] font-bold text-slate-400 select-none">
                  {currency === 'EGP' ? (isAr ? 'ج.م' : 'EGP') : currency}
                </span>
              </div>

              {/* Delete Button */}
              <button
                type="button"
                onClick={() => handleDeleteItem(item.id)}
                className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer shrink-0"
              >
                <Trash2 size={14} strokeWidth={1.5} />
              </button>
            </div>
          ))}

          {/* Add Row Button */}
          <button
            type="button"
            onClick={() => handleAddItem()}
            className="w-full py-2.5 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 text-slate-600 dark:text-slate-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-[0.99]"
          >
            <Plus size={15} strokeWidth={1.5} className="text-amber-500" />
            <span>{isAr ? 'إضافة سطر جديد' : 'Add New Item'}</span>
          </button>

          <div ref={listEndRef} />
        </div>

        {/* Sticky Total & Action Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 space-y-3 shrink-0">
          {/* Total Display Card */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-amber-500/15 border border-amber-300/40 dark:border-amber-600/30">
            <div>
              <span className="text-[11px] font-bold text-amber-900 dark:text-amber-200 block">
                {isAr ? 'المجموع الكلي للحسبة:' : 'Total Tally:'}
              </span>
              <span className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">
                {isAr ? `${validItemsCount} بنود مسجلة` : `${validItemsCount} items`}
              </span>
            </div>

            <div className="text-end">
              <span className="text-xl sm:text-2xl font-black text-amber-700 dark:text-amber-300 tracking-tight">
                {formatCurrency(totalAmount, currency, language, false)}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-4 gap-2">
            <button
              type="button"
              onClick={handleCopySummary}
              disabled={totalAmount <= 0}
              className={`col-span-1 py-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer ${
                copied
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-600'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
              } disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs`}
              title={isAr ? 'نسخ الحسبة' : 'Copy'}
            >
              {copied ? <Check size={16} strokeWidth={1.5} /> : <Copy size={16} strokeWidth={1.5} />}
              <span className="hidden sm:inline">{isAr ? 'نسخ' : 'Copy'}</span>
            </button>

            <button
              type="button"
              disabled={totalAmount <= 0}
              onClick={handleConfirmAsExpense}
              className={`col-span-3 py-3 rounded-xl font-extrabold text-xs sm:text-sm text-white flex items-center justify-center gap-2 transition-all shadow-xs active:scale-[0.99] cursor-pointer ${
                totalAmount > 0
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-amber-500/20 ring-1 ring-amber-500/30'
                  : 'bg-slate-300 dark:bg-slate-800 text-slate-400 cursor-not-allowed shadow-none'
              }`}
            >
              <ShoppingBag size={17} strokeWidth={1.5} />
              <span>{isAr ? 'اعتماد وتسجيل كمصروف' : 'Apply as Expense'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
