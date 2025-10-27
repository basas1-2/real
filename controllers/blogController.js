const Blog = require('../models/Blog');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const uploadDir = path.join(__dirname,'..','uploads');
if(!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: function(req,file,cb){ cb(null, uploadDir); },
  filename: function(req,file,cb){ const unique = Date.now()+'-'+Math.round(Math.random()*1E9); cb(null, unique+path.extname(file.originalname)); }
});
// accept only image mime types and limit size to 5MB
const imageFileFilter = (req,file,cb)=>{
  if(!file.mimetype.startsWith('image/')) return cb(new Error('Only image files are allowed'), false);
  cb(null, true);
};
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: imageFileFilter });

exports.uploadMiddleware = upload.single('image');

exports.list = async (req,res) => {
  const posts = await Blog.find().sort({createdAt:-1}).populate('author','username displayName avatarPath').lean();
  res.json(posts);
};

exports.create = async (req,res) => {
  if(!req.currentUser) return res.status(401).json({ error:'unauthorized' });
  try{
    let imagePath = null;
    if(req.file){
      const filePath = path.join(uploadDir, req.file.filename);
      const tmp = filePath + '.tmp';
      try{
        let sharpLib;
        try{ sharpLib = require('sharp'); }catch(e){}
        if(sharpLib){
          await sharpLib(filePath).resize({ width: 800, withoutEnlargement: true }).toFile(tmp);
          fs.renameSync(tmp, filePath);
        }else{
          const Jimp = require('jimp');
          const img = await Jimp.read(filePath);
          const w = img.bitmap.width;
          if(w > 800){
            await img.resize(800, Jimp.AUTO).writeAsync(tmp);
            fs.renameSync(tmp, filePath);
          }
        }
      }catch(e){
        console.error('image resize failed', e);
        try{ if(fs.existsSync(tmp)) fs.unlinkSync(tmp); }catch(_){}
        try{ if(fs.existsSync(filePath)) fs.unlinkSync(filePath); }catch(_){}
        return res.status(500).json({ error:'image processing failed' });
      }
      imagePath = '/uploads/'+req.file.filename;
    }
    const blog = await Blog.create({ author: req.currentUser.id, title: req.body.title, content: req.body.content, imagePath });
    res.json(await Blog.findById(blog._id).populate('author','username displayName avatarPath').lean());
  }catch(err){ console.error(err); res.status(500).json({ error:'server error' }); }
};

exports.get = async (req,res) => {
  const post = await Blog.findById(req.params.id).populate('author','username displayName avatarPath').lean();
  if(!post) return res.status(404).json({ error:'not found' });
  res.json(post);
};

exports.update = async (req,res) => {
  if(!req.currentUser) return res.status(401).json({ error:'unauthorized' });
  const post = await Blog.findById(req.params.id);
  if(!post) return res.status(404).json({ error:'not found' });
  if(post.author.toString() !== req.currentUser.id) return res.status(403).json({ error:'forbidden' });
  if(req.file){
    const filePath = path.join(uploadDir, req.file.filename);
    const tmp = filePath + '.tmp';
    try{
      let sharpLib;
      try{ sharpLib = require('sharp'); }catch(e){}
      if(sharpLib){
        await sharpLib(filePath).resize({ width: 800, withoutEnlargement: true }).toFile(tmp);
        fs.renameSync(tmp, filePath);
      }else{
        const Jimp = require('jimp');
        const img = await Jimp.read(filePath);
        const w = img.bitmap.width;
        if(w > 800){
          await img.resize(800, Jimp.AUTO).writeAsync(tmp);
          fs.renameSync(tmp, filePath);
        }
      }
    }catch(e){
      console.error('image resize failed', e);
      try{ if(fs.existsSync(tmp)) fs.unlinkSync(tmp); }catch(_){}
      try{ if(fs.existsSync(filePath)) fs.unlinkSync(filePath); }catch(_){}
      return res.status(500).json({ error:'image processing failed' });
    }
    if(post.imagePath){ const old = path.join(__dirname,'..', post.imagePath); if(fs.existsSync(old)) fs.unlinkSync(old); }
    post.imagePath = '/uploads/'+req.file.filename;
  }
  post.title = req.body.title; post.content = req.body.content;
  await post.save();
  res.json(await Blog.findById(post._id).populate('author','username displayName avatarPath').lean());
};

exports.remove = async (req,res) => {
  if(!req.currentUser) return res.status(401).json({ error:'unauthorized' });
  const post = await Blog.findById(req.params.id);
  if(!post) return res.status(404).json({ error:'not found' });
  if(post.author.toString() !== req.currentUser.id) return res.status(403).json({ error:'forbidden' });
  if(post.imagePath){ const old = path.join(__dirname,'..', post.imagePath); if(fs.existsSync(old)) fs.unlinkSync(old); }
  await Blog.deleteOne({_id:post._id});
  res.json({ success:true });
};
