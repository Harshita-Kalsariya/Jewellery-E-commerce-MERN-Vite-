import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { createOrder, getCart } from "../services/api";
import { refreshShopBadges } from "../shopBadgesRefresh";
import useAuth from "../context/useAuth";

const STEPS = [
  { id: 1, label: "Your items", desc: "Review what you are buying" },
  { id: 2, label: "Shipping", desc: "Where we should deliver" },
  { id: 3, label: "Payment", desc: "Choose how you will pay" },
  { id: 4, label: "Place order", desc: "Confirm and submit" },
];

const PAYMENT_OPTIONS = [
  {
    value: "razorpay",
    title: "Razorpay",
    blurb: "Pay securely with card, UPI, netbanking or wallet via Razorpay.",
  },
  {
    value: "upi",
    title: "UPI",
    blurb: "Pay using any UPI app. You can add your UPI ID for reference.",
  },
  {
    value: "card",
    title: "Credit / Debit card",
    blurb: "Card payment (integration can be completed with your gateway).",
  },
  {
    value: "netbanking",
    title: "Net banking",
    blurb: "Pay from your bank account online.",
  },
  {
    value: "cod",
    title: "Cash on delivery",
    blurb: "Pay with cash when your order arrives.",
  },
];

function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = useAuth();
  const buyNowItem = location.state?.buyNowItem;
  const [items, setItems] = useState(() => (buyNowItem?.product?._id ? [buyNowItem] : []));
  const [placing, setPlacing] = useState(false);
  const [step, setStep] = useState(1);
  const [orderComplete, setOrderComplete] = useState(false);
  const [shipping, setShipping] = useState({
    fullName: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
    phone: "",
  });
  const [paymentMethod, setPaymentMethod] = useState("razorpay");
  const [paymentDetails, setPaymentDetails] = useState({
    payerName: "",
    payerPhone: "",
    upiId: "",
    bankName: "",
    cardLast4: "",
    notes: "",
  });

  const loadCart = useCallback(async () => {
    const res = await getCart(token);
    setItems(res.data?.cart?.items || []);
  }, [token]);

  useEffect(() => {
    if (!token) return;
    if (buyNowItem?.product?._id) return;
    const timer = setTimeout(() => {
      loadCart().catch(() => toast.error("Failed to load cart for checkout"));
    }, 0);
    return () => clearTimeout(timer);
  }, [buyNowItem, loadCart, token]);

  const prices = useMemo(() => {
    const itemsPrice = items.reduce((sum, item) => sum + (item.product?.price || 0) * (item.qty || 1), 0);
    const shippingPrice = itemsPrice > 0 ? 99 : 0;
    const taxPrice = Math.round(itemsPrice * 0.03);
    const totalPrice = itemsPrice + shippingPrice + taxPrice;
    return { itemsPrice, shippingPrice, taxPrice, totalPrice };
  }, [items]);

  const paymentLabel = useMemo(
    () => PAYMENT_OPTIONS.find((p) => p.value === paymentMethod)?.title || paymentMethod,
    [paymentMethod]
  );

  const canAdvanceFromStep = (s) => {
    if (s === 1) return items.length > 0;
    if (s === 2) {
      return (
        shipping.fullName.trim() &&
        shipping.phone.trim() &&
        shipping.address.trim() &&
        shipping.city.trim() &&
        shipping.postalCode.trim()
      );
    }
    if (s === 3) return Boolean(paymentMethod);
    return true;
  };

  const goNext = () => {
    if (!canAdvanceFromStep(step)) {
      toast.error("Please complete this step before continuing.");
      return;
    }
    setStep((prev) => Math.min(prev + 1, 4));
  };

  const goBack = () => setStep((prev) => Math.max(prev - 1, 1));

  const buildPaymentPayload = () => {
    const isCod = paymentMethod === "cod";
    const details = {
      payerName: paymentDetails.payerName.trim() || shipping.fullName,
      payerPhone: paymentDetails.payerPhone.trim() || shipping.phone,
      upiId: paymentDetails.upiId.trim(),
      bankName: paymentDetails.bankName.trim(),
      cardLast4: paymentDetails.cardLast4.trim(),
      notes: paymentDetails.notes.trim(),
    };
    return {
      paymentMethod,
      paymentDetails: details,
      paymentResult: isCod
        ? { status: "pending", paidAt: null }
        : {
            status: "paid",
            paidAt: new Date().toISOString(),
          },
    };
  };

  const placeOrder = async (e) => {
    e.preventDefault();
    if (!items.length) return toast.error("Your cart is empty");
    if (!canAdvanceFromStep(2)) return toast.error("Please complete shipping details.");
    setPlacing(true);
    try {
      const pay = buildPaymentPayload();
      const payload = {
        items: items.map((item) => ({
          product: item.product?._id,
          name: item.product?.name,
          image: item.product?.images?.[0] || "",
          qty: item.qty || 1,
          price: item.product?.price || 0,
        })),
        shippingAddress: shipping,
        ...pay,
        ...prices,
      };
      await createOrder(token, payload);
      toast.success("Order placed successfully");
      refreshShopBadges();
      setOrderComplete(true);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to place order");
    } finally {
      setPlacing(false);
    }
  };

  if (!token) {
    return <p>Please login to checkout.</p>;
  }

  if (orderComplete) {
    return (
      <div className="checkout-success card p-4 text-center">
        <div className="checkout-stepper mb-4">
          {STEPS.map((s) => (
            <div key={s.id} className="checkout-step checkout-step--done">
              <span className="checkout-step__num">{"\u2713"}</span>
              <span className="checkout-step__label">{s.label}</span>
            </div>
          ))}
        </div>
        <h3 className="text-success mb-2">Order placed</h3>
        <p className="mb-4">Thank you. Your jewellery order is confirmed. We will update you when it ships.</p>
        <div className="d-flex gap-2 justify-content-center flex-wrap">
          <button type="button" className="btn btn-warning" onClick={() => navigate("/profile")}>
            View my orders
          </button>
          <button type="button" className="btn btn-outline-light" onClick={() => navigate("/")}>
            Continue shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-2">Checkout</h2>
      <p className="text-muted small mb-3">{buyNowItem ? "Direct buy" : "Cart checkout"} — follow the steps below.</p>

      <div className="checkout-stepper mb-4">
        {STEPS.map((s) => {
          const done = step > s.id;
          const current = step === s.id;
          return (
            <div
              key={s.id}
              className={`checkout-step ${done ? "checkout-step--done" : ""} ${current ? "checkout-step--current" : ""}`}
            >
              <span className="checkout-step__num">{done ? "\u2713" : s.id}</span>
              <span className="checkout-step__text">
                <span className="checkout-step__label">{s.label}</span>
                <span className="checkout-step__desc">{s.desc}</span>
              </span>
            </div>
          );
        })}
      </div>

      <div className="row g-4">
        <div className="col-lg-7">
          {step === 1 ? (
            <div className="card p-3 checkout-panel">
              <h5 className="mb-2">Step 1 — Your items</h5>
              <p className="small text-muted mb-3">Review products and quantities before shipping and payment.</p>
              {!items.length ? (
                <p>Your cart is empty. <button type="button" className="btn btn-link btn-sm p-0" onClick={() => navigate("/cart")}>Go to cart</button></p>
              ) : (
                <ul className="list-unstyled mb-0">
                  {items.map((item) => (
                    <li key={item.product?._id || item._id} className="d-flex justify-content-between border-bottom border-secondary py-2">
                      <span>{item.product?.name} × {item.qty || 1}</span>
                      <span>Rs. {(item.product?.price || 0) * (item.qty || 1)}</span>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-3 d-flex gap-2">
                <button type="button" className="btn btn-warning" disabled={!items.length} onClick={goNext}>
                  Continue to shipping
                </button>
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="card p-3 checkout-panel">
              <h5 className="mb-2">Step 2 — Shipping details</h5>
              <p className="small text-muted mb-3">We use this address to deliver your order and contact you if needed.</p>
              <div className="row g-2">
                <div className="col-md-6">
                  <label className="form-label small">Full name</label>
                  <input
                    className="form-control"
                    required
                    value={shipping.fullName}
                    onChange={(e) => setShipping((p) => ({ ...p, fullName: e.target.value }))}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label small">Phone</label>
                  <input
                    className="form-control"
                    required
                    value={shipping.phone}
                    onChange={(e) => setShipping((p) => ({ ...p, phone: e.target.value }))}
                  />
                </div>
                <div className="col-12">
                  <label className="form-label small">Address</label>
                  <input
                    className="form-control"
                    required
                    value={shipping.address}
                    onChange={(e) => setShipping((p) => ({ ...p, address: e.target.value }))}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label small">City</label>
                  <input
                    className="form-control"
                    required
                    value={shipping.city}
                    onChange={(e) => setShipping((p) => ({ ...p, city: e.target.value }))}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label small">State</label>
                  <input
                    className="form-control"
                    value={shipping.state}
                    onChange={(e) => setShipping((p) => ({ ...p, state: e.target.value }))}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label small">Postal code</label>
                  <input
                    className="form-control"
                    required
                    value={shipping.postalCode}
                    onChange={(e) => setShipping((p) => ({ ...p, postalCode: e.target.value }))}
                  />
                </div>
                <div className="col-12">
                  <label className="form-label small">Country</label>
                  <input
                    className="form-control"
                    value={shipping.country}
                    onChange={(e) => setShipping((p) => ({ ...p, country: e.target.value }))}
                  />
                </div>
              </div>
              <div className="mt-3 d-flex gap-2 flex-wrap">
                <button type="button" className="btn btn-outline-light" onClick={goBack}>Back</button>
                <button type="button" className="btn btn-warning" onClick={goNext}>Continue to payment</button>
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="card p-3 checkout-panel">
              <h5 className="mb-2">Step 3 — Payment</h5>
              <p className="small text-muted mb-3">Pick a payment type. Add any reference details your team needs (UPI ID, bank, last 4 digits, notes).</p>
              <div className="payment-options mb-3">
                {PAYMENT_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className={`payment-option card p-3 mb-2 ${paymentMethod === opt.value ? "payment-option--active" : ""}`}
                  >
                    <div className="d-flex gap-2 align-items-start">
                      <input
                        type="radio"
                        name="pay"
                        className="mt-1"
                        checked={paymentMethod === opt.value}
                        onChange={() => setPaymentMethod(opt.value)}
                      />
                      <div>
                        <strong>{opt.title}</strong>
                        <div className="small text-muted">{opt.blurb}</div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
              <div className="row g-2">
                <div className="col-md-6">
                  <label className="form-label small">Payer name (optional)</label>
                  <input
                    className="form-control"
                    placeholder="Name on payment"
                    value={paymentDetails.payerName}
                    onChange={(e) => setPaymentDetails((p) => ({ ...p, payerName: e.target.value }))}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label small">Payer phone (optional)</label>
                  <input
                    className="form-control"
                    placeholder="Phone for payment updates"
                    value={paymentDetails.payerPhone}
                    onChange={(e) => setPaymentDetails((p) => ({ ...p, payerPhone: e.target.value }))}
                  />
                </div>
                {paymentMethod === "upi" ? (
                  <div className="col-12">
                    <label className="form-label small">UPI ID (optional reference)</label>
                    <input
                      className="form-control"
                      placeholder="e.g. name@upi"
                      value={paymentDetails.upiId}
                      onChange={(e) => setPaymentDetails((p) => ({ ...p, upiId: e.target.value }))}
                    />
                  </div>
                ) : null}
                {paymentMethod === "netbanking" ? (
                  <div className="col-12">
                    <label className="form-label small">Bank name (optional)</label>
                    <input
                      className="form-control"
                      placeholder="Your bank"
                      value={paymentDetails.bankName}
                      onChange={(e) => setPaymentDetails((p) => ({ ...p, bankName: e.target.value }))}
                    />
                  </div>
                ) : null}
                {paymentMethod === "card" ? (
                  <div className="col-md-6">
                    <label className="form-label small">Last 4 digits (optional reference)</label>
                    <input
                      className="form-control"
                      maxLength={4}
                      placeholder="1234"
                      value={paymentDetails.cardLast4}
                      onChange={(e) => setPaymentDetails((p) => ({ ...p, cardLast4: e.target.value.replace(/\D/g, "").slice(0, 4) }))}
                    />
                  </div>
                ) : null}
                <div className="col-12">
                  <label className="form-label small">Notes for seller (optional)</label>
                  <textarea
                    className="form-control"
                    rows={2}
                    placeholder="Any instruction about payment or delivery"
                    value={paymentDetails.notes}
                    onChange={(e) => setPaymentDetails((p) => ({ ...p, notes: e.target.value }))}
                  />
                </div>
              </div>
              <div className="mt-3 d-flex gap-2 flex-wrap">
                <button type="button" className="btn btn-outline-light" onClick={goBack}>Back</button>
                <button type="button" className="btn btn-warning" onClick={goNext}>Review & place order</button>
              </div>
            </div>
          ) : null}

          {step === 4 ? (
            <form className="card p-3 checkout-panel" onSubmit={placeOrder}>
              <h5 className="mb-2">Step 4 — Confirm & place order</h5>
              <p className="small text-muted mb-3">Check everything below. When you place the order, it is sent to Khodiyar Jewellers for processing.</p>
              <div className="checkout-summary-block mb-3">
                <h6 className="text-uppercase small text-muted">Shipping</h6>
                <p className="mb-0">
                  {shipping.fullName}, {shipping.phone}<br />
                  {shipping.address}, {shipping.city}{shipping.state ? `, ${shipping.state}` : ""} {shipping.postalCode}, {shipping.country}
                </p>
              </div>
              <div className="checkout-summary-block mb-3">
                <h6 className="text-uppercase small text-muted">Payment</h6>
                <p className="mb-1"><strong>Method:</strong> {paymentLabel}</p>
                {paymentMethod === "cod" ? (
                  <p className="small text-warning mb-0">Cash on delivery — payment will be collected when the order is delivered.</p>
                ) : (
                  <p className="small text-muted mb-0">Payment will be marked as completed for this demo (except COD). Gateway integration can be wired here later.</p>
                )}
              </div>
              <div className="d-flex gap-2 flex-wrap">
                <button type="button" className="btn btn-outline-light" onClick={goBack}>Back</button>
                <button type="submit" className="btn btn-warning" disabled={placing || !items.length}>
                  {placing ? "Placing order..." : "Place order"}
                </button>
              </div>
            </form>
          ) : null}
        </div>

        <div className="col-lg-5">
          <div className="card p-3 checkout-summary-sticky">
            <h5>Order summary</h5>
            <p className="small text-muted">Totals update with your cart.</p>
            {items.map((item) => (
              <div key={item.product?._id || item._id} className="d-flex justify-content-between small py-1 border-bottom border-secondary">
                <span>{item.product?.name} × {item.qty}</span>
                <span>Rs. {(item.product?.price || 0) * (item.qty || 1)}</span>
              </div>
            ))}
            <hr />
            <div className="d-flex justify-content-between"><span>Items</span><span>Rs. {prices.itemsPrice}</span></div>
            <div className="d-flex justify-content-between"><span>Shipping</span><span>Rs. {prices.shippingPrice}</span></div>
            <div className="d-flex justify-content-between"><span>Tax</span><span>Rs. {prices.taxPrice}</span></div>
            <div className="d-flex justify-content-between fw-bold mt-2"><span>Total</span><span>Rs. {prices.totalPrice}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CheckoutPage;
