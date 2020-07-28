const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth')

router.post('/login',authController.postLogin);
router.post('/signup',authController.postSignUp);
router.get('/reset/:token');
router.post('/reset',authController.postReset);
router.post('/new-password',authController.postNewPassword);

module.exports = router;