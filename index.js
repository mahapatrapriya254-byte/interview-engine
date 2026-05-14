require('dotenv').config();
const express = require('express');
const app = express();

app.use(express.json());
app.use('/api/interview', require('./api/interview_routes'));
app.use(express.static('public'));
app.get('/', (req, res) => {
  res.json({ status: 'Interview Engine Running' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Interview Engine running on port ' + PORT);
});