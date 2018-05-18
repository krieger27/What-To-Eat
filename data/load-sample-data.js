require('dotenv').config({ path: __dirname + '/../variables.env' });
const fs = require('fs');

const mongoose = require('mongoose');
mongoose.connect(process.env.DATABASE);
mongoose.Promise = global.Promise; // Tell Mongoose to use ES6 promises


const Restaurant = require('../models/Restaurant');
const Review = require('../models/Review');
const User = require('../models/User');


const restaurants = JSON.parse(fs.readFileSync(__dirname + '/restaurants.json', 'utf-8'));
const reviews = JSON.parse(fs.readFileSync(__dirname + '/reviews.json', 'utf-8'));
const users = JSON.parse(fs.readFileSync(__dirname + '/users.json', 'utf-8'));

async function deleteData() {
  console.log('Destroyed it ALL..on purpose.');
  await Restaurant.remove();
  await Review.remove();
  await User.remove();
  console.log('Data Deleted. To load sample data, run\n\n\t npm run sample\n\n');
  process.exit();
}

async function loadData() {
  try {
    await Restaurant.insertMany(restaurants);
    await Review.insertMany(reviews);
    await User.insertMany(users);
    console.log('Loaded all the data!');
    process.exit();
  } catch(e) {
    console.log('\n Error! The Error info is below but if you are importing sample data make sure to drop the existing database first with.\n\n\t npm run blowitallaway\n\n\n');
    console.log(e);
    process.exit();
  }
}
if (process.argv.includes('--delete')) {
  deleteData();
} else {
  loadData();
}
