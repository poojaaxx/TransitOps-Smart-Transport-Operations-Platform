const { sequelize } = require('../config/database');
const Role = require('./Role');
const User = require('./User');
const Vehicle = require('./Vehicle');
const VehicleDocument = require('./VehicleDocument');
const Driver = require('./Driver');
const Trip = require('./Trip');
const MaintenanceLog = require('./MaintenanceLog');
const FuelLog = require('./FuelLog');
const Expense = require('./Expense');
const EmailLog = require('./EmailLog');

// User <-> Role (alias 'RoleRef' to avoid colliding with the plain `role`
// string that controllers flatten onto API responses for frontend parity).
User.belongsTo(Role, { foreignKey: 'roleId', as: 'RoleRef' });
Role.hasMany(User, { foreignKey: 'roleId', as: 'users' });

// User <-> Driver (links a Driver-role login to their Driver record).
User.belongsTo(Driver, { foreignKey: 'driverId', as: 'driver' });

// Vehicle <-> VehicleDocument
Vehicle.hasMany(VehicleDocument, { foreignKey: 'vehicleId', as: 'documents', onDelete: 'CASCADE' });
VehicleDocument.belongsTo(Vehicle, { foreignKey: 'vehicleId' });

// Trip <-> Vehicle / Driver / User(creator)
Trip.belongsTo(Vehicle, { foreignKey: 'vehicleId', as: 'vehicle' });
Vehicle.hasMany(Trip, { foreignKey: 'vehicleId', as: 'trips' });
Trip.belongsTo(Driver, { foreignKey: 'driverId', as: 'driver' });
Driver.hasMany(Trip, { foreignKey: 'driverId', as: 'trips' });
Trip.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

// MaintenanceLog <-> Vehicle
MaintenanceLog.belongsTo(Vehicle, { foreignKey: 'vehicleId', as: 'vehicle' });
Vehicle.hasMany(MaintenanceLog, { foreignKey: 'vehicleId', as: 'maintenanceLogs' });

// FuelLog <-> Vehicle
FuelLog.belongsTo(Vehicle, { foreignKey: 'vehicleId', as: 'vehicle' });
Vehicle.hasMany(FuelLog, { foreignKey: 'vehicleId', as: 'fuelLogs' });

// Expense <-> Vehicle (nullable - fleet-wide expenses have no vehicle)
Expense.belongsTo(Vehicle, { foreignKey: 'vehicleId', as: 'vehicle' });
Vehicle.hasMany(Expense, { foreignKey: 'vehicleId', as: 'expenses' });

// EmailLog <-> Driver
EmailLog.belongsTo(Driver, { foreignKey: 'relatedDriverId', as: 'relatedDriver' });

module.exports = {
  sequelize,
  Role,
  User,
  Vehicle,
  VehicleDocument,
  Driver,
  Trip,
  MaintenanceLog,
  FuelLog,
  Expense,
  EmailLog,
};
