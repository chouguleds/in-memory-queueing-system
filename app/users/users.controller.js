'use strict'

const User = require('./users.model')
const bcrypt = require('bcrypt')

/**
 * Function to create user
 *
 * @param req
 * @param res
 */
exports.create = async function (req, res) {

  let user = null
  try {

    user = await User.findOne({email: req.body.email})

    if (user !== null) {

      return res.status(409).json({
        success: false,
        message: 'email already exists'
      })
    }
    const salt = await bcrypt.genSalt(10)

    const hashedPassword = await bcrypt.hash(req.body.password, salt)

    const newUser = new User({
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword,
      role: req.body.role
    })
    await newUser.save()

    return res.status(200).json({
      success: true,
      message: 'user registered'
    })

  } catch (err) {

    res.status(500).json('internal server error')
  }
}
