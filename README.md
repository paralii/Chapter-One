# Chapter One - E-commerce Platform

A full-stack e-commerce platform built with React (Frontend) and Node.js (Backend).

## 🚀 Features

- **User Management**: Authentication, profiles, addresses
- **Product Management**: Categories, inventory, offers
- **Shopping Experience**: Cart, wishlist, checkout
- **Order Management**: Order tracking, history
- **Payment Integration**: Razorpay, wallet system
- **Admin Dashboard**: Comprehensive admin panel
- **Real-time Updates**: Socket.io integration

## 🛠️ Tech Stack

### Frontend
- **React 18** with Vite
- **Redux Toolkit** for state management
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Axios** for API calls

### Backend
- **Node.js** with Express
- **MongoDB** with Mongoose
- **Redis** for caching
- **JWT** for authentication
- **Passport.js** for OAuth
- **Socket.io** for real-time features

## 📁 Project Structure

```
Chapter-One/
├── Frontend/          # React application
├── Backend/           # Node.js server
├── CODING_STANDARDS.md # Coding standards documentation
└── README.md          # This file
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- MongoDB
- Redis
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Chapter-One
   ```

2. **Install Frontend dependencies**
   ```bash
   cd Frontend
   npm install
   ```

3. **Install Backend dependencies**
   ```bash
   cd ../Backend
   npm install
   ```

4. **Environment Setup**
   - Copy `.env.example` to `.env` in both Frontend and Backend directories
   - Configure your environment variables

5. **Start Development Servers**
   ```bash
   # Terminal 1 - Backend
   cd Backend
   npm run dev
   
   # Terminal 2 - Frontend
   cd Frontend
   npm run dev
   ```

## 📋 Development Scripts

### Frontend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run format       # Format code with Prettier
npm run code:check   # Check code quality
npm run code:fix     # Fix code quality issues
```

### Backend
```bash
npm run dev          # Start development server with nodemon
npm start            # Start production server
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run format       # Format code with Prettier
npm run code:check   # Check code quality
npm run code:fix     # Fix code quality issues
```

## 🎯 Coding Standards

This project follows strict coding standards to ensure code quality and consistency. Please refer to [CODING_STANDARDS.md](./CODING_STANDARDS.md) for detailed guidelines.

### Key Standards
- **ESLint** configuration for code quality
- **Prettier** for consistent formatting
- **Consistent naming conventions**
- **Proper error handling**
- **Security best practices**

### Code Quality Commands
```bash
# Check code quality
npm run code:check

# Fix code quality issues automatically
npm run code:fix
```

## 🔧 Configuration Files

- **ESLint**: `.eslint.config.js` (Frontend & Backend)
- **Prettier**: `.prettierrc` (Frontend & Backend)
- **Git**: `.gitignore`

## 📚 API Documentation

### User Endpoints
- `POST /user/auth/signup` - User registration
- `POST /user/auth/login` - User login
- `GET /user/profile` - Get user profile
- `PUT /user/profile` - Update user profile

### Product Endpoints
- `GET /user/products` - Get products
- `GET /user/products/:id` - Get product details
- `GET /user/categories` - Get categories

### Admin Endpoints
- `POST /admin/auth/login` - Admin login
- `GET /admin/dashboard` - Admin dashboard
- `POST /admin/products` - Create product
- `PUT /admin/products/:id` - Update product

## 🧪 Testing

```bash
# Frontend tests
cd Frontend
npm test

# Backend tests
cd Backend
npm test
```

## 🚀 Deployment

### Frontend
```bash
cd Frontend
npm run build
# Deploy dist/ folder to your hosting service
```

### Backend
```bash
cd Backend
npm start
# Use PM2 or similar process manager for production
```

## 🤝 Contributing

1. Follow the coding standards outlined in [CODING_STANDARDS.md](./CODING_STANDARDS.md)
2. Ensure all tests pass
3. Run code quality checks before submitting
4. Follow conventional commit messages

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the [CODING_STANDARDS.md](./CODING_STANDARDS.md) for development guidelines
- Review existing issues and documentation
- Create a new issue with detailed information

## 🔄 Version History

- **v1.3** - Current version with comprehensive coding standards
- **v1.2** - Enhanced admin features
- **v1.1** - User management improvements
- **v1.0** - Initial release
