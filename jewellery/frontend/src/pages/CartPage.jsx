import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { IconHeart } from "../components/Icons";
import { addToCart, getCart, getWishlist, removeCartItem, toggleWishlist } from "../services/api";
import { refreshShopBadges } from "../shopBadgesRefresh";
import useAuth from "../context/useAuth";

function CartPage() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wishlistIds, setWishlistIds] = useState([]);

  const loadCart = useCallback(async () => {
    if (!token) return;
    const res = await getCart(token);
    setItems(res.data?.cart?.items || []);
  }, [token]);

  useEffect(() => {
    if (!token) return;
    const timer = setTimeout(() => {
      loadCart()
        .catch(() => toast.error("Failed to load cart"))
        .finally(() => setLoading(false));
    }, 0);
    return () => clearTimeout(timer);
  }, [loadCart, token]);

  useEffect(() => {
    if (!token) {
      const timer = setTimeout(() => setWishlistIds([]), 0);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(async () => {
      try {
        const res = await getWishlist(token);
        const ids = (res.data?.wishlist?.products || []).map((product) => product._id);
        setWishlistIds(ids);
      } catch {
        setWishlistIds([]);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [token]);

  const totalPrice = useMemo(
    () => items.reduce((sum, item) => sum + (item.product?.price || 0) * (item.qty || 1), 0),
    [items]
  );

  const onQtyChange = async (productId, qty) => {
    await addToCart(token, { productId, qty: Number(qty) || 1 });
    await loadCart();
    refreshShopBadges();
  };

  const onRemove = async (productId) => {
    await removeCartItem(token, productId);
    await loadCart();
    toast.success("Removed from cart");
    refreshShopBadges();
  };

  const onToggleWishlist = async (productId) => {
    await toggleWishlist(token, { productId });
    setWishlistIds((prev) => (prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]));
    toast.success(wishlistIds.includes(productId) ? "Removed from wishlist" : "Added to wishlist");
    refreshShopBadges();
  };

  const onBuyNow = (item) => {
    navigate("/checkout", { state: { buyNowItem: item } });
  };

  if (loading) return <p>Loading cart...</p>;

  return (
    <div>
      <h2 className="mb-3">My Cart</h2>
      {!items.length ? (
        <p>Your cart is empty.</p>
      ) : (
        <>
          {items.map((item) => (
            <div className="card p-3 mb-2" key={item.product?._id || item._id}>
              <div className="d-flex justify-content-between align-items-center gap-3 flex-wrap">
                <div>
                  <h6 className="mb-1">{item.product?.name || "Product"}</h6>
                  <small>Rs. {item.product?.price || 0}</small>
                </div>
                <div className="d-flex gap-2 align-items-center flex-wrap">
                  <input
                    type="number"
                    min="1"
                    className="form-control"
                    style={{ width: 80 }}
                    value={item.qty || 1}
                    onChange={(e) => onQtyChange(item.product?._id, e.target.value)}
                  />
                  <button className="btn btn-outline-danger btn-sm" onClick={() => onRemove(item.product?._id)}>
                    Remove
                  </button>
                  <button className="btn btn-warning btn-sm" onClick={() => onBuyNow(item)}>
                    Buy Now
                  </button>
                  <button
                    className={`btn btn-outline-light icon-btn heart-btn ${wishlistIds.includes(item.product?._id) ? "active" : ""}`}
                    onClick={() => onToggleWishlist(item.product?._id)}
                    title="Wishlist"
                  >
                    <IconHeart filled={wishlistIds.includes(item.product?._id)} className="action-icon-svg" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          <div className="card p-3 mt-3">
            <h5 className="mb-0">Total: Rs. {totalPrice}</h5>
            <div className="mt-3">
              <Link to="/checkout" className="btn btn-warning">Proceed to Checkout</Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default CartPage;
