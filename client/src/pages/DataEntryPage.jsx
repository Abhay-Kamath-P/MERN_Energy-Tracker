import React, { useState, useEffect } from 'react';
import { 
  PenTool, 
  Calendar, 
  Clock, 
  Zap, 
  Gauge, 
  Flame, 
  IndianRupee, 
  CheckCircle2, 
  AlertCircle, 
  Trash2 
} from 'lucide-react';
import { machineAPI, logAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const DataEntryPage = () => {
  const { user } = useAuth();
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [recentLogs, setRecentLogs] = useState([]);

  const getAutoShift = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 14) return 'Shift 1 (06:00 - 14:00)';
    if (hour >= 14 && hour < 22) return 'Shift 2 (14:00 - 22:00)';
    return 'Shift 3 (22:00 - 06:00)';
  };

  // Form State
  const [selectedMachineId, setSelectedMachineId] = useState('');
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
  const [shift, setShift] = useState(getAutoShift());
  const [energyConsumedKWh, setEnergyConsumedKWh] = useState('');
  const [operatingHours, setOperatingHours] = useState('7.5');
  const [powerFactor, setPowerFactor] = useState('0.92');
  const [peakDemandKW, setPeakDemandKW] = useState('');
  const [notes, setNotes] = useState('');

  const selectedMachine = machines.find((m) => m._id === selectedMachineId);

  const loadInitialData = async () => {
    try {
      const [machRes, logRes] = await Promise.all([
        machineAPI.getAll({ status: 'Operational' }),
        logAPI.getAll({ limit: 8 }),
      ]);
      if (machRes.data.success) {
        setMachines(machRes.data.data);
        if (machRes.data.data.length > 0 && !selectedMachineId) {
          setSelectedMachineId(machRes.data.data[0]._id);
        }
      }
      if (logRes.data.success) {
        setRecentLogs(logRes.data.data);
      }
    } catch (err) {
      console.error('Failed to load data entry options', err);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Live calculations
  const tariff = selectedMachine?.tariffRatePerKWh || 8.50;
  const kwhNum = parseFloat(energyConsumedKWh) || 0;
  const hoursNum = parseFloat(operatingHours) || 0;
  const calculatedCost = (kwhNum * tariff).toFixed(2);
  const avgLoadKW = hoursNum > 0 ? (kwhNum / hoursNum).toFixed(1) : 0;
  const loadPercentage =
    selectedMachine && hoursNum > 0
      ? Math.min(100, Math.round((avgLoadKW / selectedMachine.ratedPowerKW) * 100))
      : 0;

  const maxPossibleKWh = selectedMachine ? selectedMachine.ratedPowerKW * hoursNum : 0;
  const isOverTheoreticalMax = kwhNum > maxPossibleKWh * 1.15;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitSuccess(false);

    if (!selectedMachineId) {
      setErrorMsg('Please select a machine');
      return;
    }
    if (!energyConsumedKWh || kwhNum < 0) {
      setErrorMsg('Please enter a valid energy consumption in kWh');
      return;
    }
    if (!operatingHours || hoursNum <= 0 || hoursNum > 12) {
      setErrorMsg('Operating hours must be between 0.1 and 12 hours');
      return;
    }

    setLoading(true);
    try {
      await logAPI.create({
        machineId: selectedMachineId,
        logDate,
        shift,
        energyConsumedKWh: kwhNum,
        operatingHours: hoursNum,
        powerFactor: parseFloat(powerFactor) || 0.92,
        peakDemandKW: parseFloat(peakDemandKW) || parseFloat(avgLoadKW) || 0,
        notes,
      });

      setSubmitSuccess(true);
      setEnergyConsumedKWh('');
      setPeakDemandKW('');
      setNotes('');

      const logRes = await logAPI.getAll({ limit: 8 });
      if (logRes.data.success) setRecentLogs(logRes.data.data);

      setTimeout(() => setSubmitSuccess(false), 4000);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to submit energy log');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLog = async (id) => {
    if (!window.confirm('Delete this energy log entry?')) return;
    try {
      await logAPI.delete(id);
      setRecentLogs((prev) => prev.filter((item) => item._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete log entry');
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#E1DCC9] flex items-center gap-2">
          <PenTool className="h-6 w-6 text-[#E1DCC9]" />
          <span>Machine Shift Energy Logger</span>
        </h1>
        <p className="text-sm text-[#E1DCC9]/60 mt-1">
          Record meter readings, operating run-hours, and power telemetry for plant sub-metering.
        </p>
      </div>

      {submitSuccess && (
        <div className="p-4 rounded-xl bg-[#1F150C] border border-[#E1DCC9]/50 text-[#E1DCC9] text-sm flex items-center gap-3 shadow-lg">
          <CheckCircle2 className="h-5 w-5 text-[#E1DCC9] shrink-0" />
          <div>
            <p className="font-bold">Log entry recorded successfully!</p>
            <p className="text-xs text-[#E1DCC9]/70">
              Shift data synchronized with plant analytics database and executive dashboard.
            </p>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-[#1F150C] border border-rose-500/50 text-rose-300 text-sm flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />
          <p className="font-medium">{errorMsg}</p>
        </div>
      )}

      {/* Main Form + Live Preview Card Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Form (2 Cols) */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-5 p-6 rounded-2xl bg-[#1F150C] border border-[#412D15] shadow-xl shadow-black/70">
          <h2 className="text-base font-semibold text-[#E1DCC9] border-b border-[#412D15] pb-3 flex items-center justify-between">
            <span>Reading Parameters</span>
            <span className="text-xs text-[#E1DCC9]/60 font-normal">Operator: {user?.name}</span>
          </h2>

          {/* Machine Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#E1DCC9]/70 mb-2">
              Select Machine Asset *
            </label>
            <select
              value={selectedMachineId}
              onChange={(e) => setSelectedMachineId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#000000] border border-[#412D15] text-[#E1DCC9] text-sm focus:outline-none focus:border-[#E1DCC9]/60 transition-colors"
            >
              {machines.map((m) => (
                <option key={m._id} value={m._id} className="bg-[#1F150C] text-[#E1DCC9]">
                  [{m.code}] {m.name} — {m.department} ({m.ratedPowerKW} kW)
                </option>
              ))}
            </select>
          </div>

          {/* Date & Shift Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#E1DCC9]/70 mb-2 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-[#E1DCC9]" /> Date *
              </label>
              <input
                type="date"
                required
                value={logDate}
                onChange={(e) => setLogDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#000000] border border-[#412D15] text-[#E1DCC9] text-sm focus:outline-none focus:border-[#E1DCC9]/60 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#E1DCC9]/70 mb-2 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-[#E1DCC9]" /> Shift *
              </label>
              <select
                value={shift}
                onChange={(e) => setShift(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#000000] border border-[#412D15] text-[#E1DCC9] text-sm focus:outline-none focus:border-[#E1DCC9]/60 transition-colors"
              >
                <option value="Shift 1 (06:00 - 14:00)" className="bg-[#1F150C]">Shift 1 (06:00 - 14:00 - Morning)</option>
                <option value="Shift 2 (14:00 - 22:00)" className="bg-[#1F150C]">Shift 2 (14:00 - 22:00 - Evening)</option>
                <option value="Shift 3 (22:00 - 06:00)" className="bg-[#1F150C]">Shift 3 (22:00 - 06:00 - Night)</option>
              </select>
            </div>
          </div>

          {/* Energy & Operating Hours */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#E1DCC9]/70 mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-[#E1DCC9]" /> Energy Consumed (kWh) *
                </span>
                {selectedMachine && (
                  <span className="text-[11px] text-[#E1DCC9]/50 lowercase">
                    rated: {selectedMachine.ratedPowerKW} kW
                  </span>
                )}
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                required
                placeholder="e.g. 185.4"
                value={energyConsumedKWh}
                onChange={(e) => setEnergyConsumedKWh(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-lg bg-[#000000] border text-[#E1DCC9] text-sm focus:outline-none transition-colors ${
                  isOverTheoreticalMax
                    ? 'border-rose-500 text-rose-200'
                    : 'border-[#412D15] focus:border-[#E1DCC9]/60'
                }`}
              />
              {isOverTheoreticalMax && (
                <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> Exceeds theoretical max ({maxPossibleKWh.toFixed(1)} kWh) for {hoursNum} hrs.
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#E1DCC9]/70 mb-2 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-[#E1DCC9]" /> Operating Run-Hours *
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="12"
                required
                placeholder="e.g. 7.5"
                value={operatingHours}
                onChange={(e) => setOperatingHours(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#000000] border border-[#412D15] text-[#E1DCC9] text-sm focus:outline-none focus:border-[#E1DCC9]/60 transition-colors"
              />
            </div>
          </div>

          {/* Power Factor & Peak Demand */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#E1DCC9]/70 mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Gauge className="h-3.5 w-3.5 text-[#E1DCC9]" /> Power Factor (PF)
                </span>
                <span className="text-[11px] text-[#E1DCC9]/50 font-medium">Std: 0.92</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0.70"
                max="1.00"
                value={powerFactor}
                onChange={(e) => setPowerFactor(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#000000] border border-[#412D15] text-[#E1DCC9] text-sm focus:outline-none focus:border-[#E1DCC9]/60 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#E1DCC9]/70 mb-2 flex items-center gap-1.5">
                <Flame className="h-3.5 w-3.5 text-[#E1DCC9]" /> Peak Demand Draw (kW)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                placeholder={`Auto est. ~${avgLoadKW} kW`}
                value={peakDemandKW}
                onChange={(e) => setPeakDemandKW(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#000000] border border-[#412D15] text-[#E1DCC9] text-sm focus:outline-none focus:border-[#E1DCC9]/60 transition-colors"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#E1DCC9]/70 mb-2">
              Operational Notes / Batch Comments
            </label>
            <textarea
              rows="2"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Batch run #482, high-precision milling, minor tool change delay"
              className="w-full px-3.5 py-2 rounded-lg bg-[#000000] border border-[#412D15] text-[#E1DCC9] text-sm focus:outline-none focus:border-[#E1DCC9]/60 transition-colors resize-none placeholder:text-[#E1DCC9]/30"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-[#E1DCC9] text-[#1F150C] font-bold text-sm hover:bg-[#E1DCC9]/90 transition-all shadow-lg shadow-black/50 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
          >
            <Zap className="h-4 w-4 stroke-[2.5]" />
            <span>{loading ? 'Submitting to Plant Database...' : 'Commit Shift Reading'}</span>
          </button>
        </form>

        {/* Live Calculation & Asset Gauge Card (1 Col) */}
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-[#1F150C] border border-[#412D15] shadow-xl shadow-black/70 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#E1DCC9]/70 border-b border-[#412D15] pb-3 flex items-center justify-between">
              <span>Telemetry Estimation</span>
              <span className="text-[10px] text-[#E1DCC9] font-bold bg-[#412D15] px-2 py-0.5 rounded border border-[#412D15]">
                LIVE
              </span>
            </h3>

            {/* Estimated Cost Preview */}
            <div className="p-4 rounded-xl bg-[#000000] border border-[#412D15]">
              <span className="text-xs text-[#E1DCC9]/60 flex items-center gap-1.5">
                <IndianRupee className="h-3.5 w-3.5 text-[#E1DCC9]" /> Estimated Electricity Cost
              </span>
              <div className="text-2xl font-bold text-[#E1DCC9] mt-1">
                ₹{Number(calculatedCost).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-[11px] text-[#E1DCC9]/50 mt-0.5">
                Rate: ₹{tariff.toFixed(2)}/kWh &bull; {kwhNum} kWh
              </p>
            </div>

            {/* Average Load & Utilization */}
            <div className="p-4 rounded-xl bg-[#000000] border border-[#412D15] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#E1DCC9]/70">Average Running Load:</span>
                <span className="font-bold text-[#E1DCC9]">{avgLoadKW} kW</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#E1DCC9]/70">Machine Load Factor:</span>
                <span className="font-bold text-[#E1DCC9]">
                  {loadPercentage}%
                </span>
              </div>
              {/* Progress Bar */}
              <div className="w-full bg-[#1F150C] rounded-full h-2 overflow-hidden border border-[#412D15]">
                <div
                  className="h-full bg-[#E1DCC9] transition-all duration-300 rounded-full"
                  style={{ width: `${Math.min(100, loadPercentage)}%` }}
                />
              </div>
              <p className="text-[10px] text-[#E1DCC9]/50">
                Capacity utilization of rated {selectedMachine?.ratedPowerKW || 0} kW motor
              </p>
            </div>

            {/* Machine Specs Box */}
            {selectedMachine && (
              <div className="p-4 rounded-xl bg-[#000000] border border-[#412D15] text-xs space-y-1.5">
                <span className="font-semibold text-[#E1DCC9] block mb-1">Asset Specifications</span>
                <div className="flex justify-between text-[#E1DCC9]/70">
                  <span>Category:</span>
                  <span className="text-[#E1DCC9]">{selectedMachine.category}</span>
                </div>
                <div className="flex justify-between text-[#E1DCC9]/70">
                  <span>Location:</span>
                  <span className="text-[#E1DCC9]">{selectedMachine.location}</span>
                </div>
                <div className="flex justify-between text-[#E1DCC9]/70">
                  <span>Rated Voltage:</span>
                  <span className="text-[#E1DCC9]">{selectedMachine.voltageRating} V (3-Phase)</span>
                </div>
                <div className="flex justify-between text-[#E1DCC9]/70">
                  <span>Status:</span>
                  <span className="text-[#E1DCC9] font-bold">{selectedMachine.status}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Logged Readings Table */}
      <div className="p-6 rounded-2xl bg-[#1F150C] border border-[#412D15] shadow-xl shadow-black/70 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-[#E1DCC9]">Recent Plant Readings</h2>
          <p className="text-xs text-[#E1DCC9]/60">Latest 8 entries committed to the factory database</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#000000] border-b border-[#412D15] text-[#E1DCC9]/70 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Machine</th>
                <th className="py-3 px-3">Shift</th>
                <th className="py-3 px-3 text-right">Energy</th>
                <th className="py-3 px-3 text-right">Hours</th>
                <th className="py-3 px-3 text-right">Power Factor</th>
                <th className="py-3 px-3 text-right">Cost</th>
                <th className="py-3 px-3">Logged By</th>
                {(user?.role === 'Admin' || user?.role === 'Manager') && (
                  <th className="py-3 px-3 text-center">Action</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#412D15]">
              {recentLogs.map((log) => (
                <tr key={log._id} className="hover:bg-[#412D15]/30 transition-colors">
                  <td className="py-3 px-3 text-[#E1DCC9] font-medium">
                    {new Date(log.logDate).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-bold text-[#E1DCC9]">[{log.machine?.code}]</span>{' '}
                    <span className="text-[#E1DCC9]/80">{log.machine?.name}</span>
                  </td>
                  <td className="py-3 px-3 text-[#E1DCC9]/70">{log.shift}</td>
                  <td className="py-3 px-3 text-right font-bold text-[#E1DCC9]">
                    {log.energyConsumedKWh.toFixed(1)} kWh
                  </td>
                  <td className="py-3 px-3 text-right text-[#E1DCC9]/80">{log.operatingHours} h</td>
                  <td className="py-3 px-3 text-right text-[#E1DCC9]/80">
                    {log.powerFactor ? log.powerFactor.toFixed(2) : '0.92'}
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-[#E1DCC9]">
                    ₹{Number(log.calculatedCost).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-3 text-[#E1DCC9]/70">{log.loggedBy?.name || 'Operator'}</td>
                  {(user?.role === 'Admin' || user?.role === 'Manager') && (
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => handleDeleteLog(log._id)}
                        title="Delete reading"
                        className="p-1 text-[#E1DCC9]/50 hover:text-rose-400 transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
