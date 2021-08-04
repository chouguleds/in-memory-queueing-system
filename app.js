'use strict'

// express initialization
const express = require('express')
const app = express()
const config = require('./config')
const mongo = require('./lib/mongo')
const redis = require('./lib/redis')

// configure express
require('./config/express')(app)
// register routes on the app

let server = null

mongo.init()
  .then(function () {
    return redis.init()
  })
  .then(function () {
    // start the server
    require('./routes')(app)
    server = app.listen(config.port, function () {

      console.log('server started on port ' + config.port)
    })
  })

module.exports = server
