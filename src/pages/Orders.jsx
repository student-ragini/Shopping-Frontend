import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/api";
import { useNavigate } from "react-router-dom";

export default function Orders() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const res = await api.getOrders(user);
        if (res?.success) {
          setOrders(res.orders);
        } else {
          setOrders([]);
        }
      } catch (err) {
        console.error(err);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    if (user) loadOrders();
  }, [user]);

  /* ================= CANCEL ORDER ================= */
  const cancelOrder = async (orderId) => {
    const ok = window.confirm("Are you sure you want to cancel this order?");
    if (!ok) return;

    try {
      await fetch(`http://localhost:4400/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Cancelled" }),
      });

      alert("Order cancelled");

      setOrders((prev) =>
        prev.map((o) =>
          o._id === orderId ? { ...o, status: "Cancelled" } : o
        )
      );
    } catch (err) {
      console.error(err);
      alert("Failed to cancel order");
    }
  };

  /* ================= FILTER ================= */
  const filteredOrders =
    filter === "All"
      ? orders
      : orders.filter((o) => o.status === filter);

  if (loading) {
    return <div className="container mt-5">Loading orders...</div>;
  }

  return (
    <div className="container mt-5">
      {/* ===== HEADER + FILTER ===== */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3>My Orders</h3>

        <div>
          <label className="me-2 fw-semibold">Filter by status:</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="form-select d-inline-block w-auto"
          >
            <option>All</option>
            <option>Created</option>
            <option>Processing</option>
            <option>Shipped</option>
            <option>Delivered</option>
            <option>Cancelled</option>
          </select>
        </div>
      </div>

      {/* ===== TABLE ===== */}
      {filteredOrders.length === 0 ? (
        <p>No orders found.</p>
      ) : (
        <div className="table-responsive">
          <table className="table table-bordered align-middle">
            <thead className="table-light">
              <tr>
                <th>#</th>
                <th>Order ID</th>
                <th>Date</th>
                <th>Items</th>
                <th>Total (₹)</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredOrders.map((order, index) => (
                <tr key={order._id}>
                  <td>{index + 1}</td>

                  <td className="text-break">{order._id}</td>

                  <td>
                    {new Date(order.createdAt).toLocaleDateString()} <br />
                    {new Date(order.createdAt).toLocaleTimeString()}
                  </td>

                  <td>
                    {order.items.map((item, i) => (
                      <div key={i}>
                        {item.title} × {item.qty}
                      </div>
                    ))}
                  </td>

                  <td>{order.total}</td>

                  <td>
                    <span
                      className={`badge ${
                        order.status === "Created"
                          ? "bg-secondary"
                          : order.status === "Cancelled"
                          ? "bg-danger"
                          : order.status === "Shipped"
                          ? "bg-info"
                          : "bg-success"
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>

                  <td>
                    {/* ===== VIEW ===== */}
                    <button
                      className="btn btn-sm btn-outline-primary me-2"
                      onClick={() =>
                        navigate(`/orders/${order._id}`)
                      }
                    >
                      View
                    </button>

                    {/* ===== CANCEL ===== */}
                    {order.status === "Created" && (
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => cancelOrder(order._id)}
                      >
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}