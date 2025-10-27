require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const path = require('path');

const app = express();

mongoose.connect(process.env.MONGODB_URI, {useNewUrlParser:true, useUnifiedTopology:true})
  .then(()=> console.log('MongoDB connected'))
  .catch(err => { console.error('MongoDB connection error:', err); });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/', express.static(path.join(__dirname, 'public')));

const jwt = require('jsonwebtoken');
app.use((req, res, next) => {
  const token = req.cookies?.token;
  if(token){
    try{
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      req.currentUser = payload; // { id, username, displayName }
      res.locals.currentUser = payload;
    }catch(e){
      res.locals.currentUser = null;
    }
  }else{
    res.locals.currentUser = null;
  }
  next();
});

const authRoutes = require('./routes/auth');
const blogRoutes = require('./routes/blogs');

app.use('/auth', authRoutes);
app.use('/blogs', blogRoutes);

app.get('/', (req,res) => res.sendFile(path.join(__dirname,'public','index.html')));

const PORT = process.env.PORT || 8001;
app.listen(PORT, ()=> console.log(`Server running on port ${PORT}`));
