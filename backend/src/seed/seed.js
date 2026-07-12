require('dotenv').config();
const {
  sequelize,
  Role,
  User,
  Vehicle,
  Driver,
  Trip,
  MaintenanceLog,
  FuelLog,
  Expense,
} = require('../models');

const { ROLE_LIST, VEHICLE_STATUS, DRIVER_STATUS, TRIP_STATUS, MAINTENANCE_STATUS } = require('../utils/constants');

const daysFromNow = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
};

const seed = async () => {
  await sequelize.authenticate();
  console.log('Resetting schema (sync force)...');
  await sequelize.sync({ force: true });

  console.log('Creating roles...');
  const roles = await Role.bulkCreate(ROLE_LIST.map((name) => ({ name })));
  const roleId = Object.fromEntries(roles.map((r) => [r.name, r._id]));

  console.log('Creating users...');
  const DEMO_PASSWORD = 'Password123!';
  const users = [];
  for (const spec of [
    { name: 'Frank Mercer', email: 'fleetmanager@transitops.demo', role: 'FleetManager' },
    { name: 'Sara Lin', email: 'safety@transitops.demo', role: 'SafetyOfficer' },
    { name: 'Amara Chen', email: 'finance@transitops.demo', role: 'FinancialAnalyst' },
    { name: 'Diego Ruiz', email: 'driver@transitops.demo', role: 'Driver' },
  ]) {
    // eslint-disable-next-line no-await-in-loop
    const user = await User.create({
      name: spec.name,
      email: spec.email,
      password: DEMO_PASSWORD,
      roleId: roleId[spec.role],
    });
    users.push(user);
  }
  console.log(`Created ${users.length} users. Demo password for all: ${DEMO_PASSWORD}`);

  console.log('Creating vehicles...');
  const vehicles = await Vehicle.bulkCreate([
    { registrationNumber: 'TRK-1001', name: 'Ford F-750', type: 'Truck', maxLoadCapacityKg: 8000, odometerKm: 42000, acquisitionCost: 65000, status: VEHICLE_STATUS.AVAILABLE, region: 'North' },
    { registrationNumber: 'TRK-1002', name: 'Volvo FH16', type: 'Truck', maxLoadCapacityKg: 12000, odometerKm: 88000, acquisitionCost: 95000, status: VEHICLE_STATUS.ON_TRIP, region: 'South' },
    { registrationNumber: 'VAN-2001', name: 'Mercedes Sprinter', type: 'Van', maxLoadCapacityKg: 1500, odometerKm: 21000, acquisitionCost: 38000, status: VEHICLE_STATUS.AVAILABLE, region: 'East' },
    { registrationNumber: 'VAN-2002', name: 'Ford Transit', type: 'Van', maxLoadCapacityKg: 1200, odometerKm: 55000, acquisitionCost: 32000, status: VEHICLE_STATUS.IN_SHOP, region: 'West' },
    { registrationNumber: 'BUS-3001', name: 'Blue Bird Vision', type: 'Bus', maxLoadCapacityKg: 4000, odometerKm: 63000, acquisitionCost: 110000, status: VEHICLE_STATUS.AVAILABLE, region: 'North' },
    { registrationNumber: 'CAR-4001', name: 'Toyota Corolla', type: 'Car', maxLoadCapacityKg: 400, odometerKm: 30000, acquisitionCost: 21000, status: VEHICLE_STATUS.RETIRED, region: 'South' },
    { registrationNumber: 'TRL-5001', name: 'Great Dane Trailer', type: 'Trailer', maxLoadCapacityKg: 20000, odometerKm: 15000, acquisitionCost: 45000, status: VEHICLE_STATUS.AVAILABLE, region: 'East' },
  ]);
  console.log(`Created ${vehicles.length} vehicles.`);
  const [truck1, truck2, van1, van2, bus1, , trailer1] = vehicles;

  console.log('Creating drivers...');
  const drivers = await Driver.bulkCreate([
    { name: 'Diego Ruiz', licenseNumber: 'LIC-0001', licenseCategory: 'HGV', licenseExpiryDate: daysFromNow(400), contactNumber: '+1-555-0101', email: 'driver@transitops.demo', safetyScore: 92, status: DRIVER_STATUS.ON_TRIP },
    { name: 'Priya Nair', licenseNumber: 'LIC-0002', licenseCategory: 'HMV', licenseExpiryDate: daysFromNow(180), contactNumber: '+1-555-0102', email: 'priya.demo@transitops.demo', safetyScore: 88, status: DRIVER_STATUS.AVAILABLE },
    { name: 'Marcus Webb', licenseNumber: 'LIC-0003', licenseCategory: 'LMV', licenseExpiryDate: daysFromNow(15), contactNumber: '+1-555-0103', email: 'marcus.demo@transitops.demo', safetyScore: 76, status: DRIVER_STATUS.AVAILABLE },
    { name: 'Elena Kovac', licenseNumber: 'LIC-0004', licenseCategory: 'PSV', licenseExpiryDate: daysFromNow(-10), contactNumber: '+1-555-0104', email: 'elena.demo@transitops.demo', safetyScore: 81, status: DRIVER_STATUS.AVAILABLE },
    { name: 'Tomás Alvarez', licenseNumber: 'LIC-0005', licenseCategory: 'HGV', licenseExpiryDate: daysFromNow(300), contactNumber: '+1-555-0105', email: 'tomas.demo@transitops.demo', safetyScore: 95, status: DRIVER_STATUS.OFF_DUTY },
    { name: 'Grace Owusu', licenseNumber: 'LIC-0006', licenseCategory: 'HMV', licenseExpiryDate: daysFromNow(250), contactNumber: '+1-555-0106', email: 'grace.demo@transitops.demo', safetyScore: 60, status: DRIVER_STATUS.SUSPENDED },
  ]);
  console.log(`Created ${drivers.length} drivers.`);
  const [driver1, driver2, driver3, , driver5] = drivers;

  // Link the Driver-role login to its Driver record.
  await User.update({ driverId: driver1._id }, { where: { email: 'driver@transitops.demo' } });

  console.log('Creating trips (one per lifecycle state)...');
  await Trip.bulkCreate([
    {
      source: 'Chicago, IL', destination: 'Detroit, MI', vehicleId: truck2._id, driverId: driver1._id,
      cargoWeightKg: 9500, plannedDistanceKm: 450, revenue: 2200, status: TRIP_STATUS.DISPATCHED,
      dispatchedAt: new Date(), createdBy: users[0]._id,
    },
    {
      source: 'Boston, MA', destination: 'New York, NY', vehicleId: van1._id, driverId: driver2._id,
      cargoWeightKg: 900, plannedDistanceKm: 340, revenue: 900, status: TRIP_STATUS.DRAFT,
      createdBy: users[0]._id,
    },
    {
      source: 'Dallas, TX', destination: 'Houston, TX', vehicleId: bus1._id, driverId: driver5._id,
      cargoWeightKg: 2000, plannedDistanceKm: 380, actualDistanceKm: 392, revenue: 1800,
      status: TRIP_STATUS.COMPLETED, dispatchedAt: daysFromNow(-6), completedAt: daysFromNow(-5),
      createdBy: users[0]._id,
    },
    {
      source: 'Seattle, WA', destination: 'Portland, OR', vehicleId: trailer1._id, driverId: driver2._id,
      cargoWeightKg: 18000, plannedDistanceKm: 280, actualDistanceKm: 275, revenue: 3100,
      status: TRIP_STATUS.COMPLETED, dispatchedAt: daysFromNow(-12), completedAt: daysFromNow(-11),
      createdBy: users[0]._id,
    },
    {
      source: 'Miami, FL', destination: 'Orlando, FL', vehicleId: van1._id, driverId: driver3._id,
      cargoWeightKg: 700, plannedDistanceKm: 380, revenue: 1100, status: TRIP_STATUS.CANCELLED,
      cancelledAt: daysFromNow(-2), createdBy: users[0]._id,
    },
  ]);

  console.log('Creating maintenance records...');
  await MaintenanceLog.bulkCreate([
    { vehicleId: van2._id, description: 'Transmission repair', cost: 1800, startDate: daysFromNow(-3), status: MAINTENANCE_STATUS.ACTIVE, createdBy: users[0]._id },
    { vehicleId: truck1._id, description: 'Routine service + oil change', cost: 320, startDate: daysFromNow(-30), endDate: daysFromNow(-28), status: MAINTENANCE_STATUS.COMPLETED, createdBy: users[0]._id },
    { vehicleId: bus1._id, description: 'Brake pad replacement', cost: 540, startDate: daysFromNow(-20), endDate: daysFromNow(-19), status: MAINTENANCE_STATUS.COMPLETED, createdBy: users[0]._id },
  ]);

  console.log('Creating fuel logs...');
  await FuelLog.bulkCreate([
    { vehicleId: truck2._id, liters: 180, cost: 320, date: daysFromNow(-6), odometerKm: 87500, createdBy: users[0]._id },
    { vehicleId: truck2._id, liters: 150, cost: 275, date: daysFromNow(-1), odometerKm: 88000, createdBy: users[0]._id },
    { vehicleId: bus1._id, liters: 90, cost: 165, date: daysFromNow(-6), odometerKm: 62800, createdBy: users[0]._id },
    { vehicleId: trailer1._id, liters: 210, cost: 390, date: daysFromNow(-12), odometerKm: 14700, createdBy: users[0]._id },
    { vehicleId: van1._id, liters: 40, cost: 78, date: daysFromNow(-15), odometerKm: 20800, createdBy: users[0]._id },
  ]);

  console.log('Creating expenses...');
  await Expense.bulkCreate([
    { vehicleId: truck2._id, category: 'Toll', amount: 45, date: daysFromNow(-6), notes: 'I-94 tolls', createdBy: users[0]._id },
    { vehicleId: bus1._id, category: 'Permit', amount: 120, date: daysFromNow(-20), notes: 'Annual route permit', createdBy: users[0]._id },
    { vehicleId: trailer1._id, category: 'Insurance', amount: 500, date: daysFromNow(-30), createdBy: users[0]._id },
    { vehicleId: null, category: 'Other', amount: 75, date: daysFromNow(-2), notes: 'Office fleet-tracking software subscription', createdBy: users[0]._id },
  ]);

  console.log('\nSeed complete.');
  console.log('Demo logins (all use password:', DEMO_PASSWORD + ')');
  const roleOrder = ['FleetManager', 'SafetyOfficer', 'FinancialAnalyst', 'Driver'];
  users.forEach((u, i) => console.log(`  ${roleOrder[i].padEnd(18)} ${u.email}`));
};

// Only auto-connect/exit when run directly (`npm run seed`); allow other
// scripts (e.g. test setup) to `require` and call seed() against a
// connection they already manage.
if (require.main === module) {
  seed()
    .then(async () => {
      await sequelize.close();
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seed failed:', err);
      process.exit(1);
    });
}

module.exports = seed;
