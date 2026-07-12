const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Expense = sequelize.define(
  'Expense',
  {
    _id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    vehicleId: { type: DataTypes.INTEGER, allowNull: true },
    category: {
      type: DataTypes.ENUM('Toll', 'Maintenance', 'Insurance', 'Permit', 'Fine', 'Other'),
      allowNull: false,
    },
    amount: { type: DataTypes.FLOAT, allowNull: false, validate: { min: 0 } },
    date: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    notes: { type: DataTypes.TEXT, allowNull: true },
    createdBy: { type: DataTypes.INTEGER, allowNull: true },
  },
  { tableName: 'expenses', timestamps: true }
);

module.exports = Expense;
