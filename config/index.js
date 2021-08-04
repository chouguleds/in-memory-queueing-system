'use strict'

const _ = require('lodash')

const environment = process.env.NODE_ENV || 'development'

const all = {
  userRoles: ['user', 'admin']
}

module.exports = _.merge(all, require('./environment/' + environment + '.js') || {})
