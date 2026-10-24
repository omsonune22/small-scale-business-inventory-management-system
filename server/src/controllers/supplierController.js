import { query } from '../config/db.js';

// In-memory fallback suppliers for offline development
let fallbackSuppliers = [
  { supplier_id: 1, company_name: 'Apex FMCG Distributors', contact_person: 'Robert Vance', phone: '+1 (555) 234-5678', email: 'orders@apexfmcg.com', address: '104 Industrial Parkway, Sector 4', created_at: '2026-10-21' },
  { supplier_id: 2, company_name: 'Sunrise Dairy Co.', contact_person: 'Elena Rostova', phone: '+1 (555) 876-5432', email: 'supply@sunrisedairy.com', address: '42 Green Valley Rd, Farm Zone', created_at: '2026-10-22' },
  { supplier_id: 3, company_name: 'Global Refreshments Ltd.', contact_person: 'Marcus Sterling', phone: '+1 (555) 345-6789', email: 'contact@globalrefresh.com', address: '88 Harbor Boulevard, Port District', created_at: '2026-10-22' },
];

/**
 * GET /api/v1/suppliers
 * List all active suppliers with purchase count summary.
 */
export const getSuppliers = async (req, res, next) => {
  try {
    const sql = `
      SELECT 
        s.supplier_id,
        s.company_name,
        s.contact_person,
        s.phone,
        s.email,
        s.address,
        s.created_at,
        COUNT(p.purchase_id) AS total_purchases
      FROM suppliers s
      LEFT JOIN purchases p ON s.supplier_id = p.supplier_id
      GROUP BY s.supplier_id, s.company_name, s.contact_person, s.phone, s.email, s.address, s.created_at
      ORDER BY s.company_name ASC
    `;

    try {
      const suppliers = await query(sql);
      return res.status(200).json({
        success: true,
        count: suppliers.length,
        suppliers: suppliers.map(s => ({
          ...s,
          total_purchases: Number(s.total_purchases) || 0
        }))
      });
    } catch (dbErr) {
      console.warn('[SUPPLIERS]: Database offline, using fallback suppliers.');
      return res.status(200).json({
        success: true,
        count: fallbackSuppliers.length,
        suppliers: fallbackSuppliers
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/suppliers
 * Admin only: Create a new supplier record.
 */
export const createSupplier = async (req, res, next) => {
  try {
    const { company_name, contact_person, phone, email, address } = req.body;

    if (!company_name || !company_name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Company name is required.'
      });
    }

    const trimmedCompany = company_name.trim();

    try {
      const sql = `
        INSERT INTO suppliers (company_name, contact_person, phone, email, address)
        VALUES (?, ?, ?, ?, ?)
      `;
      const result = await query(sql, [
        trimmedCompany,
        contact_person ? contact_person.trim() : null,
        phone ? phone.trim() : null,
        email ? email.trim() : null,
        address ? address.trim() : null
      ]);

      const newSupplier = {
        supplier_id: result.insertId,
        company_name: trimmedCompany,
        contact_person: contact_person || '',
        phone: phone || '',
        email: email || '',
        address: address || '',
        total_purchases: 0
      };

      return res.status(201).json({
        success: true,
        message: `Supplier '${trimmedCompany}' registered successfully.`,
        supplier: newSupplier
      });
    } catch (dbErr) {
      console.warn('[SUPPLIERS]: Database offline, saving in fallback state.');
      const newSupplier = {
        supplier_id: fallbackSuppliers.length + 1,
        company_name: trimmedCompany,
        contact_person: contact_person || '',
        phone: phone || '',
        email: email || '',
        address: address || '',
        total_purchases: 0,
        created_at: new Date().toISOString()
      };
      fallbackSuppliers.push(newSupplier);

      return res.status(201).json({
        success: true,
        message: `Supplier '${trimmedCompany}' registered successfully (offline demo).`,
        supplier: newSupplier
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/suppliers/:id
 * Update supplier details.
 */
export const updateSupplier = async (req, res, next) => {
  try {
    const supplierId = parseInt(req.params.id, 10);
    const { company_name, contact_person, phone, email, address } = req.body;

    if (isNaN(supplierId)) {
      return res.status(400).json({ success: false, message: 'Invalid supplier ID parameter.' });
    }
    if (!company_name || !company_name.trim()) {
      return res.status(400).json({ success: false, message: 'Company name is required.' });
    }

    try {
      const sql = `
        UPDATE suppliers 
        SET 
          company_name = ?,
          contact_person = ?,
          phone = ?,
          email = ?,
          address = ?
        WHERE supplier_id = ?
      `;
      const result = await query(sql, [
        company_name.trim(),
        contact_person ? contact_person.trim() : null,
        phone ? phone.trim() : null,
        email ? email.trim() : null,
        address ? address.trim() : null,
        supplierId
      ]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Supplier not found.' });
      }

      return res.status(200).json({
        success: true,
        message: 'Supplier details updated successfully.'
      });
    } catch (dbErr) {
      console.warn('[SUPPLIERS]: Database offline, updating fallback supplier.');
      const idx = fallbackSuppliers.findIndex(s => s.supplier_id === supplierId);
      if (idx !== -1) {
        fallbackSuppliers[idx] = {
          ...fallbackSuppliers[idx],
          company_name: company_name.trim(),
          contact_person: contact_person || '',
          phone: phone || '',
          email: email || '',
          address: address || ''
        };
      }
      return res.status(200).json({
        success: true,
        message: 'Supplier details updated successfully (offline demo).'
      });
    }
  } catch (error) {
    next(error);
  }
};
