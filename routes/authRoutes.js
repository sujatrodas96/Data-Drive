const express = require('express');
const router = express.Router();
const { register, login, logout } = require('../controller/user');
const bcrypt = require('bcryptjs');
const validate = require('../middleware/validate');
const { registerSchema, loginSchema } = require('../validations/authValidation');

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/logout', logout);

module.exports = router;




