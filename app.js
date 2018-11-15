var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const webpush = require('web-push');
const cors = require('cors');
var indexRouter = require('./routes/index');
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/webpsuh');

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection err'));
db.once('open', ()=>console.log('db connected!'));

var app = express();
//public key:BK7FWRVICmo3XAYQZGmnAnTpwDKqE5-vY1IAmJnGrvBM4_GkmNaUzbXxooc3Ei3NLmwAVOZ6UDcdc815vli2o6Q
// privateKey: 2E-JdOfYISbcVNLP6bQBOx79YEQz_gTfGIfgnoGUN0g
// const vapidKeys = webpush.generateVAPIDKeys();
// console.log(vapidKeys.publicKey, vapidKeys.privateKey);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
