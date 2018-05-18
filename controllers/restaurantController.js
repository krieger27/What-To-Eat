const mongoose = require('mongoose');
const Restaurant = mongoose.model('Restaurant');
const User = mongoose.model('User');
const multer = require('multer');
const jimp = require('jimp');
const uuid = require('uuid');

const multerOptions = {
  storage: multer.memoryStorage(),
  fileFilter(req, file, next) {
    const isPhoto = file.mimetype.startsWith('image/');
    if(isPhoto) {
      next(null, true);
    } else {
      next({ message: 'That filetype isn\'t allowed!' }, false);
    }
  }
};

exports.homePage = (req, res) => {
  res.render('index');
};

exports.addRestaurant = (req, res) => {
  res.render('editRestaurant', { title: 'Add Restaurant' });
};

exports.upload = multer(multerOptions).single('photo');

exports.resize = async (req, res, next) => {
  if (!req.file) {
    next();
    return;
  }
  const extension = req.file.mimetype.split('/')[1];
  req.body.photo = `${uuid.v4()}.${extension}`;
  // resizing 
  const photo = await jimp.read(req.file.buffer);
  await photo.resize(800, jimp.AUTO);
  await photo.write(`./public/uploads/${req.body.photo}`);
  next();
};

exports.createRestaurant = async (req, res) => {
  req.body.author = req.user._id;
  const restaurant = await (new Restaurant(req.body)).save();
  req.flash('success', `Successfully Created ${restaurant.name}. Would you like to leave a review?`);
  res.redirect(`/restaurant/${restaurant.slug}`);
};

exports.getRestaurants = async (req, res) => {
  const page = req.params.page || 1;
  const limit = 4;
  const skip = (page * limit) - limit;

  //Database query 
  const restaurantsPromise = Restaurant
    .find()
    .skip(skip)
    .limit(limit)
    .sort({ created: 'desc' });

  const countPromise = Restaurant.count();

  const [restaurants, count] = await Promise.all([restaurantsPromise, countPromise]);
  const pages = Math.ceil(count / limit);
  if (!restaurants.length && skip) {
    req.flash('info', `Hey! You asked for page ${page}. But that doesn't exist. So I put you on page ${pages}`);
    res.redirect(`/restaurants/page/${pages}`);
    return;
  }

  res.render('restaurants', { title: 'Restaurants', restaurants, page, pages, count });
};

const confirmOwner = (restaurant, user) => {
  if (!restaurant.author.equals(user._id)) {
    throw Error('You must own a restaurant in order to edit it!');
  }
};


exports.editRestaurant = async (req, res) => {
  // 1. Find the store given the ID
  const restaurant = await Restaurant.findOne({ _id: req.params.id });
  // 2. confirm owner 
  confirmOwner(restaurant, req.user);
  // 3. Render edit form 
  res.render('editRestaurant', { title: `Edit ${restaurant.name}`, restaurant });
};

exports.updateRestaurant = async (req, res) => {
  // set the location data to be a point
  req.body.location.type = 'Point';
  // find and update the store
  const restaurant = await Restaurant.findOneAndUpdate({ _id: req.params.id }, req.body, {
    new: true, // get new store
    runValidators: true
  }).exec();
  req.flash('success', `Successfully updated <strong>${restaurant.name}</strong>. <a href="/restaurants/${restaurant.slug}">View Restaurant →</a>`);
  res.redirect(`/restaurants/${restaurant._id}/edit`);
};

exports.getRestaurantBySlug = async (req, res, next) => {
  const restaurant= await Restaurant.findOne({ slug: req.params.slug }).populate('author reviews');
  if (!restaurant) return next();
  res.render('restaurant', { restaurant, title: restaurant.name });
};

exports.getRestaurantsByTag = async (req, res) => {
  const tag = req.params.tag;
  const tagQuery = tag || { $exists: true, $ne: [] };
  const tagsPromise = Restaurant.getTagsList();
  const restaurantsPromise = Restaurant.find({ tags: tagQuery });
  const [tags, restaurants] = await Promise.all([tagsPromise, restaurantsPromise]);
  res.render('tag', { tags, title: 'Tags', tag, restaurants });
};


exports.searchRestaurants = async (req, res) => {
  const restaurants = await Restaurant
  .find({
    $text: {
      $search: req.query.q
    }
  }, {
    score: { $meta: 'textScore' }
  })
  .sort({
    score: { $meta: 'textScore' }
  })
  // only get 5 otherwise it's overkill
  .limit(5);
  res.json(restaurants);
};

exports.mapRestaurants = async (req, res) => {
  const coordinates = [req.query.lng, req.query.lat].map(parseFloat);
  const q = {
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates
        },
        $maxDistance: 10000 // 10km
      }
    }
  };

  const restaurants = await Restaurant.find(q).select('slug name description location photo').limit(10);
  res.json(restaurants);
};

exports.mapPage = (req, res) => {
  res.render('map', { title: 'Map' });
};

exports.heartRestaurant = async (req, res) => {
  const hearts = req.user.hearts.map(obj => obj.toString());

  const operator = hearts.includes(req.params.id) ? '$pull' : '$addToSet';
  const user = await User
    .findByIdAndUpdate(req.user._id,
      { [operator]: { hearts: req.params.id } },
      { new: true }
    );
  res.json(user);
};

exports.getHearts = async (req, res) => {
  const restaurants = await Restaurant.find({
    _id: { $in: req.user.hearts }
  });
  res.render('restaurants', { title: 'Hearted Restaurants', restaurants });
};

exports.getTopRestaurants = async (req, res) => {
  const restaurants = await Restaurant.getTopRestaurants();
  res.render('topRestaurants', { restaurants, title:'Top Restaurants!'});
}
