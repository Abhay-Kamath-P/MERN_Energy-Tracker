import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Zap, Clock, LogOut, UserCheck } from 'lucide-react';

export const Navbar = () => {
  const { user, logout, quickLogin } = useAuth();
  const navigate = useNavigate();

  const getCurrentShift = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 14) return 'Shift 1 (06:00 - 14:00)';
    if (hour >= 14 && hour < 22) return 'Shift 2 (14:00 - 22:00)';
    return 'Shift 3 (22:00 - 06:00)';
  };

  const handleRoleSwitch = async (role) => {
    await quickLogin(role);
    if (role === 'Operator') {
      navigate('/entry');
    } else {
      navigate('/');
    }
  };

  return (
    <header className="h-16 bg-[#1F150C]/95 border-b border-[#412D15] backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30 shadow-md shadow-black/40">
      {/* Brand & Factory Tag */}
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-[#412D15] border border-[#E1DCC9]/30 flex items-center justify-center shadow-lg shadow-black/50">
          <Zap className="h-5 w-5 text-[#E1DCC9] stroke-[2.5]" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#E1DCC9] text-lg tracking-tight">ENERGEX</span>
            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-[#412D15]/80 text-[#E1DCC9] border border-[#412D15]">
              Plant Core
            </span>
          </div>
          <p className="text-xs text-[#E1DCC9]/60 hidden sm:block">Industrial Energy Intelligence & Sub-metering</p>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-4">
        {/* Dynamic Shift Badge */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#000000]/70 border border-[#412D15] text-xs text-[#E1DCC9]">
          <Clock className="h-3.5 w-3.5 text-[#E1DCC9] animate-pulse" />
          <span className="font-medium text-[#E1DCC9]/60">Active:</span>
          <span className="text-[#E1DCC9] font-bold">{getCurrentShift()}</span>
        </div>

        {/* Quick Role Tester Switcher */}
        <div className="hidden lg:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#000000]/70 border border-[#412D15] text-xs">
          <span className="text-[#E1DCC9]/60 text-[11px] font-medium mr-1 flex items-center gap-1">
            <UserCheck className="h-3 w-3 text-[#E1DCC9]/70" /> Role:
          </span>
          <button
            onClick={() => handleRoleSwitch('Operator')}
            title="Switch to Operator (Data Entry Scope)"
            className={`px-2 py-0.5 rounded text-[11px] transition-colors cursor-pointer ${
              user?.role === 'Operator'
                ? 'bg-[#E1DCC9] text-[#1F150C] font-bold shadow'
                : 'text-[#E1DCC9]/70 hover:text-[#E1DCC9] hover:bg-[#412D15]/60'
            }`}
          >
            Operator
          </button>
          <button
            onClick={() => handleRoleSwitch('Manager')}
            title="Switch to Manager (Analytics & Reports Scope)"
            className={`px-2 py-0.5 rounded text-[11px] transition-colors cursor-pointer ${
              user?.role === 'Manager'
                ? 'bg-[#E1DCC9] text-[#1F150C] font-bold shadow'
                : 'text-[#E1DCC9]/70 hover:text-[#E1DCC9] hover:bg-[#412D15]/60'
            }`}
          >
            Manager
          </button>
          <button
            onClick={() => handleRoleSwitch('Admin')}
            title="Switch to Admin (Full Fleet Control Scope)"
            className={`px-2 py-0.5 rounded text-[11px] transition-colors cursor-pointer ${
              user?.role === 'Admin'
                ? 'bg-[#E1DCC9] text-[#1F150C] font-bold shadow'
                : 'text-[#E1DCC9]/70 hover:text-[#E1DCC9] hover:bg-[#412D15]/60'
            }`}
          >
            Admin
          </button>
        </div>

        {/* User Role Badge */}
        {user && (
          <div className="flex items-center gap-3 pl-3 border-l border-[#412D15]">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-[#E1DCC9]">{user.name}</p>
              <div className="flex items-center justify-end gap-1">
                <span className="text-[10px] font-semibold px-2 py-0.2 rounded bg-[#412D15] text-[#E1DCC9] border border-[#412D15]">
                  {user.role}
                </span>
              </div>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="p-2 rounded-lg text-[#E1DCC9]/70 hover:text-[#E1DCC9] hover:bg-[#412D15] transition-colors cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
