import express from "express";
import { verifyToken, isAdmin } from "../middlewares/authMiddleware.js";
import * as AdminAuthController from "../controllers/admin/adminAuthController.js";
import * as adminDashboardController from "../controllers/admin/adminDashboardController.js";
import * as AdminCustomerController from "../controllers/admin/adminCustomerController.js";
import * as AdminCategoryController from "../controllers/admin/adminCategoryController.js";
import * as AdminProductController from "../controllers/admin/adminProductController.js";
import * as AdminOrderController from "../controllers/admin/adminOrderController.js";
import * as AdminInventoryController from '../controllers/admin/adminInventoryController.js';
import { uploadProductImages, processProductImages } from "../middlewares/uploadMiddleware.js";
import * as AdminCouponController from "../controllers/admin/adminCouponController.js";
import * as salesReportController from "../controllers/admin/salesReportController.js";
import * as AdminOfferController from "../controllers/admin/adminOfferController.js";

const router = express.Router();

// ===================== ADMIN AUTHENTICATION =====================
router.post("/login", AdminAuthController.adminLogin);
router.post("/logout", AdminAuthController.adminLogout);
router.post("/refresh-token", AdminAuthController.refreshAdminToken);

// ===================== ADMIN DASHBOARD =====================
router.get('/dashboard/stats', adminDashboardController.getDashboardStats);
router.get('/dashboard/top-products', adminDashboardController.getTopProducts);
router.get('/dashboard/top-categories', adminDashboardController.getTopCategories);
router.get('/dashboard/ledger-book', adminDashboardController.generateLedgerBook);

// ===================== CUSTOMER MANAGEMENT =====================
router.get("/customers", verifyToken("admin"), isAdmin, AdminCustomerController.getAllCustomers);
router.get("/customers/:id", verifyToken("admin"), isAdmin, AdminCustomerController.getCustomerById);
router.get("/customers/count", verifyToken("admin"), isAdmin, AdminCustomerController.userCount);
router.post("/customers", verifyToken("admin"), isAdmin, AdminCustomerController.createCustomer);
router.patch("/customers/:id/toggle-block", verifyToken("admin"), isAdmin, AdminCustomerController.toggleBlockCustomer);
router.put("/customers/:id", verifyToken("admin"), isAdmin, AdminCustomerController.updateCustomer);
router.delete("/customers/:id", verifyToken("admin"), isAdmin, AdminCustomerController.deleteCustomer);

// ===================== CATEGORY MANAGEMENT =====================
router.get("/categories", verifyToken("admin"), isAdmin, AdminCategoryController.getCategories);
router.post("/categories", verifyToken("admin"), isAdmin, AdminCategoryController.createCategory);
router.put("/categories/:id", verifyToken("admin"), isAdmin, AdminCategoryController.updateCategory);
router.delete("/categories/:id", verifyToken("admin"), isAdmin, AdminCategoryController.deleteCategory);
router.get("/categories/:category", AdminCategoryController.getBooksByCategory);

// ===================== PRODUCT MANAGEMENT =====================
router.get("/products", verifyToken("admin"), isAdmin, AdminProductController.getProducts);
router.post("/products",verifyToken("admin"), isAdmin, uploadProductImages, processProductImages, AdminProductController.createProduct);
router.get("/products/:id",verifyToken("admin"), isAdmin, AdminProductController.getProductById);
router.put("/products/:id",verifyToken("admin"), isAdmin, uploadProductImages, processProductImages, AdminProductController.updateProduct);
router.patch("/products/:id/toggle",verifyToken("admin"), isAdmin, AdminProductController.toggleProductListing);
router.patch("/products/:id/",verifyToken("admin"), isAdmin, AdminProductController.deleteProduct);

// ===================== ORDER MANAGEMENT =====================
router.get("/orders", verifyToken("admin"), isAdmin, AdminOrderController.listAllOrders);
router.get("/orders/:id", verifyToken("admin"), isAdmin, AdminOrderController.getOrderById);
router.put("/orders/:id/status", verifyToken("admin"), isAdmin, AdminOrderController.updateOrderStatus);
router.patch("/orders/item/delivered", verifyToken("admin"), isAdmin, AdminOrderController.markItemDelivered);
router.delete("/orders/:id", verifyToken("admin"), isAdmin, AdminOrderController.softDeleteOrder);
router.get("/orders/:id/invoice", verifyToken("admin"), isAdmin, AdminOrderController.downloadAdminInvoice);
router.post("/orders/return/verify", verifyToken("admin"), isAdmin, AdminOrderController.verifyReturnRequest);

// ===================== INVENTORY MANAGEMENT =====================
router.get('/inventory', verifyToken("admin"), isAdmin, AdminInventoryController.getAllInventory);
router.post('/inventory/update', verifyToken("admin"), isAdmin, AdminInventoryController.updateProductStock);
router.get('/inventory/low-stock', verifyToken("admin"), isAdmin, AdminInventoryController.getLowStockProducts);
router.get('/inventory/report', verifyToken("admin"), isAdmin, AdminInventoryController.getInventoryReport);

// ===================== COUPON MANAGEMENT =====================
router.post("/coupons/create", verifyToken("admin"), isAdmin, AdminCouponController.createCoupon);
router.get("/coupons", verifyToken("admin"), isAdmin, AdminCouponController.getCoupons);
router.get("/coupons/:couponId", verifyToken("admin"), isAdmin, AdminCouponController.getCouponById);
router.put("/coupons/:couponId/update", verifyToken("admin"), isAdmin, AdminCouponController.updateCoupon);
router.delete("/coupons/:couponId/delete", verifyToken("admin"), isAdmin, AdminCouponController.deleteCoupon);

// ===================== OFFER MANAGEMENT =====================
router.post("/offers/create", verifyToken("admin"), isAdmin, AdminOfferController.createOffer);
router.get("/offers", verifyToken("admin"), isAdmin, AdminOfferController.getOffers);
router.get("/offers/:offerId", verifyToken("admin"), isAdmin, AdminOfferController.getOfferById);
router.put("/offers/:offerId/update", verifyToken("admin"), isAdmin, AdminOfferController.updateOffer);
router.put("/offers/:offerId/toggle-referral", verifyToken("admin"), isAdmin, AdminOfferController.toggleReferralOffer);
router.post("/offers/referrals", verifyToken("admin"), isAdmin, AdminOfferController.getReferralOffers);

// ===================== SALES REPORT =====================
router.get("/sales-report", verifyToken("admin"), isAdmin, salesReportController.getSalesReport); // Fetch report data (dashboard view)
router.get("/sales-report/pdf", verifyToken("admin"), isAdmin, salesReportController.generateSalesReportPDF); // Download PDF
router.get("/sales-report/excel", verifyToken("admin"), isAdmin, salesReportController.generateSalesReportExcel); // Download Excel



export default router;
