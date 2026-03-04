require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDatabase, createDefaultAdmin } = require('./database');

const app = express();
const PORT = process.env.PORT || 80;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api', require('./routes/api'));
app.use('/api/admin', require('./routes/admin'));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin', 'login.html'));
});

app.get('/admin/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin', 'dashboard.html'));
});

async function startServer() {
    try {
        await initDatabase();
        await createDefaultAdmin();
        
        app.listen(PORT, () => {
            console.log(`伺服器已啟動 http://localhost:${PORT}`);
            console.log(`管理後台 http://localhost:${PORT}/admin`);
        });
    } catch (error) {
        console.error('伺服器啟動失敗:', error);
        process.exit(1);
    }
}

startServer();
