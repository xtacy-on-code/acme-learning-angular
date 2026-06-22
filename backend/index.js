const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const redisClient = require('./src/config/redis');

// Serve uploaded files as static URLs. This turns the uploads/ folder on disk
// into web-reachable URLs, e.g. a file saved at
//   backend/uploads/profile-images/<userId>.jpg
// becomes  http://localhost:5000/uploads/profile-images/<userId>.jpg
// Without this, multer would save the file but the browser could never load it.
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// connect to database
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MONGODB connected'))
    .catch(err => console.log('MONGODB error: ', err));

// test route
app.get('/', (req, res) => {
    res.json({ message: 'backend is running'})
});

// server running
const PORT = process.env.PORT || 5000;
async function start() {
    await redisClient.connect();

    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

start();


// auth route
const authRoutes = require('./src/routes/auth');
app.use('/api/auth', authRoutes);

// student routes
const studentRoutes = require('./src/routes/student');
app.use('/api/students', studentRoutes);

// profile routes (current logged-in user's own profile)
const profileRoutes = require('./src/routes/profile');
app.use('/api/profile', profileRoutes);