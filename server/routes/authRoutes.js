const express = require('express')
const router = express.Router()
const { test, registerUser, loginUser, getProfile, logoutUser, saveScore } = require('../controllers/authController')


router.get('/', test)
router.post('/register', registerUser)
router.post('/login', loginUser)
router.get('/profile', getProfile)
router.post('/logout', logoutUser)
router.post('/api/save-score', saveScore);


module.exports = router