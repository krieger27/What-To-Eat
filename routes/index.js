const express = require('express');
const router = express.Router();
const restaurantCtrl = require('../controllers/restaurantCtrl');

router.get('/', restaurantCtrl.homePage);

module.exports = router;
