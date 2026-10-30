import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

/**
 * StatsCard Component
 * Metric display card for CampusFix Admin Dashboard
 */
export const StatsCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend, // { value: '+12%', isPositive: true, neutral: false }
  variant = 'default', // 'default' | 'pending' | 'inprogress' | 'resolved' | 'urgent'
  onClick,
  active = false,
  className = ''
}) => {
  const variantStyles = {
    default: {
      border: 'border-slate-200 hover:border-slate-300',
      activeRing: 'ring-2 ring-slate-800',
      iconBg: 'bg-slate-100 text-slate-800',
      barColor: 'bg-slate-800'
    },
    pending: {
      border: 'border-amber-200 hover:border-amber-300',
      activeRing: 'ring-2 ring-amber-500',
      iconBg: 'bg-amber-50 text-amber-600',
      barColor: 'bg-amber-500'
    },
    inprogress: {
      border: 'border-blue-200 hover:border-blue-300',
      activeRing: 'ring-2 ring-blue-600',
      iconBg: 'bg-blue-50 text-blue-600',
      barColor: 'bg-blue-600'
    },
    resolved: {
      border: 'border-emerald-200 hover:border-emerald-300',
      activeRing: 'ring-2 ring-emerald-600',
      iconBg: 'bg-emerald-50 text-emerald-600',
      barColor: 'bg-emerald-600'
    },
    urgent: {
      border: 'border-rose-200 hover:border-rose-300',
      activeRing: 'ring-2 ring-rose-600',
      iconBg: 'bg-rose-50 text-rose-600',
      barColor: 'bg-rose-600'
    }
  }[variant] || variantStyles.default;

  const clickableStyles = onClick 
    ? 'cursor-pointer transform hover:-translate-y-0.5 transition-all duration-200' 
    : '';

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`relative overflow-hidden rounded-xl bg-white p-5 shadow-sm border ${variantStyles.border} ${active ? variantStyles.activeRing : ''} ${clickableStyles} ${className}`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {title}
          </p>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-bold tracking-tight text-slate-900">
              {value}
            </span>
          </div>
        </div>

        {Icon && (
          <div className={`p-3 rounded-xl ${variantStyles.iconBg}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="mt-3 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          {subtitle && <span className="truncate">{subtitle}</span>}
          {trend && (
            <span className={`inline-flex items-center font-medium gap-0.5 ${
              trend.neutral 
                ? 'text-slate-500' 
                : trend.isPositive 
                  ? 'text-emerald-600' 
                  : 'text-rose-600'
            }`}>
              {trend.isPositive && <ArrowUpRight className="w-3.5 h-3.5" />}
              {!trend.isPositive && !trend.neutral && <ArrowDownRight className="w-3.5 h-3.5" />}
              {trend.neutral && <Minus className="w-3.5 h-3.5" />}
              <span>{trend.value}</span>
            </span>
          )}
        </div>
      )}

      {/* Decorative accent strip */}
      <div className={`absolute bottom-0 left-0 right-0 h-1 ${variantStyles.barColor} opacity-70`} />
    </div>
  );
};

export default StatsCard;
