const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Rotas de autenticação
router.post('/login', authController.login);
router.post('/register', authController.register);

// Rotas para desenvolvimento apenas
if (process.env.NODE_ENV === 'development') {
  router.post('/reset-password', authController.resetPassword);
  router.post('/force-reset', authController.forceResetPassword);
}

module.exports = router;