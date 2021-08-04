'use strict'

const express = require('express')
const router = express.Router()
const controller = require('./producers.controller')
const validator = require('../../lib/validator')
const publishValidationSchema = require('./producers.validation')
const auth = require('../../auth/auth.service.js')

router.post('/publish', validator(publishValidationSchema.publish), auth.isAuthenticated(), controller.publish)

module.exports = router
