import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { IconHeart } from "../components/Icons";
import PaginationBar from "../components/PaginationBar";
import { addToCart, getProducts, getWishlist, toggleWishlist } from "../services/api";
import { refreshShopBadges } from "../shopBadgesRefresh";
import useAuth from "../context/useAuth";

function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(() => ({
    search: "",
    category: "",
    material: "",
    purity: "",
    minPrice: "",
    maxPrice: "",
    pageSize: "12",
  }));
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 12 });
  const [wishlistIds, setWishlistIds] = useState([]);
  const { token, isAdmin } = useAuth();

  const fetchProducts = async (nextFilters) => {
    setLoading(true);
    try {
      const { pageSize, page, ...rest } = nextFilters;
      const params = Object.fromEntries(Object.entries(rest).filter(([, value]) => value !== ""));
      const limit = Math.min(100, Math.max(1, parseInt(pageSize || "12", 10) || 12));
      const pageNum = Math.max(1, parseInt(page || "1", 10) || 1);
      params.page = pageNum;
      params.limit = limit;
      const res = await getProducts(params);
      setProducts(res.data.products || []);
      const p = res.data.pagination;
      if (p) {
        setPagination(p);
      } else {
        setPagination({
          page: pageNum,
          limit,
          total: res.data.products?.length || 0,
          pages: 1,
        });
      }
    } catch {
      setProducts([]);
      setPagination({ page: 1, pages: 1, total: 0, limit: 12 });
    } finally {
      setLoading(false);
    }
  };

  const hasActiveFilters = useMemo(
    () =>
      ["search", "category", "material", "purity", "minPrice", "maxPrice"].some(
        (key) => (searchParams.get(key) || "") !== ""
      ),
    [searchParams]
  );

  const categoryTiles = useMemo(
    () => [
      { key: "rings", label: "Rings", query: { category: "rings" } },
      { key: "earrings", label: "Earrings", query: { category: "earrings" } },
      { key: "necklaces", label: "Necklaces", query: { category: "necklaces" } },
      { key: "bracelets", label: "Bracelets", query: { category: "bracelets" } },
      { key: "pendants", label: "pendants", query: { category: "pendants" } },
      { key: "daily-wear", label: "Daily Wear", query: { purity: "22k" } },
    ],
    []
  );

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const res = await getProducts({ page: 1, limit: 200 });
        setAllProducts(res.data.products || []);
      } catch {
        setAllProducts([]);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const nextFilters = {
      search: searchParams.get("search") || "",
      category: searchParams.get("category") || "",
      material: searchParams.get("material") || "",
      purity: searchParams.get("purity") || "",
      minPrice: searchParams.get("minPrice") || "",
      maxPrice: searchParams.get("maxPrice") || "",
      page: searchParams.get("page") || "1",
      pageSize: searchParams.get("pageSize") || "12",
    };
    const syncTimer = setTimeout(() => {
      setFilters(nextFilters);
    }, 0);
    const timer = setTimeout(() => {
      fetchProducts(nextFilters);
    }, 0);
    return () => {
      clearTimeout(syncTimer);
      clearTimeout(timer);
    };
  }, [searchParams]);

  useEffect(() => {
    if (!token || isAdmin) {
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
  }, [token, isAdmin]);

  useEffect(() => {
    if (loading || !hasActiveFilters) return;
    const id = requestAnimationFrame(() => {
      document.getElementById("product-results")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => cancelAnimationFrame(id);
  }, [loading, hasActiveFilters, searchParams]);

  const applyFilters = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== "" && key !== "page" && key !== "pageSize") params.set(key, value);
    });
    if (filters.pageSize) params.set("pageSize", filters.pageSize);
    params.set("page", "1");
    setSearchParams(params);
  };

  const clearFilters = () => {
    const reset = { search: "", category: "", material: "", purity: "", minPrice: "", maxPrice: "", pageSize: "12" };
    setFilters(reset);
    setSearchParams(new URLSearchParams());
  };

  const goToProductPage = (p) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", String(p));
    setSearchParams(params);
  };

  const onAddToCart = async (productId) => {
    if (!token) return toast.error("Please login first");
    await addToCart(token, { productId, qty: 1 });
    toast.success("Added to cart");
    refreshShopBadges();
  };

  const onToggleWishlist = async (productId) => {
    if (!token) return toast.error("Please login first");
    await toggleWishlist(token, { productId });
    setWishlistIds((prev) => (prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]));
    toast.success(wishlistIds.includes(productId) ? "Removed from wishlist" : "Added to wishlist");
    refreshShopBadges();
  };

  const pickImageByCategory = (tile) => {
    const list = allProducts.length ? allProducts : products;
    if (!list.length) return "";
    const matched = list.find((item) => {
      const byCategory = tile.query.category ? item.category === tile.query.category : true;
      const byMaterial = tile.query.material ? item.material === tile.query.material : true;
      const byPurity = tile.query.purity ? item.purity === tile.query.purity : true;
      return byCategory && byMaterial && byPurity;
    });
    return matched?.images?.[0] || list[0]?.images?.[0] || "";
  };

  const onCategoryClick = (tile) => {
    const params = new URLSearchParams();
    Object.entries(tile.query).forEach(([key, value]) => params.set(key, value));
    params.set("page", "1");
    const ps = searchParams.get("pageSize");
    if (ps) params.set("pageSize", ps);
    setSearchParams(params);
  };

  return (
    <div>
      <section className="hero-banner p-4 mb-4 text-center">
        <h1>Khodiyar Jewellery Collection</h1>
      </section>

      <section className="category-tile-wrap mb-4">
        <h3 className="section-heading">Shop By Category</h3>
        <div className="row g-3">
          {categoryTiles.map((tile) => (
            <div className="col-6 col-md-2" key={tile.key}>
              <button type="button" className="category-card card p-0" onClick={() => onCategoryClick(tile)}>
                <img src={pickImageByCategory(tile)} alt={tile.label} />
                <div className="py-2">{tile.label}</div>
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="card p-3 mb-4 filter-panel">
        <form className="row g-2 align-items-end" onSubmit={applyFilters}>
          <div className="col-md-3">
            <label className="form-label">Quick Search</label>
            <input
              className="form-control"
              placeholder="Name/category"
              value={filters.search}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
            />
          </div>
          <div className="col-md-2">
            <label className="form-label">Category</label>
            <select className="form-select" value={filters.category} onChange={(e) => setFilters((prev) => ({ ...prev, category: e.target.value }))}>
              <option value="">All</option>
              <option value="rings">Rings</option>
              <option value="necklaces">Necklaces</option>
              <option value="bracelets">Bracelets</option>
              <option value="earrings">Earrings</option>
            </select>
          </div>
          <div className="col-md-2">
            <label className="form-label">Material</label>
            <select className="form-select" value={filters.material} onChange={(e) => setFilters((prev) => ({ ...prev, material: e.target.value }))}>
              <option value="">All</option>
              <option value="gold">Gold</option>
              <option value="diamond">Diamond</option>
              <option value="silver">Silver</option>
              <option value="platinum">Platinum</option>
            </select>
          </div>
          <div className="col-md-2">
            <label className="form-label">Purity</label>
            <select className="form-select" value={filters.purity} onChange={(e) => setFilters((prev) => ({ ...prev, purity: e.target.value }))}>
              <option value="">All</option>
              <option value="24k">24k</option>
              <option value="22k">22k</option>
              <option value="18k">18k</option>
              <option value="14k">14k</option>
            </select>
          </div>
          <div className="col-md-1">
            <label className="form-label">Min</label>
            <input className="form-control" type="number" value={filters.minPrice} onChange={(e) => setFilters((prev) => ({ ...prev, minPrice: e.target.value }))} />
          </div>
          <div className="col-md-1">
            <label className="form-label">Max</label>
            <input className="form-control" type="number" value={filters.maxPrice} onChange={(e) => setFilters((prev) => ({ ...prev, maxPrice: e.target.value }))} />
          </div><div><br></br></div>
          <div className="col-md-1 d-flex gap-2">
            <button className="btn btn-outline-warning" type="submit">Go</button>
          </div>
          <div className="col-md-2">
            <button className="btn btn-outline-warning" type="button" onClick={clearFilters}>Reset</button>
          </div>
          <div className="col-md-2">
            <label className="form-label">Per page</label>
            <select
              className="form-select"
              value={filters.pageSize || "12"}
              onChange={(e) => {
                const v = e.target.value;
                setFilters((prev) => ({ ...prev, pageSize: v }));
                const params = new URLSearchParams(searchParams);
                params.set("pageSize", v);
                params.set("page", "1");
                setSearchParams(params);
              }}
            >
              <option value="9">9</option>
              <option value="12">12</option>
              <option value="24">24</option>
              <option value="36">36</option>
            </select>
          </div>
        </form>
      </section>

      {loading ? <p>Loading products...</p> : null}
      <section id="product-results" className="product-results-section">
        <h3 className="section-heading">Trending Products</h3>
        <div className="row g-4">
        {!loading && products.length === 0 ? <p className="text-muted">No products match your filters.</p> : null}
        {products.map((item) => (
          <div className="col-md-4" key={item._id}>
            <div className="card product-card h-100">
              <img src={item.images?.[0]} className="card-img-top" alt={item.name} />
              <div className="card-body">
                <h5>{item.name}</h5>
                <p>{item.material.toUpperCase()} | {item.purity}</p>
                <p>Rs. {item.price}</p>
                <div className="d-flex gap-2 flex-wrap">
                  <Link className="btn btn-outline-warning" to={`/products/${item.slug}`}>View Details</Link>
                  {!isAdmin ? (
                    <>
                      <button type="button" className="btn btn-outline-warning" onClick={() => onAddToCart(item._id)}>
                        Add to Cart
                      </button>
                      <button
                        type="button"
                        className={`btn btn-outline-light icon-btn heart-btn ${wishlistIds.includes(item._id) ? "active" : ""}`}
                        onClick={() => onToggleWishlist(item._id)}
                        title="Wishlist"
                      >
                        <IconHeart filled={wishlistIds.includes(item._id)} className="action-icon-svg" />
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        ))}
        </div>
        {!loading && pagination.total > 0 ? (
          <div className="mt-4 d-flex justify-content-center">
            <PaginationBar
              page={pagination.page}
              pages={pagination.pages}
              total={pagination.total}
              limit={pagination.limit}
              onPageChange={goToProductPage}
            />
          </div>
        ) : null}
      </section>
    </div>
  );
}

export default HomePage;
