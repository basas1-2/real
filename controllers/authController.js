const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const { generateToken, sendVerificationEmail } = require('../utils/emailService');

const createToken = (user) => jwt.sign({ id: user._id, username: user.username, displayName: user.displayName, email: user.email }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

exports.register = async (req,res) => {
  try{
    const { username, email, password, displayName } = req.body;
    if(!username || !email || !password) return res.status(400).json({ error:'username, email and password required' });
    // basic email format check (mongoose also enforces via schema)
    if(typeof email !== 'string' || !/.+@.+\..+/.test(email)) return res.status(400).json({ error:'invalid email' });
    // ensure unique username or email
    const existing = await User.findOne({ $or: [ { username }, { email } ] });
    if(existing){
      if(existing.username === username) return res.status(400).json({ error:'username taken' });
      return res.status(400).json({ error:'email already in use' });
    }
    
    // Generate verification token
    const verificationToken = generateToken();
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ 
      username, 
      email, 
      passwordHash: hash, 
      displayName: displayName || username,
      verificationToken,
      verificationTokenExpires,
      isVerified: false
    });

    // Send verification email
    await sendVerificationEmail(email, verificationToken);

    res.json({ 
      success: true, 
      message: 'Registration successful. Please check your email to verify your account.',
      requiresVerification: true
    });
  }catch(err){
    console.error(err); res.status(500).json({ error:'server error' });
  }
};

exports.login = async (req,res) => {
  try{
    const { username, password } = req.body; // username may be an email or username
    if(!username || !password) return res.status(400).json({ error:'identifier and password required' });
    const identifier = username;
    const user = await User.findOne({ $or: [ { username: identifier }, { email: identifier } ] });
    if(!user) return res.status(400).json({ error:'invalid credentials' });
    const ok = await user.verifyPassword(password);
    if(!ok) return res.status(400).json({ error:'invalid credentials' });
    
    // Check if email is verified
    if (!user.isVerified) {
      return res.status(403).json({ 
        error: 'Please verify your email first', 
        requiresVerification: true,
        email: user.email 
      });
    }
    
    const token = createToken(user);
    res.cookie('token', token, { httpOnly:true, maxAge:1000*60*60*24*7 });
    res.json({ success:true, user:{ id:user._id, username:user.username, displayName:user.displayName, email:user.email } });
  }catch(err){ console.error(err); res.status(500).json({ error:'server error' }); }
};

exports.logout = (req,res) => {
  res.clearCookie('token'); res.json({ success:true });
};

exports.whoami = (req,res) => {
  if(req.currentUser) return res.json({ user: req.currentUser });
  return res.status(401).json({ error:'not authenticated' });
};

exports.uploadAvatar = async (req,res) => {
  try{
    if(!req.currentUser) return res.status(401).json({ error:'unauthorized' });
    if(!req.file) return res.status(400).json({ error:'no file' });
    const UserModel = require('../models/User');
    const user = await UserModel.findById(req.currentUser.id);
    if(!user) return res.status(404).json({ error:'user not found' });
    if(user.avatarPath){ const old = path.join(__dirname,'..', user.avatarPath); try{ require('fs').unlinkSync(old); }catch(e){} }
    user.avatarPath = '/uploads/' + req.file.filename;
    await user.save();
    res.json({ success:true, avatarPath: user.avatarPath });
  }catch(err){ console.error(err); res.status(500).json({ error:'server error' }); }
};

exports.getProfileByUsername = async (req,res) => {
  const username = req.params.username;
  const user = await User.findOne({ username }).lean();
  if(!user) return res.status(404).json({ error:'user not found' });
  const Blog = require('../models/Blog');
  const posts = await Blog.find({ author: user._id }).sort({createdAt:-1}).lean();
  res.json({ user: { id:user._id, username:user.username, displayName:user.displayName, avatarPath:user.avatarPath }, posts });
};

// Verify email endpoint
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Verification token required' });

    const user = await User.findOne({ 
      verificationToken: token,
      verificationTokenExpires: { $gt: Date.now() }
    });

    if (!user) return res.status(400).json({ error: 'Invalid or expired verification token' });

    // Update user as verified
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    // Create session token
    const authToken = createToken(user);
    res.cookie('token', authToken, { httpOnly:true, maxAge:1000*60*60*24*7 });
    
    res.json({ 
      success: true, 
      message: 'Email verified successfully',
      user: { 
        id: user._id, 
        username: user.username, 
        displayName: user.displayName, 
        email: user.email 
      }
    });
  } catch(err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
};

// Resend verification email
exports.resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.isVerified) return res.status(400).json({ error: 'Email already verified' });

    // Generate new verification token
    const verificationToken = generateToken();
    user.verificationToken = verificationToken;
    user.verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    // Send new verification email
    await sendVerificationEmail(email, verificationToken);

    res.json({ 
      success: true, 
      message: 'Verification email sent successfully' 
    });
  } catch(err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
};
