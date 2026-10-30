import React from 'react';
import { useApp } from '../../context/AppContext';
import { Home, ArrowLeftRight, LineChart, Settings, Plus } from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics';

export const BottomNavigation: React.FC = () => {
  const { activeTab, setActiveTab, openAddExpense, language, t } = useApp();

  return (
    <nav 
      role="navigation" 
      aria-label={language === 'ar' ? 'شريط التنقل الرئيسي' : 'Main Navigation'}
      className="fixed bottom-2.5 left-1/2 -translate-x-1/2 w-[calc(100%-1.25rem)] max-w-[420px] z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-2xl sm:rounded-3xl shadow-lg shadow-slate-900/5 dark:shadow-black/20 transition-all select-none"
    >
      <div className="px-2 py-1.5 flex items-center justify-between">
        {/* Tab 1: Home */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            setActiveTab('home');
          }}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'home'
              ? 'text-blue-600 dark:text-blue-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 active:scale-95'
          }`}
        >
          <Home size={19} strokeWidth={activeTab === 'home' ? 2.2 : 1.6} />
          <span className="text-[10px] mt-0.5 tracking-tight font-medium">
            {t.nav.home}
          </span>
        </button>

        {/* Tab 2: Transactions */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            setActiveTab('transactions');
          }}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'transactions'
              ? 'text-blue-600 dark:text-blue-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 active:scale-95'
          }`}
        >
          <ArrowLeftRight size={19} strokeWidth={activeTab === 'transactions' ? 2.2 : 1.6} />
          <span className="text-[10px] mt-0.5 tracking-tight font-medium">
            {t.nav.transactions}
          </span>
        </button>

        {/* CENTER ACTION BUTTON: TACTILE ELEVATED PLUS BUTTON */}
        <div className="flex-1 flex items-center justify-center py-0.5">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('medium');
              openAddExpense();
            }}
            title={t.nav.addExpense}
            aria-label={t.nav.addExpense}
            className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 hover:from-blue-700 hover:to-indigo-600 text-white shadow-md shadow-blue-500/30 flex items-center justify-center transition-all cursor-pointer active:scale-90 active:shadow-xs focus:outline-hidden"
          >
            <Plus size={22} strokeWidth={2.2} />
          </button>
        </div>

        {/* Tab 3: Insights */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            setActiveTab('insights');
          }}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'insights'
              ? 'text-blue-600 dark:text-blue-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 active:scale-95'
          }`}
        >
          <LineChart size={19} strokeWidth={activeTab === 'insights' ? 2.2 : 1.6} />
          <span className="text-[10px] mt-0.5 tracking-tight font-medium">
            {t.nav.insights}
          </span>
        </button>

        {/* Tab 4: Settings */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            setActiveTab('settings');
          }}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'settings'
              ? 'text-blue-600 dark:text-blue-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 active:scale-95'
          }`}
        >
          <Settings size={19} strokeWidth={activeTab === 'settings' ? 2.2 : 1.6} />
          <span className="text-[10px] mt-0.5 tracking-tight font-medium">
            {t.nav.settings}
          </span>
        </button>
      </div>
    </nav>
  );
};
