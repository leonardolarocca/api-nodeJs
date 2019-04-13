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
  viewEngine: {
    extName: '.html',
    partialsDir: path.resolve('../src/resources/mail/'),
    layoutsDir: path.resolve('../src/resources/mail/auth/'),
    defaultLayout: 'forgot_password.html'
  },
  viewPath: path.resolve('../src/resources/mail/'),
  extName: '.html'
}))

module.exports = transport
