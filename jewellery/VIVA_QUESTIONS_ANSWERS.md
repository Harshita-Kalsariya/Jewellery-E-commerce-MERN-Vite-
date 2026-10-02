# Viva Questions and Sample Answers (Project-Based)

## A) Basic Project Questions

1. **What is your project title and objective?**  
   **Answer:** My project is a Jewellery E-commerce Web Application built on the MERN stack. Its objective is to provide a secure, user-friendly platform where customers can browse, filter, and purchase jewellery online.

2. **Why did you choose this project?**  
   **Answer:** E-commerce is a practical real-world domain. This project allowed me to apply frontend, backend, database, and security concepts in one integrated system.

3. **Which domain does your internship project belong to?**  
   **Answer:** Software Development domain, specifically full-stack web application development.

4. **What are the main modules in your project?**  
   **Answer:** Authentication, product catalog, cart, wishlist, order management, reviews, and admin dashboard.

---

## B) Technical Stack Questions

5. **Which technologies are used in frontend?**  
   **Answer:** React with Vite, JavaScript, HTML, CSS, Bootstrap, Axios, React Router, and React Toastify.

6. **Which technologies are used in backend?**  
   **Answer:** Node.js, Express.js, Mongoose, JWT, bcrypt, and security middleware such as Helmet and rate limiter.

7. **Which database did you use and why?**  
   **Answer:** MongoDB. It is flexible, document-based, and integrates well with Node.js through Mongoose.

8. **What is MERN stack?**  
   **Answer:** MERN stands for MongoDB, Express.js, React, and Node.js. It is a full-stack JavaScript framework for web app development.

---

## C) Architecture & Design Questions

9. **Which architecture pattern did you follow?**  
   **Answer:** MVC architecture in backend. Models handle data, controllers handle business logic, and routes map API endpoints.

10. **Explain user roles in your system.**  
    **Answer:** There are two main roles: Buyer and Admin. Buyers can shop and place orders, while Admin can manage users, products, and order statuses.

11. **How does frontend communicate with backend?**  
    **Answer:** Frontend sends HTTP requests through Axios to REST APIs, and backend responds with JSON data.

12. **How is state handled in frontend?**  
    **Answer:** Authentication state is managed centrally using a context provider, and page-level state is handled using React hooks.

---

## D) Security & Validation Questions

13. **How did you secure your APIs?**  
    **Answer:** I used JWT-based authentication, role-based authorization middleware, and route protection for sensitive endpoints.

14. **Which security middleware is implemented?**  
    **Answer:** Helmet, express-rate-limit, express-mongo-sanitize, and HPP.

15. **How do you validate user input?**  
    **Answer:** Using express-validator on important routes such as authentication, cart, wishlist, orders, and reviews.

16. **How is password security maintained?**  
    **Answer:** Passwords are hashed using bcrypt before storing in the database.

---

## E) Database & Data Flow Questions

17. **Name important collections in your database.**  
    **Answer:** Users, Products, Orders, Carts, and Wishlists.

18. **How is order data stored?**  
    **Answer:** Order documents include user reference, item list, shipping details, pricing fields, payment details, and order status.

19. **Explain product filtering in your project.**  
    **Answer:** The product API supports filters like category, material, purity, search keyword, and price range through query parameters.

20. **How does data flow from UI to DB?**  
    **Answer:** UI action -> Axios API call -> Express route -> Controller logic -> Mongoose model -> MongoDB -> JSON response -> UI update.

---

## F) Testing, Challenges, and Improvement Questions

21. **How did you test your project?**  
    **Answer:** I tested role-based routes, API responses, form validation, and complete user flows like login to order placement.

22. **What challenges did you face?**  
    **Answer:** Managing role-based access and keeping frontend-backend data flow consistent were key challenges.

23. **How did you solve those challenges?**  
    **Answer:** By separating concerns using MVC, implementing reusable middleware, and testing each module incrementally.

24. **What are future improvements?**  
    **Answer:** Advanced recommendation engine, full payment webhook verification, and production-grade token refresh strategy.

---

## G) Quick One-Line Viva Answers

- **SDLC model used?** Agile incremental model.  
- **Total internship duration?** 120 hours.  
- **API style used?** RESTful APIs.  
- **Authentication type?** JWT token-based authentication.  
- **Main frontend framework?** React with Vite.  
- **Main backend framework?** Express on Node.js.  
- **Database type?** NoSQL (MongoDB).  
- **Primary objective?** Build a secure and scalable jewellery e-commerce platform.

---

## H) Smart Questions You Can Ask Viva Panel

1. For production deployment, should I prioritize payment verification or recommendation engine first?  
2. Which monitoring stack do you recommend for MERN projects in real deployment?  
3. What additional testing strategy should I add to strengthen this internship project for enterprise use?

