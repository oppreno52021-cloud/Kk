import React from 'react';
import { 
  Utensils, 
  ShoppingCart, 
  Car, 
  Receipt, 
  ShoppingBag, 
  HeartPulse, 
  Film, 
  GraduationCap, 
  User, 
  MoreHorizontal,
  Coffee,
  Home,
  Tv,
  Briefcase,
  Plane,
  Gift,
  Smartphone,
  Dumbbell,
  CreditCard,
  Banknote,
  Laptop,
  TrendingUp,
  Award,
  PlusCircle,
  Zap,
  Gamepad2,
  Pill,
  PiggyBank,
  Landmark
} from 'lucide-react';

interface CategoryIconProps {
  name: string;
  color?: string;
  size?: number;
  strokeWidth?: number;
  className?: string;
  showBackground?: boolean;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  name,
  color,
  size = 18,
  strokeWidth = 1.5,
  className = '',
  showBackground = true,
}) => {
  const getIcon = () => {
    switch (name) {
      case 'Utensils': return <Utensils size={size} strokeWidth={strokeWidth} />;
      case 'ShoppingCart': return <ShoppingCart size={size} strokeWidth={strokeWidth} />;
      case 'Car': return <Car size={size} strokeWidth={strokeWidth} />;
      case 'Receipt': return <Receipt size={size} strokeWidth={strokeWidth} />;
      case 'ShoppingBag': return <ShoppingBag size={size} strokeWidth={strokeWidth} />;
      case 'HeartPulse': return <HeartPulse size={size} strokeWidth={strokeWidth} />;
      case 'Pill': return <Pill size={size} strokeWidth={strokeWidth} />;
      case 'Zap': return <Zap size={size} strokeWidth={strokeWidth} />;
      case 'Gamepad2': return <Gamepad2 size={size} strokeWidth={strokeWidth} />;
      case 'Film': return <Film size={size} strokeWidth={strokeWidth} />;
      case 'GraduationCap': return <GraduationCap size={size} strokeWidth={strokeWidth} />;
      case 'User': return <User size={size} strokeWidth={strokeWidth} />;
      case 'Coffee': return <Coffee size={size} strokeWidth={strokeWidth} />;
      case 'Home': return <Home size={size} strokeWidth={strokeWidth} />;
      case 'Tv': return <Tv size={size} strokeWidth={strokeWidth} />;
      case 'Briefcase': return <Briefcase size={size} strokeWidth={strokeWidth} />;
      case 'Plane': return <Plane size={size} strokeWidth={strokeWidth} />;
      case 'Gift': return <Gift size={size} strokeWidth={strokeWidth} />;
      case 'Smartphone': return <Smartphone size={size} strokeWidth={strokeWidth} />;
      case 'Dumbbell': return <Dumbbell size={size} strokeWidth={strokeWidth} />;
      case 'CreditCard': return <CreditCard size={size} strokeWidth={strokeWidth} />;
      case 'Banknote': return <Banknote size={size} strokeWidth={strokeWidth} />;
      case 'Landmark': return <Landmark size={size} strokeWidth={strokeWidth} />;
      case 'PiggyBank': return <PiggyBank size={size} strokeWidth={strokeWidth} />;
      case 'Laptop': return <Laptop size={size} strokeWidth={strokeWidth} />;
      case 'TrendingUp': return <TrendingUp size={size} strokeWidth={strokeWidth} />;
      case 'Award': return <Award size={size} strokeWidth={strokeWidth} />;
      case 'PlusCircle': return <PlusCircle size={size} strokeWidth={strokeWidth} />;
      default: return <MoreHorizontal size={size} strokeWidth={strokeWidth} />;
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
