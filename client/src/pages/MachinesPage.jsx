import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  Plus, 
  Search, 
  Zap, 
  MapPin, 
  Trash2, 
  Edit3, 
  AlertCircle,
  X
} from 'lucide-react';
import { machineAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const MachinesPage = () => {
  const { user } = useAuth();
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('All');
  const [category, setCategory] = useState('All');
  const [status, setStatus] = useState('All');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingMachine, setEditingMachine] = useState(null);
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [cat, setCat] = useState('CNC / Milling');
  const [dept, setDept] = useState('Machining Line A');
  const [ratedPowerKW, setRatedPowerKW] = useState('');
  const [voltageRating, setVoltageRating] = useState('415');
  const [location, setLocation] = useState('Shop Floor 1');
  const [machStatus, setMachStatus] = useState('Operational');
  const [tariffRatePerKWh, setTariffRatePerKWh] = useState('0.15');

  const fetchMachines = async () => {
    setLoading(true);
    try {
      const res = await machineAPI.getAll({
        search: search || undefined,
        department: department !== 'All' ? department : undefined,
        category: category !== 'All' ? category : undefined,
        status: status !== 'All' ? status : undefined,
      });
      if (res.data.success) {
        setMachines(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch machines', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMachines();
  }, [department, category, status]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchMachines();
  };

  const openAddModal = () => {
    setEditingMachine(null);
    setName('');
    setCode('');
    setCat('CNC / Milling');
    setDept('Machining Line A');
    setRatedPowerKW('');
    setVoltageRating('415');
    setLocation('Shop Floor 1');
    setMachStatus('Operational');
    setTariffRatePerKWh('0.15');
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (m) => {
    setEditingMachine(m);
    setName(m.name);
    setCode(m.code);
    setCat(m.category);
    setDept(m.department);
    setRatedPowerKW(m.ratedPowerKW.toString());
    setVoltageRating(m.voltageRating.toString());
    setLocation(m.location);
    setMachStatus(m.status);
    setTariffRatePerKWh(m.tariffRatePerKWh.toString());
    setFormError('');
    setShowModal(true);
  };

  const handleSaveMachine = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!name || !code || !ratedPowerKW) {
      setFormError('Please fill in machine name, code, and rated power');
      return;
    }

    setFormLoading(true);
    try {
      const payload = {
        name,
        code,
        category: cat,
        department: dept,
        ratedPowerKW: parseFloat(ratedPowerKW),
        voltageRating: parseFloat(voltageRating),
        location,
        status: machStatus,
        tariffRatePerKWh: parseFloat(tariffRatePerKWh),
      };

      if (editingMachine) {
        await machineAPI.update(editingMachine._id, payload);
      } else {
        await machineAPI.create(payload);
      }

      setShowModal(false);
      fetchMachines();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save machine');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id, mName) => {
    if (!window.confirm(`Are you sure you want to delete ${mName}? All associated logs will also be removed.`)) {
      return;
    }
    try {
      await machineAPI.delete(id);
      fetchMachines();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete machine');
    }
  };

  const totalCapacityKW = machines.reduce((acc, m) => acc + (m.ratedPowerKW || 0), 0);
  const operationalCount = machines.filter((m) => m.status === 'Operational').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#E1DCC9] flex items-center gap-2">
            <Cpu className="h-6 w-6 text-[#E1DCC9]" />
            <span>Industrial Machine Fleet</span>
          </h1>
          <p className="text-sm text-[#E1DCC9]/60 mt-0.5">
            Fleet inventory, electrical specifications, and capacity ratings
          </p>
        </div>

        {(user?.role === 'Admin' || user?.role === 'Manager') && (
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#E1DCC9] text-[#1F150C] font-bold text-sm hover:bg-[#E1DCC9]/90 transition-all shadow-md shadow-black/50 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            <span>Register Machine</span>
          </button>
        )}
      </div>

      {/* Fleet Metric Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-[#1F150C] border border-[#412D15] shadow-lg shadow-black/50">
          <span className="text-xs font-semibold text-[#E1DCC9]/60 uppercase">Total Assets</span>
          <div className="text-2xl font-bold text-[#E1DCC9] mt-1">{machines.length} Machines</div>
          <p className="text-xs text-[#E1DCC9]/50 mt-0.5">Across 6 factory departments</p>
        </div>
        <div className="p-4 rounded-xl bg-[#1F150C] border border-[#412D15] shadow-lg shadow-black/50">
          <span className="text-xs font-semibold text-[#E1DCC9]/60 uppercase">Operational Status</span>
          <div className="text-2xl font-bold text-[#E1DCC9] mt-1">
            {operationalCount} <span className="text-sm text-[#E1DCC9]/60 font-normal">/ {machines.length} Online</span>
          </div>
          <p className="text-xs text-[#E1DCC9]/50 mt-0.5">Available for production shifts</p>
        </div>
        <div className="p-4 rounded-xl bg-[#1F150C] border border-[#412D15] shadow-lg shadow-black/50">
          <span className="text-xs font-semibold text-[#E1DCC9]/60 uppercase">Total Connected Load</span>
          <div className="text-2xl font-bold text-[#E1DCC9] mt-1">
            {totalCapacityKW} <span className="text-sm text-[#E1DCC9]/60 font-normal">kW Capacity</span>
          </div>
          <p className="text-xs text-[#E1DCC9]/50 mt-0.5">Installed plant electrical rating</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="p-4 rounded-xl bg-[#1F150C] border border-[#412D15] flex flex-wrap items-center justify-between gap-3 shadow-lg shadow-black/50">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-[220px]">
          <Search className="h-4 w-4 text-[#E1DCC9]/50 absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by code, machine name, or bay..."
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-[#000000] border border-[#412D15] text-xs text-[#E1DCC9] focus:outline-none focus:border-[#E1DCC9]/60 transition-colors placeholder:text-[#E1DCC9]/30"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2">
          {/* Department Filter */}
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="px-3 py-2 rounded-lg bg-[#000000] border border-[#412D15] text-xs text-[#E1DCC9] focus:outline-none focus:border-[#E1DCC9]/60"
          >
            <option value="All" className="bg-[#1F150C]">All Departments</option>
            <option value="Machining Line A" className="bg-[#1F150C]">Machining Line A</option>
            <option value="Machining Line B" className="bg-[#1F150C]">Machining Line B</option>
            <option value="Stamping Plant" className="bg-[#1F150C]">Stamping Plant</option>
            <option value="Thermal Processing" className="bg-[#1F150C]">Thermal Processing</option>
            <option value="Assembly & Packaging" className="bg-[#1F150C]">Assembly & Packaging</option>
            <option value="Utility & Facility" className="bg-[#1F150C]">Utility & Facility</option>
          </select>

          {/* Status Filter */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2 rounded-lg bg-[#000000] border border-[#412D15] text-xs text-[#E1DCC9] focus:outline-none focus:border-[#E1DCC9]/60"
          >
            <option value="All" className="bg-[#1F150C]">All Statuses</option>
            <option value="Operational" className="bg-[#1F150C]">Operational</option>
            <option value="Idle" className="bg-[#1F150C]">Idle</option>
            <option value="Maintenance" className="bg-[#1F150C]">Maintenance</option>
          </select>
        </div>
      </div>

      {/* Machine Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {machines.map((m) => (
          <div
            key={m._id}
            className="p-5 rounded-2xl bg-[#1F150C] border border-[#412D15] hover:border-[#E1DCC9]/40 transition-all flex flex-col justify-between group shadow-xl shadow-black/60"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[11px] font-bold text-[#E1DCC9] px-2 py-0.5 rounded bg-[#412D15] border border-[#412D15]">
                    {m.code}
                  </span>
                  <h3 className="font-bold text-[#E1DCC9] text-base mt-2">{m.name}</h3>
                  <p className="text-xs text-[#E1DCC9]/60">{m.category}</p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-[#412D15] text-[#E1DCC9] border-[#E1DCC9]/30">
                  {m.status}
                </span>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-[#412D15] text-xs">
                <div>
                  <span className="text-[#E1DCC9]/50 block">Rated Power:</span>
                  <span className="font-bold text-[#E1DCC9] flex items-center gap-1">
                    <Zap className="h-3 w-3 text-[#E1DCC9]" /> {m.ratedPowerKW} kW
                  </span>
                </div>
                <div>
                  <span className="text-[#E1DCC9]/50 block">Voltage:</span>
                  <span className="font-semibold text-[#E1DCC9]">{m.voltageRating} V (3-Ph)</span>
                </div>
                <div>
                  <span className="text-[#E1DCC9]/50 block">Department:</span>
                  <span className="font-medium text-[#E1DCC9]/80 truncate block">{m.department}</span>
                </div>
                <div>
                  <span className="text-[#E1DCC9]/50 block">Tariff:</span>
                  <span className="font-medium text-[#E1DCC9]/80">${m.tariffRatePerKWh}/kWh</span>
                </div>
              </div>

              <div className="mt-3 text-xs text-[#E1DCC9]/60 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-[#E1DCC9]/50" />
                <span>{m.location}</span>
              </div>
            </div>

            {/* Actions */}
            {(user?.role === 'Admin' || user?.role === 'Manager') && (
              <div className="flex items-center justify-end gap-2 mt-5 pt-3 border-t border-[#412D15]">
                <button
                  onClick={() => openEditModal(m)}
                  className="px-2.5 py-1.5 rounded-lg bg-[#412D15] hover:bg-[#412D15]/80 text-[#E1DCC9] text-xs flex items-center gap-1 transition-colors cursor-pointer font-medium"
                >
                  <Edit3 className="h-3 w-3" /> Edit
                </button>
                {user?.role === 'Admin' && (
                  <button
                    onClick={() => handleDelete(m._id, m.name)}
                    className="px-2.5 py-1.5 rounded-lg bg-[#000000] hover:bg-rose-950 text-rose-300 text-xs flex items-center gap-1 border border-rose-900/60 transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-3 w-3 text-rose-400" /> Delete
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-[#000000]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1F150C] border border-[#412D15] rounded-2xl w-full max-w-lg p-6 shadow-2xl relative shadow-black/90">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-[#E1DCC9]/60 hover:text-[#E1DCC9] hover:bg-[#412D15] transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="text-lg font-bold text-[#E1DCC9] mb-1">
              {editingMachine ? `Edit ${editingMachine.name}` : 'Register New Machine Asset'}
            </h2>
            <p className="text-xs text-[#E1DCC9]/60 mb-5">
              Enter machine electrical capacity, floor location, and sub-metering parameters.
            </p>

            {formError && (
              <div className="mb-4 p-3 rounded-lg bg-[#000000] border border-rose-500/50 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveMachine} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#E1DCC9]/70 font-semibold uppercase mb-1">Machine Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mazak 5-Axis CNC Mill"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#000000] border border-[#412D15] text-[#E1DCC9] focus:outline-none focus:border-[#E1DCC9]/60 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#E1DCC9]/70 font-semibold uppercase mb-1">Machine Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MCH-CNC-003"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#000000] border border-[#412D15] text-[#E1DCC9] uppercase focus:outline-none focus:border-[#E1DCC9]/60 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[#E1DCC9]/70 font-semibold uppercase mb-1">Category *</label>
                  <select
                    value={cat}
                    onChange={(e) => setCat(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#000000] border border-[#412D15] text-[#E1DCC9] focus:outline-none focus:border-[#E1DCC9]/60 text-xs"
                  >
                    <option value="CNC / Milling" className="bg-[#1F150C]">CNC / Milling</option>
                    <option value="Stamping & Press" className="bg-[#1F150C]">Stamping & Press</option>
                    <option value="Furnace & Heating" className="bg-[#1F150C]">Furnace & Heating</option>
                    <option value="Compressor & Pneumatics" className="bg-[#1F150C]">Compressor & Pneumatics</option>
                    <option value="HVAC & Cooling" className="bg-[#1F150C]">HVAC & Cooling</option>
                    <option value="Packaging & Conveyor" className="bg-[#1F150C]">Packaging & Conveyor</option>
                    <option value="Other" className="bg-[#1F150C]">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#E1DCC9]/70 font-semibold uppercase mb-1">Department *</label>
                  <select
                    value={dept}
                    onChange={(e) => setDept(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#000000] border border-[#412D15] text-[#E1DCC9] focus:outline-none focus:border-[#E1DCC9]/60 text-xs"
                  >
                    <option value="Machining Line A" className="bg-[#1F150C]">Machining Line A</option>
                    <option value="Machining Line B" className="bg-[#1F150C]">Machining Line B</option>
                    <option value="Stamping Plant" className="bg-[#1F150C]">Stamping Plant</option>
                    <option value="Thermal Processing" className="bg-[#1F150C]">Thermal Processing</option>
                    <option value="Assembly & Packaging" className="bg-[#1F150C]">Assembly & Packaging</option>
                    <option value="Utility & Facility" className="bg-[#1F150C]">Utility & Facility</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#E1DCC9]/70 font-semibold uppercase mb-1">Status</label>
                  <select
                    value={machStatus}
                    onChange={(e) => setMachStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#000000] border border-[#412D15] text-[#E1DCC9] focus:outline-none focus:border-[#E1DCC9]/60 text-xs"
                  >
                    <option value="Operational" className="bg-[#1F150C]">Operational</option>
                    <option value="Idle" className="bg-[#1F150C]">Idle</option>
                    <option value="Maintenance" className="bg-[#1F150C]">Maintenance</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[#E1DCC9]/70 font-semibold uppercase mb-1">Rated kW *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    placeholder="35"
                    value={ratedPowerKW}
                    onChange={(e) => setRatedPowerKW(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#000000] border border-[#412D15] text-[#E1DCC9] focus:outline-none focus:border-[#E1DCC9]/60 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[#E1DCC9]/70 font-semibold uppercase mb-1">Voltage (V)</label>
                  <input
                    type="number"
                    value={voltageRating}
                    onChange={(e) => setVoltageRating(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#000000] border border-[#412D15] text-[#E1DCC9] focus:outline-none focus:border-[#E1DCC9]/60 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[#E1DCC9]/70 font-semibold uppercase mb-1">Tariff ($/kWh)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={tariffRatePerKWh}
                    onChange={(e) => setTariffRatePerKWh(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#000000] border border-[#412D15] text-[#E1DCC9] focus:outline-none focus:border-[#E1DCC9]/60 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#E1DCC9]/70 font-semibold uppercase mb-1">Location / Floor</label>
                <input
                  type="text"
                  placeholder="e.g. Bay 2 - Precision Milling"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#000000] border border-[#412D15] text-[#E1DCC9] focus:outline-none focus:border-[#E1DCC9]/60 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#412D15]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg bg-[#000000] text-[#E1DCC9]/70 hover:text-[#E1DCC9] font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-2 rounded-lg bg-[#E1DCC9] text-[#1F150C] font-bold shadow-md cursor-pointer disabled:opacity-50"
                >
                  {formLoading ? 'Saving...' : editingMachine ? 'Update Machine' : 'Register Machine'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
