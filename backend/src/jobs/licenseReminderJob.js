const cron = require('node-cron');
const Driver = require('../models/Driver');
const { sendEmail } = require('../utils/emailService');

const REMINDER_WINDOW_DAYS = 30;
// Don't re-notify the same driver more than once every 7 days.
const RENOTIFY_AFTER_DAYS = 7;

// Finds drivers whose license expires within REMINDER_WINDOW_DAYS (or has
// already expired) and sends/simulates a reminder email for each one that
// hasn't been notified recently.
const runLicenseExpiryCheck = async () => {
  const windowEnd = new Date();
  windowEnd.setDate(windowEnd.getDate() + REMINDER_WINDOW_DAYS);

  const renotifyThreshold = new Date();
  renotifyThreshold.setDate(renotifyThreshold.getDate() - RENOTIFY_AFTER_DAYS);

  const candidates = await Driver.find({
    licenseExpiryDate: { $lte: windowEnd },
    $or: [{ expiryReminderSentAt: null }, { expiryReminderSentAt: { $lte: renotifyThreshold } }],
  });

  const results = [];
  for (const driver of candidates) {
    if (!driver.email) {
      results.push({ driver: driver.name, skipped: 'no email on file' });
      continue;
    }

    const isExpired = driver.licenseExpiryDate < new Date();
    const subject = isExpired
      ? `URGENT: License expired for ${driver.name}`
      : `Reminder: License expiring soon for ${driver.name}`;
    const body = isExpired
      ? `${driver.name}'s driving license (${driver.licenseNumber}) expired on ${driver.licenseExpiryDate.toDateString()}. They cannot be assigned to trips until this is renewed.`
      : `${driver.name}'s driving license (${driver.licenseNumber}) expires on ${driver.licenseExpiryDate.toDateString()}. Please renew it soon to avoid a dispatch interruption.`;

    // eslint-disable-next-line no-await-in-loop
    const outcome = await sendEmail({ to: driver.email, subject, body, relatedDriver: driver._id });
    driver.expiryReminderSentAt = new Date();
    // eslint-disable-next-line no-await-in-loop
    await driver.save();
    results.push({ driver: driver.name, email: driver.email, simulated: outcome.simulated });
  }

  return results;
};

// Runs once a day at 07:00 server time.
const scheduleLicenseReminderJob = () => {
  cron.schedule('0 7 * * *', () => {
    runLicenseExpiryCheck().catch((err) => console.error('License reminder job failed:', err));
  });
};

module.exports = { runLicenseExpiryCheck, scheduleLicenseReminderJob };
