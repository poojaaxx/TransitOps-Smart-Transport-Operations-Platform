const { Sequelize } = require('sequelize');

// Managed MySQL providers (Aiven, PlanetScale, etc.) require TLS and present
// a cert not in Node's default trust store. Toggle via DB_SSL=true rather
// than assuming - local dev MySQL has no TLS listener at all.
const useSSL = process.env.DB_SSL === 'true';

const sequelize = new Sequelize(
  process.env.DB_NAME || 'transitops',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    dialect: 'mysql',
    logging: false,
    dialectOptions: useSSL ? { ssl: { rejectUnauthorized: false } } : {},
  }
);

// Verifies the connection and ensures tables exist. Non-destructive — safe
// to call on every server start. `npm run seed` handles a full reset.
const connectDB = async () => {
  await sequelize.authenticate();
  await sequelize.sync();
  console.log(`MySQL connected: ${process.env.DB_HOST || 'localhost'}/${process.env.DB_NAME || 'transitops'}`);
};

module.exports = { sequelize, connectDB };
