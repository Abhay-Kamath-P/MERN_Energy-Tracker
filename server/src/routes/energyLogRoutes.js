import express from 'express';
import EnergyLog from '../models/EnergyLog.js';
import Machine from '../models/Machine.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/logs
// @desc    Get energy logs with extensive filtering & pagination
router.get('/', protect, async (req, res) => {
  try {
    const { machineId, department, shift, startDate, endDate, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (machineId && machineId !== 'All') {
      filter.machine = machineId;
    }

    if (shift && shift !== 'All') {
      filter.shift = shift;
    }

    if (startDate || endDate) {
      filter.logDate = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        filter.logDate.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.logDate.$lte = end;
      }
    }

    // If department filter specified, find machines in that department first
    if (department && department !== 'All') {
      const machinesInDept = await Machine.find({ department }).select('_id');
      const machineIds = machinesInDept.map((m) => m._id);
      if (filter.machine) {
        // machineId already filtered, keep if it belongs to dept
      } else {
        filter.machine = { $in: machineIds };
      }
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [logs, total] = await Promise.all([
      EnergyLog.find(filter)
        .populate('machine', 'name code department category ratedPowerKW tariffRatePerKWh')
        .populate('loggedBy', 'name email role')
        .sort({ logDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      EnergyLog.countDocuments(filter),
    ]);

    res.json({
      success: true,
      count: logs.length,
      total,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      data: logs,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/logs/export/csv
// @desc    Generate CSV export of energy logs
router.get('/export/csv', protect, async (req, res) => {
  try {
    const { machineId, department, startDate, endDate } = req.query;
    const filter = {};

    if (machineId && machineId !== 'All') filter.machine = machineId;

    if (startDate || endDate) {
      filter.logDate = {};
      if (startDate) filter.logDate.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.logDate.$lte = end;
      }
    }

    if (department && department !== 'All') {
      const machinesInDept = await Machine.find({ department }).select('_id');
      filter.machine = { $in: machinesInDept.map((m) => m._id) };
    }

    const logs = await EnergyLog.find(filter)
      .populate('machine', 'name code department')
      .populate('loggedBy', 'name')
      .sort({ logDate: -1 });

    const headers = 'Log Date,Machine Code,Machine Name,Department,Shift,Energy (kWh),Operating Hours,Power Factor,Peak Demand (kW),Cost ($),Logged By,Notes\n';
    const rows = logs.map((log) => {
      const dateStr = new Date(log.logDate).toISOString().split('T')[0];
      const mCode = log.machine?.code || 'N/A';
      const mName = `"${log.machine?.name || 'N/A'}"`;
      const dept = `"${log.machine?.department || 'N/A'}"`;
      const shift = `"${log.shift}"`;
      const kwh = log.energyConsumedKWh.toFixed(2);
      const hrs = log.operatingHours.toFixed(1);
      const pf = (log.powerFactor || 0).toFixed(2);
      const peak = (log.peakDemandKW || 0).toFixed(1);
      const cost = (log.calculatedCost || 0).toFixed(2);
      const user = `"${log.loggedBy?.name || 'System'}"`;
      const notes = `"${(log.notes || '').replace(/"/g, '""')}"`;
      return `${dateStr},${mCode},${mName},${dept},${shift},${kwh},${hrs},${pf},${peak},${cost},${user},${notes}`;
    });

    const csvContent = headers + rows.join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="factory_energy_logs.csv"');
    res.status(200).send(csvContent);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/logs/:id
// @desc    Get single log
router.get('/:id', protect, async (req, res) => {
  try {
    const log = await EnergyLog.findById(req.params.id)
      .populate('machine')
      .populate('loggedBy', 'name email');
    if (!log) {
      return res.status(404).json({ success: false, message: 'Log not found' });
    }
    res.json({ success: true, data: log });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/logs
// @desc    Create a new energy log entry
router.post('/', protect, async (req, res) => {
  try {
    const { machineId, logDate, shift, energyConsumedKWh, operatingHours, powerFactor, peakDemandKW, notes } = req.body;

    const machine = await Machine.findById(machineId);
    if (!machine) {
      return res.status(404).json({ success: false, message: 'Selected machine not found' });
    }

    const rate = machine.tariffRatePerKWh || Number(process.env.DEFAULT_ENERGY_RATE) || 0.15;
    const calculatedCost = Number(energyConsumedKWh) * rate;

    const newLog = await EnergyLog.create({
      machine: machineId,
      logDate: logDate ? new Date(logDate) : new Date(),
      shift: shift || 'Shift 1 (06:00 - 14:00)',
      energyConsumedKWh: Number(energyConsumedKWh),
      operatingHours: Number(operatingHours),
      powerFactor: Number(powerFactor) || 0.92,
      peakDemandKW: Number(peakDemandKW) || 0,
      calculatedCost: Math.round(calculatedCost * 100) / 100,
      notes: notes || '',
      loggedBy: req.user._id,
    });

    const populated = await EnergyLog.findById(newLog._id)
      .populate('machine', 'name code department category ratedPowerKW')
      .populate('loggedBy', 'name email');

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/logs/:id
// @desc    Update an energy log entry (Operator who created, Manager, or Admin)
router.put('/:id', protect, async (req, res) => {
  try {
    const log = await EnergyLog.findById(req.params.id);
    if (!log) {
      return res.status(404).json({ success: false, message: 'Log not found' });
    }

    // Role check: Only the logger, Manager or Admin can edit
    if (req.user.role === 'Operator' && log.loggedBy && log.loggedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this entry' });
    }

    const { machineId, logDate, shift, energyConsumedKWh, operatingHours, powerFactor, peakDemandKW, notes } = req.body;

    let targetMachine = log.machine;
    if (machineId && machineId !== log.machine.toString()) {
      targetMachine = await Machine.findById(machineId);
      log.machine = machineId;
    } else {
      targetMachine = await Machine.findById(log.machine);
    }

    if (logDate) log.logDate = new Date(logDate);
    if (shift) log.shift = shift;
    if (energyConsumedKWh !== undefined) log.energyConsumedKWh = Number(energyConsumedKWh);
    if (operatingHours !== undefined) log.operatingHours = Number(operatingHours);
    if (powerFactor !== undefined) log.powerFactor = Number(powerFactor);
    if (peakDemandKW !== undefined) log.peakDemandKW = Number(peakDemandKW);
    if (notes !== undefined) log.notes = notes;

    const rate = targetMachine?.tariffRatePerKWh || 0.15;
    log.calculatedCost = Math.round(log.energyConsumedKWh * rate * 100) / 100;

    await log.save();

    const populated = await EnergyLog.findById(log._id)
      .populate('machine', 'name code department category')
      .populate('loggedBy', 'name email');

    res.json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   DELETE /api/logs/:id
// @desc    Delete a log (Manager or Admin)
router.delete('/:id', protect, authorize('Admin', 'Manager'), async (req, res) => {
  try {
    const log = await EnergyLog.findById(req.params.id);
    if (!log) {
      return res.status(404).json({ success: false, message: 'Log not found' });
    }
    await log.deleteOne();
    res.json({ success: true, message: 'Log entry deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
