import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  DollarSign, 
  Gauge, 
  Flame, 
  RefreshCw,
  ArrowUpRight 
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { analyticsAPI, logAPI } from '../services/api';
import { Link } from 'react-router-dom';

const DEPARTMENT_COLORS = ['#E1DCC9', '#c89d53', '#8f6836', '#593e1e', '#a3937d', '#412D15'];

export const DashboardPage = () => {
  const [range, setRange] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState(null);
  const [trends, setTrends] = useState([]);
  const [machineRankings, setMachineRankings] = useState([]);
  const [deptDistribution, setDeptDistribution] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [kpiRes, trendsRes, rankRes, deptRes, logsRes] = await Promise.all([
        analyticsAPI.getKPIs({ range }),
        analyticsAPI.getTrends({ range }),
        analyticsAPI.getByMachine({ range, limit: 6 }),
        analyticsAPI.getByDepartment({ range }),
        logAPI.getAll({ limit: 5 }),
      ]);

      if (kpiRes.data.success) setKpis(kpiRes.data.data);
      if (trendsRes.data.success) setTrends(trendsRes.data.data);
      if (rankRes.data.success) setMachineRankings(rankRes.data.data);
      if (deptRes.data.success) setDeptDistribution(deptRes.data.data);
      if (logsRes.data.success) setRecentLogs(logsRes.data.data);
    } catch (err) {
      console.error('Failed to load dashboard metrics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [range]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Range Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#E1DCC9] flex items-center gap-2.5">
            <span>Plant Energy Operations</span>
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#E1DCC9] animate-pulse" />
          </h1>
          <p className="text-sm text-[#E1DCC9]/60 mt-0.5">Real-time factory telemetry, sub-metering, and load analytics</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Range Switcher */}
          <div className="flex items-center bg-[#1F150C] border border-[#412D15] rounded-lg p-1 text-xs">
            <button
              onClick={() => setRange('today')}
              className={`px-3 py-1.5 rounded-md font-bold transition-colors cursor-pointer ${
                range === 'today' ? 'bg-[#E1DCC9] text-[#1F150C]' : 'text-[#E1DCC9]/60 hover:text-[#E1DCC9]'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setRange('7d')}
              className={`px-3 py-1.5 rounded-md font-bold transition-colors cursor-pointer ${
                range === '7d' ? 'bg-[#E1DCC9] text-[#1F150C]' : 'text-[#E1DCC9]/60 hover:text-[#E1DCC9]'
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setRange('30d')}
              className={`px-3 py-1.5 rounded-md font-bold transition-colors cursor-pointer ${
                range === '30d' ? 'bg-[#E1DCC9] text-[#1F150C]' : 'text-[#E1DCC9]/60 hover:text-[#E1DCC9]'
              }`}
            >
              30 Days
            </button>
          </div>

          <button
            onClick={fetchData}
            title="Refresh Data"
            className="p-2 rounded-lg bg-[#1F150C] border border-[#412D15] text-[#E1DCC9]/70 hover:text-[#E1DCC9] hover:bg-[#412D15] transition-colors cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-[#E1DCC9]' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Energy */}
        <div className="p-5 rounded-xl bg-[#1F150C] border border-[#412D15] hover:border-[#E1DCC9]/40 transition-all shadow-lg shadow-black/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#E1DCC9]/60 uppercase tracking-wider">Total Consumption</span>
            <div className="p-2 rounded-lg bg-[#412D15] text-[#E1DCC9] border border-[#412D15]">
              <Zap className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-[#E1DCC9]">
              {kpis ? kpis.totalKWh.toLocaleString() : '---'} <span className="text-sm font-normal text-[#E1DCC9]/60">kWh</span>
            </div>
            <p className="text-xs text-[#E1DCC9]/50 mt-1">Aggregated across active machine meters</p>
          </div>
        </div>

        {/* Estimated Cost */}
        <div className="p-5 rounded-xl bg-[#1F150C] border border-[#412D15] hover:border-[#E1DCC9]/40 transition-all shadow-lg shadow-black/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#E1DCC9]/60 uppercase tracking-wider">Electricity Bill</span>
            <div className="p-2 rounded-lg bg-[#412D15] text-[#E1DCC9] border border-[#412D15]">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-[#E1DCC9]">
              ${kpis ? kpis.totalCost.toLocaleString() : '---'}
            </div>
            <p className="text-xs text-[#E1DCC9]/50 mt-1">Calculated at tiered factory tariffs</p>
          </div>
        </div>

        {/* Power Factor */}
        <div className="p-5 rounded-xl bg-[#1F150C] border border-[#412D15] hover:border-[#E1DCC9]/40 transition-all shadow-lg shadow-black/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#E1DCC9]/60 uppercase tracking-wider">Avg Power Factor</span>
            <div className="p-2 rounded-lg bg-[#412D15] text-[#E1DCC9] border border-[#412D15]">
              <Gauge className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-[#E1DCC9] flex items-center gap-2">
              <span>{kpis?.avgPowerFactor || '0.92'}</span>
              <span className="text-xs px-2 py-0.5 rounded font-bold bg-[#412D15] text-[#E1DCC9] border border-[#412D15]">
                {Number(kpis?.avgPowerFactor || 0.92) >= 0.90 ? 'Optimal' : 'Sub-par'}
              </span>
            </div>
            <p className="text-xs text-[#E1DCC9]/50 mt-1">Target ≥ 0.90 to avoid grid penalty</p>
          </div>
        </div>

        {/* Peak Demand */}
        <div className="p-5 rounded-xl bg-[#1F150C] border border-[#412D15] hover:border-[#E1DCC9]/40 transition-all shadow-lg shadow-black/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#E1DCC9]/60 uppercase tracking-wider">Peak Demand Load</span>
            <div className="p-2 rounded-lg bg-[#412D15] text-[#E1DCC9] border border-[#412D15]">
              <Flame className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-[#E1DCC9]">
              {kpis?.maxPeakDemand || '---'} <span className="text-sm font-normal text-[#E1DCC9]/60">kW</span>
            </div>
            <p className="text-xs text-[#E1DCC9]/50 mt-1">
              Top Load: <span className="text-[#E1DCC9] font-medium">{kpis?.topConsumer?.code || 'Fleet'}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Main Charts: Trend Area Chart & Department Share */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Area Chart (2 Cols) */}
        <div className="lg:col-span-2 p-6 rounded-xl bg-[#1F150C] border border-[#412D15] shadow-lg shadow-black/60">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-[#E1DCC9]">Daily Consumption Profile (kWh)</h2>
              <p className="text-xs text-[#E1DCC9]/60">Daily energy volume and cost variation</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#E1DCC9]/70">
              <span className="inline-block w-3 h-3 rounded-full bg-[#E1DCC9]" /> Energy (kWh)
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="energyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E1DCC9" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#412D15" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#412D15" opacity={0.6} />
                <XAxis 
                  dataKey="date" 
                  stroke="#E1DCC9" 
                  opacity={0.6}
                  fontSize={11} 
                  tickFormatter={(val) => val.slice(5)} 
                />
                <YAxis stroke="#E1DCC9" opacity={0.6} fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F150C',
                    borderColor: '#412D15',
                    borderRadius: '0.5rem',
                    color: '#E1DCC9',
                    fontSize: '12px',
                  }}
                  formatter={(value, name) => [
                    name === 'totalKWh' ? `${value.toLocaleString()} kWh` : `$${value.toLocaleString()}`,
                    name === 'totalKWh' ? 'Energy Used' : 'Cost'
                  ]}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Area 
                  type="monotone" 
                  dataKey="totalKWh" 
                  stroke="#E1DCC9" 
                  strokeWidth={2.5} 
                  fillOpacity={1} 
                  fill="url(#energyGrad)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Distribution Donut (1 Col) */}
        <div className="p-6 rounded-xl bg-[#1F150C] border border-[#412D15] flex flex-col justify-between shadow-lg shadow-black/60">
          <div>
            <h2 className="text-base font-semibold text-[#E1DCC9]">Department Breakdown</h2>
            <p className="text-xs text-[#E1DCC9]/60 mb-4">Energy distribution across factory lines</p>
            
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deptDistribution}
                    dataKey="totalKWh"
                    nameKey="department"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                  >
                    {deptDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={DEPARTMENT_COLORS[index % DEPARTMENT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F150C',
                      borderColor: '#412D15',
                      borderRadius: '0.5rem',
                      color: '#E1DCC9',
                      fontSize: '12px',
                    }}
                    formatter={(val) => [`${val.toLocaleString()} kWh`, 'Consumption']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-[#412D15] max-h-28 overflow-y-auto">
            {deptDistribution.map((item, idx) => (
              <div key={item.department} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 truncate">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: DEPARTMENT_COLORS[idx % DEPARTMENT_COLORS.length] }}
                  />
                  <span className="text-[#E1DCC9]/80 truncate">{item.department}</span>
                </div>
                <span className="font-semibold text-[#E1DCC9] shrink-0">{item.totalKWh.toLocaleString()} kWh</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Secondary Row: Machine Ranking & Recent Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Machine Benchmark Ranking (2 Cols) */}
        <div className="lg:col-span-2 p-6 rounded-xl bg-[#1F150C] border border-[#412D15] shadow-lg shadow-black/60">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-[#E1DCC9]">Top Energy Consuming Machines</h2>
              <p className="text-xs text-[#E1DCC9]/60">Total kWh consumed by asset in selected period</p>
            </div>
            <Link
              to="/analytics"
              className="text-xs text-[#E1DCC9] hover:underline flex items-center gap-1 font-semibold"
            >
              Full Analytics <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={machineRankings}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#412D15" opacity={0.5} horizontal={false} />
                <XAxis type="number" stroke="#E1DCC9" opacity={0.6} fontSize={11} />
                <YAxis dataKey="code" type="category" stroke="#E1DCC9" opacity={0.6} fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F150C',
                    borderColor: '#412D15',
                    borderRadius: '0.5rem',
                    color: '#E1DCC9',
                    fontSize: '12px',
                  }}
                  formatter={(val, name, item) => [
                    `${val.toLocaleString()} kWh ($${item.payload.totalCost})`,
                    `${item.payload.name}`,
                  ]}
                />
                <Bar dataKey="totalKWh" fill="#c89d53" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Shift Activity Stream (1 Col) */}
        <div className="p-6 rounded-xl bg-[#1F150C] border border-[#412D15] flex flex-col justify-between shadow-lg shadow-black/60">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-[#E1DCC9]">Recent Shift Logs</h2>
                <p className="text-xs text-[#E1DCC9]/60">Latest floor meter entries</p>
              </div>
              <Link
                to="/entry"
                className="text-xs px-2.5 py-1 rounded bg-[#412D15] text-[#E1DCC9] border border-[#E1DCC9]/30 hover:bg-[#412D15]/80 font-bold"
              >
                + Log Entry
              </Link>
            </div>

            <div className="space-y-3">
              {recentLogs.slice(0, 4).map((log) => (
                <div key={log._id} className="p-3 rounded-lg bg-[#000000]/60 border border-[#412D15] text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#E1DCC9]">[{log.machine?.code}]</span>
                    <span className="text-[#E1DCC9]/50">{new Date(log.logDate).toLocaleDateString()}</span>
                  </div>
                  <div className="text-[#E1DCC9]/70 mt-1 truncate">{log.machine?.name}</div>
                  <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-[#412D15]">
                    <span className="text-[#E1DCC9] font-bold">{log.energyConsumedKWh} kWh</span>
                    <span className="text-[#E1DCC9]/90 font-medium">${log.calculatedCost}</span>
                    <span className="text-[11px] text-[#E1DCC9]/50">{log.operatingHours}h run</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Link
            to="/reports"
            className="block text-center text-xs text-[#E1DCC9]/60 hover:text-[#E1DCC9] mt-3 pt-3 border-t border-[#412D15]"
          >
            View all logged shift history &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
};
