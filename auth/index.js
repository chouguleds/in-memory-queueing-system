'use strict'

const express = require('express')
const router = express.Router()

router.use('/local', require('./local'))

module.exports = router
