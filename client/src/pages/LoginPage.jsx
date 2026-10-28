import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Zap, AlertCircle, ArrowRight, UserCheck } from 'lucide-react';

export const LoginPage = () => {
  const { login, quickLogin } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const loggedUser = await login(email, password);
      if (loggedUser?.role === 'Operator') {
        navigate('/entry');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuick = async (role) => {
    setError('');
    setLoading(true);
    try {
      const loggedUser = await quickLogin(role);
      if (loggedUser?.role === 'Operator' || role === 'Operator') {
        navigate('/entry');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || `Failed to log in as ${role}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#000000] flex flex-col justify-center items-center p-6 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-[#412D15]/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-[#1F150C]/80 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-[#1F150C] border border-[#412D15] rounded-2xl shadow-2xl p-8 backdrop-blur-xl relative z-10 shadow-black/80">
        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 rounded-xl bg-[#412D15] border border-[#E1DCC9]/30 items-center justify-center shadow-lg shadow-black/60 mb-4">
            <Zap className="h-7 w-7 text-[#E1DCC9] stroke-[2.5]" />
          </div>
          <h1 className="text-2xl font-bold text-[#E1DCC9] tracking-tight">ENERGEX Core</h1>
          <p className="text-sm text-[#E1DCC9]/60 mt-1">Factory Sub-metering & Energy Intelligence System</p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-[#412D15]/60 border border-rose-500/50 text-rose-300 text-sm flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Standard Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#E1DCC9]/70 mb-1.5">
              Work Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. operator@factory.com"
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#000000] border border-[#412D15] text-[#E1DCC9] text-sm focus:outline-none focus:border-[#E1DCC9]/60 transition-all placeholder:text-[#E1DCC9]/30"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#E1DCC9]/70 mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#000000] border border-[#412D15] text-[#E1DCC9] text-sm focus:outline-none focus:border-[#E1DCC9]/60 transition-all placeholder:text-[#E1DCC9]/30"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-lg bg-[#E1DCC9] text-[#1F150C] font-bold text-sm hover:bg-[#E1DCC9]/90 transition-all shadow-md shadow-black/40 disabled:opacity-50 flex items-center justify-center gap-2 mt-2 cursor-pointer"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In to Plant Console'}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        {/* Quick Demo Logins with clear role expectations */}
        <div className="mt-8 pt-6 border-t border-[#412D15]">
          <div className="text-center mb-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#E1DCC9]/60 flex items-center justify-center gap-1.5">
              <UserCheck className="h-3.5 w-3.5 text-[#E1DCC9]" /> One-Click Role Access
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleQuick('Operator')}
              className="p-2.5 rounded-lg bg-[#000000]/80 hover:bg-[#412D15] border border-[#412D15] transition-all text-center group cursor-pointer"
            >
              <div className="text-xs font-bold text-[#E1DCC9]">Operator</div>
              <div className="text-[10px] text-[#E1DCC9]/60">Data Entry</div>
            </button>

            <button
              onClick={() => handleQuick('Manager')}
              className="p-2.5 rounded-lg bg-[#000000]/80 hover:bg-[#412D15] border border-[#412D15] transition-all text-center group cursor-pointer"
            >
              <div className="text-xs font-bold text-[#E1DCC9]">Manager</div>
              <div className="text-[10px] text-[#E1DCC9]/60">Analytics</div>
            </button>

            <button
              onClick={() => handleQuick('Admin')}
              className="p-2.5 rounded-lg bg-[#000000]/80 hover:bg-[#412D15] border border-[#412D15] transition-all text-center group cursor-pointer"
            >
              <div className="text-xs font-bold text-[#E1DCC9]">Admin</div>
              <div className="text-[10px] text-[#E1DCC9]/60">Full Fleet</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
