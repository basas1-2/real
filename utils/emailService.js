const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Configure email transport (update with your email service settings)
const transporter = nodemailer.createTransport({
  service: 'gmail', // or your email service
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Generate a random token
const generateToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Send verification email
const sendVerificationEmail = async (email, token) => {
  const verificationUrl = `http://localhost:3000/verify-email.html?token=${token}`;
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Verify Your Email Address',
    html: `
      <h1>Email Verification</h1>
      <p>Thank you for registering! Please click the link below to verify your email address:</p>
      <a href="${verificationUrl}">${verificationUrl}</a>
      <p>This link will expire in 24 hours.</p>
      <p>If you didn't register for an account, please ignore this email.</p>
    `
  };

  return transporter.sendMail(mailOptions);
};

module.exports = {
  generateToken,
  sendVerificationEmail
};