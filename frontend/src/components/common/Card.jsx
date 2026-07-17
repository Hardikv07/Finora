import React from 'react';

/**
 * Reusable Card component with glassmorphism, optional header and action slots
 */
const Card = ({
  title,
  subtitle,
  actions,
  children,
  className = '',
  headerClassName = '',
  bodyClassName = '',
  hoverEffect = false,
  onClick
}) => {
  return (
    <div
      onClick={onClick}
      className={`glass-card rounded-2xl overflow-hidden ${hoverEffect ? 'cursor-pointer hover:-translate-y-1' : ''} ${className}`}
    >
      {(title || subtitle || actions) && (
        <div className={`px-6 py-4.5 border-b border-slate-100/80 flex items-center justify-between gap-4 ${headerClassName}`}>
          <div>
            {title && <h3 className="text-base font-semibold text-slate-800 tracking-tight">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>
      )}
      <div className={`p-6 ${bodyClassName}`}>{children}</div>
    </div>
  );
};

export default Card;
