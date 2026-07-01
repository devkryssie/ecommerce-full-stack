import db from "../config/db.js";

const ProductModel = {
  async create({ category_id, name, slug, description, price, stock }) {
    const [result] = await db.execute(
      "INSERT INTO products (category_id, name, slug, description, price, stock) VALUES (?, ?, ?, ?, ?, ?)",
      [category_id || null, name, slug, description, price, stock]
    );
    return result.insertId;
  },

  async update(id, { category_id, name, slug, description, price, stock }) {
    const [result] = await db.execute(
      "UPDATE products SET category_id = ?, name = ?, slug = ?, description = ?, price = ?, stock = ? WHERE id = ?",
      [category_id || null, name, slug, description, price, stock, id]
    );
    return result.affectedRows > 0;
  },

  async delete(id) {
    // Delete product. Note: Foreign Key CASCADE will delete product_images in DB,
    // but the controller must fetch image public_ids first to delete from Cloudinary.
    const [result] = await db.execute("DELETE FROM products WHERE id = ?", [id]);
    return result.affectedRows > 0;
  },

  async getById(id) {
    const [rows] = await db.execute(
      `SELECT p.*, c.name AS category_name 
       FROM products p 
       LEFT JOIN categories c ON p.category_id = c.id 
       WHERE p.id = ?`,
      [id]
    );
    if (!rows[0]) return null;

    const [images] = await db.execute(
      "SELECT id, image_url, public_id FROM product_images WHERE product_id = ?",
      [id]
    );

    rows[0].images = images;
    return rows[0];
  },

  async getAll({ page = 1, limit = 10, search, category, minPrice, maxPrice, sort }) {
    let query = `
      SELECT p.*, c.name AS category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += " AND (p.name LIKE ? OR p.description LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }

    if (category) {
      query += " AND p.category_id = ?";
      params.push(Number(category));
    }

    if (minPrice) {
      query += " AND p.price >= ?";
      params.push(Number(minPrice));
    }

    if (maxPrice) {
      query += " AND p.price <= ?";
      params.push(Number(maxPrice));
    }

    // Sorting
    if (sort === "price_asc") {
      query += " ORDER BY p.price ASC";
    } else if (sort === "price_desc") {
      query += " ORDER BY p.price DESC";
    } else if (sort === "newest") {
      query += " ORDER BY p.created_at DESC";
    } else {
      query += " ORDER BY p.id DESC"; // Default sort
    }

    // Pagination
    const offset = (Number(page) - 1) * Number(limit);
    query += " LIMIT ? OFFSET ?";
    params.push(Number(limit), Number(offset));

    const [products] = await db.query(query, params);

    // Fetch images for each product and attach them
    for (let product of products) {
      const [images] = await db.query(
        "SELECT id, image_url, public_id FROM product_images WHERE product_id = ?",
        [product.id]
      );
      product.images = images;
    }

    // Get the total count for pagination metadata
    let countQuery = "SELECT COUNT(*) as total FROM products p WHERE 1=1";
    const countParams = [];

    if (search) {
      countQuery += " AND (p.name LIKE ? OR p.description LIKE ?)";
      countParams.push(`%${search}%`, `%${search}%`);
    }

    if (category) {
      countQuery += " AND p.category_id = ?";
      countParams.push(Number(category));
    }

    if (minPrice) {
      countQuery += " AND p.price >= ?";
      countParams.push(Number(minPrice));
    }

    if (maxPrice) {
      countQuery += " AND p.price <= ?";
      countParams.push(Number(maxPrice));
    }

    const [countRows] = await db.query(countQuery, countParams);
    const total = countRows[0].total;

    return {
      products,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    };
  },

  async addImages(productId, images) {
    if (!images || images.length === 0) return;
    const values = images.map((img) => [productId, img.image_url, img.public_id]);
    await db.query(
      "INSERT INTO product_images (product_id, image_url, public_id) VALUES ?",
      [values]
    );
  },

  async getImageById(imageId) {
    const [rows] = await db.execute(
      "SELECT id, product_id, image_url, public_id FROM product_images WHERE id = ?",
      [imageId]
    );
    return rows[0] || null;
  },

  async deleteImage(imageId) {
    const [result] = await db.execute("DELETE FROM product_images WHERE id = ?", [
      imageId,
    ]);
    return result.affectedRows > 0;
  },

  async getProductImages(productId) {
    const [rows] = await db.execute(
      "SELECT id, image_url, public_id FROM product_images WHERE product_id = ?",
      [productId]
    );
    return rows;
  },

  async reduceStock(productId, quantity, connection) {
    const dbConn = connection || db;
    const [result] = await dbConn.execute(
      "UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?",
      [quantity, productId, quantity]
    );
    return result.affectedRows > 0;
  },

  async increaseStock(productId, quantity, connection) {
    const dbConn = connection || db;
    const [result] = await dbConn.execute(
      "UPDATE products SET stock = stock + ? WHERE id = ?",
      [quantity, productId]
    );
    return result.affectedRows > 0;
  },
};

export default ProductModel;
