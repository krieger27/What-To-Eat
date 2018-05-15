const express = require('express');
const router = express.Router();
const restaurantCtrl = require('../controllers/restaurantCtrl');
const { catchErrors } = require('../handlers/errorHandlers');

router.get('/', restaurantCtrl.homePage);
router.get('/add', restaurantController.addRestaurant);
router.post('/add', catchErrors(storeController.createRestaurant));

module.exports = router;
