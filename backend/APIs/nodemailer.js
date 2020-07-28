const nodemailer = require('nodemailer');
const sendGridTransporter = require('nodemailer-sendgrid-transport');
const Transporter = nodemailer.createTransport(sendGridTransporter({
    auth: {
        api_key: process.env.API_KEY
    }
}))
module.exports = Transporter;