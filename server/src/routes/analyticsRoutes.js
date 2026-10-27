import express from 'express';
import mongoose from 'mongoose';
import EnergyLog from '../models/EnergyLog.js';
import Machine from '../models/Machine.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Helper to calculate date ranges
const getDateRange = (range = '30d') => {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date();

  if (range === '7d') {
    start.setDate(end.getDate() - 7);
  } else if (range === '30d') {
    start.setDate(end.getDate() - 30);
  } else if (range === '90d') {
    start.setDate(end.getDate() - 90);
  } else if (range === 'today') {
    start.setHours(0, 0, 0, 0);
  } else {
    start.setDate(end.getDate() - 30);
  }
  return { start, end };
};

// @route   GET /api/analytics/kpis
// @desc    High-level factory KPIs
router.get('/kpis', protect, async (req, res) => {
  try {
    const { range = '30d' } = req.query;
    const { start, end } = getDateRange(range);

    const matchFilter = { logDate: { $gte: start, $lte: end } };

    // KPI aggregation
    const [overallStats, activeMachinesCount, topMachineAgg] = await Promise.all([
      EnergyLog.aggregate([
        { $match: matchFilter },
        {
          $group: {
            _id: null,
            totalKWh: { $sum: '$energyConsumedKWh' },
            totalCost: { $sum: '$calculatedCost' },
            totalHours: { $sum: '$operatingHours' },
            avgPowerFactor: { $avg: '$powerFactor' },
            maxPeakDemand: { $max: '$peakDemandKW' },
            entryCount: { $sum: 1 },
          },
        },
      ]),
      Machine.countDocuments({ status: 'Operational' }),
      EnergyLog.aggregate([
        { $match: matchFilter },
        {
          $group: {
            _id: '$machine',
            totalKWh: { $sum: '$energyConsumedKWh' },
            totalCost: { $sum: '$calculatedCost' },
          },
        },
        { $sort: { totalKWh: -1 } },
        { $limit: 1 },
        {
          $lookup: {
            from: 'machines',
            localField: '_id',
            foreignField: '_id',
            as: 'machineDetails',
          },
        },
        { $unwind: { path: '$machineDetails', preserveNullAndEmptyArrays: true } },
      ]),
    ]);

    const stats = overallStats[0] || {
      totalKWh: 0,
      totalCost: 0,
      totalHours: 0,
      avgPowerFactor: 0.92,
      maxPeakDemand: 0,
      entryCount: 0,
    };

    const avgIntensity = stats.totalHours > 0 ? (stats.totalKWh / stats.totalHours).toFixed(2) : 0;

    res.json({
      success: true,
      data: {
        totalKWh: Math.round(stats.totalKWh * 100) / 100,
        totalCost: Math.round(stats.totalCost * 100) / 100,
        totalHours: Math.round(stats.totalHours * 10) / 10,
        avgPowerFactor: stats.avgPowerFactor ? (stats.avgPowerFactor).toFixed(2) : '0.92',
        maxPeakDemand: stats.maxPeakDemand ? stats.maxPeakDemand.toFixed(1) : '0.0',
        avgEnergyIntensity: Number(avgIntensity),
        activeMachines: activeMachinesCount,
        topConsumer: topMachineAgg[0]
          ? {
              name: topMachineAgg[0].machineDetails?.name || 'Unknown',
              code: topMachineAgg[0].machineDetails?.code || '',
              totalKWh: Math.round(topMachineAgg[0].totalKWh * 10) / 10,
              totalCost: Math.round(topMachineAgg[0].totalCost * 10) / 10,
            }
          : null,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/analytics/trends
// @desc    Time series daily consumption and cost
router.get('/trends', protect, async (req, res) => {
  try {
    const { range = '30d', machineId } = req.query;
    const { start, end } = getDateRange(range);

    const matchStage = { logDate: { $gte: start, $lte: end } };
    if (machineId && machineId !== 'All') {
      matchStage.machine = new mongoose.Types.ObjectId(machineId);
    }

    const trends = await EnergyLog.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$logDate' } },
          totalKWh: { $sum: '$energyConsumedKWh' },
          totalCost: { $sum: '$calculatedCost' },
          operatingHours: { $sum: '$operatingHours' },
          avgPeakDemand: { $avg: '$peakDemandKW' },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          date: '$_id',
          totalKWh: { $round: ['$totalKWh', 1] },
          totalCost: { $round: ['$totalCost', 2] },
          operatingHours: { $round: ['$operatingHours', 1] },
          avgPeakDemand: { $round: ['$avgPeakDemand', 1] },
        },
      },
    ]);

    res.json({ success: true, count: trends.length, data: trends });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/analytics/by-machine
// @desc    Machine ranking by energy consumption
router.get('/by-machine', protect, async (req, res) => {
  try {
    const { range = '30d', limit = 10 } = req.query;
    const { start, end } = getDateRange(range);

    const machineStats = await EnergyLog.aggregate([
      { $match: { logDate: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: '$machine',
          totalKWh: { $sum: '$energyConsumedKWh' },
          totalCost: { $sum: '$calculatedCost' },
          totalHours: { $sum: '$operatingHours' },
          avgPowerFactor: { $avg: '$powerFactor' },
        },
      },
      { $sort: { totalKWh: -1 } },
      { $limit: Number(limit) },
      {
        $lookup: {
          from: 'machines',
          localField: '_id',
          foreignField: '_id',
          as: 'machine',
        },
      },
      { $unwind: '$machine' },
      {
        $project: {
          _id: 1,
          name: '$machine.name',
          code: '$machine.code',
          department: '$machine.department',
          category: '$machine.category',
          ratedPowerKW: '$machine.ratedPowerKW',
          totalKWh: { $round: ['$totalKWh', 1] },
          totalCost: { $round: ['$totalCost', 2] },
          totalHours: { $round: ['$totalHours', 1] },
          avgPowerFactor: { $round: ['$avgPowerFactor', 2] },
          kWhPerHour: {
            $cond: [
              { $gt: ['$totalHours', 0] },
              { $round: [{ $divide: ['$totalKWh', '$totalHours'] }, 2] },
              0,
            ],
          },
        },
      },
    ]);

    res.json({ success: true, data: machineStats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/analytics/by-department
// @desc    Energy consumption distribution by department
router.get('/by-department', protect, async (req, res) => {
  try {
    const { range = '30d' } = req.query;
    const { start, end } = getDateRange(range);

    const deptStats = await EnergyLog.aggregate([
      { $match: { logDate: { $gte: start, $lte: end } } },
      {
        $lookup: {
          from: 'machines',
          localField: 'machine',
          foreignField: '_id',
          as: 'machine',
        },
      },
      { $unwind: '$machine' },
      {
        $group: {
          _id: '$machine.department',
          totalKWh: { $sum: '$energyConsumedKWh' },
          totalCost: { $sum: '$calculatedCost' },
          machineCount: { $addToSet: '$machine._id' },
        },
      },
      { $sort: { totalKWh: -1 } },
      {
        $project: {
          _id: 0,
          department: '$_id',
          totalKWh: { $round: ['$totalKWh', 1] },
          totalCost: { $round: ['$totalCost', 2] },
          activeMachines: { $size: '$machineCount' },
        },
      },
    ]);

    res.json({ success: true, data: deptStats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/analytics/by-shift
// @desc    Shift comparison
router.get('/by-shift', protect, async (req, res) => {
  try {
    const { range = '30d' } = req.query;
    const { start, end } = getDateRange(range);

    const shiftStats = await EnergyLog.aggregate([
      { $match: { logDate: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: '$shift',
          totalKWh: { $sum: '$energyConsumedKWh' },
          totalCost: { $sum: '$calculatedCost' },
          totalHours: { $sum: '$operatingHours' },
          logCount: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          shift: '$_id',
          totalKWh: { $round: ['$totalKWh', 1] },
          totalCost: { $round: ['$totalCost', 2] },
          totalHours: { $round: ['$totalHours', 1] },
          logCount: 1,
        },
      },
    ]);

    res.json({ success: true, data: shiftStats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
