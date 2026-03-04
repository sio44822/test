require('dotenv').config();
const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: '請先登入' });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
        if (err) {
            return res.status(403).json({ error: '權杖已失效，請重新登入' });
        }
        req.user = user;
        next();
    });
}

function generateToken(user) {
    return jwt.sign(
        { id: user.id, username: user.username },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
}

module.exports = { authenticateToken, generateToken };
