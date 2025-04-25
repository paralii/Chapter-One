import express from "express";
import { verifyToken, isAdmin } from "../middlewares/authMiddleware.js";
import * as AdminAuthController from "../controllers/admin/adminAuthController";
import * as AdminCustomerController from "../controllers/admin/adminCustomerController";
import * as AdminCategoryController from "../controllers/admin/adminCategoryController";
import * as AdminProductController from "../controllers/admin/adminProductController";
import * as AdminOrderController from "../controllers/admin/adminOrderController.js";
import * as AdminInventoryController from '../controllers/admin/adminInventoryController.js';
import { upload, processImages } from "../middleware/uploadMiddleware.js";


const router = express.Router();

// ===================== ADMIN AUTHENTICATION =====================
router.post("/login", AdminAuthController.adminLogin);
router.post("/logout", AdminAuthController.adminLogout);
router.post("/refresh-token", AdminAuthController.refreshAdminToken);

// ===================== CUSTOMER MANAGEMENT =====================
router.get("/customers", verifyToken, isAdmin, AdminCustomerController.getAllCustomers);
router.get("/customers/:id", verifyToken, isAdmin, AdminCustomerController.getCustomerById);
router.get("/customers/count", verifyToken, isAdmin, AdminCustomerController.userCount);
router.post("/customers", verifyToken, isAdmin, AdminCustomerController.createCustomer);
router.patch("/customers/:id/toggle-block", verifyToken, isAdmin, AdminCustomerController.toggleBlockCustomer);
router.put("/customers/:id", verifyToken, isAdmin, AdminCustomerController.updateCustomer);
router.delete("/customers/:id", verifyToken, isAdmin, AdminCustomerController.deleteCustomer);

// ===================== CATEGORY MANAGEMENT =====================
router.get("/categories", verifyToken, isAdmin, AdminCategoryController.getCategories);
router.post("/categories", verifyToken, isAdmin, AdminCategoryController.createCategory);
router.put("/categories/:id", verifyToken, isAdmin, AdminCategoryController.updateCategory);
router.delete("/categories/:id", verifyToken, isAdmin, AdminCategoryController.deleteCategory);
router.get("/:category", AdminCategoryController.getBooksByCategory);

// ===================== PRODUCT MANAGEMENT =====================
router.get("/products", verifyToken, isAdmin, AdminProductController.getProducts);
router.post("/products",verifyToken, isAdmin, upload, processImages, AdminProductController.createProduct);
router.get("/products/:id",verifyToken, isAdmin, AdminProductController.getProductById);
router.put("/products/:id",verifyToken, isAdmin, upload, processImages, AdminProductController.updateProduct);
router.patch("/products/:id/toggle",verifyToken, isAdmin, AdminProductController.toggleProductListing);

// ===================== ORDER MANAGEMENT =====================
router.get("/orders", verifyToken, isAdmin, AdminOrderController.listAllOrders);
router.get("/orders/:id", verifyToken, isAdmin, AdminOrderController.getOrderById);
router.patch("/orders/:id/status", verifyToken, isAdmin, AdminOrderController.updateOrderStatus);
router.patch("/orders/item/delivered", verifyToken, isAdmin, AdminOrderController.markItemDelivered);
router.delete("/orders/:id", verifyToken, isAdmin, AdminOrderController.softDeleteOrder);
router.get("/orders/:id/invoice", verifyToken, isAdmin, AdminOrderController.downloadAdminInvoice);
router.post("/orders/return/verify", verifyToken, isAdmin, AdminOrderController.verifyReturnRequest);

// ===================== INVENTORY MANAGEMENT =====================
router.get('/', verifyToken, isAdmin, AdminInventoryController.getAllInventory);
router.post('/update', verifyToken, isAdmin, AdminInventoryController.updateProductStock);
router.get('/low-stock', verifyToken, isAdmin, AdminInventoryController.getLowStockProducts);
router.get('/report', verifyToken, isAdmin, AdminInventoryController.getInventoryReport);


router.post("/coupons/create", verifyToken, isAdmin, couponController.createCoupon);
router.delete("/coupons/:id", verifyToken, isAdmin, couponController.deleteCoupon);

router.get("/product-offers", productOfferController.getProductOffers);
router.post(
  "/product-offer",
  verifyToken,
  isAdmin,
  productOfferController.createProductOffer
);
router.delete(
  "/product-offer/:id",
  verifyToken,
  isAdmin,
  productOfferController.deleteProductOffer
);

router.get("/category-offers", categoryOfferController.getCategoryOffers);
router.post(
  "/category-offer",
  verifyToken,
  isAdmin,
  categoryOfferController.createCategoryOffer
);
router.delete(
  "/category-offer/:id",
  verifyToken,
  isAdmin,
  categoryOfferController.deleteCategoryOffer
);

router.get("/daily", verifyToken, isAdmin, salesReportController.getDailySales);
router.get(
  "/weekly",
  verifyToken,
  isAdmin,
  salesReportController.getWeeklySales
);
router.get(
  "/yearly",
  verifyToken,
  isAdmin,
  salesReportController.getYearlySales
);
router.get(
  "/custom",
  verifyToken,
  isAdmin,
  salesReportController.getCustomSales
);
router.get("/", verifyToken, isAdmin, salesReportController.getSalesReport);
router.get(
  "/download/pdf",
  verifyToken,
  isAdmin,
  salesReportController.downloadSalesReportPdf
);
router.get(
  "/download/excel",
  verifyToken,
  isAdmin,
  salesReportController.downloadSalesReportExcel
);
router.post("/referral/generate-coupon", verifyToken, isAdmin, referralController.generateReferralCoupon);

router.get("/wallet/:userId", verifyToken, isAdmin, walletController.getWalletByUserId);
router.get("/wallet/:userId/transactions", verifyToken, isAdmin, walletController.getWalletTransactionsByUserId);


export default router;
