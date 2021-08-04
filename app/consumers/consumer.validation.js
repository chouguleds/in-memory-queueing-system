'use strict'

const joi = require('joi')

module.exports = {
  subscribe: joi.object().keys({

    topic: joi.string().required(),
    callback_url: joi.string().required()
  }),
  dependency: joi.object().keys({

    user: joi.string().required(),
    dependent_on: joi.array().required()
  })
}
