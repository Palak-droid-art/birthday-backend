console.log("Checking environment variables...");
if (!process.env.MONGO_URI) {
    console.error("❌ ERROR: MONGO_URI is missing!");
} else {
    console.log("✅ MONGO_URI is detected.");
}
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

const app = express();
app.use(cors());
app.use(express.json());

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: { folder: 'birthday_uploads', format: async (req, file) => 'jpg' },
});
const upload = multer({ storage: storage });

mongoose.connect(process.env.MONGO_URI);

const Wish = mongoose.model('Wish', new mongoose.Schema({ name: String, text: String }));
const Image = mongoose.model('Image', new mongoose.Schema({ imagePath: String }));

app.post('/api/upload', upload.single('image'), async (req, res) => {
    const newImage = new Image({ imagePath: req.file.path });
    await newImage.save();
    res.status(201).json(newImage);
});

app.get('/api/images', async (req, res) => res.json(await Image.find()));
app.get('/api/wishes', async (req, res) => res.json(await Wish.find()));
app.post('/api/wishes', async (req, res) => {
    const newWish = new Wish(req.body);
    await newWish.save();
    res.status(201).json(newWish);
});

app.listen(5000, () => console.log('Server running on 5000'));
