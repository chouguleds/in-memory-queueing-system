'use strict'

const Consumer = require('./consumer.model')

/**
 * Function to subscribe to the topic
 *
 * @param req
 * @param res
 */
const subscribe = async function (req, res) {

  try {
    const subscription = await Consumer.findOne({
      topic: req.body.topic,
      user: req.user._id
    })

    if(subscription !== null) {

      return res.status(200).json({
        success: true,
        message: 'already subscribed.'
      })
    }

    const newSubscription = new Consumer({
      user: req.user._id,
      topic: req.body.topic.toLowerCase(),
      callback_url: req.body.callback_url
    })

    await newSubscription.save()

    return res.status(200).json({
      success: true,
      message: 'subscribed.'
    })

  } catch (err) {

    res.status(500).json('internal server error')
  }
}


/**
 * Function to add the dependency for the consumers
 *
 * @param req
 * @param res
 */
const addDependency = async function (req, res) {

  try {

    const user = await Consumer.findOne({
      user: req.body.user
    })
    user.dependency = req.body.dependent_on
    await user.save()

    return res.status(200).json({
      success: true,
      message: 'dependency added.'
    })
  } catch (err) {

    res.status(500).json('internal server error')
  }
}

module.exports = {
  subscribe,
  addDependency
}
