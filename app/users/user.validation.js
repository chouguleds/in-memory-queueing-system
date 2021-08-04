'use strict'

const joi = require('joi')

module.exports = {
  create: joi.object().keys({

    email: joi.string().email().required(),
    password: joi.string().min(3).required(),
    name: joi.string().required(),
    role: joi.string()
  })
}
