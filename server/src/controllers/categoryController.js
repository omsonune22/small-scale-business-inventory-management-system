import { query } from '../config/db.js';

// In-memory fallback categories for development/offline mode
let fallbackCategories = [
  { category_id: 1, name: 'Beverages', description: 'Refreshing cold beverages, sodas, and juices', product_count: 2 },
  { category_id: 2, name: 'Packaged Foods', description: 'Snacks, cookies, canned goods, and dry staples', product_count: 2 },
  { category_id: 3, name: 'Personal Care', description: 'Hygiene essentials, soaps, and toiletries', product_count: 1 },
];

/**
 * GET /api/v1/categories
 * List all categories with their associated active product counts.
 */
export const getCategories = async (req, res, next) => {
  try {
    const sql = `
      SELECT 
        c.category_id,
        c.name,
        c.description,
        c.created_at,
        COUNT(p.product_id) AS product_count
      FROM categories c
      LEFT JOIN products p ON c.category_id = p.category_id AND p.is_active = 1
      GROUP BY c.category_id, c.name, c.description, c.created_at
      ORDER BY c.name ASC
    `;

    try {
      const categories = await query(sql);
      return res.status(200).json({
        success: true,
        count: categories.length,
        categories: categories.map(c => ({
          ...c,
          product_count: Number(c.product_count) || 0
        }))
      });
    } catch (dbErr) {
      console.warn('[CATEGORIES]: Database offline, using fallback categories.');
      return res.status(200).json({
        success: true,
        count: fallbackCategories.length,
        categories: fallbackCategories
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/categories
 * Admin only: Create a new product category.
 */
export const createCategory = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required.'
      });
    }

    const trimmedName = name.trim();

    try {
      // Check for duplicates
      const existing = await query('SELECT category_id FROM categories WHERE LOWER(name) = ?', [trimmedName.toLowerCase()]);
      if (existing.length > 0) {
        return res.status(409).json({
          success: false,
          message: `Category '${trimmedName}' already exists.`
        });
      }

      const result = await query(
        'INSERT INTO categories (name, description) VALUES (?, ?)',
        [trimmedName, description ? description.trim() : null]
      );

      return res.status(201).json({
        success: true,
        message: `Category '${trimmedName}' created successfully.`,
        category: {
          category_id: result.insertId,
          name: trimmedName,
          description: description || '',
          product_count: 0
        }
      });
    } catch (dbErr) {
      console.warn('[CATEGORIES]: Database offline, creating in fallback state.');
      const newCat = {
        category_id: fallbackCategories.length + 1,
        name: trimmedName,
        description: description || '',
        product_count: 0
      };
      fallbackCategories.push(newCat);
      return res.status(201).json({
        success: true,
        message: `Category '${trimmedName}' created successfully (offline demo).`,
        category: newCat
      });
    }
  } catch (error) {
    next(error);
  }
};
