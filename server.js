const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;

// Database connection
mongoose.connect('mongodb://localhost:27017/registrationDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log("Connected to database");
}).catch((err) => {
    console.error("Connection failed", err);
    process.exit(1);
});

// Create schema
const userSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String,
    role: String // Add a field for user role
});

const User = mongoose.model('User', userSchema);

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Common function to register a user
async function registerUser(req, res, role) {
    try {
        const { username, email, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).send('User already exists');
        }

        // Create new user
        const newUser = new User({
            username,
            email,
            password,
            role
        });
        await newUser.save();
        res.send('Registration successful!');
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal server error');
    }
}

// Route for registering a normal user
app.post('/register', async (req, res) => {
    await registerUser(req, res, 'user');
});

// Route for registering a recruiter
app.post('/register-recruiter', async (req, res) => {
    await registerUser(req, res, 'recruiter');
});

// Assuming you have a route for handling login requests
app.post('/login', async (req, res) => {
    const { username, password, role } = req.body;

    try {
        // Find the user with the provided username in the database
        const user = await User.findOne({ username });

        // If no user is found with the provided username, or if the password is incorrect, return an error
        if (!user || password !== user.password || role !== user.role) {
            return res.redirect('/login.html?error=invalidCredentials');
        }

        // If the passwords match and role is correct, redirect to the dashboard page based on the user's role
        if (role === 'admin') {
            return res.redirect('/Dashboard.html');
        } else if (role === 'subadmin') {
            return res.redirect('/subadmin-dashboard.html');
        } else if (role === 'recruiter') {
            return res.redirect('/recruiter-dashboard.html');
        } else {
            return res.status(401).send('Unauthorized');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal server error');
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
