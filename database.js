require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'display',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function initDatabase() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || '127.0.0.1',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || 'root',
        multipleStatements: true
    });

    try {
        await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'display'}`);
        await connection.query(`USE ${process.env.DB_NAME || 'display'}`);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS categories (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(50) NOT NULL,
                slug VARCHAR(50) NOT NULL UNIQUE,
                display_order INT DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS products (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                description TEXT,
                price DECIMAL(10,2) DEFAULT 0,
                discount_price DECIMAL(10,2) DEFAULT NULL,
                discount_percent INT DEFAULT NULL,
                discount_type ENUM('fixed', 'percent') DEFAULT 'fixed',
                discount_start DATETIME DEFAULT NULL,
                discount_end DATETIME DEFAULT NULL,
                category_id INT,
                is_featured TINYINT DEFAULT 0,
                is_active TINYINT DEFAULT 1,
                display_order INT DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
            )
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS product_categories (
                id INT AUTO_INCREMENT PRIMARY KEY,
                product_id INT NOT NULL,
                category_id INT NOT NULL,
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
                FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
                UNIQUE KEY unique_product_category (product_id, category_id)
            )
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS product_images (
                id INT AUTO_INCREMENT PRIMARY KEY,
                product_id INT NOT NULL,
                image_path VARCHAR(255) NOT NULL,
                display_order INT DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
            )
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS admins (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        try {
            const [columns] = await connection.query('SHOW COLUMNS FROM products LIKE "discount_price"');
            if (!columns || columns.length === 0) {
                await connection.query(`ALTER TABLE products ADD COLUMN discount_price DECIMAL(10,2) DEFAULT NULL`);
            }
        } catch (e) {
            console.log('discount_price column may already exist');
        }

        try {
            const [columns] = await connection.query('SHOW COLUMNS FROM products LIKE "discount_percent"');
            if (!columns || columns.length === 0) {
                await connection.query(`ALTER TABLE products ADD COLUMN discount_percent INT DEFAULT NULL`);
            }
        } catch (e) {
            console.log('discount_percent column may already exist');
        }

        try {
            const [typeCols] = await connection.query('SHOW COLUMNS FROM products LIKE "discount_type"');
            if (!typeCols || typeCols.length === 0) {
                await connection.query(`ALTER TABLE products ADD COLUMN discount_type VARCHAR(20) DEFAULT 'fixed'`);
            }
        } catch (e) {
            console.log('discount_type column may already exist');
        }

        try {
            const [startCols] = await connection.query('SHOW COLUMNS FROM products LIKE "discount_start"');
            if (!startCols || startCols.length === 0) {
                await connection.query(`ALTER TABLE products ADD COLUMN discount_start DATETIME DEFAULT NULL`);
            }
        } catch (e) {
            console.log('discount_start column may already exist');
        }

        try {
            const [endCols] = await connection.query('SHOW COLUMNS FROM products LIKE "discount_end"');
            if (!endCols || endCols.length === 0) {
                await connection.query(`ALTER TABLE products ADD COLUMN discount_end DATETIME DEFAULT NULL`);
            }
        } catch (e) {
            console.log('discount_end column may already exist');
        }

        try {
            const [tables] = await connection.query(`SHOW TABLES LIKE "product_categories"`);
            if (!tables || tables.length === 0) {
                await connection.query(`CREATE TABLE product_categories (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    product_id INT NOT NULL,
                    category_id INT NOT NULL,
                    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
                    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
                    UNIQUE KEY unique_product_category (product_id, category_id)
                )`);
            }
        } catch (e) {
            console.log('product_categories table may already exist');
        }

        console.log('資料庫資料表建立完成');
    } catch (error) {
        console.error('資料庫初始化錯誤:', error);
        throw error;
    } finally {
        await connection.end();
    }
}

async function createDefaultAdmin() {
    const bcrypt = require('bcryptjs');
    const [rows] = await pool.query('SELECT id FROM admins WHERE username = ?', ['admin']);
    
    if (rows.length === 0) {
        const passwordHash = await bcrypt.hash('password', 10);
        await pool.query('INSERT INTO admins (username, password_hash) VALUES (?, ?)', ['admin', passwordHash]);
        console.log('預設管理者帳號已建立: admin / password');
    }
}

module.exports = { pool, initDatabase, createDefaultAdmin };
