import { body, validationResult } from "express-validator";

export const validateUserSignup = [
  body("firstname").notEmpty().withMessage("First name is required"),
  body("lastname").notEmpty().withMessage("Last name is required"),
  body("email").isEmail().withMessage("Invalid email address"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/\d/)
    .withMessage("Password must contain at least one number")
    .matches(/[a-zA-Z]/)
    .withMessage("Password must contain letters"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

export const validateUserLogin = [
  body("email").isEmail().withMessage("Invalid email address"),
  body("password").notEmpty().withMessage("Password is required"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

export const validateForgotPassword = [
  body("email").isEmail().withMessage("Invalid email address"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

export const validateResetPassword = [
  body("otp").notEmpty().withMessage("OTP is required"),
  body("otpToken").notEmpty().withMessage("OTP token is required"),
  body("newPassword")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/\d/)
    .withMessage("Password must contain at least one number")
    .matches(/[a-zA-Z]/)
    .withMessage("Password must contain letters"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

export const validateProfileUpdate = [
  body("firstname").notEmpty().withMessage("First name is required"),
  body("lastname").notEmpty().withMessage("Last name is required"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

export const validateChangePassword = [
  body("oldPassword").notEmpty().withMessage("Old password is required"),
  body("newPassword")
    .isLength({ min: 8 })
    .withMessage("New password must be at least 8 characters")
    .matches(/\d/)
    .withMessage("New password must contain a number")
    .matches(/[a-zA-Z]/)
    .withMessage("New password must contain letters"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

export const validateEmailChangeRequest = [
  body("newEmail").isEmail().withMessage("A valid new email is required"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

export const validateConfirmEmailChange = [
  body("otp").notEmpty().withMessage("OTP is required"),
  body("emailChangeToken").notEmpty().withMessage("Token is required"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

export const validateAddress = [
  body("name").notEmpty().withMessage("Name is required"),
  body("phone").isNumeric().withMessage("Phone number is required"),
  body("place").notEmpty().withMessage("Place is required"),
  body("city").notEmpty().withMessage("City is required"),
  body("district").notEmpty().withMessage("District is required"),
  body("state").notEmpty().withMessage("State is required"),
  body("country").notEmpty().withMessage("Country is required"),
  body("pin").isNumeric().withMessage("PIN code must be numeric"),
  body("type").optional().isIn(["Home", "Office"]).withMessage("Invalid address type"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

export const validateUpdateAddress = [
  body("name").optional().notEmpty().withMessage("Name cannot be empty"),
  body("phone").optional().isNumeric().withMessage("Phone must be numeric"),
  body("place").optional().notEmpty().withMessage("Place cannot be empty"),
  body("city").optional().notEmpty().withMessage("City cannot be empty"),
  body("district").optional().notEmpty().withMessage("District cannot be empty"),
  body("state").optional().notEmpty().withMessage("State cannot be empty"),
  body("country").optional().notEmpty().withMessage("Country cannot be empty"),
  body("pin").optional().isNumeric().withMessage("PIN must be numeric"),
  body("type").optional().isIn(["Home", "Office"]).withMessage("Invalid address type"),
  body("isDefault").optional().isBoolean().withMessage("isDefault must be true or false"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

export const validateCheckout = (req, res, next) => {
  body('addressId')
    .notEmpty().withMessage("Address ID is required")
    .isMongoId().withMessage("Invalid address ID format")
    .run(req);

  body('discount')
    .optional()
    .isDecimal().withMessage("Discount must be a valid number")
    .run(req);

  body('cart')
    .isArray().withMessage("Cart should be an array of products.")
    .notEmpty().withMessage("Cart cannot be empty.")
    .run(req);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

export const placeOrderValidator = [
  body("items")
    .isArray()
    .withMessage("Items must be an array")
    .bail()
    .custom((value) => value.length > 0)
    .withMessage("Order must contain at least one item"),
  body("address_id")
    .isMongoId()
    .withMessage("Invalid address ID")
    .notEmpty()
    .withMessage("Address is required"),
  body("paymentMethod")
    .isIn(["COD", "Online"])
    .withMessage("Invalid payment method")
    .notEmpty()
    .withMessage("Payment method is required"),
];

// Validation for canceling an order or product
export const cancelOrderValidator = [
  body("orderID")
    .notEmpty()
    .withMessage("Order ID is required")
    .isString()
    .withMessage("Invalid Order ID format"),
  body("product_id")
    .optional()
    .isMongoId()
    .withMessage("Invalid Product ID format"),
  body("reason")
    .optional()
    .isString()
    .withMessage("Cancellation reason must be a string"),
];

// Validation for returning an order or product
export const returnOrderValidator = [
  body("orderID")
    .notEmpty()
    .withMessage("Order ID is required")
    .isString()
    .withMessage("Invalid Order ID format"),
  body("product_id")
    .isMongoId()
    .withMessage("Invalid Product ID format")
    .notEmpty()
    .withMessage("Product ID is required"),
  body("reason")
    .isString()
    .withMessage("Return reason is required")
    .notEmpty()
    .withMessage("Return reason cannot be empty"),
];