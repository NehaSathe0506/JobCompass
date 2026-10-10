const router = require('express').Router();
const auth = require('../middleware/auth');
const c = require('../controllers/authController');

router.post('/register', c.register);
router.post('/login', c.login);
router.get('/profile', auth, c.getProfile);
router.put('/profile', auth, c.updateProfile);

module.exports = router;
