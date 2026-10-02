# Jewellery E-commerce (MERN + Vite)

Production-style full-stack jewellery ecommerce scaffold with:
- `frontend`: React + Vite + Bootstrap premium black/gold UI
- `backend`: Node.js + Express + MongoDB with MVC architecture

## Folder Structure

```text
jewellery/
  backend/
    src/
      config/
      controllers/
      middleware/
      models/
      routes/
      utils/
      data/
      app.js
      server.js
      seed.js
  frontend/
    src/
      pages/
      services/
      App.jsx
      main.jsx
```

## Backend MVC Modules

- **Models**: `User`, `Product`, `Cart`, `Wishlist`, `Order`
- **Controllers**:
  - `authController` (register, login, logout, forgot/reset, profile)
  - `productController` (list, filter, product details, review)
  - `shopController` (cart, wishlist, order, recommendation, admin dashboard/CRUD)
- **Routes**:
  - `/api/auth`
  - `/api/products`
  - `/api/shop`
- **Middleware**:
  - `protect`, `adminOnly`
  - centralized error middleware

## API Endpoints

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password/:token`
- `GET /api/auth/profile`

### Products (Buyer)
- `GET /api/products?search=&category=&material=&purity=&minPrice=&maxPrice=`
- `GET /api/products/:slug`
- `POST /api/products/:id/reviews`

### Buyer Store Features
- `GET /api/shop/cart`
- `PUT /api/shop/cart`
- `DELETE /api/shop/cart/:productId`
- `GET /api/shop/wishlist`
- `PUT /api/shop/wishlist`
- `POST /api/shop/orders`
- `GET /api/shop/recommendations`

### Admin
- `GET /api/shop/admin/overview`
- `GET /api/shop/admin/users`
- `DELETE /api/shop/admin/users/:id`
- `POST /api/shop/admin/products`
- `PUT /api/shop/admin/products/:id`
- `DELETE /api/shop/admin/products/:id`
- `PATCH /api/shop/admin/orders/:id`

## Database Schema (Core Fields)

### Product
- name, slug, price, category
- material, purity, weight
- images[], description, stock
- rating, numReviews, reviews[]

### User
- name, email, password (hashed), role
- avatar, resetToken, resetTokenExpires

### Order
- user, items[], shippingAddress
- paymentMethod/paymentResult
- itemsPrice, taxPrice, shippingPrice, totalPrice
- orderStatus (`pending`, `shipped`, `delivered`)

## Setup Instructions

1. **Clone / open project**
2. **Backend env**
   - Copy `backend/.env.example` to `backend/.env`
   - Fill MongoDB, JWT, SMTP, Cloudinary, Razorpay keys
3. **Install dependencies**
   - `cd backend && npm install`
   - `cd ../frontend && npm install`
4. **Seed products**
   - `cd backend && npm run seed`
5. **Run backend**
   - `npm run dev`
6. **Run frontend**
   - `cd ../frontend`
   - `npm run dev`
7. Open `http://localhost:5173`

## Notes for Production Hardening

- Implemented now:
  - Security middleware: `helmet`, `express-rate-limit`, `express-mongo-sanitize`, `hpp`
  - Request validation middleware with `express-validator` on auth/cart/wishlist/order/review routes
  - Protected frontend routes (buyer/admin role checks)
  - Centralized auth state with context provider
  - User-friendly toast notifications for auth and cart actions
- Next production upgrades:
  - Replace demo recommendation logic with ML service or vector search
  - Add Cloudinary upload route using `multer` + `cloudinary`
  - Add refresh tokens + CSRF token strategy
  - Integrate full Razorpay order verification webhook flow
