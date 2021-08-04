/**
 * Created by akhil29 on 12/01/16.
 */
'use strict'

const redis = require('redis')
const config = require('../config')
const Promise = require('bluebird')
const mongoose = require('mongoose')

mongoose.Promise = Promise

const init = function () {

  return new Promise(function (resolve, reject) {

    // mongodb connection
    mongoose.connect(config.mongo.uri, config.mongo.options)
    mongoose.connection.on('error', function (err) {

      console.error('MongoDB connection error: ' + err)
      return reject()
    })
    mongoose.connection.on('connected', function (err) {

      return resolve()
    })
  })
}

module.exports = {
  init
}
