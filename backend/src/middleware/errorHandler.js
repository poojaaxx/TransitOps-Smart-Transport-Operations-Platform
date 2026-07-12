// Converts thrown errors (including Mongoose validation/duplicate-key errors)
// into consistent JSON responses instead of leaking stack traces to clients.
const errorHandler = (err, req, res, next) => {
  console.error(err);

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(409).json({ message: `Duplicate value for ${field}: ${JSON.stringify(err.keyValue[field])}` });
  }

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ message: messages.join('; ') });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ message: `Invalid value for ${err.path}: ${err.value}` });
  }

  const status = err.status || 500;
  res.status(status).json({ message: err.message || 'Internal server error' });
};

const notFound = (req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
};

module.exports = { errorHandler, notFound };
