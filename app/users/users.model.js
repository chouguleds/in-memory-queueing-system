'use strict'

const mongoose = require('mongoose')
const bcrypt = require('bcrypt')

const UserSchema = new mongoose.Schema({

  name: String,
  email: {
    type: String,
    unique: {
      message: 'email must be unique.'
    }
  },
  password: String,
  role: {
    type: String,
    default: 'user'
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
})

UserSchema.methods = {

  authenticate: function (planeText) {

    return bcrypt.compareSync(planeText, this.password)
  }
}
module.exports = mongoose.model('User', UserSchema)
