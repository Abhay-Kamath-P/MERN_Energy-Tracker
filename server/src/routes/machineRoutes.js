import express from 'express';
import Machine from '../models/Machine.js';
import EnergyLog from '../models/EnergyLog.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/machines
// @desc    Get all machines with optional filters
router.get('/', protect, async (req, res) => {
  try {
    const { department, category, status, search } = req.query;
    const filter = {};

    if (department && department !== 'All') {
      filter.department = department;
    }
    if (category && category !== 'All') {
      filter.category = category;
    }
    if (status && status !== 'All') {
      filter.status = status;
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
      ];
    }

    const machines = await Machine.find(filter).sort({ name: 1 });
    res.json({ success: true, count: machines.length, data: machines });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/machines/:id
// @desc    Get single machine by ID
router.get('/:id', protect, async (req, res) => {
  try {
    const machine = await Machine.findById(req.params.id);
    if (!machine) {
      return res.status(404).json({ success: false, message: 'Machine not found' });
    }

    // Get latest 5 logs for this machine
    const recentLogs = await EnergyLog.find({ machine: machine._id })
      .sort({ logDate: -1, createdAt: -1 })
      .limit(5)
      .populate('loggedBy', 'name');

    // Aggregate totals for this machine
    const stats = await EnergyLog.aggregate([
      { $match: { machine: machine._id } },
      {
        $group: {
          _id: null,
          totalKWh: { $sum: '$energyConsumedKWh' },
          totalHours: { $sum: '$operatingHours' },
          totalCost: { $sum: '$calculatedCost' },
          avgPowerFactor: { $avg: '$powerFactor' },
          maxPeakDemand: { $max: '$peakDemandKW' },
          totalLogs: { $sum: 1 },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        machine,
        stats: stats[0] || { totalKWh: 0, totalHours: 0, totalCost: 0, avgPowerFactor: 0, maxPeakDemand: 0, totalLogs: 0 },
        recentLogs,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/machines
// @desc    Add a new machine (Admin & Manager)
router.post('/', protect, authorize('Admin', 'Manager'), async (req, res) => {
  try {
    const { name, code, category, department, ratedPowerKW, voltageRating, location, status, tariffRatePerKWh } = req.body;

    const existing = await Machine.findOne({ code: code.toUpperCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: `Machine code ${code} is already registered` });
    }

    const machine = await Machine.create({
      name,
      code: code.toUpperCase(),
      category,
      department,
      ratedPowerKW: Number(ratedPowerKW),
      voltageRating: Number(voltageRating) || 415,
      location: location || 'Shop Floor',
      status: status || 'Operational',
      tariffRatePerKWh: Number(tariffRatePerKWh) || 0.15,
    });

    res.status(201).json({ success: true, data: machine });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/machines/:id
// @desc    Update a machine (Admin & Manager)
router.put('/:id', protect, authorize('Admin', 'Manager'), async (req, res) => {
  try {
    const machine = await Machine.findById(req.params.id);
    if (!machine) {
      return res.status(404).json({ success: false, message: 'Machine not found' });
    }

    if (req.body.code && req.body.code.toUpperCase() !== machine.code) {
      const existing = await Machine.findOne({ code: req.body.code.toUpperCase() });
      if (existing) {
        return res.status(400).json({ success: false, message: `Machine code ${req.body.code} is already in use` });
      }
      req.body.code = req.body.code.toUpperCase();
    }

    const updated = await Machine.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   DELETE /api/machines/:id
// @desc    Delete a machine (Admin only)
router.delete('/:id', protect, authorize('Admin'), async (req, res) => {
  try {
    const machine = await Machine.findById(req.params.id);
    if (!machine) {
      return res.status(404).json({ success: false, message: 'Machine not found' });
    }

    // Cascade delete logs
    await EnergyLog.deleteMany({ machine: machine._id });
    await machine.deleteOne();

    res.json({ success: true, message: 'Machine and its energy logs have been deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
