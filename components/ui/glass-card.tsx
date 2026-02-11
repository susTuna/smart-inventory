import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'lg' | 'elevated';
  onClick?: () => void;
}

export function GlassCard({
  children,
  className = '',
  variant = 'default',
  onClick,
}: GlassCardProps) {
  const baseClass = 'rounded-xl transition-all duration-300';

  const variantClasses = {
    default: 'glass',
    lg: 'glass-lg',
    elevated: 'glass shadow-glow hover:shadow-glow-lg',
  };

  return (
    <div
      className={`${baseClass} ${variantClasses[variant]} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
