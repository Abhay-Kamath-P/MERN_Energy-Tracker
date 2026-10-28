import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from './models/User.js';
import Machine from './models/Machine.js';
import EnergyLog from './models/EnergyLog.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/factory_energy_tracker';

export const seedData = async () => {
  try {
    console.log('[Seeder] Connecting to database...');
    await mongoose.connect(MONGO_URI);
    console.log('[Seeder] Connected.');

    // Clear existing collections
    console.log('[Seeder] Clearing old collections...');
    await Promise.all([User.deleteMany({}), Machine.deleteMany({}), EnergyLog.deleteMany({})]);

    // 1. Seed Users
    console.log('[Seeder] Seeding users with specified credentials...');
    const users = await User.create([
      {
        name: 'Sarah Connor (Plant Admin)',
        email: 'admin@factory.com',
        password: 'admin123',
        role: 'Admin',
        department: 'Plant Operations Management',
      },
      {
        name: 'David Vance (Energy Manager)',
        email: 'manager@factory.com',
        password: 'manager123',
        role: 'Manager',
        department: 'Sustainability & Facility',
      },
      {
        name: 'Alex Rivera (Floor Operator)',
        email: 'operator@factory.com',
        password: 'operator123',
        role: 'Operator',
        department: 'Machining Line A',
      },
    ]);
    console.log(`[Seeder] Seeded ${users.length} default users.`);

    // 2. Seed Machines
    console.log('[Seeder] Seeding factory industrial machines...');
    const machines = await Machine.create([
      {
        name: 'Mazak 5-Axis CNC Mill',
        code: 'MCH-CNC-001',
        category: 'CNC / Milling',
        department: 'Machining Line A',
        ratedPowerKW: 35,
        voltageRating: 415,
        location: 'Bay 1 - Precision Milling',
        status: 'Operational',
        tariffRatePerKWh: 8.80,
      },
      {
        name: 'Haas VF-4 Machining Center',
        code: 'MCH-CNC-002',
        category: 'CNC / Milling',
        department: 'Machining Line A',
        ratedPowerKW: 22,
        voltageRating: 415,
        location: 'Bay 2 - Precision Milling',
        status: 'Operational',
        tariffRatePerKWh: 8.80,
      },
      {
        name: 'Doosan Puma 2600 Lathe',
        code: 'MCH-LTH-001',
        category: 'CNC / Milling',
        department: 'Machining Line B',
        ratedPowerKW: 18,
        voltageRating: 415,
        location: 'Bay 3 - Turning Center',
        status: 'Operational',
        tariffRatePerKWh: 8.80,
      },
      {
        name: 'AIDA 300-Ton Mechanical Press',
        code: 'MCH-PRS-001',
        category: 'Stamping & Press',
        department: 'Stamping Plant',
        ratedPowerKW: 50,
        voltageRating: 415,
        location: 'Heavy Press Hall',
        status: 'Operational',
        tariffRatePerKWh: 8.50,
      },
      {
        name: 'Komatsu Servo Press 150T',
        code: 'MCH-PRS-002',
        category: 'Stamping & Press',
        department: 'Stamping Plant',
        ratedPowerKW: 30,
        voltageRating: 415,
        location: 'Heavy Press Hall',
        status: 'Operational',
        tariffRatePerKWh: 8.50,
      },
      {
        name: 'Continuous Annealing Furnace',
        code: 'MCH-FRN-001',
        category: 'Furnace & Heating',
        department: 'Thermal Processing',
        ratedPowerKW: 95,
        voltageRating: 480,
        location: 'Heat Treatment Wing',
        status: 'Operational',
        tariffRatePerKWh: 8.20,
      },
      {
        name: 'Atlas Copco Rotary Screw Compressor 75HP',
        code: 'MCH-CMP-001',
        category: 'Compressor & Pneumatics',
        department: 'Utility & Facility',
        ratedPowerKW: 55,
        voltageRating: 415,
        location: 'Central Utility Room',
        status: 'Operational',
        tariffRatePerKWh: 8.50,
      },
      {
        name: 'Trane Industrial Chiller 120TR',
        code: 'MCH-CHL-001',
        category: 'HVAC & Cooling',
        department: 'Utility & Facility',
        ratedPowerKW: 70,
        voltageRating: 415,
        location: 'Rooftop Utility Deck',
        status: 'Operational',
        tariffRatePerKWh: 8.50,
      },
      {
        name: 'Automated Robotic Packaging Cell',
        code: 'MCH-PKG-001',
        category: 'Packaging & Conveyor',
        department: 'Assembly & Packaging',
        ratedPowerKW: 16,
        voltageRating: 415,
        location: 'Packing Line 1',
        status: 'Operational',
        tariffRatePerKWh: 8.50,
      },
      {
        name: 'Fanuc Robotic Palletizer',
        code: 'MCH-PKG-002',
        category: 'Packaging & Conveyor',
        department: 'Assembly & Packaging',
        ratedPowerKW: 12,
        voltageRating: 415,
        location: 'Outbound Warehouse',
        status: 'Operational',
        tariffRatePerKWh: 8.50,
      },
    ]);
    console.log(`[Seeder] Seeded ${machines.length} industrial machines.`);

    // 3. Seed 30 Days of realistic energy logs across shifts
    console.log('[Seeder] Generating 30 days of shift logs...');
    const shifts = [
      'Shift 1 (06:00 - 14:00)',
      'Shift 2 (14:00 - 22:00)',
      'Shift 3 (22:00 - 06:00)',
    ];

    const logsToInsert = [];
    const now = new Date();

    for (let dayOffset = 29; dayOffset >= 0; dayOffset--) {
      const targetDate = new Date();
      targetDate.setDate(now.getDate() - dayOffset);
      targetDate.setHours(12, 0, 0, 0);

      // Is it a weekend? Lower utilization
      const isWeekend = targetDate.getDay() === 0 || targetDate.getDay() === 6;

      for (const machine of machines) {
        // Continuous machines (Furnace, Compressor, Chiller) run all 3 shifts; others mostly Shift 1 & 2
        const shiftsForMachine =
          machine.category === 'Furnace & Heating' || machine.category === 'Compressor & Pneumatics' || machine.category === 'HVAC & Cooling'
            ? shifts
            : isWeekend
            ? [shifts[0]] // only 1 shift on weekends
            : [shifts[0], shifts[1]];

        for (const shift of shiftsForMachine) {
          // Operating hours (e.g. 6.5 to 7.8 hours per 8 hr shift)
          const opHours = isWeekend && machine.category !== 'Furnace & Heating'
            ? Number((Math.random() * 2 + 4).toFixed(1))
            : Number((Math.random() * 1.5 + 6.3).toFixed(1));

          // Load factor: 55% to 85% of rated power
          const loadFactor = isWeekend ? (Math.random() * 0.2 + 0.45) : (Math.random() * 0.25 + 0.65);
          const avgPowerKW = machine.ratedPowerKW * loadFactor;
          const energyConsumedKWh = Number((avgPowerKW * opHours).toFixed(2));
          const peakDemandKW = Number((avgPowerKW * (1 + Math.random() * 0.2)).toFixed(1));
          const powerFactor = Number((0.89 + Math.random() * 0.08).toFixed(2));
          const calculatedCost = Number((energyConsumedKWh * machine.tariffRatePerKWh).toFixed(2));

          const loggerUser = users[Math.floor(Math.random() * users.length)];

          logsToInsert.push({
            machine: machine._id,
            logDate: targetDate,
            shift,
            energyConsumedKWh,
            operatingHours: opHours,
            powerFactor,
            peakDemandKW,
            calculatedCost,
            notes: isWeekend ? 'Weekend reduced load cycle' : 'Standard production batch running',
            loggedBy: loggerUser._id,
          });
        }
      }
    }

    await EnergyLog.insertMany(logsToInsert);
    console.log(`[Seeder] Successfully seeded ${logsToInsert.length} shift energy logs!`);
    console.log('\n[Ready] System credentials:');
    console.log(' - Admin:    admin@factory.com / admin123');
    console.log(' - Manager:  manager@factory.com / manager123');
    console.log(' - Operator: operator@factory.com / operator123\n');
  } catch (error) {
    console.error('[Seeder Error]', error);
  } finally {
    if (process.argv[1]?.includes('seed.js')) {
      await mongoose.disconnect();
      console.log('[Seeder] Disconnected from database.');
    }
  }
};

// Run if called directly
if (process.argv[1]?.includes('seed.js')) {
  seedData().then(() => process.exit(0));
}
