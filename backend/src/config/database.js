const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'transitops',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    dialect: 'mysql',
    logging: false,
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
