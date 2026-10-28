import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  PenTool, 
  Cpu, 
  BarChart3, 
  FileSpreadsheet, 
  Activity,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar = () => {
  const { user } = useAuth();

  // Role-specific navigation items:
  // - Operator: Data Entry only
  // - Manager: Analytics, Reports, Plant Overview, Data Entry
  // - Admin: Full Fleet + all modules
  const navItems = [
    {
      to: '/entry',
      label: 'Shift Data Entry',
      icon: PenTool,
      roles: ['Operator', 'Manager', 'Admin'],
      badge: 'Live',
    },
    {
      to: '/',
      label: 'Plant Overview',
      icon: LayoutDashboard,
      roles: ['Manager', 'Admin'],
    },
    {
      to: '/analytics',
      label: 'Visual Analytics',
      icon: BarChart3,
      roles: ['Manager', 'Admin'],
    },
    {
      to: '/reports',
      label: 'Reports & Export',
      icon: FileSpreadsheet,
      roles: ['Manager', 'Admin'],
    },
    {
      to: '/machines',
      label: 'Machine Fleet',
      icon: Cpu,
      roles: ['Admin'],
    },
  ];

  // Filter navigation items strictly by the logged-in user's role
  const visibleNavItems = navItems.filter((item) =>
    user ? item.roles.includes(user.role) : false
  );

  const getRolePermissionLabel = () => {
    switch (user?.role) {
      case 'Operator':
        return { title: 'Operator Mode', desc: 'Shift Data Entry & Floor Readings' };
      case 'Manager':
        return { title: 'Manager Mode', desc: 'Analytics, Reports & Audit Scope' };
      default:
        return { title: 'Admin Mode', desc: 'Full Fleet & System Control' };
    }
  };

  const roleInfo = getRolePermissionLabel();

  return (
    <aside className="w-64 bg-[#1F150C] border-r border-[#412D15] flex flex-col justify-between shrink-0 h-[calc(100vh-4rem)]">
      {/* Navigation Links */}
      <div className="p-4 space-y-1">
        <div className="flex items-center justify-between px-3 py-2 text-[11px] font-bold tracking-wider text-[#E1DCC9]/50 uppercase">
          <span>Factory Modules</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#000000] text-[#E1DCC9]/70 border border-[#412D15]">
            {user?.role}
          </span>
        </div>
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[#412D15] text-[#E1DCC9] border border-[#E1DCC9]/30 shadow-md font-semibold'
                    : 'text-[#E1DCC9]/65 hover:text-[#E1DCC9] hover:bg-[#412D15]/40'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-[#000000] text-[#E1DCC9] border border-[#412D15] animate-pulse">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Role Permissions & Plant Grid Card */}
      <div className="p-4 border-t border-[#412D15] space-y-2.5">
        <div className="p-3 rounded-xl bg-[#000000]/60 border border-[#412D15] space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#E1DCC9]">
            <ShieldCheck className="h-3.5 w-3.5 text-[#E1DCC9]" />
            <span>{roleInfo.title}</span>
          </div>
          <p className="text-[11px] text-[#E1DCC9]/60 leading-tight">
            {roleInfo.desc}
          </p>
        </div>

        <div className="p-3 rounded-xl bg-[#000000]/60 border border-[#412D15] space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#E1DCC9] flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-[#E1DCC9]" /> Plant Grid
            </span>
            <span className="text-[10px] font-semibold text-[#E1DCC9] bg-[#412D15] px-1.5 py-0.5 rounded border border-[#412D15]">
              Active
            </span>
          </div>
          <p className="text-[11px] text-[#E1DCC9]/60 leading-relaxed">
            Industrial tariff: <span className="text-[#E1DCC9] font-medium">₹8.50/kWh</span>
          </p>
        </div>
      </div>
    </aside>
  );
};
