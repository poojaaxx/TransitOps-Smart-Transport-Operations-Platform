const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { ROLE_LIST } = require('../utils/constants');

const Role = sequelize.define(
  'Role',
  {
    _id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: {
      type: DataTypes.ENUM(...ROLE_LIST),
      allowNull: false,
      unique: true,
    },
  },
  { tableName: 'roles', timestamps: true }
);

module.exports = Role;
