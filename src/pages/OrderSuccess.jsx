import { useLocation, useNavigate } from "react-router-dom";

export default function OrderSuccess() {
  const location = useLocation();
  const navigate = useNavigate();

  const { orderId, total } = location.state || {};

  if (!orderId) {
    navigate("/products", { replace: true });
    return null;
  }

  return (
    <div className="container mt-5">
      <h2 className="text-success">Order Confirmed 🎉</h2>

      <p className="mt-3">
        <strong>Order ID:</strong> {orderId}
      </p>

      <p>Thank you for your order!</p>

      <h5 className="mt-2">
        <strong>Total Paid:</strong> ₹{total}
      </h5>

      <button
        className="btn btn-primary mt-3"
        onClick={() => navigate("/products")}
      >
        Continue Shopping
      </button>
    </div>
  );
}