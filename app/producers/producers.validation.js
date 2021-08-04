'use strict'

const joi = require('joi')

module.exports = {
  publish: joi.object().keys({


    topic: joi.string().required(),
    content: joi.string().required()
  })
}
