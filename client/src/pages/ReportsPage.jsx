import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  Trash2, 
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { logAPI, machineAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const ReportsPage = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [machineId, setMachineId] = useState('All');
  const [department, setDepartment] = useState('All');
  const [shift, setShift] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const fetchMachines = async () => {
      try {
        const res = await machineAPI.getAll();
        if (res.data.success) setMachines(res.data.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchMachines();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await logAPI.getAll({
        machineId: machineId !== 'All' ? machineId : undefined,
        department: department !== 'All' ? department : undefined,
        shift: shift !== 'All' ? shift : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        page,
        limit: 15,
      });

      if (res.data.success) {
        setLogs(res.data.data);
        setTotalPages(res.data.totalPages || 1);
        setTotalCount(res.data.total || 0);
      }
    } catch (err) {
      console.error('Failed to fetch logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [machineId, department, shift, startDate, endDate, page]);

  const handleDownloadCsv = () => {
    const params = {};
    if (machineId !== 'All') params.machineId = machineId;
    if (department !== 'All') params.department = department;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    const url = logAPI.getExportCsvUrl(params);
    window.open(url, '_blank');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this reading entry?')) return;
    try {
      await logAPI.delete(id);
      fetchLogs();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete');
    }
  };

  const totalFilteredKWh = logs.reduce((acc, log) => acc + log.energyConsumedKWh, 0);
  const totalFilteredCost = logs.reduce((acc, log) => acc + log.calculatedCost, 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#E1DCC9] flex items-center gap-2">
            <FileSpreadsheet className="h-6 w-6 text-[#E1DCC9]" />
            <span>Plant Energy Audit & Compliance Reports</span>
          </h1>
          <p className="text-sm text-[#E1DCC9]/60 mt-0.5">
            Historical shift-by-shift sub-metering archive with CSV data export
          </p>
        </div>

        <button
          onClick={handleDownloadCsv}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#E1DCC9] text-[#1F150C] font-bold text-sm hover:bg-[#E1DCC9]/90 transition-all shadow-md shadow-black/50 cursor-pointer self-start sm:self-auto"
        >
          <Download className="h-4 w-4 stroke-[2.5]" />
          <span>Export CSV Report</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-xl bg-[#1F150C] border border-[#412D15] space-y-3 shadow-lg shadow-black/60">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs">
          {/* Machine Filter */}
          <div>
            <label className="block text-[#E1DCC9]/70 uppercase font-semibold mb-1">Machine</label>
            <select
              value={machineId}
              onChange={(e) => {
                setMachineId(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded-lg bg-[#000000] border border-[#412D15] text-[#E1DCC9] focus:outline-none focus:border-[#E1DCC9]/60 text-xs"
            >
              <option value="All" className="bg-[#1F150C]">All Machines</option>
              {machines.map((m) => (
                <option key={m._id} value={m._id} className="bg-[#1F150C]">
                  [{m.code}] {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Department Filter */}
          <div>
            <label className="block text-[#E1DCC9]/70 uppercase font-semibold mb-1">Department</label>
            <select
              value={department}
              onChange={(e) => {
                setDepartment(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded-lg bg-[#000000] border border-[#412D15] text-[#E1DCC9] focus:outline-none focus:border-[#E1DCC9]/60 text-xs"
            >
              <option value="All" className="bg-[#1F150C]">All Departments</option>
              <option value="Machining Line A" className="bg-[#1F150C]">Machining Line A</option>
              <option value="Machining Line B" className="bg-[#1F150C]">Machining Line B</option>
              <option value="Stamping Plant" className="bg-[#1F150C]">Stamping Plant</option>
              <option value="Thermal Processing" className="bg-[#1F150C]">Thermal Processing</option>
              <option value="Assembly & Packaging" className="bg-[#1F150C]">Assembly & Packaging</option>
              <option value="Utility & Facility" className="bg-[#1F150C]">Utility & Facility</option>
            </select>
          </div>

          {/* Shift Filter */}
          <div>
            <label className="block text-[#E1DCC9]/70 uppercase font-semibold mb-1">Shift</label>
            <select
              value={shift}
              onChange={(e) => {
                setShift(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded-lg bg-[#000000] border border-[#412D15] text-[#E1DCC9] focus:outline-none focus:border-[#E1DCC9]/60 text-xs"
            >
              <option value="All" className="bg-[#1F150C]">All Shifts</option>
              <option value="Shift 1 (06:00 - 14:00)" className="bg-[#1F150C]">Shift 1 (Morning)</option>
              <option value="Shift 2 (14:00 - 22:00)" className="bg-[#1F150C]">Shift 2 (Evening)</option>
              <option value="Shift 3 (22:00 - 06:00)" className="bg-[#1F150C]">Shift 3 (Night)</option>
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-[#E1DCC9]/70 uppercase font-semibold mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded-lg bg-[#000000] border border-[#412D15] text-[#E1DCC9] focus:outline-none focus:border-[#E1DCC9]/60 text-xs"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-[#E1DCC9]/70 uppercase font-semibold mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded-lg bg-[#000000] border border-[#412D15] text-[#E1DCC9] focus:outline-none focus:border-[#E1DCC9]/60 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Summary Info Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-3 rounded-xl bg-[#1F150C] border border-[#412D15] text-xs shadow-lg shadow-black/60">
        <div className="flex items-center gap-6">
          <div>
            <span className="text-[#E1DCC9]/60">Total Entries:</span>{' '}
            <span className="font-bold text-[#E1DCC9]">{totalCount} records</span>
          </div>
          <div>
            <span className="text-[#E1DCC9]/60">Page Energy:</span>{' '}
            <span className="font-bold text-[#E1DCC9]">{totalFilteredKWh.toFixed(1)} kWh</span>
          </div>
          <div>
            <span className="text-[#E1DCC9]/60">Page Cost:</span>{' '}
            <span className="font-bold text-[#c89d53]">₹{Number(totalFilteredCost).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>

        <button
          onClick={fetchLogs}
          className="text-xs text-[#E1DCC9]/60 hover:text-[#E1DCC9] flex items-center gap-1.5 cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-[#E1DCC9]' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Data Table */}
      <div className="rounded-2xl bg-[#1F150C] border border-[#412D15] shadow-xl shadow-black/70 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#000000] border-b border-[#412D15] text-[#E1DCC9]/70 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Machine Code</th>
                <th className="py-3 px-4">Machine Name</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Shift</th>
                <th className="py-3 px-4 text-right">Energy (kWh)</th>
                <th className="py-3 px-4 text-right">Hours</th>
                <th className="py-3 px-4 text-right">Power Factor</th>
                <th className="py-3 px-4 text-right">Peak Load</th>
                <th className="py-3 px-4 text-right">Cost (₹)</th>
                <th className="py-3 px-4">Notes</th>
                {(user?.role === 'Admin' || user?.role === 'Manager') && (
                  <th className="py-3 px-4 text-center">Action</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#412D15]">
              {logs.map((log) => (
                <tr key={log._id} className="hover:bg-[#412D15]/30 transition-colors">
                  <td className="py-3 px-4 text-[#E1DCC9] font-medium whitespace-nowrap">
                    {new Date(log.logDate).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 font-bold text-[#E1DCC9] whitespace-nowrap">
                    {log.machine?.code || 'N/A'}
                  </td>
                  <td className="py-3 px-4 text-[#E1DCC9]/90 font-medium whitespace-nowrap">
                    {log.machine?.name || 'N/A'}
                  </td>
                  <td className="py-3 px-4 text-[#E1DCC9]/60 whitespace-nowrap">
                    {log.machine?.department || 'N/A'}
                  </td>
                  <td className="py-3 px-4 text-[#E1DCC9]/80 whitespace-nowrap">{log.shift}</td>
                  <td className="py-3 px-4 text-right font-bold text-[#E1DCC9]">
                    {log.energyConsumedKWh.toFixed(1)}
                  </td>
                  <td className="py-3 px-4 text-right text-[#E1DCC9]/80">{log.operatingHours} h</td>
                  <td className="py-3 px-4 text-right text-[#E1DCC9]/80">
                    {log.powerFactor ? log.powerFactor.toFixed(2) : '0.92'}
                  </td>
                  <td className="py-3 px-4 text-right text-[#c89d53] font-medium">
                    {log.peakDemandKW ? `${log.peakDemandKW.toFixed(1)} kW` : '---'}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-[#E1DCC9]">
                    ₹{Number(log.calculatedCost).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-4 text-[#E1DCC9]/60 max-w-xs truncate" title={log.notes}>
                    {log.notes || '—'}
                  </td>
                  {(user?.role === 'Admin' || user?.role === 'Manager') && (
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleDelete(log._id)}
                        title="Delete reading"
                        className="p-1 text-[#E1DCC9]/40 hover:text-rose-400 transition-colors cursor-pointer"
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

        {/* Pagination Bar */}
        <div className="p-4 border-t border-[#412D15] flex items-center justify-between text-xs text-[#E1DCC9]/60 bg-[#000000]">
          <div>
            Showing Page <span className="text-[#E1DCC9] font-semibold">{page}</span> of{' '}
            <span className="text-[#E1DCC9] font-semibold">{totalPages}</span> ({totalCount} total entries)
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg bg-[#1F150C] border border-[#412D15] hover:bg-[#412D15] text-[#E1DCC9] disabled:opacity-30 cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg bg-[#1F150C] border border-[#412D15] hover:bg-[#412D15] text-[#E1DCC9] disabled:opacity-30 cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
