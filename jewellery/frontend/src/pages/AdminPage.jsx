import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import PaginationBar from "../components/PaginationBar";
import {
  createAdminProduct,
  deleteAdminProduct,
  deleteAdminUser,
  getAdminOrders,
  getAdminOverview,
  getAdminTransactionReport,
  getAdminUsers,
  getProducts,
  updateAdminOrderStatus,
  updateAdminProduct,
} from "../services/api";
import useAuth from "../context/useAuth";

const PAGE_SIZE_USERS = 6;
const PAGE_SIZE_ORDERS = 6;
const PAGE_SIZE_PRODUCTS = 6;

function AdminPage() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [metrics, setMetrics] = useState(null);
  const [report, setReport] = useState(null);
  const [reportDays, setReportDays] = useState(14);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProductId, setEditingProductId] = useState(null);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const { token } = useAuth();

  const [usersPage, setUsersPage] = useState(1);
  const [usersPagination, setUsersPagination] = useState({ page: 1, pages: 1, total: 0, limit: PAGE_SIZE_USERS });
  const [userSearchInput, setUserSearchInput] = useState("");
  const [userSearchQuery, setUserSearchQuery] = useState("");

  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersPagination, setOrdersPagination] = useState({ page: 1, pages: 1, total: 0, limit: PAGE_SIZE_ORDERS });
  const [orderSearchInput, setOrderSearchInput] = useState("");
  const [orderSearchQuery, setOrderSearchQuery] = useState("");

  const [productsPage, setProductsPage] = useState(1);
  const [productsPagination, setProductsPagination] = useState({ page: 1, pages: 1, total: 0, limit: PAGE_SIZE_PRODUCTS });
  const [productSearchInput, setProductSearchInput] = useState("");
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [form, setForm] = useState({
    name: "",
    slug: "",
    price: "",
    category: "rings",
    material: "gold",
    purity: "22k",
    weight: "",
    image: "",
    description: "",
    stock: "",
  });

  const loadMetrics = useCallback(async () => {
    const overviewRes = await getAdminOverview(token);
    setMetrics(overviewRes.data.metrics);
  }, [token]);

  const loadReport = useCallback(async () => {
    const reportRes = await getAdminTransactionReport(token, reportDays);
    setReport(reportRes.data?.report || null);
  }, [token, reportDays]);

  const loadUsersData = useCallback(async () => {
    const res = await getAdminUsers(token, {
      page: usersPage,
      limit: PAGE_SIZE_USERS,
      search: userSearchQuery,
    });
    setUsers(res.data.users || []);
    if (res.data.pagination) setUsersPagination(res.data.pagination);
  }, [token, usersPage, userSearchQuery]);

  const loadOrdersData = useCallback(async () => {
    const res = await getAdminOrders(token, {
      page: ordersPage,
      limit: PAGE_SIZE_ORDERS,
      search: orderSearchQuery,
    });
    setOrders(res.data.orders || []);
    if (res.data.pagination) setOrdersPagination(res.data.pagination);
  }, [token, ordersPage, orderSearchQuery]);

  const loadProductsData = useCallback(async () => {
    const res = await getProducts({
      page: productsPage,
      limit: PAGE_SIZE_PRODUCTS,
      search: productSearchQuery,
    });
    setProducts(res.data.products || []);
    if (res.data.pagination) setProductsPagination(res.data.pagination);
  }, [productsPage, productSearchQuery]);

  const reloadAfterMutation = useCallback(async () => {
    await Promise.all([loadMetrics(), loadReport()]);
    if (activeTab === "users") await loadUsersData();
    else if (activeTab === "orders" || activeTab === "payments") await loadOrdersData();
    else if (activeTab === "products") await loadProductsData();
  }, [activeTab, loadMetrics, loadReport, loadUsersData, loadOrdersData, loadProductsData]);

  useEffect(() => {
    if (!token) return;
    const timer = setTimeout(() => {
      loadMetrics()
        .then(() => loadReport())
        .catch(() => toast.error("Failed to load admin data"))
        .finally(() => setLoading(false));
    }, 0);
    return () => clearTimeout(timer);
  }, [loadMetrics, loadReport, token]);

  useEffect(() => {
    if (!token || activeTab !== "dashboard") return;
    const t = setTimeout(() => {
      loadReport().catch(() => toast.error("Failed to load transaction report"));
    }, 0);
    return () => clearTimeout(t);
  }, [token, activeTab, loadReport]);

  useEffect(() => {
    if (!token || activeTab !== "users") return;
    const t = setTimeout(() => {
      loadUsersData().catch(() => toast.error("Failed to load users"));
    }, 0);
    return () => clearTimeout(t);
  }, [token, activeTab, loadUsersData]);

  useEffect(() => {
    if (!token || (activeTab !== "orders" && activeTab !== "payments")) return;
    const t = setTimeout(() => {
      loadOrdersData().catch(() => toast.error("Failed to load orders"));
    }, 0);
    return () => clearTimeout(t);
  }, [token, activeTab, loadOrdersData]);

  useEffect(() => {
    if (!token || activeTab !== "products") return;
    const t = setTimeout(() => {
      loadProductsData().catch(() => toast.error("Failed to load products"));
    }, 0);
    return () => clearTimeout(t);
  }, [token, activeTab, loadProductsData]);

  const setProductForEdit = (product) => {
    setEditingProductId(product._id);
    setForm({
      name: product.name || "",
      slug: product.slug || "",
      price: product.price || "",
      category: product.category || "rings",
      material: product.material || "gold",
      purity: product.purity || "22k",
      weight: product.weight || "",
      image: product.images?.[0] || "",
      description: product.description || "",
      stock: product.stock || "",
    });
    setActiveTab("products");
  };

  const clearForm = () => {
    setEditingProductId(null);
    setForm({
      name: "",
      slug: "",
      price: "",
      category: "rings",
      material: "gold",
      purity: "22k",
      weight: "",
      image: "",
      description: "",
      stock: "",
    });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    setForm((prev) => ({ ...prev, image: String(base64) }));
  };

  const submitProduct = async (e) => {
    e.preventDefault();
    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      price: Number(form.price),
      category: form.category,
      material: form.material,
      purity: form.purity,
      weight: Number(form.weight),
      images: [form.image],
      description: form.description.trim(),
      stock: Number(form.stock),
    };
    if (editingProductId) {
      await updateAdminProduct(token, editingProductId, payload);
      toast.success("Product updated");
    } else {
      await createAdminProduct(token, payload);
      toast.success("Product created");
    }
    clearForm();
    await reloadAfterMutation();
  };

  const removeProduct = async (productId) => {
    await deleteAdminProduct(token, productId);
    toast.success("Product deleted");
    await reloadAfterMutation();
  };

  const removeUser = async (userId) => {
    await deleteAdminUser(token, userId);
    toast.success("User deleted");
    await reloadAfterMutation();
  };

  const changeOrderStatus = async (orderId, status) => {
    await updateAdminOrderStatus(token, orderId, status);
    toast.success("Order status updated");
    await reloadAfterMutation();
  };

  const formatPaymentMethod = (m) => {
    const map = {
      razorpay: "Razorpay",
      upi: "UPI",
      card: "Credit / Debit card",
      netbanking: "Net banking",
      cod: "Cash on delivery",
    };
    return map[m] || m || "—";
  };

  const formatDate = (d) => {
    if (!d) return "—";
    try {
      return new Date(d).toLocaleString();
    } catch {
      return String(d);
    }
  };

  const payments = useMemo(
    () =>
      orders.map((order) => ({
        id: order._id,
        customer: order.user?.name || "User",
        method: formatPaymentMethod(order.paymentMethod),
        status: order.paymentResult?.status || "pending",
        amount: order.totalPrice || 0,
      })),
    [orders]
  );

  const detailOrder = useMemo(
    () => (selectedOrderId ? orders.find((o) => o._id === selectedOrderId) : null),
    [orders, selectedOrderId]
  );

  const dailyMax = useMemo(
    () => Math.max(1, ...(report?.daily || []).map((d) => Number(d.netAmount) || 0)),
    [report]
  );

  const paymentFlowTotal = useMemo(
    () => (report?.paymentStatus || []).reduce((sum, p) => sum + (Number(p.count) || 0), 0),
    [report]
  );

  const paymentPie = useMemo(() => {
    const rows = report?.paymentStatus || [];
    if (!rows.length) return "conic-gradient(#6c757d 0 100%)";
    const colors = ["#28a745", "#ffc107", "#fd7e14", "#dc3545", "#17a2b8", "#6f42c1"];
    let cursor = 0;
    const segments = rows.map((row, idx) => {
      const pct = paymentFlowTotal ? ((Number(row.count) || 0) / paymentFlowTotal) * 100 : 0;
      const start = cursor;
      cursor += pct;
      return `${colors[idx % colors.length]} ${start}% ${cursor}%`;
    });
    return `conic-gradient(${segments.join(", ")})`;
  }, [report, paymentFlowTotal]);

  if (!token) return <p>Admin login required.</p>;
  if (loading) return <p>Loading dashboard...</p>;

  return (
    <div>
      <div className="d-flex gap-2 flex-wrap mb-3">
        <button className={`btn btn-sm ${activeTab === "dashboard" ? "btn-warning" : "btn-outline-light"}`} onClick={() => setActiveTab("dashboard")}>Dashboard</button>
        <button className={`btn btn-sm ${activeTab === "users" ? "btn-warning" : "btn-outline-light"}`} onClick={() => setActiveTab("users")}>Users</button>
        <button className={`btn btn-sm ${activeTab === "products" ? "btn-warning" : "btn-outline-light"}`} onClick={() => setActiveTab("products")}>Products</button>
        <button className={`btn btn-sm ${activeTab === "orders" ? "btn-warning" : "btn-outline-light"}`} onClick={() => setActiveTab("orders")}>Orders</button>
        <button className={`btn btn-sm ${activeTab === "payments" ? "btn-warning" : "btn-outline-light"}`} onClick={() => setActiveTab("payments")}>Payments</button>
      </div>

      {activeTab === "dashboard" ? (
        <div className="row g-3">
          <div className="col-12">
            <div className="card p-3">
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                <div>
                  <h5 className="mb-1">Transaction Dashboard</h5>
                  <p className="small text-muted mb-0">Monitor daily money flow, payment status, and settlement health.</p>
                </div>
                <div className="d-flex gap-2 align-items-center">
                  <label className="small mb-0">Report window</label>
                  <select
                    className="form-select form-select-sm"
                    style={{ width: 130 }}
                    value={reportDays}
                    onChange={(e) => setReportDays(Number(e.target.value))}
                  >
                    <option value={14}>14 days</option>
                    <option value={30}>30 days</option>
                    <option value={60}>60 days</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-3"><div className="card p-3"><h5>Users</h5><p>{metrics?.users || 0}</p></div></div>
          <div className="col-md-3"><div className="card p-3"><h5>Orders</h5><p>{metrics?.orders || 0}</p></div></div>
          <div className="col-md-3"><div className="card p-3"><h5>Products</h5><p>{metrics?.products || 0}</p></div></div>
          <div className="col-md-3"><div className="card p-3"><h5>Revenue</h5><p>Rs. {metrics?.revenue || 0}</p></div></div>
          <div className="col-md-3"><div className="card p-3"><h6>Net Sales</h6><p>Rs. {metrics?.netRevenue || 0}</p></div></div>
          <div className="col-md-3"><div className="card p-3"><h6>Net Cashflow</h6><p>Rs. {metrics?.netCashflow || 0}</p></div></div>
          <div className="col-md-3"><div className="card p-3"><h6>Paid Orders</h6><p>{metrics?.paidOrders || 0}</p></div></div>
          <div className="col-md-3"><div className="card p-3"><h6>Pending Payments</h6><p>{metrics?.paymentPending || 0}</p></div></div>
          <div className="col-md-3"><div className="card p-3"><h6>Refund Pending</h6><p>{metrics?.refundPending || 0}</p></div></div>
          <div className="col-md-3"><div className="card p-3"><h6>Refunded Amount</h6><p>Rs. {metrics?.refundedAmount || 0}</p></div></div>

          <div className="col-lg-8">
            <div className="card p-3">
              <h6 className="mb-3">Daily Net Transaction (Paid - Refunded)</h6>
              <div className="d-flex align-items-end gap-2" style={{ minHeight: 220, overflowX: "auto" }}>
                {(report?.daily || []).map((day) => {
                  const value = Number(day.netAmount) || 0;
                  const h = Math.max(8, Math.round((value / dailyMax) * 180));
                  return (
                    <div key={day.date} className="text-center" style={{ minWidth: 34 }}>
                      <div
                        title={`${day.date}: Rs. ${value}`}
                        style={{
                          height: `${h}px`,
                          background: "linear-gradient(180deg, #ffc107 0%, #b8860b 100%)",
                          borderRadius: 6,
                        }}
                      />
                      <small className="text-muted">{day.date.slice(5)}</small>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="col-lg-4">
            <div className="card p-3 h-100">
              <h6 className="mb-3">Money Arrival Flow</h6>
              <div className="d-flex align-items-center gap-3">
                <div
                  style={{
                    width: 140,
                    height: 140,
                    borderRadius: "50%",
                    background: paymentPie,
                    border: "1px solid rgba(255,255,255,0.2)",
                  }}
                />
                <div className="small">
                  {(report?.paymentStatus || []).map((s) => (
                    <div key={s.status} className="mb-1">
                      <strong>{s.status}</strong>: {s.count}
                    </div>
                  ))}
                </div>
              </div>
              <hr />
              <p className="small mb-1">Gross Sales: Rs. {report?.totals?.grossSales || 0}</p>
              <p className="small mb-1">Paid Sales: Rs. {report?.totals?.paidSales || 0}</p>
              <p className="small mb-1">Refunded Sales: Rs. {report?.totals?.refundSales || 0}</p>
              <p className="small mb-1 fw-bold">Net Sales (Gross - Refunded): Rs. {report?.totals?.netSales || 0}</p>
              <p className="small mb-0">Net Cashflow (Paid - Refunded): Rs. {report?.totals?.netCashflow || 0}</p>
            </div>
          </div>

          <div className="col-lg-6">
            <div className="card p-3">
              <h6 className="mb-3">Order Fulfillment Status</h6>
              <div className="table-responsive">
                <table className="table table-dark table-sm mb-0">
                  <thead>
                    <tr><th>Status</th><th>Count</th></tr>
                  </thead>
                  <tbody>
                    {(report?.orderStatus || []).map((s) => (
                      <tr key={s.status}>
                        <td>{s.status}</td>
                        <td>{s.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="col-lg-6">
            <div className="card p-3">
              <h6 className="mb-3">Payment Method Mix</h6>
              <div className="table-responsive">
                <table className="table table-dark table-sm mb-0">
                  <thead>
                    <tr><th>Method</th><th>Orders</th><th>Amount</th></tr>
                  </thead>
                  <tbody>
                    {(report?.paymentMethods || []).map((row) => (
                      <tr key={row.method}>
                        <td>{formatPaymentMethod(row.method)}</td>
                        <td>{row.count}</td>
                        <td>Rs. {row.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {activeTab === "users" ? (
        <div className="card p-3">
          <h5 className="mb-3">Manage Users</h5>
          <div className="table-toolbar d-flex flex-wrap align-items-end mb-3">
            <input
              className="form-control"
              placeholder="Search name or email…"
              value={userSearchInput}
              onChange={(e) => setUserSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setUserSearchQuery(userSearchInput.trim());
                  setUsersPage(1);
                }
              }}
            />
            <button
              type="button"
              className="btn btn-outline-warning"
              onClick={() => {
                setUserSearchQuery(userSearchInput.trim());
                setUsersPage(1);
              }}
            >
              Search
            </button>
          </div>
          <PaginationBar
            page={usersPagination.page}
            pages={usersPagination.pages}
            total={usersPagination.total}
            limit={usersPagination.limit}
            onPageChange={(p) => setUsersPage(p)}
            className="mb-3"
          />
          <div className="table-responsive">
            <table className="table table-dark table-striped align-middle">
              <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Action</th></tr></thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{user.role}</td>
                    <td>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => removeUser(user._id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {activeTab === "products" ? (
        <div className="row g-3">
          <div className="col-lg-5">
            <div className="card p-3">
              <h5>{editingProductId ? "Update Product" : "Create Product"}</h5>
              <form className="row g-2" onSubmit={submitProduct}>
                <div className="col-12"><input className="form-control" required placeholder="Name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} /></div>
                <div className="col-12"><input className="form-control" required placeholder="Slug" value={form.slug} onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))} /></div>
                <div className="col-6"><input className="form-control" type="number" required placeholder="Price" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} /></div>
                <div className="col-6"><input className="form-control" type="number" required placeholder="Stock" value={form.stock} onChange={(e) => setForm((p) => ({ ...p, stock: e.target.value }))} /></div>
                <div className="col-4">
                  <select className="form-select" value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}>
                    <option value="rings">Rings</option><option value="necklaces">Necklaces</option><option value="bracelets">Bracelets</option><option value="earrings">Earrings</option><option value="pendants">Pendants</option>
                  </select>
                </div>
                <div className="col-4">
                  <select className="form-select" value={form.material} onChange={(e) => setForm((p) => ({ ...p, material: e.target.value }))}>
                    <option value="gold">Gold</option><option value="silver">Silver</option><option value="diamond">Diamond</option>
                  </select>
                </div>
                <div className="col-4">
                  <select className="form-select" value={form.purity} onChange={(e) => setForm((p) => ({ ...p, purity: e.target.value }))}>
                    <option value="18k">18k</option><option value="22k">22k</option>
                  </select>
                </div>
                <div className="col-6"><input className="form-control" type="number" step="0.1" required placeholder="Weight" value={form.weight} onChange={(e) => setForm((p) => ({ ...p, weight: e.target.value }))} /></div>
                <div className="col-6"><input className="form-control" type="file" accept="image/*" onChange={handleImageUpload} /></div>
                <div className="col-12"><input className="form-control" placeholder="Image URL (optional)" value={form.image} onChange={(e) => setForm((p) => ({ ...p, image: e.target.value }))} /></div>
                <div className="col-12"><textarea className="form-control" rows="3" required placeholder="Description" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} /></div>
                <div className="col-12 d-flex gap-2">
                  <button className="btn btn-warning" type="submit">{editingProductId ? "Update" : "Create"}</button>
                  <button className="btn btn-outline-light" type="button" onClick={clearForm}>Clear</button>
                </div>
              </form>
            </div>
          </div>
          <div className="col-lg-7">
            <div className="card p-3">
              <h5 className="mb-3">Manage Products</h5>
              <div className="table-toolbar d-flex flex-wrap align-items-end mb-3">
                <input
                  className="form-control"
                  placeholder="Search product name…"
                  value={productSearchInput}
                  onChange={(e) => setProductSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setProductSearchQuery(productSearchInput.trim());
                      setProductsPage(1);
                    }
                  }}
                />
                <button
                  type="button"
                  className="btn btn-outline-warning"
                  onClick={() => {
                    setProductSearchQuery(productSearchInput.trim());
                    setProductsPage(1);
                  }}
                >
                  Search
                </button>
              </div>
              <PaginationBar
                page={productsPagination.page}
                pages={productsPagination.pages}
                total={productsPagination.total}
                limit={productsPagination.limit}
                onPageChange={(p) => setProductsPage(p)}
                className="mb-3"
              />
              <div className="table-responsive">
                <table className="table table-dark table-striped align-middle">
                  <thead><tr><th>Product</th><th>Price</th><th>Stock</th><th>Action</th></tr></thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product._id}>
                        <td>{product.name}</td>
                        <td>Rs. {product.price}</td>
                        <td>{product.stock}</td>
                        <td className="d-flex gap-2">
                          <button className="btn btn-sm btn-outline-warning" onClick={() => setProductForEdit(product)}>Edit</button>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => removeProduct(product._id)}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {activeTab === "orders" ? (
        <div>
          <div className="card p-3 mb-3">
            <h5 className="mb-3">Manage Orders</h5>
            <p className="small text-muted mb-3">Select an order to see line items, pricing breakdown, payment method, and shipping.</p>
            <div className="table-toolbar d-flex flex-wrap align-items-end mb-3">
              <input
                className="form-control"
                placeholder="Search by order ID or customer name/email…"
                value={orderSearchInput}
                onChange={(e) => setOrderSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setSelectedOrderId(null);
                    setOrderSearchQuery(orderSearchInput.trim());
                    setOrdersPage(1);
                  }
                }}
              />
              <button
                type="button"
                className="btn btn-outline-warning"
                onClick={() => {
                  setSelectedOrderId(null);
                  setOrderSearchQuery(orderSearchInput.trim());
                  setOrdersPage(1);
                }}
              >
                Search
              </button>
            </div>
            <PaginationBar
              page={ordersPagination.page}
              pages={ordersPagination.pages}
              total={ordersPagination.total}
              limit={ordersPagination.limit}
              onPageChange={(p) => {
                setSelectedOrderId(null);
                setOrdersPage(p);
              }}
              className="mb-3"
            />
            <div className="table-responsive">
              <table className="table table-dark table-striped align-middle">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Customer</th>
                    <th>Payment</th>
                    <th>Pay status</th>
                    <th>Total</th>
                    <th>Fulfillment</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order._id}>
                      <td className="text-nowrap">
                        <code className="small">{String(order._id).slice(0, 10)}…</code>
                      </td>
                      <td>
                        <div>{order.user?.name || "User"}</div>
                        <small className="text-muted">{order.user?.email || ""}</small>
                      </td>
                      <td>{formatPaymentMethod(order.paymentMethod)}</td>
                      <td>{order.paymentResult?.status || "—"}</td>
                      <td>Rs. {order.totalPrice}</td>
                      <td>
                        <select
                          className="form-select form-select-sm"
                          value={order.orderStatus}
                          onChange={(e) => changeOrderStatus(order._id, e.target.value)}
                        >
                          <option value="pending">pending</option>
                          <option value="shipped">shipped</option>
                          <option value="delivered">delivered</option>
                          <option value="cancelled">cancelled</option>
                          <option value="return_requested">return_requested</option>
                          <option value="returned">returned</option>
                          <option value="exchange_requested">exchange_requested</option>
                          <option value="exchanged">exchanged</option>
                        </select>
                      </td>
                      <td>
                        <button
                          type="button"
                          className={`btn btn-sm ${selectedOrderId === order._id ? "btn-warning" : "btn-outline-warning"}`}
                          onClick={() => setSelectedOrderId(selectedOrderId === order._id ? null : order._id)}
                        >
                          {selectedOrderId === order._id ? "Hide detail" : "View detail"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {detailOrder ? (
            <div className="card p-3 admin-order-detail">
              <h5 className="mb-3">Order detail</h5>
              <div className="row g-3">
                <div className="col-md-6">
                  <dl className="mb-0">
                    <dt>Order ID</dt>
                    <dd><code>{detailOrder._id}</code></dd>
                    <dt>Created</dt>
                    <dd>{formatDate(detailOrder.createdAt)}</dd>
                    <dt>Customer</dt>
                    <dd>
                      {detailOrder.user?.name} ({detailOrder.user?.email || "no email"})
                    </dd>
                    <dt>Order status</dt>
                    <dd>{detailOrder.orderStatus}</dd>
                  </dl>
                </div>
                <div className="col-md-6">
                  <dl className="mb-0">
                    <dt>Payment method</dt>
                    <dd>{formatPaymentMethod(detailOrder.paymentMethod)}</dd>
                    <dt>Payment status</dt>
                    <dd>{detailOrder.paymentResult?.status || "—"}</dd>
                    <dt>Paid at</dt>
                    <dd>{formatDate(detailOrder.paymentResult?.paidAt)}</dd>
                    <dt>Razorpay IDs</dt>
                    <dd className="small">
                      Order: {detailOrder.paymentResult?.razorpayOrderId || "—"}
                      <br />
                      Payment: {detailOrder.paymentResult?.razorpayPaymentId || "—"}
                    </dd>
                  </dl>
                </div>
                <div className="col-12">
                  <h6 className="text-uppercase small text-muted mb-2">Shipping address</h6>
                  <div className="p-2 rounded border border-secondary">
                    {detailOrder.shippingAddress?.fullName || "—"}
                    <br />
                    {detailOrder.shippingAddress?.phone || ""}
                    <br />
                    {detailOrder.shippingAddress?.address || ""}
                    <br />
                    {[detailOrder.shippingAddress?.city, detailOrder.shippingAddress?.state, detailOrder.shippingAddress?.postalCode]
                      .filter(Boolean)
                      .join(", ")}
                    <br />
                    {detailOrder.shippingAddress?.country || ""}
                  </div>
                </div>
                <div className="col-12">
                  <h6 className="text-uppercase small text-muted mb-2">Payment details (from checkout)</h6>
                  <div className="p-2 rounded border border-secondary small">
                    {detailOrder.paymentDetails ? (
                      <ul className="mb-0 ps-3">
                        {detailOrder.paymentDetails.payerName ? <li>Payer: {detailOrder.paymentDetails.payerName}</li> : null}
                        {detailOrder.paymentDetails.payerPhone ? <li>Phone: {detailOrder.paymentDetails.payerPhone}</li> : null}
                        {detailOrder.paymentDetails.upiId ? <li>UPI: {detailOrder.paymentDetails.upiId}</li> : null}
                        {detailOrder.paymentDetails.bankName ? <li>Bank: {detailOrder.paymentDetails.bankName}</li> : null}
                        {detailOrder.paymentDetails.cardLast4 ? <li>Card last 4: {detailOrder.paymentDetails.cardLast4}</li> : null}
                        {detailOrder.paymentDetails.notes ? <li>Notes: {detailOrder.paymentDetails.notes}</li> : null}
                        {!Object.values(detailOrder.paymentDetails).some(Boolean) ? <li className="text-muted">No extra fields saved</li> : null}
                      </ul>
                    ) : (
                      <span className="text-muted">No payment details record (older order)</span>
                    )}
                  </div>
                </div>
                <div className="col-12">
                  <h6 className="text-uppercase small text-muted mb-2">Line items</h6>
                  <div className="table-responsive">
                    <table className="table table-dark table-sm align-middle mb-0">
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Qty</th>
                          <th>Unit price</th>
                          <th>Line total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(detailOrder.items || []).map((line, idx) => (
                          <tr key={`${line.product}-${idx}`}>
                            <td>{line.name || line.product}</td>
                            <td>{line.qty}</td>
                            <td>Rs. {line.price}</td>
                            <td>Rs. {(line.price || 0) * (line.qty || 1)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="col-md-6 ms-auto">
                  <div className="p-3 rounded border border-secondary">
                    <div className="d-flex justify-content-between"><span>Items</span><span>Rs. {detailOrder.itemsPrice ?? "—"}</span></div>
                    <div className="d-flex justify-content-between"><span>Shipping</span><span>Rs. {detailOrder.shippingPrice ?? "—"}</span></div>
                    <div className="d-flex justify-content-between"><span>Tax</span><span>Rs. {detailOrder.taxPrice ?? "—"}</span></div>
                    <hr />
                    <div className="d-flex justify-content-between fw-bold"><span>Total</span><span>Rs. {detailOrder.totalPrice}</span></div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {activeTab === "payments" ? (
        <div className="card p-3">
          <h5 className="mb-3">Payment Monitoring</h5>
          <p className="small text-muted mb-3">Same data as Orders — use search and pagination there, or switch to the Orders tab.</p>
          <div className="table-toolbar d-flex flex-wrap align-items-end mb-3">
            <input
              className="form-control"
              placeholder="Search by order ID or customer…"
              value={orderSearchInput}
              onChange={(e) => setOrderSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setSelectedOrderId(null);
                  setOrderSearchQuery(orderSearchInput.trim());
                  setOrdersPage(1);
                }
              }}
            />
            <button
              type="button"
              className="btn btn-outline-warning"
              onClick={() => {
                setSelectedOrderId(null);
                setOrderSearchQuery(orderSearchInput.trim());
                setOrdersPage(1);
              }}
            >
              Search
            </button>
          </div>
          <PaginationBar
            page={ordersPagination.page}
            pages={ordersPagination.pages}
            total={ordersPagination.total}
            limit={ordersPagination.limit}
            onPageChange={(p) => {
              setSelectedOrderId(null);
              setOrdersPage(p);
            }}
            className="mb-3"
          />
          <div className="table-responsive">
            <table className="table table-dark table-striped align-middle">
              <thead><tr><th>Order ID</th><th>Customer</th><th>Method</th><th>Status</th><th>Amount</th></tr></thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td><code className="small">{String(payment.id).slice(0, 12)}…</code></td>
                    <td>{payment.customer}</td>
                    <td>{payment.method}</td>
                    <td>{payment.status}</td>
                    <td>Rs. {payment.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default AdminPage;
