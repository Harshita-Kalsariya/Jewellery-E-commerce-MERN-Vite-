import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import HomePage from "./pages/HomePage";
import AuthPage from "./pages/AuthPage";
import ProfilePage from "./pages/ProfilePage";
import AdminPage from "./pages/AdminPage";
import ProductPage from "./pages/ProductPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import CartPage from "./pages/CartPage";
import WishlistPage from "./pages/WishlistPage";
import CheckoutPage from "./pages/CheckoutPage";
import { IconHeart, IconShoppingBag, IconUserCircle } from "./components/Icons";
import ProtectedRoute from "./components/ProtectedRoute";
import useAuth from "./context/useAuth";
import api, { getCart, getWishlist } from "./services/api";
import { SHOP_BADGES_EVENT } from "./shopBadgesRefresh";

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isAdmin, user, logoutUser, token } = useAuth();
  const [searchText, setSearchText] = useState("");
  const [cartQty, setCartQty] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);

  const loadShopBadges = useCallback(async () => {
    if (!token || isAdmin) {
      setCartQty(0);
      setWishlistCount(0);
      return;
    }
    try {
      const [cartRes, wishRes] = await Promise.all([getCart(token), getWishlist(token)]);
      const items = cartRes.data?.cart?.items || [];
      const totalQty = items.reduce((sum, row) => sum + (Number(row.qty) || 1), 0);
      setCartQty(totalQty);
      const w = wishRes.data?.wishlist?.products || [];
      setWishlistCount(w.length);
    } catch {
      setCartQty(0);
      setWishlistCount(0);
    }
  }, [token, isAdmin]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      loadShopBadges();
    }, 0);
    return () => window.clearTimeout(t);
  }, [loadShopBadges, location.pathname]);

  useEffect(() => {
    const onRefresh = () => {
      window.setTimeout(() => loadShopBadges(), 0);
    };
    window.addEventListener(SHOP_BADGES_EVENT, onRefresh);
    return () => window.removeEventListener(SHOP_BADGES_EVENT, onRefresh);
  }, [loadShopBadges]);

  const categories = useMemo(
    () => [
      { label: "Diamond", material: "diamond" },
      { label: "Silver", material: "silver" },
      { label: "Gold", material: "gold" },
      { label: "Earrings", category: "earrings" },
      { label: "Necklace Sets", category: "necklaces" },
      { label: "Pendants", category: "pendants" },
      { label: "Bracelets", category: "bracelets" },
      { label: "Rings", category: "rings" },
      { label: "Everyday Essentials", purity: "22k" },
    ],
    []
  );

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // no-op
    } finally {
      logoutUser();
    }
  };

  const onSearchSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchText.trim()) params.set("search", searchText.trim());
    params.set("page", "1");
    navigate(`/?${params.toString()}`);
  };

  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/");
  };

  return (
    <div className="app-shell">
      <header className="lux-header">
        <div className="container top-header d-flex justify-content-between align-items-center py-3 gap-3">
          <Link to="/" className="brand">KHODIYAR JEWELLERS</Link>
          <form className="search-form" onSubmit={onSearchSubmit}>
            <input
              className="form-control search-input"
              placeholder="Search for rings, necklaces, diamond..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </form>
          <nav className="d-flex gap-3 nav-icons align-items-center">
            {isAuthenticated ? (
              <Link to="/profile" className="profile-chip" title={user?.name || "Profile"}>
                {user?.avatar ? (
                  <img src={user.avatar} alt="" className="profile-avatar" />
                ) : (
                  <span className="profile-icon-fallback" aria-hidden>
                    <IconUserCircle />
                  </span>
                )}
                <span className="profile-nav-name">{user?.name || "Profile"}</span>
              </Link>
            ) : null}
            {isAuthenticated && !isAdmin ? (
              <Link
                to="/cart"
                className={`nav-icon-link nav-icon-with-badge ${cartQty > 0 ? "nav-icon-has-cart" : ""}`}
                title={cartQty > 0 ? `Cart (${cartQty} items)` : "Cart"}
                aria-label={cartQty > 0 ? `Cart, ${cartQty} items` : "Cart"}
              >
                <span className="nav-icon-stack">
                  <IconShoppingBag />
                  {cartQty > 0 ? (
                    <span className="nav-badge" aria-hidden>
                      {cartQty > 99 ? "99+" : cartQty}
                    </span>
                  ) : null}
                </span>
              </Link>
            ) : null}
            {isAuthenticated && !isAdmin ? (
              <Link
                to="/wishlist"
                className={`nav-icon-link nav-icon-with-badge ${wishlistCount > 0 ? "nav-icon-has-wishlist" : ""}`}
                title={wishlistCount > 0 ? `Wishlist (${wishlistCount})` : "Wishlist"}
                aria-label={wishlistCount > 0 ? `Wishlist, ${wishlistCount} saved` : "Wishlist"}
              >
                <span className="nav-icon-stack">
                  <IconHeart filled={wishlistCount > 0} />
                </span>
              </Link>
            ) : null}
            {isAuthenticated && isAdmin ? <Link to="/admin">Admin Panel</Link> : null}
            {!isAuthenticated ? <Link to="/auth">Login</Link> : <button className="btn btn-sm btn-warning" onClick={handleLogout}>Logout</button>}
          </nav>
        </div>
        <div className="category-nav-wrap">
          <div className="container category-nav d-flex gap-4">
            {categories.map((item) => {
              const params = new URLSearchParams();
              if (item.category) params.set("category", item.category);
              if (item.material) params.set("material", item.material);
              if (item.purity) params.set("purity", item.purity);
              return (
                <Link key={item.label} to={`/?${params.toString()}`} className="category-link">
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      <main className="container py-4">
        {location.pathname !== "/" ? (
          <button type="button" className="btn btn-outline-light btn-sm mb-3" onClick={goBack}>
            {"\u2190"} Back
          </button>
        ) : null}
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute adminOnly><AdminPage /></ProtectedRoute>} />
          <Route path="/cart" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
          <Route path="/wishlist" element={<ProtectedRoute><WishlistPage /></ProtectedRoute>} />
          <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
          <Route path="/products/:slug" element={<ProductPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        </Routes>
      </main>

      <footer className="lux-footer">
        <div className="container py-4 d-flex justify-content-between flex-wrap gap-3">
          <div><h6>About</h6><p>Premium handcrafted jewellery for modern elegance. You can Book Appoinment for buying jewellery at our shop by calling on +91 95581 74674.</p></div>
          <div><h6>Address</h6><p>2/2/5, Rambalram Nagar,Chandlodiya,Ahmedabad, Gujarat 382481,India</p></div>
          <div><h6>Contact</h6><p>khodiyarjewellers30@gmail.com | +91 95581 74674</p></div>
        </div>
      </footer>
      <ToastContainer position="top-right" autoClose={2500} />
    </div>
  );
}

export default App;
