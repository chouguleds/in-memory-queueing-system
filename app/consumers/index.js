'use strict'

const express = require('express')
const router = express.Router()
const controller = require('./consumer.controller.js')
const validator = require('../../lib/validator')
const consumerValidationSchema = require('./consumer.validation.js')
const auth = require('../../auth/auth.service.js')

router.post('/subscribe', validator(consumerValidationSchema.subscribe), auth.isAuthenticated(), controller.subscribe)
router.post('/addDependency', validator(consumerValidationSchema.dependency), auth.hasRole('admin'), controller.addDependency)


module.exports = router
