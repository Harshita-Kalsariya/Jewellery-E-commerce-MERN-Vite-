import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true,
});

export const getProducts = (params) => api.get("/products", { params });
export const getProduct = (slug) => api.get(`/products/${slug}`);
export const login = (body) => api.post("/auth/login", body);
export const register = (body) => api.post("/auth/register", body);
export const forgotPassword = (body) => api.post("/auth/forgot-password", body);
export const resetPassword = (token, body) => api.post(`/auth/reset-password/${token}`, body);
export const changePassword = (token, body) =>
  api.put("/auth/change-password", body, { headers: { Authorization: `Bearer ${token}` } });
export const getProfile = (token) =>
  api.get("/auth/profile", token ? { headers: { Authorization: `Bearer ${token}` } } : undefined);
export const getAdminOverview = (token) =>
  api.get("/shop/admin/overview", { headers: { Authorization: `Bearer ${token}` } });
export const getAdminTransactionReport = (token, days = 14) =>
  api.get("/shop/admin/reports/transactions", { params: { days }, headers: { Authorization: `Bearer ${token}` } });
export const getAdminOrders = (token, params) =>
  api.get("/shop/admin/orders", { params, headers: { Authorization: `Bearer ${token}` } });
export const addToCart = (token, body) =>
  api.put("/shop/cart", body, { headers: { Authorization: `Bearer ${token}` } });
export const getCart = (token) => api.get("/shop/cart", { headers: { Authorization: `Bearer ${token}` } });
export const removeCartItem = (token, productId) =>
  api.delete(`/shop/cart/${productId}`, { headers: { Authorization: `Bearer ${token}` } });
export const getWishlist = (token) => api.get("/shop/wishlist", { headers: { Authorization: `Bearer ${token}` } });
export const toggleWishlist = (token, body) =>
  api.put("/shop/wishlist", body, { headers: { Authorization: `Bearer ${token}` } });
export const createOrder = (token, body) => api.post("/shop/orders", body, { headers: { Authorization: `Bearer ${token}` } });
export const requestOrderCancel = (token, orderId, body = {}) =>
  api.patch(`/shop/orders/${orderId}/cancel`, body, { headers: { Authorization: `Bearer ${token}` } });
export const requestOrderReturn = (token, orderId, body = {}) =>
  api.patch(`/shop/orders/${orderId}/return`, body, { headers: { Authorization: `Bearer ${token}` } });
export const requestOrderExchange = (token, orderId, body = {}) =>
  api.patch(`/shop/orders/${orderId}/exchange`, body, { headers: { Authorization: `Bearer ${token}` } });
export const getAdminUsers = (token, params) =>
  api.get("/shop/admin/users", { params, headers: { Authorization: `Bearer ${token}` } });
export const deleteAdminUser = (token, userId) =>
  api.delete(`/shop/admin/users/${userId}`, { headers: { Authorization: `Bearer ${token}` } });
export const createAdminProduct = (token, body) =>
  api.post("/shop/admin/products", body, { headers: { Authorization: `Bearer ${token}` } });
export const updateAdminProduct = (token, productId, body) =>
  api.put(`/shop/admin/products/${productId}`, body, { headers: { Authorization: `Bearer ${token}` } });
export const deleteAdminProduct = (token, productId) =>
  api.delete(`/shop/admin/products/${productId}`, { headers: { Authorization: `Bearer ${token}` } });
export const updateAdminOrderStatus = (token, orderId, orderStatus) =>
  api.patch(
    `/shop/admin/orders/${orderId}`,
    { orderStatus },
    { headers: { Authorization: `Bearer ${token}` } }
  );

export default api;
