const express = require('express')
const authMiddleware = require('../middleware/auth')

const router = express.Router()

router.use(authMiddleware)

router.get('/', async (req, res) => {
  res.status(200).send({ ok: true })
})

module.exports = app => app.use('/projects', router)
