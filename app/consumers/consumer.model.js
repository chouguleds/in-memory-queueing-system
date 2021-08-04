'use strict'

const mongoose = require('mongoose')

const ConsumerSchema = new mongoose.Schema({

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  topic: String,
  callback_url: String,
  dependency: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'User'
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
})

module.exports = mongoose.model('Consumer', ConsumerSchema)
