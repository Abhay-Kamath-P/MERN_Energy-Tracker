import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Clock, 
  Gauge 
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { analyticsAPI, machineAPI } from '../services/api';

export const AnalyticsPage = () => {
  const [range, setRange] = useState('30d');
  const [selectedMachineId, setSelectedMachineId] = useState('All');
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);

  const [trends, setTrends] = useState([]);
  const [shiftStats, setShiftStats] = useState([]);
  const [machineEfficiency, setMachineEfficiency] = useState([]);

  useEffect(() => {
    const fetchMachinesList = async () => {
      try {
        const res = await machineAPI.getAll();
        if (res.data.success) setMachines(res.data.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchMachinesList();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [trendRes, shiftRes, machRes] = await Promise.all([
        analyticsAPI.getTrends({ range, machineId: selectedMachineId }),
        analyticsAPI.getByShift({ range }),
        analyticsAPI.getByMachine({ range, limit: 12 }),
      ]);

      if (trendRes.data.success) setTrends(trendRes.data.data);
      if (shiftRes.data.success) setShiftStats(shiftRes.data.data);
      if (machRes.data.success) setMachineEfficiency(machRes.data.data);
    } catch (err) {
      console.error('Failed to load analytics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [range, selectedMachineId]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#E1DCC9] flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-[#E1DCC9]" />
            <span>Industrial Visual Analytics & Reports</span>
          </h1>
          <p className="text-sm text-[#E1DCC9]/60 mt-0.5">
            Shift efficiency, machine intensity benchmarking, and power demand profiles
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Machine Filter */}
          <select
            value={selectedMachineId}
            onChange={(e) => setSelectedMachineId(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-[#1F150C] border border-[#412D15] text-xs text-[#E1DCC9] focus:outline-none focus:border-[#E1DCC9]/60"
          >
            <option value="All" className="bg-[#1F150C]">All Machines (Fleet Total)</option>
            {machines.map((m) => (
              <option key={m._id} value={m._id} className="bg-[#1F150C]">
                [{m.code}] {m.name}
              </option>
            ))}
          </select>

          {/* Time Range */}
          <div className="flex items-center bg-[#1F150C] border border-[#412D15] rounded-lg p-1 text-xs">
            <button
              onClick={() => setRange('7d')}
              className={`px-3 py-1 rounded-md font-bold transition-colors cursor-pointer ${
                range === '7d' ? 'bg-[#E1DCC9] text-[#1F150C]' : 'text-[#E1DCC9]/60 hover:text-[#E1DCC9]'
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setRange('30d')}
              className={`px-3 py-1 rounded-md font-bold transition-colors cursor-pointer ${
                range === '30d' ? 'bg-[#E1DCC9] text-[#1F150C]' : 'text-[#E1DCC9]/60 hover:text-[#E1DCC9]'
              }`}
            >
              30 Days
            </button>
            <button
              onClick={() => setRange('90d')}
              className={`px-3 py-1 rounded-md font-bold transition-colors cursor-pointer ${
                range === '90d' ? 'bg-[#E1DCC9] text-[#1F150C]' : 'text-[#E1DCC9]/60 hover:text-[#E1DCC9]'
              }`}
            >
              Quarter (90d)
            </button>
          </div>
        </div>
      </div>

      {/* Chart 1: Energy & Cost Correlation Time Series */}
      <div className="p-6 rounded-2xl bg-[#1F150C] border border-[#412D15] shadow-xl shadow-black/70">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-[#E1DCC9]">
              Energy Consumption & Cost Telemetry Trend
            </h2>
            <p className="text-xs text-[#E1DCC9]/60">
              Dual-axis progression of kWh consumption versus electricity charges
            </p>
          </div>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trends} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#412D15" opacity={0.5} />
              <XAxis dataKey="date" stroke="#E1DCC9" opacity={0.6} fontSize={11} tickFormatter={(v) => v.slice(5)} />
              <YAxis yAxisId="left" stroke="#E1DCC9" fontSize={11} />
              <YAxis yAxisId="right" orientation="right" stroke="#c89d53" fontSize={11} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F150C',
                  borderColor: '#412D15',
                  borderRadius: '0.5rem',
                  color: '#E1DCC9',
                  fontSize: '12px',
                }}
              />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="totalKWh"
                name="Energy (kWh)"
                stroke="#E1DCC9"
                strokeWidth={2.5}
                dot={false}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="totalCost"
                name="Cost ($)"
                stroke="#c89d53"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid: Shift Comparison & Machine Energy Intensity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Shift Energy Comparison */}
        <div className="p-6 rounded-2xl bg-[#1F150C] border border-[#412D15] shadow-xl shadow-black/70">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-[#E1DCC9]">Shift-wise Energy Distribution</h2>
              <p className="text-xs text-[#E1DCC9]/60">Total consumption divided by operating shifts</p>
            </div>
            <Clock className="h-5 w-5 text-[#E1DCC9]" />
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={shiftStats} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#412D15" opacity={0.5} />
                <XAxis dataKey="shift" stroke="#E1DCC9" opacity={0.6} fontSize={10} tickFormatter={(s) => s.split(' ')[0]} />
                <YAxis stroke="#E1DCC9" opacity={0.6} fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F150C',
                    borderColor: '#412D15',
                    borderRadius: '0.5rem',
                    color: '#E1DCC9',
                    fontSize: '12px',
                  }}
                  formatter={(val, name) => [
                    name === 'totalKWh' ? `${val.toLocaleString()} kWh` : `$${val.toLocaleString()}`,
                    name === 'totalKWh' ? 'Energy' : 'Total Cost'
                  ]}
                />
                <Bar dataKey="totalKWh" name="Energy (kWh)" fill="#8f6836" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-[#412D15] text-center">
            {shiftStats.map((s) => (
              <div key={s.shift} className="p-2 rounded-lg bg-[#000000]/60 border border-[#412D15]">
                <span className="text-[11px] text-[#E1DCC9]/60 block truncate">{s.shift.split(' ')[0]}</span>
                <span className="text-xs font-bold text-[#E1DCC9] block mt-0.5">{s.totalKWh.toLocaleString()} kWh</span>
                <span className="text-[10px] text-[#c89d53] font-semibold">${s.totalCost.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Machine Energy Intensity */}
        <div className="p-6 rounded-2xl bg-[#1F150C] border border-[#412D15] shadow-xl shadow-black/70">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-[#E1DCC9]">Asset Energy Intensity (kWh/Hour)</h2>
              <p className="text-xs text-[#E1DCC9]/60">Hourly power rate relative to rated capacity</p>
            </div>
            <Gauge className="h-5 w-5 text-[#E1DCC9]" />
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={machineEfficiency}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 35, bottom: 5 }}
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
                    `${val} kWh/hr (Rated: ${item.payload.ratedPowerKW} kW)`,
                    item.payload.name
                  ]}
                />
                <Bar dataKey="kWhPerHour" name="Energy Intensity" fill="#c89d53" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
