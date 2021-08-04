'use strict'

const jwt = require('jwt-then')
const config = require('../config')
const User = require('../app/users/users.model')
const compose = require('composable-middleware')

// middleware to authenticate user for every request made
const isAuthenticated = function () {

  return async function (req, res, next) {

    let token = null
    if (req.query && req.query.hasOwnProperty('access_token')) {

      token = req.query.access_token
    } else if (req.headers.authorization) {

      token = req.headers.authorization
    }

    // varify jwt using the secret used
    let decoded = null
    try {

      decoded = await jwt.verify(token, config.secrets.session)
    } catch (err) {

      return res.status(500).json({
        message: 'invalid token',
        data: err
      })
    }

    try {
      const user = await User.findById(decoded._id)
      if (!user) {
        return res.status(401).end()
      }
      req.user = user
      next()
    } catch (err) {

      next(err)
    }
  }
}

const hasRole = function (roleRequired) {

  if (!roleRequired) {
    throw new Error('Required role needs to be set')
  }

  return compose()
    .use(isAuthenticated())
    .use(function meetsRequirements (req, res, next) {

      if (config.userRoles.indexOf(req.user.role) >=
        config.userRoles.indexOf(roleRequired)) {

        next()
      } else {
        res.status(403).send('Forbidden')
      }
    })
}

// sign jwt token
const signToken = function (id) {

  return jwt.sign({
    _id: id
  }, config.secrets.session, {
    expiresIn: '30 days'
  })
}

module.exports = {
  signToken,
  isAuthenticated,
  hasRole
}
