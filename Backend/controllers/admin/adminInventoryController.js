import Product from '../../models/Product.js';
import asyncHandler from 'express-async-handler';

// GET /admin/inventory - View all products with stock levels
export const getAllInventory = asyncHandler(async (req, res) => {
  const products = await Product.find({}, 'name available_quantity price');
  res.status(200).json({ success: true, products });
});

// POST /admin/inventory/update - Update stock manually
// Body: { productId: "", quantity: 100 }
export const updateProductStock = asyncHandler(async (req, res) => {
  const { productId, quantity } = req.body;

  if (!productId || quantity === undefined) {
    return res.status(400).json({ success: false, message: 'Product ID and quantity are required' });
  }

  const product = await Product.findById(productId);
  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  product.available_quantity = quantity;
  await product.save();

  res.status(200).json({ success: true, message: 'Stock updated successfully', product });
});

// GET /admin/inventory/low-stock - View products with low stock (less than 5)
export const getLowStockProducts = asyncHandler(async (req, res) => {
  const threshold = 5;
  const lowStockProducts = await Product.find({ available_quantity: { $lt: threshold } }, 'name available_quantity');

  res.status(200).json({
    success: true,
    count: lowStockProducts.length,
    lowStockProducts
  });
});

// GET /admin/inventory/report - Basic inventory report
export const getInventoryReport = asyncHandler(async (req, res) => {
  const products = await Product.find({}, 'name available_quantity price');

  const totalProducts = products.length;
  const totalItemsInStock = products.reduce((sum, p) => sum + p.available_quantity, 0);
  const totalValue = products.reduce((sum, p) => sum + (p.available_quantity * p.price), 0);

  res.status(200).json({
    success: true,
    report: {
      totalProducts,
      totalItemsInStock,
      estimatedStockValue: totalValue.toFixed(2)
    }
  });
});
