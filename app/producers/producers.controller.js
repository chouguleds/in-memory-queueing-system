'use strict'

const queue = require('../../queue/queue')
const uuid = require('uuid')

/**
 * Function to publish the content
 *
 * @param req
 * @param res
 */
const publish = async function (req, res) {

  req.body._id = uuid.v1()
  req.body.producer = req.user.email
  const success = await queue.add(req.body)

  if(success) {
    return res.status(200).json({
      success: true,
      message: 'Published.'
    })
  } else {
    return res.status(500).json({
      success: false,
      message: 'Queue length full.'
    })
  }
}

module.exports = {
  publish: publish
}
