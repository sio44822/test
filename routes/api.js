const express = require('express');
const router = express.Router();
const { pool } = require('../database');

router.get('/products', async (req, res) => {
    try {
        const { search, category, price_min, price_max, sort, page = 1, limit = 20, is_active } = req.query;
        
        let sql = `SELECT p.*, c.name as category_name, 
            (SELECT image_path FROM product_images WHERE product_id = p.id ORDER BY display_order LIMIT 1) as main_image 
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.id 
            WHERE 1=1`;
        const params = [];

        if (is_active === undefined || is_active === null || is_active === '') {
            sql += ' AND p.is_active = 1';
        } else if (is_active !== 'all') {
            sql += ' AND p.is_active = ?';
            params.push(is_active === 'true' ? 1 : 0);
        }

        if (search) {
            sql += ' AND (p.name LIKE ? OR p.description LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        if (category) {
            sql += ' AND (p.category_id = ? OR p.id IN (SELECT product_id FROM product_categories WHERE category_id = ?))';
            params.push(category, category);
        }

        if (price_min) {
            sql += ' AND p.price >= ?';
            params.push(price_min);
        }

        if (price_max) {
            sql += ' AND p.price <= ?';
            params.push(price_max);
        }

        switch (sort) {
            case 'price_asc':
                sql += ' ORDER BY p.price ASC';
                break;
            case 'price_desc':
                sql += ' ORDER BY p.price DESC';
                break;
            case 'newest':
                sql += ' ORDER BY p.created_at DESC';
                break;
            default:
                sql += ' ORDER BY p.display_order ASC, p.created_at DESC';
        }

        const offset = (page - 1) * limit;
        sql += ' LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const [products] = await pool.query(sql, params);

        for (let product of products) {
            const [images] = await pool.query('SELECT * FROM product_images WHERE product_id = ? ORDER BY display_order', [product.id]);
            product.images = images;
            
            const [cats] = await pool.query(`
                SELECT c.id, c.name FROM product_categories pc 
                JOIN categories c ON pc.category_id = c.id 
                WHERE pc.product_id = ?`, [product.id]);
            product.categories = cats;
        }

        res.json(products);
    } catch (error) {
        console.error('取得商品失敗:', error);
        res.status(500).json({ error: '伺服器錯誤' });
    }
});

router.get('/products/featured', async (req, res) => {
    try {
        const [products] = await pool.query(`
            SELECT p.*, c.name as category_name,
            (SELECT image_path FROM product_images WHERE product_id = p.id ORDER BY display_order LIMIT 1) as main_image
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.id 
            WHERE p.is_featured = 1 AND p.is_active = 1
            ORDER BY p.display_order ASC
        `);

        for (let product of products) {
            const [images] = await pool.query('SELECT * FROM product_images WHERE product_id = ? ORDER BY display_order', [product.id]);
            product.images = images;
        }

        res.json(products);
    } catch (error) {
        console.error('取得精選商品失敗:', error);
        res.status(500).json({ error: '伺服器錯誤' });
    }
});

router.get('/products/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [products] = await pool.query(`
            SELECT p.*, c.name as category_name 
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.id 
            WHERE p.id = ? AND p.is_active = 1
        `, [id]);

        if (products.length === 0) {
            return res.status(404).json({ error: '商品不存在' });
        }

        const [images] = await pool.query('SELECT * FROM product_images WHERE product_id = ? ORDER BY display_order', [id]);
        products[0].images = images;

        res.json(products[0]);
    } catch (error) {
        console.error('取得商品詳情失敗:', error);
        res.status(500).json({ error: '伺服器錯誤' });
    }
});

router.get('/categories', async (req, res) => {
    try {
        const [categories] = await pool.query('SELECT * FROM categories ORDER BY display_order ASC');
        res.json(categories);
    } catch (error) {
        console.error('取得分類失敗:', error);
        res.status(500).json({ error: '伺服器錯誤' });
    }
});

module.exports = router;
