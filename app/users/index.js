'use strict'

const express = require('express')
const router = express.Router()
const controller = require('./users.controller.js')
const validator = require('../../lib/validator')
const userValidationSchema = require('./user.validation.js')

router.post('/create', validator(userValidationSchema.create), controller.create)

module.exports = router
