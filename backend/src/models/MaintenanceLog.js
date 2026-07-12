const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { MAINTENANCE_STATUS } = require('../utils/constants');

const MaintenanceLog = sequelize.define(
  'MaintenanceLog',
  {
    _id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    vehicleId: { type: DataTypes.INTEGER, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    cost: { type: DataTypes.FLOAT, defaultValue: 0, validate: { min: 0 } },
    startDate: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    endDate: { type: DataTypes.DATE, allowNull: true, defaultValue: null },
    status: {
      type: DataTypes.ENUM(...Object.values(MAINTENANCE_STATUS)),
      defaultValue: MAINTENANCE_STATUS.ACTIVE,
    },
    createdBy: { type: DataTypes.INTEGER, allowNull: true },
  },
  { tableName: 'maintenance_logs', timestamps: true }
);

module.exports = MaintenanceLog;
