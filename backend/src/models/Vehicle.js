const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { VEHICLE_STATUS } = require('../utils/constants');

const Vehicle = sequelize.define(
  'Vehicle',
  {
    _id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    registrationNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      set(value) {
        this.setDataValue('registrationNumber', value.toUpperCase().trim());
      },
    },
    name: { type: DataTypes.STRING, allowNull: false },
    type: {
      type: DataTypes.ENUM('Truck', 'Van', 'Bus', 'Car', 'Trailer', 'Other'),
      allowNull: false,
    },
    maxLoadCapacityKg: { type: DataTypes.FLOAT, allowNull: false, validate: { min: 0 } },
    odometerKm: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0, validate: { min: 0 } },
    acquisitionCost: { type: DataTypes.FLOAT, allowNull: false, validate: { min: 0 } },
    status: {
      type: DataTypes.ENUM(...Object.values(VEHICLE_STATUS)),
      defaultValue: VEHICLE_STATUS.AVAILABLE,
    },
    region: { type: DataTypes.STRING, defaultValue: 'Unassigned' },
  },
  { tableName: 'vehicles', timestamps: true }
);

module.exports = Vehicle;
