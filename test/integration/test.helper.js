'use strict'

const jwt = require('jwt-then')
const config = require('../../config/index')

const _signToken = function (id) {

  return jwt.sign({
    _id: id
  }, config.secrets.session, {
    expiresIn: 60 * 60 * 10
  })
}

const getToken = async function (userId) {

  const token = await _signToken(userId)
  return token
}
module.exports = {
  getToken
}
