import React, { useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  Building2,
  CopyCheck,
  BarChart3,
  ShieldCheck,
  Menu,
  X,
  Server,
  ExternalLink,
  ChevronRight,
  LogOut,
  UserCheck
} from 'lucide-react';

/**
 * AdminSidebar Component
 * Deep Navy Blue theme for CampusFix Administration
 */
export const AdminSidebar = ({ 
  pendingCount = 0, 
  duplicateCount = 0,
  isApiLive = true 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navigation = [
    {
      name: 'Overview Dashboard',
      path: '/admin',
      exact: true,
      icon: LayoutDashboard,
      badge: null
    },
    {
      name: 'Complaint Management',
      path: '/admin/complaints',
      icon: ClipboardList,
      badge: pendingCount > 0 ? `${pendingCount} pending` : null,
      badgeColor: 'bg-amber-500 text-slate-900'
    },
    {
      name: 'Department Operations',
      path: '/admin/departments',
      icon: Building2,
      badge: null
    },
    {
      name: 'Duplicate Detection',
      path: '/admin/duplicates',
      icon: CopyCheck,
      badge: duplicateCount > 0 ? `${duplicateCount} flags` : null,
      badgeColor: 'bg-rose-500 text-white'
    },
    {
      name: 'Analytics & Trends',
      path: '/admin/analytics',
      icon: BarChart3,
      badge: null
    }
  ];

  const isActive = (item) => {
    if (item.exact) {
      return location.pathname === item.path || location.pathname === `${item.path}/`;
    }
    return location.pathname.startsWith(item.path);
  };

  const navContent = (
    <div className="flex h-full flex-col justify-between bg-slate-950 text-slate-200">
      <div>
        {/* Brand Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800/80 bg-slate-950">
          <Link to="/admin" className="flex items-center space-x-3 group">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-400 p-0.5 shadow-md shadow-blue-900/30">
              <div className="h-full w-full rounded-[10px] bg-slate-950 flex items-center justify-center">
                <ShieldCheck className="h-5 w-5 text-blue-400 group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-lg text-white tracking-tight">CampusFix</span>
                <span className="rounded bg-blue-500/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-blue-400 border border-blue-500/30">
                  OPS
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Administration Suite</p>
            </div>
          </Link>
          <button
            onClick={() => setIsOpen(false)}
            className="md:hidden text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Backend Status indicator */}
        <div className="px-6 py-3 border-b border-slate-800/60 bg-slate-900/50">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center space-x-2 text-slate-400">
              <Server className="h-3.5 w-3.5 text-slate-400" />
              <span>Backend API</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className={`h-2 w-2 rounded-full ${isApiLive ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'bg-amber-400 animate-pulse'}`} />
              <span className={`font-mono text-[11px] ${isApiLive ? 'text-emerald-400' : 'text-amber-400'}`}>
                {isApiLive ? '8000 (Live)' : 'Local Cache'}
              </span>
            </span>
          </div>
        </div>

        {/* Navigation items */}
        <div className="px-3 py-6">
          <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Operations & Control
          </p>
          <nav className="space-y-1">
            {navigation.map((item) => {
              const active = isActive(item);
              const NavIcon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`group flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-150 ${
                    active
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <NavIcon className={`h-4 w-4 shrink-0 transition-colors ${active ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`} />
                    <span className="truncate">{item.name}</span>
                  </div>

                  {item.badge && (
                    <span className={`ml-2 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${item.badgeColor || 'bg-slate-800 text-slate-300'}`}>
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Admin Profile & Actions */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-900/40">
        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="h-9 w-9 shrink-0 rounded-full bg-gradient-to-tr from-blue-700 to-indigo-500 flex items-center justify-center font-bold text-white text-xs border border-white/20">
              AD
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">Admin Authority</p>
              <p className="text-[11px] text-slate-400 truncate">Estates & Facilities</p>
            </div>
          </div>
          <Link
            to="/"
            title="View Student Portal"
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-3 text-center">
          <p className="text-[10px] text-slate-400">
            CampusFix Core v2.4 • Central Ops
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile top navigation trigger */}
      <div className="md:hidden flex items-center justify-between bg-slate-950 px-4 py-3 text-white border-b border-slate-800 sticky top-0 z-40">
        <div className="flex items-center space-x-2">
          <div className="h-7 w-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
            CF
          </div>
          <span className="font-bold text-sm tracking-tight">CampusFix Admin</span>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 rounded-lg bg-slate-900 text-slate-300 hover:text-white border border-slate-800"
          aria-label="Open Navigation"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile drawer backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile slide-over drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out md:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {navContent}
      </aside>

      {/* Desktop persistent sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r border-slate-800/90 z-30">
        {navContent}
      </aside>
    </>
  );
};

export default AdminSidebar;
