'use strict'

const express = require('express')
const authService = require('../auth.service')
const User = require('../../app/users/users.model.js')

const router = express.Router()

// login api
router.post('/', async function (req, res) {

  // find if user present or not
  let user = null
  try {

    user = await User.findOne({
      email: req.body.email
    })
  } catch (err) {

    return res.status(500).json({
      success: false,
      message: 'internal server error'
    })
  }

  if (user === null) {

    return res.status(404).json({
      success: false,
      message: 'invalid user email'
    })
  }
  // authenticate user password
  if (!user.authenticate(req.body.password)) {

    return res.status(401).send({

      message: 'invalid password'
    })
  }
  // sign token with user's _id
  const token = await authService.signToken(user._id)
  res.status(200).json({
    success: true,
    message: 'login success.',
    token: token
  })
})

module.exports = router
