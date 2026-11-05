import React from 'react';
import { Loader2 } from 'lucide-react';

interface CustomButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  title: string;
  variant?: 'primary' | 'danger' | 'outline' | 'secondary';
  size?: 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

export const CustomButton: React.FC<CustomButtonProps> = ({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  className = '',
  ...props
}) => {
  const baseStyles =
    'relative inline-flex items-center justify-center font-bold rounded-xl transition-all duration-150 focus:outline-hidden focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';

  const sizeStyles = {
    md: 'min-h-[48px] px-4 py-2.5 text-sm sm:text-base gap-2',
    lg: 'min-h-[56px] px-6 py-3.5 text-base sm:text-lg gap-2.5',
  };

  const variantStyles = {
    primary:
      'bg-sky-600 hover:bg-sky-700 text-white shadow-sm hover:shadow-md focus:ring-sky-500 border border-sky-500',
    danger:
      'bg-red-600 hover:bg-red-700 text-white shadow-sm hover:shadow-md focus:ring-red-500 border border-red-500',
    secondary:
      'bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 focus:ring-slate-400',
    outline:
      'bg-transparent hover:bg-sky-50 dark:hover:bg-sky-950/40 text-sky-600 dark:text-sky-400 border-2 border-sky-600 dark:border-sky-500 focus:ring-sky-500',
  };

  return (
    <button
      disabled={disabled || loading}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <>
          {icon && <span className="shrink-0">{icon}</span>}
          <span>{title}</span>
        </>
      )}
    </button>
  );
};
