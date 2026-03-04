const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const { pool } = require('../database');
const { authenticateToken, generateToken } = require('../middleware/auth');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../public/uploads/products'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(new Error('只能上傳圖片檔案'));
    }
});

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: '請輸入帳號和密碼' });
        }

        const [admins] = await pool.query('SELECT * FROM admins WHERE username = ?', [username]);

        if (admins.length === 0) {
            return res.status(401).json({ error: '帳號或密碼錯誤' });
        }

        const admin = admins[0];
        const isValidPassword = await bcrypt.compare(password, admin.password_hash);

        if (!isValidPassword) {
            return res.status(401).json({ error: '帳號或密碼錯誤' });
        }

        const token = generateToken(admin);
        res.json({ token, username: admin.username });
    } catch (error) {
        console.error('登入失敗:', error);
        res.status(500).json({ error: '伺服器錯誤' });
    }
});

router.get('/categories', authenticateToken, async (req, res) => {
    try {
        const [categories] = await pool.query('SELECT * FROM categories ORDER BY display_order ASC');
        res.json(categories);
    } catch (error) {
        console.error('取得分類失敗:', error);
        res.status(500).json({ error: '伺服器錯誤' });
    }
});

router.post('/categories', authenticateToken, async (req, res) => {
    try {
        const { name, slug, display_order = 0 } = req.body;

        if (!name || !slug) {
            return res.status(400).json({ error: '請提供分類名稱和別名' });
        }

        const [result] = await pool.query('INSERT INTO categories (name, slug, display_order) VALUES (?, ?, ?)', [name, slug, display_order]);
        res.json({ id: result.insertId, name, slug, display_order });
    } catch (error) {
        console.error('新增分類失敗:', error);
        res.status(500).json({ error: '伺服器錯誤' });
    }
});

router.put('/categories/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, slug, display_order } = req.body;

        await pool.query('UPDATE categories SET name = ?, slug = ?, display_order = ? WHERE id = ?', [name, slug, display_order, id]);
        res.json({ id: parseInt(id), name, slug, display_order });
    } catch (error) {
        console.error('更新分類失敗:', error);
        res.status(500).json({ error: '伺服器錯誤' });
    }
});

router.delete('/categories/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('UPDATE products SET category_id = NULL WHERE category_id = ?', [id]);
        await pool.query('DELETE FROM categories WHERE id = ?', [id]);
        res.json({ message: '分類已刪除' });
    } catch (error) {
        console.error('刪除分類失敗:', error);
        res.status(500).json({ error: '伺服器錯誤' });
    }
});

router.get('/products', authenticateToken, async (req, res) => {
    try {
        const [products] = await pool.query(`
            SELECT p.*, c.name as category_name 
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.id 
            ORDER BY p.display_order ASC, p.created_at DESC
        `);

        for (let product of products) {
            const [images] = await pool.query('SELECT * FROM product_images WHERE product_id = ? ORDER BY display_order', [product.id]);
            product.images = images;
        }

        res.json(products);
    } catch (error) {
        console.error('取得商品失敗:', error);
        res.status(500).json({ error: '伺服器錯誤' });
    }
});

router.post('/products', authenticateToken, async (req, res) => {
    try {
        const { name, description, price, category_id, is_featured = 0, is_active = 1, display_order = 0, image_paths = [] } = req.body;

        if (!name) {
            return res.status(400).json({ error: '請提供商品名稱' });
        }

        const [result] = await pool.query(
            'INSERT INTO products (name, description, price, category_id, is_featured, is_active, display_order) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [name, description || '', price || 0, category_id || null, is_featured, is_active, display_order]
        );

        const productId = result.insertId;

        if (image_paths.length > 0) {
            for (let i = 0; i < image_paths.length; i++) {
                await pool.query('INSERT INTO product_images (product_id, image_path, display_order) VALUES (?, ?, ?)', [productId, image_paths[i], i]);
            }
        }

        res.json({ id: productId, message: '商品已新增' });
    } catch (error) {
        console.error('新增商品失敗:', error);
        res.status(500).json({ error: '伺服器錯誤' });
    }
});

router.put('/products/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, price, category_id, is_featured, is_active, display_order } = req.body;

        await pool.query(
            'UPDATE products SET name = ?, description = ?, price = ?, category_id = ?, is_featured = ?, is_active = ?, display_order = ? WHERE id = ?',
            [name, description || '', price || 0, category_id || null, is_featured || 0, is_active !== undefined ? is_active : 1, display_order || 0, id]
        );

        res.json({ id: parseInt(id), message: '商品已更新' });
    } catch (error) {
        console.error('更新商品失敗:', error);
        res.status(500).json({ error: '伺服器錯誤' });
    }
});

router.delete('/products/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM product_images WHERE product_id = ?', [id]);
        await pool.query('DELETE FROM products WHERE id = ?', [id]);
        res.json({ message: '商品已刪除' });
    } catch (error) {
        console.error('刪除商品失敗:', error);
        res.status(500).json({ error: '伺服器錯誤' });
    }
});

router.post('/upload', authenticateToken, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: '請上傳圖片' });
        }
        res.json({ imagePath: '/uploads/products/' + req.file.filename });
    } catch (error) {
        console.error('上傳圖片失敗:', error);
        res.status(500).json({ error: '伺服器錯誤' });
    }
});

router.post('/upload-multiple', authenticateToken, upload.array('images', 10), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: '請上傳圖片' });
        }
        const imagePaths = req.files.map(file => '/uploads/products/' + file.filename);
        res.json(imagePaths);
    } catch (error) {
        console.error('上傳圖片失敗:', error);
        res.status(500).json({ error: '伺服器錯誤' });
    }
});

router.delete('/images/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const [images] = await pool.query('SELECT image_path FROM product_images WHERE id = ?', [id]);
        
        if (images.length > 0) {
            const fs = require('fs');
            const imagePath = path.join(__dirname, '../public', images[0].image_path);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        await pool.query('DELETE FROM product_images WHERE id = ?', [id]);
        res.json({ message: '圖片已刪除' });
    } catch (error) {
        console.error('刪除圖片失敗:', error);
        res.status(500).json({ error: '伺服器錯誤' });
    }
});

router.put('/images/reorder', authenticateToken, async (req, res) => {
    try {
        const { images } = req.body;
        
        for (let i = 0; i < images.length; i++) {
            await pool.query('UPDATE product_images SET display_order = ? WHERE id = ?', [i, images[i].id]);
        }

        res.json({ message: '圖片順序已更新' });
    } catch (error) {
        console.error('更新圖片順序失敗:', error);
        res.status(500).json({ error: '伺服器錯誤' });
    }
});

module.exports = router;
