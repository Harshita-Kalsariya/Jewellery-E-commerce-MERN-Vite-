# Internship Project Presentation Content

## Slide 1: Title Slide

**Project Title:** Jewellery E-commerce Web Application (MERN Stack)  
**Group ID:** [Enter Group ID]  
**Student Name & Roll No.:** [Enter Name] - [Enter Roll No.]  
**Program & Semester:** [Enter Program] - Semester [Enter Semester]  
**Institute:** K. S. School of Business Management & IT  
**University:** Gujarat University  
**Internship Organization:** [Enter Organization Name]  
**Guide / Mentor Name:** [Enter Guide Name]

---

## Slide 2: Introduction

- This internship project focuses on designing and developing a full-stack web-based jewellery e-commerce application.
- The project is developed under the **Software Development** domain.
- It provides a practical implementation of real-world online shopping features such as authentication, product browsing, cart, wishlist, and order placement.
- **Total Duration:** 120 Hours.

---

## Slide 3: Project Overview

**Project Name:** Jewellery E-commerce (MERN + Vite)  

**Purpose of the Software:**
- To provide a modern and secure online platform for browsing and purchasing jewellery products.
- To help users filter products by category, material, purity, and price.
- To provide separate functionality for buyers and admin.

**Target Users:**
- General customers (buyers)
- Admin / store manager

---

## Slide 4: Scope of the Project

**Features Included:**
- User registration, login, logout, forgot/reset password
- Product listing with advanced filtering and search
- Product details and review system
- Cart and wishlist management
- Order placement and status tracking
- Admin dashboard, user management, and product CRUD

**User Roles:**
- **Buyer:** browse products, manage cart/wishlist, place orders, add reviews
- **Admin:** manage users, products, and order status

**Limitations:**
- Recommendation system is currently basic/demo logic.
- Full payment verification webhook integration is not completed.
- Cloud image upload and refresh-token based session strategy are future enhancements.

---

## Slide 5: Software Development Methodology

**SDLC Model Used:** Agile (Incremental Development)

**Phase-wise Explanation:**
1. **Requirement Analysis:** Identified ecommerce requirements and role-based functionalities.
2. **System Design:** Prepared frontend-backend architecture and database schema design.
3. **Development:** Implemented modules in phases (auth, product, cart, wishlist, orders, admin).
4. **Testing:** Performed endpoint testing, UI flow testing, and role-based route protection checks.
5. **Deployment Preparation:** Added security middleware and production hardening checkpoints.

---

## Slide 6: Frontend Design

**Frontend Technology Used:**
- HTML5
- CSS3
- JavaScript (ES6+)
- React (with Vite)
- Bootstrap

**UI Design Highlights:**
- Premium black-gold themed responsive interface
- Reusable React components and page-based structure
- Toast notifications for better user feedback

**User Interaction Flow:**
1. User registers/logs in
2. Browses and filters products
3. Views product details and reviews
4. Adds items to cart/wishlist
5. Places order and tracks status

---

## Slide 7: Backend Design

**Backend Technology Used:**
- Node.js
- Express.js
- MongoDB with Mongoose

**Business Logic:**
- Authentication with JWT and role-based authorization
- Product and review management
- Cart, wishlist, and order workflows
- Admin operations for products, users, and order updates

**Server-side Processing:**
- MVC architecture (`models`, `controllers`, `routes`, `middleware`)
- Validation and sanitization of requests
- Centralized error handling and secure API response flow

---

## Slide 8: Database Design

**Database Used:** MongoDB

**Main Collections:**
- `users`
- `products`
- `orders`
- `carts`
- `wishlists`

**Data Flow (High Level):**
1. Frontend sends API request
2. Express routes direct request to controller
3. Controller applies business logic and accesses MongoDB via models
4. Response is returned to frontend for UI update

---

## Optional Extra Slides (Recommended)

### Slide 9: Security & Validation
- Helmet, rate limiting, mongo sanitization, HPP
- Input validation using express-validator
- Protected routes for buyer/admin access control

### Slide 10: Conclusion & Future Scope
- Project successfully demonstrates full-stack ecommerce workflow.
- Future scope: AI-based recommendations, complete payment verification, advanced analytics dashboard.

