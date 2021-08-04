'use strict'

const users = require('./app/users')
const auth = require('./auth')
const consumers = require('./app/consumers')
const producers = require('./app/producers')

module.exports = function (app) {

  // patent level routes
  app.use('/api/consumers', consumers)
  app.use('/api/producers', producers)
  app.use('/api/users', users)
  app.use('/auth', auth)
}
