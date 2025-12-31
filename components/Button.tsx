import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  icon?: React.ReactNode;
  fullWidth?: boolean;
  darkMode?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  icon,
  className = '',
  fullWidth = false,
  darkMode = false,
  ...props
}) => {
  const baseStyles = "inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors duration-200 text-sm focus:outline-none focus:ring-2 focus:ring-offset-1";

  // Dark mode aware variants
  const variants = {
    primary: darkMode
      ? "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500 shadow-sm"
      : "bg-blue-700 hover:bg-blue-800 text-white focus:ring-blue-500 shadow-sm",
    secondary: darkMode
      ? "bg-gray-700 hover:bg-gray-600 text-gray-200 border border-gray-600 shadow-sm focus:ring-gray-500"
      : "bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 shadow-sm focus:ring-gray-200",
    outline: darkMode
      ? "bg-transparent border border-blue-500 text-blue-400 hover:bg-blue-900/30 focus:ring-blue-500"
      : "bg-transparent border border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-blue-500",
    ghost: darkMode
      ? "bg-transparent hover:bg-gray-700 text-gray-300"
      : "bg-transparent hover:bg-gray-100 text-gray-600"
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className} disabled:opacity-50 disabled:cursor-not-allowed`}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
};