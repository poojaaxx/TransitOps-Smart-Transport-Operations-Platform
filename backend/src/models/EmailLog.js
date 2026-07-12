const mongoose = require('mongoose');

// Records every reminder email the system generates. When SMTP credentials
// are not configured, sending is simulated and still logged here so the
// feature is fully demoable without real email infra.
const emailLogSchema = new mongoose.Schema(
  {
    to: { type: String, required: true },
    subject: { type: String, required: true },
    body: { type: String, required: true },
    relatedDriver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', default: null },
    status: { type: String, enum: ['sent', 'simulated', 'failed'], required: true },
    error: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('EmailLog', emailLogSchema);
