import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api/api";
import { useAuth } from "../context/AuthContext";

export default function OrderDetails() {
  const { orderId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrder = async () => {
      try {
        const res = await api.getOrders(user);
        if (res.success) {
          const found = res.orders.find(o => o._id === orderId);
          setOrder(found || null);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [orderId, user]);

  if (loading) return <div className="container mt-5">Loading...</div>;
  if (!order) return <div className="container mt-5">Order not found</div>;

  return (
    <div className="container mt-5">
      <h3>Order Details</h3>

      <div className="card p-3 mb-4">
        <p><strong>Order ID:</strong> {order._id}</p>
        <p><strong>Date:</strong> {new Date(order.createdAt).toLocaleString()}</p>
        <p><strong>Status:</strong> {order.status}</p>
        <p><strong>Total:</strong> ₹{order.total}</p>
      </div>

      <h5>Items</h5>

      <table className="table table-bordered">
        <thead className="table-light">
          <tr>
            <th>#</th>
            <th>Item</th>
            <th>Qty</th>
            <th>Price (₹)</th>
            <th>Total (₹)</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item, i) => (
            <tr key={i}>
              <td>{i + 1}</td>
              <td>{item.title}</td>
              <td>{item.qty}</td>
              <td>{item.unitPrice}</td>
              <td>{item.lineTotal}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <button
        className="btn btn-secondary mt-3"
        onClick={() => navigate("/orders")}
      >
        Back to My Orders
      </button>
    </div>
  );
}