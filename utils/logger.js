const fs = require('fs');
const path = require('path');

const saveSession = (sessionId, data) => {
  const filePath = path.join(__dirname, '../logs/sessions', sessionId + '.json');
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log('[Logger] Session saved: ' + filePath);
};

const loadSession = (sessionId) => {
  const filePath = path.join(__dirname, '../logs/sessions', sessionId + '.json');
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
};

module.exports = { saveSession, loadSession };