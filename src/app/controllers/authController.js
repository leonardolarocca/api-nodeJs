const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const mailer = require('../../modules/mailer')

const User = require('../models/user')
const authConfig = require('../../config/auth.json')

function GenerateToken (params = {}) {
  return jwt.sign({ params }, authConfig.secret, {
    expiresIn: 86400
  })
}

router.post('/register', async (req, res) => {
  const { email } = req.body
  try {
    if (await User.findOne({ email })) {
      return res.status(400).send({ error: 'User already exists' })
    }
    const user = await User.create(req.body)

    user.password = undefined

    return res.send({
      user,
      token: GenerateToken({ id: user.id })
    })
  } catch (err) {
    return res.status(400).send({ error: 'Registration failed' })
  }
})

router.post('/authenticate', async (req, res) => {
  const { email, password } = req.body
  const user = await User.findOne({ email }).select('+password')

  if (!user) {
    return res.status(400).send({ error: 'User not found' })
  }

  if (!await bcrypt.compare(password, user.password)) {
    return res.status(400).send({ error: 'invalid password' })
  }

  user.password = undefined

  res.status(200).send({
    user,
    token: GenerateToken({ id: user.id })
  })
})

router.post('/forgot_password', async (req, res) => {
  const { email } = req.body

  try {
    const user = await User.findOne({ email })

    if (!user) {
      return res.status(401).send({ error: 'User not found' })
    }

    const token = crypto.randomBytes(20).toString('hex')

    const now = new Date()

    now.setHours(now.getHours() + 1)

    await User.findByIdAndUpdate(user.id, {
      '$set': {
        passwordResetToken: token,
        passwordResetExpires: now
      }
    })

    try {
      await mailer.sendMail({
        to: email,
        from: 'leonardo_larocca@hotmail.com',
        template: 'auth/forgot_password',
        context: { token }
      })
    } catch (err) {
      return res.status(400).send({ error: 'Cannot send forgot password email' })
    }

    return res.status(204).end()
  } catch (err) {
    res.status(401).send({ error: 'Error on forgot password, try again later' })
  }
})

router.post('/reset_password', async (req, res) => {
  const { email, token, password } = req.body

  try {
    const user = await User.findOne({ email })
      .select('+passwordResetToken passwordResetExpires')

    if (!user) {
      return res.status(401).send({ error: 'User not found' })
    }

    if (token !== user.passwordResetToken) {
      return res.status(400).send({ error: 'Token invalid' })
    }

    const now = Date.now()

    if (now > user.passwordResetExpires) {
      return res.status(400).send({ error: 'Token expired, get a new token' })
    }

    user.password = password

    await user.save()

    return res.status(204).end()
  } catch (err) {
    res.status(400).send({ error: 'Cannot reset password' })
  }
})

module.exports = app => app.use('/auth', router)
