const async = require('async')
const httpUtil = require('../lib/httplUtil')
const Promise = require('bluebird')
const co = require('co')
const queueConfig = require('./config')

let lists = null
let redisClient = null
let messageDependencyMap = null

/**
 * Function to publish to subscriber
 *
 * @param url
 * @param message
 */
const publishToSubscriber = async function(url, message) {

  return new Promise(function (resolve, reject) {

    // retries in case there is failure in processing of the message
    async.retry(queueConfig.NUMBER_OF_RETRIES, async function (cb, results) {

      const options = {
        method: 'POST',
        url: url,
        data: message
      }

     const res = await httpUtil.makeRequest(options)
      if(res.status === 200) {

        cb(null, true)
      } else {
        cb(new Error("consumer error."))
      }
    }, function (err, results) {
      if(err) {
        return resolve(false)
      }
      return resolve(true)
    })
  })
}

/**
 * Function to get all consumers list

 */
const _getAllConsumersList = async function () {

  // get list of all the consumers list
  lists = await redisClient.multi()
    .keys('consumer*')
    .execAsync()
  return lists
}

/**
 * Function to get the message turn
 *
 * @param turn
 * @param listLength
 */
const _getTurn = function (turn, listLength) {

  turn += 1
  turn = turn % listLength
  return turn
}

/**
 * Function to create a worker
 *
 * @param client
 * @param messageDependencyMap
 * @param dependentsMap
 */
const _worker = async function (client, messageDependency, dependentsMap) {

  redisClient = client
  messageDependencyMap = messageDependency
  try {

    let turn = 0

    while(true) {

      // get list of all the consumers with given topic
      lists = await _getAllConsumersList()

      if(lists[0].length === 0){

        continue
      }
      // get the element from redis
      let listElement = await redisClient.multi().lindex(lists[0][turn], 0).execAsync()
      if(!listElement[0]) {

        turn = _getTurn(turn, lists[0].length)
        continue
      }
      listElement = JSON.parse(listElement)

      // get the dependency of the messages to be processed
      const message = messageDependencyMap.get(listElement.consumer + '_' + listElement._id, true)

      if(message === undefined) {

        turn = _getTurn(turn, lists[0].length)
        if(lists[0][turn])
        await redisClient.multi().lpop(lists[0][turn]).rpush(['dead_letter', listElement]).execAsync()
        continue
      }

      // if the item is locked that means some other worker is processing it
      if(message.isLocked === true) {

        turn = _getTurn(turn, lists[0].length)
        continue
      }

      // if there is dependency for the consumer then check if it is resolved
      if(message.dependency) {

        for (let property in message.dependency) {

          if (message.dependency.hasOwnProperty(property)) {

            // if the dependency is not resolved then put the message to the end of the list and move to the next consumer
            if(message.dependency[property] === false) {

              if(lists[0][turn])
              await redisClient.multi().lpop(lists[0][turn]).rpush(lists[0][turn], JSON.stringify(listElement)).execAsync()
              turn = _getTurn(turn, lists[0].length)
              continue
            }
          }
        }
      }

      // publsih the message to the client and acquire a lock on that
      message.isLocked = true
      messageDependencyMap.set(listElement.consumer + '_' + listElement._id, message, queueConfig.MESSAGE_EXPIRY)

      // send to consumer
      const res = await publishToSubscriber(listElement.callback_url, listElement)
      if (res) {

        const dependents = dependentsMap.get(listElement.consumer, true)
        // if message is sent successfully to the consumer then resolve all the consumers that were dependent on this consumer
        for(let i=0; dependents && i < dependents.length; i++){

          const record = messageDependencyMap.get(dependents[i] + '_' + listElement._id , true)
          if(record.dependency && !record.dependency[listElement.consumer]) {

            record.dependency[listElement.consumer] = true
          }
          messageDependencyMap.set(dependents[i] + '_' + listElement._id , record)
        }
        // remove the messag from the dependency map
        messageDependencyMap.remove(listElement.consumer + '_' + listElement._id)
        // remove the message from the consumer list
        if(lists[0][turn])
        await redisClient.multi().lpop(lists[0][turn]).execAsync()

      } else {

        /* if the message is not published to the consumer after specified retries then remove the message from the
          message dependency map and add the message to the dead letter queue and remove from the users list
        */
        messageDependencyMap.remove(listElement.consumer + '_' + listElement._id)
        if(lists[0][turn])
        await redisClient.multi().lpop(lists[0][turn]).rpush(['dead_letter', listElement]).execAsync()
      }
      turn = _getTurn(turn, lists[0].length)
    }
  } catch (err) {
    console.log(err)
  }
}

/**
 * Function to initialize workers
 *
 * @param client
 * @param messageDependencyMap
 * @param dependentsMap
 */
const workerInit = function (client, messageDependencyMap, dependentsMap) {

  for(let i=0; i < queueConfig.NUMBER_OF_WORKERS; i++) {

    new co.wrap(_worker)(client, messageDependencyMap, dependentsMap)
  }
}
module.exports = {
  workerInit
}