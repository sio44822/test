require('dotenv').config();
const { pool, initDatabase } = require('./database');

async function seedProducts() {
    await initDatabase();

    const categories = [
        { name: '蛋糕', slug: 'cake', order: 1 },
        { name: '餅乾', slug: 'cookie', order: 2 },
        { name: '麵包', slug: 'bread', order: 3 },
        { name: '甜點', slug: 'dessert', order: 4 },
        { name: '禮盒', slug: 'gift', order: 5 }
    ];

    for (const cat of categories) {
        await pool.query(
            'INSERT IGNORE INTO categories (name, slug, display_order) VALUES (?, ?, ?)',
            [cat.name, cat.slug, cat.order]
        );
    }

    const [cats] = await pool.query('SELECT * FROM categories');
    const catMap = {};
    cats.forEach(c => catMap[c.slug] = c.id);

    const products = [
        { name: '草莓鮮奶油蛋糕', description: '使用新鮮草莓與香濃鮮奶油，酸甜可口', price: 350, category: 'cake', featured: 1 },
        { name: '巧克力慕斯蛋糕', description: '濃郁比利时巧克力，香滑細膩', price: 320, category: 'cake', featured: 1 },
        { name: '檸檬塔', description: '檸檬醬酸甜適中，塔皮酥脆', price: 180, category: 'dessert', featured: 0 },
        { name: '焦糖布丁', description: '滑嫩口感，焦糖香氣濃郁', price: 80, category: 'dessert', featured: 0 },
        { name: '莓果優格慕斯', description: '藍莓與優格的完美結合', price: 220, category: 'dessert', featured: 1 },
        { name: '核桃餅乾', description: '酥脆餅乾配上香烤核桃', price: 120, category: 'cookie', featured: 0 },
        { name: '巧克力豆餅乾', description: '香濃巧克力豆，甜蜜滋味', price: 100, category: 'cookie', featured: 0 },
        { name: '燕麥葡萄乾餅乾', description: '健康燕麥搭配葡萄乾', price: 90, category: 'cookie', featured: 0 },
        { name: '丹麥牛角麵包', description: '外酥內軟，層次分明', price: 45, category: 'bread', featured: 0 },
        { name: '布里歐修', description: '法式奶油麵包，香氣濃郁', price: 55, category: 'bread', featured: 0 },
        { name: '蒜香法棍', description: '酥脆法棍塗上蒜香奶油', price: 35, category: 'bread', featured: 0 },
        { name: '紅豆麵包', description: '柔軟麵包包入甜蜜紅豆餡', price: 30, category: 'bread', featured: 0 },
        { name: '起司蛋糕', description: '濃郁起司風味，入口即化', price: 280, category: 'cake', featured: 1 },
        { name: '抹茶紅豆蛋糕', description: '日本抹茶搭配甜蜜紅豆', price: 300, category: 'cake', featured: 0 },
        { name: '提拉米蘇', description: '經典義大利甜點，咖啡香濃', price: 260, category: 'dessert', featured: 1 },
        { name: '蒙布朗栗子蛋糕', description: '栗子泥與鮮奶油的組合', price: 320, category: 'dessert', featured: 0 },
        { name: '水果千層酥', description: '酥脆千層搭配新鮮水果', price: 240, category: 'dessert', featured: 0 },
        { name: '手工餅乾禮盒', description: '多種口味手工餅乾組合', price: 399, category: 'gift', featured: 1 },
        { name: '中秋月餅禮盒', description: '精選月餅禮盒，送禮自用皆宜', price: 599, category: 'gift', featured: 0 },
        { name: '聖誕節甜點禮盒', description: '節慶限定甜點組合', price: 799, category: 'gift', featured: 0 },
        { name: '生日蛋糕', description: '客製化生日蛋糕，歡樂慶生', price: 450, category: 'cake', featured: 0 },
        { name: '結婚蛋糕', description: '浪漫結婚蛋糕，見證幸福', price: 1200, category: 'cake', featured: 0 },
        { name: '泡芙', description: '香草卡士達內餡，清爽不膩', price: 35, category: 'dessert', featured: 0 },
        { name: '司康', description: '英式傳統點心，酥鬆口感', price: 50, category: 'cookie', featured: 0 },
        { name: '瑪德蓮', description: '法式貝殼蛋糕，檸檬香氣', price: 45, category: 'cookie', featured: 0 },
        { name: '費南雪', description: '金融家蛋糕，杏仁風味', price: 55, category: 'cookie', featured: 0 },
        { name: '肉桂捲', description: '瑞典經典，肉桂糖漿濃郁', price: 65, category: 'bread', featured: 0 },
        { name: '德國鹽麵包', description: 'Q彈口感，鹽味適中', price: 40, category: 'bread', featured: 0 },
        { name: '日式豆乳甜甜圈', description: '軟糯甜甜圈，豆乳清香', price: 50, category: 'dessert', featured: 0 },
        { name: '舒芙蕾鬆餅', description: '雲朵般柔軟，入口即化', price: 180, category: 'dessert', featured: 1 }
    ];

    for (let i = 0; i < products.length; i++) {
        const p = products[i];
        const categoryId = catMap[p.category];
        
        const [result] = await pool.query(
            'INSERT INTO products (name, description, price, category_id, is_featured, is_active, display_order) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [p.name, p.description, p.price, categoryId, p.featured, 1, i + 1]
        );
        
        const productId = result.insertId;
        
        const imageUrl = `https://picsum.photos/seed/cake${i + 1}/400/300`;
        
        await pool.query(
            'INSERT INTO product_images (product_id, image_path, display_order) VALUES (?, ?, ?)',
            [productId, imageUrl, 0]
        );
        
        console.log(`已新增: ${p.name} - ${imageUrl}`);
    }

    console.log('\n✅ 已完成！共新增 ' + products.length + ' 項商品');
    process.exit(0);
}

seedProducts().catch(err => {
    console.error('錯誤:', err);
    process.exit(1);
});
