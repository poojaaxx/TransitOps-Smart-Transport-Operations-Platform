const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database');

const User = sequelize.define(
  'User',
  {
    _id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
      set(value) {
        this.setDataValue('email', value.toLowerCase().trim());
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { len: [6, 255] },
    },
    roleId: { type: DataTypes.INTEGER, allowNull: false },
    driverId: { type: DataTypes.INTEGER, allowNull: true },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  { tableName: 'users', timestamps: true }
);

User.beforeSave(async (user) => {
  if (!user.changed('password')) return;
  user.password = await bcrypt.hash(user.password, 10);
});

User.prototype.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Flattens the joined Role into a plain `role` string (matching the old
// Mongoose enum-string shape) and strips internal FK/association fields so
// the frontend never has to change how it reads `user.role`.
User.prototype.toSafeObject = function toSafeObject() {
  const obj = this.toJSON();
  delete obj.password;
  if (this.RoleRef) {
    obj.role = this.RoleRef.name;
  }
  delete obj.RoleRef;
  delete obj.roleId;
  return obj;
};

module.exports = User;
