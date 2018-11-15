var express = require('express');
var router = express.Router();
var publicKey = `BK7FWRVICmo3XAYQZGmnAnTpwDKqE5-vY1IAmJnGrvBM4_GkmNaUzbXxooc3Ei3NLmwAVOZ6UDcdc815vli2o6Q`;
const webpush = require('web-push');

let fcmAPIKey = "AIzaSyDOrDDTfem4JIQ9IvnO21MwBihKF7NwiHk";
let privateKey = "2E-JdOfYISbcVNLP6bQBOx79YEQz_gTfGIfgnoGUN0g";

const _ = require('lodash');
var mongoose = require('mongoose');

var userSchema = new mongoose.Schema({
  endpoint: String,
  p256dh: String,
  auth: String,
  group: String,
  device: String,
  active: Date,
  lastSession: Date
});

var User = mongoose.model('User', userSchema);

/**
 * @description Query usrs via group
 */

router.get('/users/', function(req, res, next){
  let group = req.query.group;  
  let page = req.query.page;  
  if(_.isUndefined(group) || _.isUndefined(page)){
    return res.jons(resp(200, 'invalid params'));
  }

  User.find(groupForQuery(group)).sort({active: -1}).limit(10).skip((page-1) * 10).exec((err, user)=>{
    if(err) return ;
    return res.json(resp(200, user))
  })
});

/**
 * @description Setting group for users
 */
router.post('/group', function(req, res, next){

  if(_.isUndefined(req.body.group) || !_.isArray(req.body.users)){
    return res.json(resp('400', 'invalid params'));
  }

  req.body.users.forEach(user=>{
      User.findOneAndUpdate({_id:user.id}, {group: req.body.group}, function(err, res){
          if(err) return;
      })
  })
  
  res.json(resp(200, 'success'));
})

router.post('/push/:group', function (req, res, next) {

  let group = req.params.group;
  let content = req.body;

  if (!checkPushContent(group, content)) {
    return res.json(
      resp('400', 'invalid params')
    )
  }

  User.find(groupForQuery(group), function(err, user){
      if(err) return console.err(err);
      notificationPush(user, content);
      res.json(resp('200', 'success'))
    })
})

router.post('/users', function (req, res, next) {

  if (!checkUserParams(req.body)) {
    res.status(400);
    return res.send('invalid params');
  }

  var userSchema = new User({
    endpoint: req.body.endpoint,
    p256dh: req.body.keys.p256dh,
    auth: req.body.keys.auth,
    active: req.body.ts,
    device: `${req.body.platform}(${getChromeVersion(req.body.ua)})`,
    group: 'general'
  });

  userSchema.save(function (err, res) {
    if (err) return console.error(err);
  });

  res.json(resp('200', 'success'));
});

function checkUserParams(params) {
  return typeof params.endpoint !== 'undefined' && typeof params.keys.auth !== 'undefined' &&
    typeof params.keys.p256dh !== 'undefined' && typeof params.ua !== 'undefined' && typeof params.platform !== 'undefined' && typeof params.ts !== 'undefined'
}

function getChromeVersion(ua) {
  var raw = ua.match(/Chrom(e|ium)\/([0-9]+)\./);
  return raw ? parseInt(raw[2], 10) : false;
}

function resp(status, message) {
  return {
    status,
    message
  }
}

function checkPushContent(group, content) {
  if (typeof group !== 'undefined' && typeof content.title !== 'undefined' &&
    content.body !== 'undefined' && content.data.url !== 'undefined') {
    return true;
  }
  return false;
}

function groupForQuery(group){
  let condition = {};
  if(group !== 'general'){
    condition.group = group;
  }
  return condition;
}

function notificationPush(user, content) {

  webpush.setVapidDetails(
    'mailto:evlefsp@gmail.com',
    publicKey,
    privateKey
  );

  user.forEach(u => {
    const pushSubscription = {
      "endpoint": u.endpoint,
      "expirationTime": null,
      "keys": {
        "p256dh": u.p256dh,
        "auth": u.auth
      }
    }

    webpush.sendNotification(pushSubscription, JSON.stringify(content)).catch(e=>console.log(e));
  })
}

module.exports = router;