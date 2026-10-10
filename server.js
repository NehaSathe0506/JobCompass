// JobCompass - main server file
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const resources = require('./routes/resources');

const app = express();

app.use(cors());
app.use(express.json());                                  // parse JSON request bodies
app.use(express.static(path.join(__dirname, 'public')));  // serve the frontend (next step)

// API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/companies', require('./routes/companies'));
app.use('/api/applications', require('./routes/applications'));
app.use('/api/deadlines', resources.deadlines);
app.use('/api/follow-ups', resources.followUps);
app.use('/api/interviews', resources.interviews);
app.use('/api/dashboard', require('./routes/dashboard'));

// Unknown API routes
app.use('/api', (req, res) => res.status(404).json({ message: 'Route not found.' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`JobCompass running at http://localhost:${PORT}`));
