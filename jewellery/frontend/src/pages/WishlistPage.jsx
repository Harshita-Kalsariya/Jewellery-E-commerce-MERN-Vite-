import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { getWishlist, toggleWishlist } from "../services/api";
import { refreshShopBadges } from "../shopBadgesRefresh";
import useAuth from "../context/useAuth";

function WishlistPage() {
  const { token } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadWishlist = useCallback(async () => {
    if (!token) return;
    const res = await getWishlist(token);
    setProducts(res.data?.wishlist?.products || []);
  }, [token]);

  useEffect(() => {
    if (!token) return;
    const timer = setTimeout(() => {
      loadWishlist()
        .catch(() => toast.error("Failed to load wishlist"))
        .finally(() => setLoading(false));
    }, 0);
    return () => clearTimeout(timer);
  }, [loadWishlist, token]);

  const onRemove = async (productId) => {
    await toggleWishlist(token, { productId });
    await loadWishlist();
    toast.success("Removed from wishlist");
    refreshShopBadges();
  };

  if (loading) return <p>Loading wishlist...</p>;

  return (
    <div>
      <h2 className="mb-3">My Wishlist</h2>
      {!products.length ? (
        <p>Your wishlist is empty.</p>
      ) : (
        products.map((product) => (
          <div className="card p-3 mb-2" key={product._id}>
            <div className="d-flex justify-content-between align-items-center gap-3 flex-wrap">
              <div>
                <h6 className="mb-1">{product.name}</h6>
                <small>Rs. {product.price}</small>
              </div>
              <div className="d-flex gap-2">
                <Link className="btn btn-outline-warning btn-sm" to={`/products/${product.slug}`}>
                  View
                </Link>
                <button className="btn btn-outline-danger btn-sm" onClick={() => onRemove(product._id)}>
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default WishlistPage;
