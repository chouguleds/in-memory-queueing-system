const redisClient = require('../lib/redis').client()
const subscribeClient = require('../lib/redis').getSubscribeClient()
const controller = require('./queue.controller')
const co = require('co')
const queueConfig = require('./config')
subscribeClient.subscribe('new message')

// when a message is added to the messages queue, worker will poll the message and to the consumers list
subscribeClient.on("message", function (channel) {

  if(channel === 'new message') {

    co.wrap(controller.pollMessageFromQueue)()
  }
})

/**
 * Function to message to queue
 *
 * @param message
 */
const add = async function (message) {


 const listLength = await redisClient.multi().llen('messages').execAsync()
  // if the length of the list if full, then return error
 if(listLength >= queueConfig.QUEUE_LENGTH){
   return false
 }
 message = JSON.stringify(message)
  // add message to the messages list and publish new message event
 await redisClient.multi()
  .rpush(['messages', message])
  .publish("new message", message)
  .execAsync()

  return true
}

module.exports = {
  add: add
}