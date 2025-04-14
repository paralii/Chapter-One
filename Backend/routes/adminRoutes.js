import express from "express";
import { verifyToken, isAdmin } from "../middleware/authMiddleware.js";
import * as AdminController from "../controllers/adminController.js";
import * as categoryController from "../controllers/categoryController.js";
import * as productController from "../controllers/productController.js";
import * as inventoryController from "../controllers/inventoryController.js";
import * as orderController from "../controllers/orderController.js";
import * as couponController from "../controllers/couponController.js";
import * as categoryOfferController from "../controllers/categoryOfferController.js";
import * as productOfferController from "../controllers/productOfferController.js";
import * as salesReportController from "../controllers/salesReportController.js";
import * as referralController from "../controllers/referralController.js"; 
import * as walletController from "../controllers/walletControllers.js"; 

import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.post("/login", AdminController.adminLogin);
router.post("/logout", AdminController.adminLogout);
router.post("/refresh-token", AdminController.refreshAccessToken);

router.get("/users", verifyToken, isAdmin, AdminController.getAllUsers);
router.post("/users", verifyToken, isAdmin, AdminController.createUser);
router.get("/users/count", verifyToken, isAdmin, AdminController.userCount);
router.get("/users/:id", verifyToken, isAdmin, AdminController.getUserById);
router.put("/users/:id", verifyToken, isAdmin, AdminController.updateUser);
router.patch(
  "/users/:id/toggle-block",
  verifyToken,
  isAdmin,
  AdminController.toggleBlockUser
);
router.delete("/users/:id", verifyToken, isAdmin, AdminController.deleteUser);

router.get(
  "/categories",
  verifyToken,
  isAdmin,
  categoryController.getCategories
);
router.post(
  "/categories",
  verifyToken,
  isAdmin,
  categoryController.createCategory
);
router.put(
  "/categories/:id",
  verifyToken,
  isAdmin,
  categoryController.updateCategory
);
router.delete(
  "/categories/:id",
  verifyToken,
  isAdmin,
  categoryController.deleteCategory
);

router.get("/:category", categoryController.getBooksByCategory);

router.get("/products", verifyToken, isAdmin, productController.getProducts);
router.post(
  "/products",
  verifyToken,
  isAdmin,
  upload.array("images", 10),
  productController.createProduct
);
router.get(
  "/products/:id",
  verifyToken,
  isAdmin,
  productController.getProductById
);
router.put(
  "/products/:id",
  verifyToken,
  isAdmin,
  upload.array("images", 10),
  productController.updateProduct
);
router.patch(
  "/products/:id/toggle",
  verifyToken,
  isAdmin,
  productController.toggleProductListing
);

router.get("/orders", verifyToken, isAdmin, orderController.listOrdersAdmin);
router.put(
  "/orders/:id/status",
  verifyToken,
  isAdmin,
  orderController.updateOrderStatus
);
router.put(
  "/orders/:orderId/verify-return",
  verifyToken,
  isAdmin,
  orderController.verifyReturnRequest
);

router.get(
  "/inventory",
  verifyToken,
  isAdmin,
  inventoryController.getInventory
);
router.put(
  "/inventory/:id",
  verifyToken,
  isAdmin,
  inventoryController.updateStock
);
router.post(
  "/inventory/:id/add-stock",
  verifyToken,
  isAdmin,
  inventoryController.addStock
);

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
