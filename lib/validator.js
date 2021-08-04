'use strict'

const joi = require('joi')

/* validation middleware for express to validate the arguments being passed */
module.exports = function (schema) {

  return function (req, res, next) {

    joi.validate(req.body, schema, function (err, value) {

      if (err) {
        return res.status(500).json({
          success: false,
          message: 'invalid arguments',
          data: err
        })
      }
      req.body = value
      next()
    })
  }
}
