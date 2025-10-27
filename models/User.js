const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {type:String, required:true, unique:true},
  email: {type:String, required:true, unique:true, lowercase:true, trim:true, match: /.+@.+\..+/},
  passwordHash: {type:String, required:true},
  isVerified: {type: Boolean, default: false},
  verificationToken: String,
  verificationTokenExpires: Date,
  displayName: {type:String},
  avatarPath: {type:String, default:null}
}, {timestamps:true});

userSchema.methods.verifyPassword = function(password){
  return bcrypt.compare(password, this.passwordHash);
}

module.exports = mongoose.model('User', userSchema);
