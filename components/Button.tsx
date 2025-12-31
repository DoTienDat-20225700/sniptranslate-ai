import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success'; // Thêm 'success'
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  icon,
  className = '',
  fullWidth = false,
  style,
  ...props
}) => {
  const baseStyles = "inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed";

  const variantStyles = {
    primary: {
      backgroundColor: 'var(--color-brand)',
      color: 'white',
      border: '1px solid transparent',
    },
    secondary: {
      backgroundColor: 'var(--btn-sec-bg)',
      color: 'var(--btn-sec-text)',
      border: '1px solid var(--btn-sec-border)',
      boxShadow: 'var(--shadow-panel)'
    },
    outline: {
      backgroundColor: 'transparent',
      border: '1px solid var(--color-brand)',
      color: 'var(--color-brand)',
    },
    ghost: {
      backgroundColor: 'transparent',
      color: 'var(--text-secondary)',
      border: '1px solid transparent'
    },
    // Nút Đỏ (Dừng / Nguy hiểm)
    danger: {
      backgroundColor: 'var(--color-danger)',
      color: 'white',
      border: '1px solid transparent',
    },
    // Nút Xanh Lá (Thành công / Bắt đầu)
    success: {
      backgroundColor: 'var(--color-success)',
      color: 'white',
      border: '1px solid transparent',
    }
  };

  return (
    <button
      className={`${baseStyles} ${fullWidth ? 'w-full' : ''} ${className}`}
      style={{ ...variantStyles[variant], ...style }}
      {...props}
    >
      {icon && <span>{icon}</span>}
      {children}
    </button>
  );
};