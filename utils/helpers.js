const { v4: uuidv4 } = require('uuid');

const generateSessionId = () => 'session_' + uuidv4();
const timestamp = () => new Date().toISOString();

module.exports = { generateSessionId, timestamp };