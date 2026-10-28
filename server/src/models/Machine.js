import mongoose from 'mongoose';

const machineSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide machine name'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Please provide machine code (e.g. MCH-001)'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Please provide machine category'],
      enum: ['CNC / Milling', 'Stamping & Press', 'Compressor & Pneumatics', 'Furnace & Heating', 'HVAC & Cooling', 'Packaging & Conveyor', 'Other'],
      default: 'CNC / Milling',
    },
    department: {
      type: String,
      required: [true, 'Please provide department'],
      enum: ['Machining Line A', 'Machining Line B', 'Stamping Plant', 'Thermal Processing', 'Assembly & Packaging', 'Utility & Facility'],
      default: 'Machining Line A',
    },
    ratedPowerKW: {
      type: Number,
      required: [true, 'Please provide rated power in kW'],
      min: [0.1, 'Rated power must be positive'],
    },
    voltageRating: {
      type: Number,
      default: 415, // 3-phase standard
    },
    location: {
      type: String,
      default: 'Shop Floor 1',
    },
    status: {
      type: String,
      enum: ['Operational', 'Idle', 'Maintenance', 'Decommissioned'],
      default: 'Operational',
    },
    tariffRatePerKWh: {
      type: Number,
      default: 8.50, // ₹8.50 per kWh default in INR
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Machine', machineSchema);
