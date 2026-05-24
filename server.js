const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const app = express();
const PORT = 5000;

// MIDDLEWARES
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// MONGODB CONNECTION
mongoose.connect('mongodb://127.0.0.1:27017/birthdayDB')
    .then(() => console.log('✅ MongoDB Connected Successfully!'))
    .catch((err) => console.log('❌ MongoDB Connection Error:', err));

// MULTER SETUP (Image Uploading)
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage: storage });

// DATABASE SCHEMAS & MODELS
const wishSchema = new mongoose.Schema({
    name: { type: String, required: true },
    text: { type: String, required: true },
    date: { type: Date, default: Date.now }
});
const Wish = mongoose.model('Wish', wishSchema);

const imageSchema = new mongoose.Schema({
    imagePath: { type: String, required: true },
    date: { type: Date, default: Date.now }
});
const Image = mongoose.model('Image', imageSchema);

// ==========================================
// API ROUTES (WISHES)
// ==========================================
app.get('/api/wishes', async (req, res) => {
    try {
        const wishes = await Wish.find().sort({ date: -1 });
        res.json(wishes);
    } catch (err) { res.status(500).json({ error: 'Failed to fetch wishes' }); }
});

app.post('/api/wishes', async (req, res) => {
    try {
        const newWish = new Wish({ name: req.body.name, text: req.body.text });
        await newWish.save();
        res.status(201).json(newWish);
    } catch (err) { res.status(500).json({ error: 'Failed to save wish' }); }
});

// Wish Delete Route
app.delete('/api/wishes/:id', async (req, res) => {
    try {
        await Wish.findByIdAndDelete(req.params.id);
        res.json({ message: 'Wish deleted successfully' });
    } catch (err) { res.status(500).json({ error: 'Failed to delete wish' }); }
});

// ==========================================
// API ROUTES (IMAGES)
// ==========================================
app.post('/api/upload', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No image provided' });
        const newImage = new Image({ imagePath: `/uploads/${req.file.filename}` });
        await newImage.save();
        res.status(201).json(newImage);
    } catch (err) { res.status(500).json({ error: 'Failed to upload image' }); }
});

app.get('/api/images', async (req, res) => {
    try {
        const images = await Image.find().sort({ date: -1 });
        res.json(images);
    } catch (err) { res.status(500).json({ error: 'Failed to fetch images' }); }
});

// Image Delete Route
app.delete('/api/images/:id', async (req, res) => {
    try {
        const image = await Image.findById(req.params.id);
        if (image) {
            const fileName = image.imagePath.split('/').pop(); 
            const filePath = path.join(__dirname, 'uploads', fileName); 
            
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
            await Image.findByIdAndDelete(req.params.id);
        }
        res.json({ message: 'Image deleted successfully' });
    } catch (err) { res.status(500).json({ error: 'Failed to delete image' }); }
});

// START SERVER
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});