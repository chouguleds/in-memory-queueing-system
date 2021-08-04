/**
 * Created by akhil29 on 12/01/16.
 */
'use strict'

const redis = require('redis')
const config = require('../config')
const Promise = require('bluebird')
Promise.promisifyAll(redis.RedisClient.prototype);
Promise.promisifyAll(redis.Multi.prototype);
let client
let subscribeClient

const init = function () {

  return new Promise(function (resolve, reject) {

    client = redis.createClient({
      'host': config.redis.host,
      'port': config.redis.port
    })

    subscribeClient = redis.createClient({
      'host': config.redis.host,
      'port': config.redis.port
    })

    client.on('ready', function (err) {

      return resolve()
    })
    client.on('error', function (err) {
      console.error('redis connection error: ' + err)
      return reject(err)
    })
  })
}
const getSubscribeClient = function () {

  return subscribeClient
}
const getClient = function () {
  return client
}
module.exports = {
  init,
  client: getClient,
  getSubscribeClient
}


