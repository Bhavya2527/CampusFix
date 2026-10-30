import React from 'react';
import { 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  ShieldAlert, 
  Activity, 
  Building2 
} from 'lucide-react';

/**
 * StatusBadge Component
 * Displays standardized CampusFix status, priority, and department badges
 */
export const StatusBadge = ({ 
  status, 
  type = 'status', // 'status' | 'priority' | 'department' | 'confidence'
  size = 'md',     // 'sm' | 'md' | 'lg'
  showIcon = true,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1 font-medium',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm px-3 py-1.5 gap-2 font-semibold'
  }[size] || 'text-xs px-2.5 py-1 gap-1.5 font-medium';

  // PRIORITY BADGES
  if (type === 'priority') {
    const priority = (status || '').toLowerCase();
    switch (priority) {
      case 'urgent':
        return (
          <span className={`inline-flex items-center rounded-full bg-rose-50 text-rose-700 border border-rose-200 shadow-sm ${sizeClasses} ${className}`}>
            {showIcon && <ShieldAlert className="w-3.5 h-3.5 text-rose-600 animate-pulse" />}
            <span>Urgent</span>
          </span>
        );
      case 'high':
        return (
          <span className={`inline-flex items-center rounded-full bg-amber-50 text-amber-700 border border-amber-200 shadow-sm ${sizeClasses} ${className}`}>
            {showIcon && <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />}
            <span>High</span>
          </span>
        );
      case 'medium':
        return (
          <span className={`inline-flex items-center rounded-full bg-sky-50 text-sky-700 border border-sky-200 ${sizeClasses} ${className}`}>
            {showIcon && <Activity className="w-3.5 h-3.5 text-sky-500" />}
            <span>Medium</span>
          </span>
        );
      case 'low':
      default:
        return (
          <span className={`inline-flex items-center rounded-full bg-slate-100 text-slate-700 border border-slate-200 ${sizeClasses} ${className}`}>
            {showIcon && <Clock className="w-3.5 h-3.5 text-slate-400" />}
            <span>{status || 'Low'}</span>
          </span>
        );
    }
  }

  // DEPARTMENT BADGES
  if (type === 'department') {
    if (!status || status === 'Unassigned') {
      return (
        <span className={`inline-flex items-center rounded-full bg-amber-50 text-amber-800 border border-amber-200 italic ${sizeClasses} ${className}`}>
          {showIcon && <AlertCircle className="w-3.5 h-3.5 text-amber-600" />}
          <span>Unassigned</span>
        </span>
      );
    }
    return (
      <span className={`inline-flex items-center rounded-full bg-slate-100 text-slate-800 border border-slate-200 font-medium ${sizeClasses} ${className}`}>
        {showIcon && <Building2 className="w-3.5 h-3.5 text-slate-500" />}
        <span className="truncate max-w-[160px]">{status}</span>
      </span>
    );
  }

  // CONFIDENCE BADGES (FOR DUPLICATES)
  if (type === 'confidence') {
    const conf = (status || '').toLowerCase();
    let colorStyle = 'bg-slate-100 text-slate-700 border-slate-200';
    if (conf.includes('very high') || conf.includes('high')) {
      colorStyle = 'bg-rose-50 text-rose-700 border-rose-200 font-semibold';
    } else if (conf.includes('moderate')) {
      colorStyle = 'bg-amber-50 text-amber-700 border-amber-200';
    }
    return (
      <span className={`inline-flex items-center rounded-full border ${colorStyle} ${sizeClasses} ${className}`}>
        {showIcon && <AlertCircle className="w-3.5 h-3.5" />}
        <span>{status} Confidence</span>
      </span>
    );
  }

  // STATUS BADGES (DEFAULT)
  const normStatus = (status || '').toLowerCase();
  switch (normStatus) {
    case 'resolved':
      return (
        <span className={`inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm ${sizeClasses} ${className}`}>
          {showIcon && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
          <span>Resolved</span>
        </span>
      );
    case 'in progress':
    case 'inprogress':
      return (
        <span className={`inline-flex items-center rounded-full bg-blue-50 text-blue-700 border border-blue-200 shadow-sm ${sizeClasses} ${className}`}>
          {showIcon && <Activity className="w-3.5 h-3.5 text-blue-600 animate-pulse" />}
          <span>In Progress</span>
        </span>
      );
    case 'pending':
    default:
      return (
        <span className={`inline-flex items-center rounded-full bg-amber-50 text-amber-700 border border-amber-200 shadow-sm ${sizeClasses} ${className}`}>
          {showIcon && <Clock className="w-3.5 h-3.5 text-amber-600" />}
          <span>Pending</span>
        </span>
      );
  }
};

export default StatusBadge;
