const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// Records every reminder email the system generates. When SMTP credentials
// are not configured, sending is simulated and still logged here so the
// feature is fully demoable without real email infra.
const EmailLog = sequelize.define(
  'EmailLog',
  {
    _id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    to: { type: DataTypes.STRING, allowNull: false },
    subject: { type: DataTypes.STRING, allowNull: false },
    body: { type: DataTypes.TEXT, allowNull: false },
    relatedDriverId: { type: DataTypes.INTEGER, allowNull: true },
    status: { type: DataTypes.ENUM('sent', 'simulated', 'failed'), allowNull: false },
    error: { type: DataTypes.TEXT, allowNull: true },
  },
  { tableName: 'email_logs', timestamps: true }
);

module.exports = EmailLog;
