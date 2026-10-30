import React from 'react';
import { 
  Banknote, 
  CreditCard, 
  Landmark, 
  Smartphone, 
  PiggyBank, 
  Wallet,
  ArrowLeftRight,
  Building2,
  Coins,
  Briefcase
} from 'lucide-react';
import { AccountType } from '../../types';

interface AccountIconProps {
  type?: AccountType | string;
  name?: string;
  color?: string;
  size?: number;
  strokeWidth?: number;
  className?: string;
  showBackground?: boolean;
}

export const AccountIcon: React.FC<AccountIconProps> = ({
  type = 'other',
  name,
  color,
  size = 18,
  strokeWidth = 1.5,
  className = '',
  showBackground = true,
}) => {
  const getIcon = () => {
    switch (name || type) {
      case 'cash':
      case 'Banknote':
        return <Banknote size={size} strokeWidth={strokeWidth} />;
      case 'bank':
      case 'Landmark':
        return <Landmark size={size} strokeWidth={strokeWidth} />;
      case 'building':
      case 'Building2':
        return <Building2 size={size} strokeWidth={strokeWidth} />;
      case 'credit_card':
      case 'debit_card':
      case 'card':
      case 'CreditCard':
        return <CreditCard size={size} strokeWidth={strokeWidth} />;
      case 'mobile_wallet':
      case 'Smartphone':
        return <Smartphone size={size} strokeWidth={strokeWidth} />;
      case 'savings':
      case 'PiggyBank':
        return <PiggyBank size={size} strokeWidth={strokeWidth} />;
      case 'coins':
      case 'Coins':
        return <Coins size={size} strokeWidth={strokeWidth} />;
      case 'business':
      case 'Briefcase':
        return <Briefcase size={size} strokeWidth={strokeWidth} />;
      case 'transfer':
      case 'instapay':
      case 'ArrowLeftRight':
        return <ArrowLeftRight size={size} strokeWidth={strokeWidth} />;
      case 'wallet':
      default:
        return <Wallet size={size} strokeWidth={strokeWidth} />;
    }
  };

  if (!showBackground) {
    return (
      <span
        style={color ? { color } : undefined}
        className={`inline-flex items-center justify-center shrink-0 ${className}`}
      >
        {getIcon()}
      </span>
    );
  }

  const customStyle: React.CSSProperties = color
    ? {
        backgroundColor: `${color}18`,
        borderColor: `${color}30`,
        color: color,
      }
    : {};

  return (
    <div
      style={customStyle}
      className={`w-10 h-10 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0 transition-all shadow-2xs ${className}`}
    >
      {getIcon()}
    </div>
  );
};
