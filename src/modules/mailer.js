const path = require('path')
const nodemailer = require('nodemailer')
const hbs = require('nodemailer-express-handlebars')
const { host, port, user, pass } = require('../config/mailer.json')

const transport = nodemailer.createTransport({
  host,
  port,
  auth: {
    user,
    pass
  }
})

transport.use('compile', hbs({
  viewEngine: 'handleBars',
  viewPath: path.resolve('./src/resources/mail/'),
  extName: '.html'
}))

module.exports = transport
