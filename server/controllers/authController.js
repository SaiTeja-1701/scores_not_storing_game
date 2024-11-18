const User = require("../models/user");
const { hashP, compareP } = require('../bcrypt/auth');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const test = (req, res) => {
    res.json('It is working');
};

const registerUser = async(req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username) {
            return res.status(400).json({ error: "Please type in your username" });
        }

        if (!email) {
            return res.status(400).json({ error: "No email entered" });
        }

        if (!password || password.length < 8) {
            return res.status(400).json({
                error: "Password is required and must be at least 8 characters long"
            });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: "You already have an account" });
        }

        const hashedP = await hashP(password);
        const user = await User.create({ username, email, password: hashedP });

        res.status(201).json({
            message: "User registered successfully",
            user: {
                username: user.username,
                id: user._id,
                email: user.email
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Registration failed" });
    }
};

const loginUser = async(req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'You do not have an account' });
        }

        const match = await compareP(password, user.password);
        if (!match) {
            return res.status(401).json({ error: "Incorrect password" });
        }

        const sessionId = uuidv4();
        const loginTime = new Date();
        user.sessions.push({ sessionId, loginTime });
        await user.save();

        jwt.sign({
                username: user.username,
                email: user.email,
                id: user._id,
                loginTime: loginTime.toISOString(),
                sessionId
            },
            process.env.JWT_SECRET, { expiresIn: '1h' },
            (err, token) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ error: "Failed to generate token" });
                }
                res.cookie('token', token, { httpOnly: true }).json({ message: "Login successful", user: { id: user._id, email: user.email } });
            }
        );
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Login failed" });
    }
};

const getProfile = (req, res) => {
    const { token } = req.cookies;
    if (token) {
        jwt.verify(token, process.env.JWT_SECRET, {}, (err, user) => {
            if (err) {
                console.error(err);
                return res.status(401).json({ error: "Invalid token" });
            }
            res.json(user);
        });
    } else {
        res.status(401).json({ error: "No token provided" });
    }
};

const logoutUser = async(req, res) => {
    const { token } = req.cookies;

    if (!token) {
        return res.status(400).json({ error: 'No token found' });
    }

    jwt.verify(token, process.env.JWT_SECRET, async(err, decoded) => {
        if (err) {
            console.error(err);
            return res.status(401).json({ error: 'Invalid token' });
        }

        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const lastSession = user.sessions.find(session => session.sessionId === decoded.sessionId);
        if (lastSession) {
            lastSession.logoutTime = new Date();
            await user.save();
        }

        res.clearCookie('token');
        res.json({ message: 'Logged out successfully' });
    });
};

const saveScore = async(req, res) => {
    try {
        const { score } = req.body;
        const { token } = req.cookies;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const currentSession = user.sessions.find(session => session.sessionId === decoded.sessionId);
        if (currentSession) {
            currentSession.score.push(score);
            await user.save();
            res.json({ message: 'Score saved successfully' });
        } else {
            res.status(404).json({ error: 'Session not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to save score' });
    }
};

module.exports = {
    test,
    registerUser,
    loginUser,
    getProfile,
    logoutUser,
    saveScore
};