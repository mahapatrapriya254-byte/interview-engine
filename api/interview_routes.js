const express = require('express');
const router = express.Router();
const InterviewSession = require('../core/interview_session');

const sessions = {};

router.post('/start', async (req, res) => {
  try {
    const { candidateName, role } = req.body;
    const session = new InterviewSession({ candidateName, role });
    const result = session.start();
    sessions[result.sessionId] = session;
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/answer', async (req, res) => {
  try {
    const { sessionId, answer } = req.body;
    const session = sessions[sessionId];
    if (!session) return res.status(404).json({ error: 'Session not found' });
    const result = await session.answer(answer);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/status/:sessionId', (req, res) => {
  try {
    const session = sessions[req.params.sessionId];
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json(session.session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;