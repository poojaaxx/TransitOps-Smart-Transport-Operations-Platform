const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const VehicleDocument = sequelize.define(
  'VehicleDocument',
  {
    _id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    vehicleId: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    fileUrl: { type: DataTypes.STRING, allowNull: false },
    mimeType: { type: DataTypes.STRING, allowNull: true },
    uploadedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  { tableName: 'vehicle_documents', timestamps: true }
);

module.exports = VehicleDocument;
