const redisClient = require('../lib/redis').client()
const Consumer = require('../app/consumers/consumer.model')
const Expirable = require('../lib/expirable')
const co = require('co')
const worker = require('./worker')

const messageDependencyMap = new Expirable()
const dependentsMap = new Expirable()

let isPollingActive = false

/**
 * Private Function to get the subscribers by topic
 *
 * @param topic
 */
const _getSubscribersByTopic = function (topic) {

   return Consumer.find({
    topic: topic
  })
}


/**
 * Private Function to create message dependency
 *
 * @param userId
 * @param messageId
 * @param dependees
 */
const _createMessageDependency = function (userId, messageId, dependees) {

  let dependency = {}

  if(dependees.length === 0) {

    dependees = []
    dependency = null
  }
  // create a map of the dependees of the consumer
  for(let i = 0; i < dependees.length; i++) {

    dependency[dependees[i]] = false
    // create a map for the dependent relationship
    _createDependentsMap(dependees[i], userId)
  }

  messageDependencyMap.set(userId + '_' + messageId, {
    dependency: dependency,
    isLocked: false
  })
}


/**
 * Private Function to create dependents map
 *
 * @param dependee
 * @param dependent
 */
const _createDependentsMap = function (dependee, dependent) {

  if(dependentsMap.has(dependee)) {

    const dependents = dependentsMap.get(dependee)
    dependents.push(dependent)
    dependentsMap.set(dependee, dependents)
  } else {

    dependentsMap.set(dependee,[dependent])
  }
}

/**
 * Function to publish to consumers
 */
const publishToConsumers = async function () {

  try {
    let listElement =  await redisClient.multi().lindex('messages', 0).execAsync()

    listElement = JSON.parse(listElement[0])

    const subscribers = await _getSubscribersByTopic(listElement.topic)

    const multi = redisClient.multi()

    multi.lpop('messages')

    // for all the subscribers, remove the message from the MESSAGES list and add to the corresponding consumers list using redis transactions
    for (let i = 0; i < subscribers.length; i++) {

      _createMessageDependency(subscribers[i].user, listElement._id, subscribers[i].dependency)
      listElement.consumer = subscribers[i].user
      listElement.callback_url = subscribers[i].callback_url
      multi.rpush('consumer_' + subscribers[i].user, JSON.stringify(listElement))
    }

    await multi.execAsync()
    worker.workerInit(redisClient, messageDependencyMap, dependentsMap)
  } catch (err) {
    console.log(err)
  }
}

/**
 * Function to poll message from queue
 */
const pollMessageFromQueue = async function () {
  // if polling is already active return
  if(isPollingActive) {
    return
  }

  isPollingActive = true
  let listLength = await redisClient.multi().llen('messages').execAsync()

  // precess the list messages one by one
  while (listLength[0] > 0) {

    await publishToConsumers()
    listLength = await redisClient.multi().llen('messages').execAsync()
  }
  isPollingActive = false
}

module.exports = {
  pollMessageFromQueue
}
