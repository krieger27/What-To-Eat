require('dotenv').config({ path: __dirname + '/../variables.env' });
const fs = require('fs');

const mongoose = require('mongoose');
mongoose.connect(process.env.DATABASE);
mongoose.Promise = global.Promise; // need for ES6 promises

const Restaurant = require('../models/Restaurant');

const restaurants = JSON.parse(fs.readFileSync(__dirname + '/restaurants.json', 'utf-8'));


async function deleteData() {
  console.log('Deleted Data...');
  await Restaurant.remove();
  console.log('Data Deleted. To load sample data, run\n\n\t npm run sample\n\n');
  process.exit();
}

async function loadData() {
  try {
    await Restaurant.insertMany(restaurants);
    console.log('Complete!');
    process.exit();
  } catch(e) {
    console.log('\nError! The Error info is below but if you are importing sample data make sure to drop the existing database first with.\n\n\t npm run blowitallaway\n\n\n');
    console.log(e);
    process.exit();
  }
}
if (process.argv.includes('--delete')) {
  deleteData();
} else {
  loadData();
}
