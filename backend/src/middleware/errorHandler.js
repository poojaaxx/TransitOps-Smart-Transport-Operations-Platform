// Converts thrown errors (including Sequelize validation/constraint errors)
// into consistent JSON responses instead of leaking stack traces to clients.
const errorHandler = (err, req, res, next) => {
  console.error(err);

  if (err.name === 'SequelizeUniqueConstraintError') {
    const item = err.errors?.[0];
    const field = item?.path || 'field';
    return res.status(409).json({ message: `Duplicate value for ${field}: ${JSON.stringify(item?.value)}` });
  }

  if (err.name === 'SequelizeValidationError') {
    const messages = err.errors.map((e) => e.message);
    return res.status(400).json({ message: messages.join('; ') });
  }

  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({ message: `Invalid reference: ${err.fields || err.parent?.sqlMessage || 'related record not found'}` });
  }

  if (err.name === 'SequelizeDatabaseError') {
    return res.status(400).json({ message: err.parent?.sqlMessage || err.message });
  }

  const status = err.status || 500;
  res.status(status).json({ message: err.message || 'Internal server error' });
};

const notFound = (req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
};

module.exports = { errorHandler, notFound };
