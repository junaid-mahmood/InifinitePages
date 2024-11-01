const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const multer = require('multer');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

const dataFile = path.join(__dirname, 'data.json');
const uploadsDir = path.join(__dirname, 'uploads');

// Initialize data file and uploads directory if they don't exist
async function initialize() {
    try {
        await fs.access(dataFile);
    } catch (error) {
        await fs.writeFile(dataFile, JSON.stringify({}));
    }

    try {
        await fs.access(uploadsDir);
    } catch (error) {
        await fs.mkdir(uploadsDir);
    }
}

initialize();

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Routes
app.get('/api/boxes', async (req, res) => {
    try {
        const data = await fs.readFile(dataFile, 'utf-8');
        res.json(JSON.parse(data));
    } catch (error) {
        res.status(500).json({ error: 'Error fetching boxes' });
    }
});

app.post('/api/boxes/:id', upload.single('image'), async (req, res) => {
    try {
        const { id } = req.params;
        const { content } = req.body;
        const data = JSON.parse(await fs.readFile(dataFile, 'utf-8'));
        
        data[id] = { content };
        if (req.file) {
            data[id].imageUrl = `/uploads/${req.file.filename}`;
        }

        await fs.writeFile(dataFile, JSON.stringify(data));
        res.json({ message: 'Box updated successfully', imageUrl: data[id].imageUrl });
    } catch (error) {
        res.status(500).json({ error: 'Error updating box' });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});