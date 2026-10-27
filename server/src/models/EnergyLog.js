import mongoose from 'mongoose';

const energyLogSchema = new mongoose.Schema(
  {
    machine: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Machine',
      required: [true, 'Please specify the machine'],
    },
    logDate: {
      type: Date,
      required: [true, 'Please specify the date'],
      default: Date.now,
    },
    shift: {
      type: String,
      required: [true, 'Please select the shift'],
      enum: ['Shift 1 (06:00 - 14:00)', 'Shift 2 (14:00 - 22:00)', 'Shift 3 (22:00 - 06:00)'],
      default: 'Shift 1 (06:00 - 14:00)',
    },
    energyConsumedKWh: {
      type: Number,
      required: [true, 'Please enter energy consumed in kWh'],
      min: [0, 'Energy consumed cannot be negative'],
    },
    operatingHours: {
      type: Number,
      required: [true, 'Please enter machine operating hours'],
      min: [0, 'Operating hours cannot be negative'],
      max: [12, 'Shift operating hours cannot exceed 12 hours'],
    },
    powerFactor: {
      type: Number,
      default: 0.92,
      min: [0, 'Power factor cannot be negative'],
      max: [1, 'Power factor cannot exceed 1.0'],
    },
    peakDemandKW: {
      type: Number,
      default: 0,
      min: [0, 'Peak demand cannot be negative'],
    },
    calculatedCost: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
    loggedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to help fast queries by machine and date
energyLogSchema.index({ machine: 1, logDate: -1 });
energyLogSchema.index({ logDate: -1 });

export default mongoose.model('EnergyLog', energyLogSchema);
