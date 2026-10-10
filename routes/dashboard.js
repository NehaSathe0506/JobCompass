const router = require('express').Router();
const auth = require('../middleware/auth');
const { stats } = require('../controllers/dashboardController');

router.get('/', auth, stats);

module.exports = router;
