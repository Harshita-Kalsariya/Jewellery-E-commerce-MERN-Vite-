import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { IconHeart } from "../components/Icons";
import { addToCart, getProduct, getWishlist, toggleWishlist } from "../services/api";
import { refreshShopBadges } from "../shopBadgesRefresh";
import useAuth from "../context/useAuth";

function ProductPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [wishlisted, setWishlisted] = useState(false);
  const [qty, setQty] = useState(1);
  const { token, isAdmin } = useAuth();

  useEffect(() => {
    getProduct(slug).then((res) => setProduct(res.data.product));
  }, [slug]);

  useEffect(() => {
    if (!token || !product?._id || isAdmin) {
      const timer = setTimeout(() => setWishlisted(false), 0);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(async () => {
      try {
        const res = await getWishlist(token);
        const ids = (res.data?.wishlist?.products || []).map((item) => item._id);
        setWishlisted(ids.includes(product._id));
      } catch {
        setWishlisted(false);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [token, product?._id, isAdmin]);

  const onAddCart = async () => {
    if (!token) return toast.error("Please login first");
    await addToCart(token, { productId: product._id, qty, mode: "increment" });
    toast.success("Added to cart");
    refreshShopBadges();
  };

  const onBuyNow = async () => {
    if (!token) return toast.error("Please login first");
    await addToCart(token, { productId: product._id, qty, mode: "increment" });
    refreshShopBadges();
    navigate("/checkout", {
      state: {
        buyNowItem: {
          product: product,
          qty,
        },
      },
    });
  };

  const onToggleWishlist = async () => {
    if (!token) return toast.error("Please login first");
    await toggleWishlist(token, { productId: product._id });
    setWishlisted((prev) => !prev);
    toast.success(wishlisted ? "Removed from wishlist" : "Added to wishlist");
    refreshShopBadges();
  };

  if (!product) return <p>Loading...</p>;
  return (
    <div className="row">
      <div className="col-md-6"><img src={product.images?.[0]} alt={product.name} className="img-fluid rounded" /></div>
      <div className="col-md-6">
        <h2>{product.name}</h2>
        <p>{product.description}</p>
        <p>{product.material} | {product.purity} | {product.weight} gm</p>
        <h4>Rs. {product.price}</h4>
        <div className="card p-3 mb-3">
          <h6 className="mb-2">Return & Exchange Policy</h6>
          <ul className="mb-0 small">
            <li>Return/Exchange is available only after product is marked delivered.</li>
            <li>Buyer can request return or exchange within 10 days of delivery.</li>
            <li>Cancellation is allowed only before order is shipped.</li>
          </ul>
        </div>
        {!isAdmin ? (
          <div className="d-flex gap-2 align-items-center flex-wrap">
            <div className="d-flex align-items-center gap-2">
              <label className="mb-0 small">Qty</label>
              <input
                type="number"
                min="1"
                max="20"
                className="form-control"
                style={{ width: 90 }}
                value={qty}
                onChange={(e) => setQty(Math.min(20, Math.max(1, Number(e.target.value) || 1)))}
              />
            </div>
            <button className="btn btn-warning" onClick={onAddCart}>Add to Cart</button>
            <button className="btn btn-warning" onClick={onBuyNow}>Buy Now</button>
            <button className={`btn btn-outline-light icon-btn heart-btn ${wishlisted ? "active" : ""}`} onClick={onToggleWishlist} title="Wishlist">
              <IconHeart filled={wishlisted} className="action-icon-svg" />
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default ProductPage;
