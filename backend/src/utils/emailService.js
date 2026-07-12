const nodemailer = require('nodemailer');
const { EmailLog } = require('../models');

let transporter = null;
const isConfigured = () => Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

const getTransporter = () => {
  if (!isConfigured()) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transporter;
};

// Sends an email if SMTP credentials are configured; otherwise simulates the
// send (logs to console + EmailLog) so the reminder feature is fully
// demoable without real SMTP infrastructure.
const sendEmail = async ({ to, subject, body, relatedDriver = null }) => {
  const t = getTransporter();
  const relatedDriverId = relatedDriver;

  if (!t) {
    console.log(`[email:simulated] to=${to} subject="${subject}"\n${body}`);
    await EmailLog.create({ to, subject, body, relatedDriverId, status: 'simulated' });
    return { simulated: true };
  }

  try {
    await t.sendMail({
      from: process.env.SMTP_FROM || 'TransitOps <no-reply@transitops.local>',
      to,
      subject,
      text: body,
    });
    await EmailLog.create({ to, subject, body, relatedDriverId, status: 'sent' });
    return { simulated: false };
  } catch (err) {
    await EmailLog.create({ to, subject, body, relatedDriverId, status: 'failed', error: err.message });
    throw err;
  }
};

module.exports = { sendEmail, isConfigured };
