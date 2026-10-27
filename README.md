# ENERGEX — Factory Energy Tracking & Sub-metering System (MERN)

A modern full-stack industrial energy management and sub-metering web application designed for factories, manufacturing plants, and facility engineers. Built with **MongoDB, Express.js, React (Vite + Tailwind CSS), and Node.js**.

---

## ⚡ Key Capabilities

1. **Machine-level Shift Logging**:
   - Operators can select any machine on the shop floor, select the date, and choose the shift (*Shift 1 Morning, Shift 2 Evening, Shift 3 Night*).
   - Input energy consumption ($kWh$), operating run-hours, power factor ($PF$), peak demand ($kW$), and operational notes.
   - **Real-Time Telemetry Preview**: Instant calculation of electricity cost based on machine tariffs, running load ($kW$), motor capacity load factor gauge (%), and physical feasibility checks.
2. **Plant Executive Dashboard**:
   - High-level KPIs: Total energy consumed ($kWh$), estimated electricity bill, average power factor with grid health warning, and peak demand.
   - Dynamic time filters: *Today, Last 7 Days, Last 30 Days*.
   - Interactive Recharts area chart with gradient volume for daily consumption.
   - Department energy breakdown donut chart.
   - Top consuming machines ranking bar chart.
3. **Machine Fleet Management**:
   - Full inventory across factory departments (Machining Line A & B, Stamping Plant, Thermal Processing, Utility & Facility, Packaging).
   - Electrical ratings (Rated Power in $kW$, 3-phase Voltage, Location, Status).
   - Add, edit, or delete machine assets.
4. **Visual Analytics Suite**:
   - Dual-axis energy vs. electricity cost progression line chart.
   - Shift-by-shift energy distribution bar chart.
   - Asset energy intensity benchmarking ($kWh$ per operating hour vs rated capacity).
   - Machine-specific filtering to analyze individual assets.
5. **Audit & Compliance Reports**:
   - Filterable shift records by Machine, Department, Shift, and Custom Date Range.
   - **1-Click CSV Export** for compliance auditing and external spreadsheet analysis.
6. **Pre-configured Role-Based Access Control**:
   - Ready-to-test accounts with pre-specified logins:
     - 👷 **Machine Operator**: `operator@factory.com` / `operator123` (Data entry, shift logging)
     - 📊 **Plant Manager**: `manager@factory.com` / `manager123` (Analytics, fleet editing, reports)
     - ⚡ **Plant Admin**: `admin@factory.com` / `admin123` (Full system configuration, asset deletion, user audit)
   - Features a **1-click Role Switcher** on the login screen and top navigation bar for testing.

---

## 🚀 Running the Project

### 1. Start MongoDB
Ensure your local MongoDB Community Server is running on port `27017` (default).

### 2. Start the Application
From the project root:

```bash
# Start backend API (Port 5000)
npm run server

# Start frontend UI (Port 3000)
npm run client
```

Or run them individually:
```bash
# In /server
cd server
npm run dev

# In /client
cd client
npm run dev
```

### 3. Database Seeding (Optional)
The server automatically seeds initial machines, users, and 30 days of shift logs if the database is empty. To re-seed fresh sample data anytime:
```bash
cd server
npm run seed
```

---

## 🌐 URLs & Access
- **Frontend App**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:5000/api/health](http://localhost:5000/api/health)
