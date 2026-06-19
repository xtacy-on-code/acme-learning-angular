const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config(); 
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

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
app.listen(PORT, () => {
    console.log(`Server running on port {$PORT}`);
});

// auth route
const authRoutes = require('./src/routes/auth');
app.use('/api/auth', authRoutes);

// student routes
const studentRoutes = require('./src/routes/student');
app.use('/api/students', studentRoutes);