import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { getProfile, requestOrderCancel, requestOrderExchange, requestOrderReturn } from "../services/api";
import useAuth from "../context/useAuth";

const statusLabel = {
  pending: "Pending",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  return_requested: "Return Requested",
  returned: "Returned",
  exchange_requested: "Exchange Requested",
  exchanged: "Exchanged",
};

function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const { token } = useAuth();
  const RETURN_EXCHANGE_WINDOW_DAYS = 10;

  useEffect(() => {
    if (!token) return;
    getProfile(token)
      .then((res) => setProfile(res.data))
      .catch(() => setProfile(null));
  }, [token]);

  const canReturnOrExchange = (order) => {
    if (!["delivered", "exchanged"].includes(order.orderStatus)) return false;
    const deliveredTime = new Date(order.exchangedAt || order.deliveredAt || order.updatedAt || order.createdAt).getTime();
    return Date.now() - deliveredTime <= RETURN_EXCHANGE_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  };

  const canRequestExchange = (order) => {
    if (!canReturnOrExchange(order)) return false;
    return (Number(order.exchangeCount) || 0) < 1 && order.orderStatus !== "exchange_requested";
  };

  const canRequestReturn = (order) => {
    if (!canReturnOrExchange(order)) return false;
    return !["return_requested", "returned", "cancelled"].includes(order.orderStatus);
  };

  const policyHint = (order) => {
    if (order.orderStatus === "pending") return "You can cancel this order before shipping.";
    if (order.orderStatus === "exchanged") return "Product exchanged. You can return it within policy window, but second exchange is not allowed.";
    if (canReturnOrExchange(order)) return `Eligible for return or exchange (within ${RETURN_EXCHANGE_WINDOW_DAYS} days of delivery).`;
    if (order.orderStatus === "delivered") return `Return/Exchange window closed (more than ${RETURN_EXCHANGE_WINDOW_DAYS} days).`;
    if (order.orderStatus === "shipped") return "Order is shipped, so cancellation is not available.";
    if (order.orderStatus === "return_requested") return "Return request submitted. Our team will review it.";
    if (order.orderStatus === "exchange_requested") return "Exchange request submitted. Our team will review it.";
    return "No action available for this order status.";
  };

  const reloadProfile = async () => {
    const res = await getProfile(token);
    setProfile(res.data);
  };

  const onAction = async (type, orderId) => {
    try {
      if (type === "cancel") await requestOrderCancel(token, orderId);
      if (type === "return") await requestOrderReturn(token, orderId);
      if (type === "exchange") await requestOrderExchange(token, orderId);
      toast.success(`${type[0].toUpperCase()}${type.slice(1)} request submitted`);
      await reloadProfile();
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to ${type} order`);
    }
  };

  if (!profile) return <p>Please login to view profile and order history.</p>;
  return (
    <div>
      <h2>{profile.user.name}</h2>
      <p>{profile.user.email}</p>
      <h4 className="mt-4">Order History</h4>
      {profile.orders.map((order) => (
        <div className="card p-3 mb-2" key={order._id}>
          <p>Order ID: {order._id}</p>
          <p>Status: {statusLabel[order.orderStatus] || order.orderStatus}</p>
          <p>Total: Rs. {order.totalPrice}</p>
          <p>Payment: {order.paymentMethod || "Razorpay"}</p>
          <p className="small text-muted mb-1">Policy: Cancel before shipping.</p>
          <p className="small text-muted mb-1">
            Return/Exchange: only after delivery and within {RETURN_EXCHANGE_WINDOW_DAYS} days.
          </p>
          <p className="small text-info mb-2">{policyHint(order)}</p>
          <div className="d-flex gap-2 flex-wrap">
            {order.orderStatus === "pending" ? (
              <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => onAction("cancel", order._id)}>
                Cancel Order
              </button>
            ) : null}
            {canRequestReturn(order) ? (
              <>
                <button type="button" className="btn btn-outline-warning btn-sm" onClick={() => onAction("return", order._id)}>
                  Return
                </button>
              </>
            ) : null}
            {canRequestExchange(order) ? (
              <>
                <button type="button" className="btn btn-outline-light btn-sm" onClick={() => onAction("exchange", order._id)}>
                  Exchange
                </button>
              </>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

export default ProfilePage;
