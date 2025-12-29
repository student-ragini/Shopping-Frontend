import { useEffect, useState } from "react";
import { api } from "../api/api";
import { useAdminAuth } from "../context/AdminAuthContext";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("All");
  const { logoutAdmin } = useAdminAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadOrders();
  }, [filter]);

  const loadOrders = async () => {
    const res = await api.getAdminOrders(filter);
    if (res.success) setOrders(res.orders);
  };

  const updateStatus = async (orderId, status) => {
    const ok = window.confirm(`Change status of this order to "${status}"?`);
    if (!ok) return;

    await api.updateOrderStatus(orderId, status);
    alert("Status updated");
    loadOrders();
  };

  const statusClass = (status) => {
    switch (status) {
      case "Created":
        return "badge bg-primary";
      case "Processing":
        return "badge bg-warning text-dark";
      case "Shipped":
        return "badge bg-info text-dark";
      case "Delivered":
        return "badge bg-success";
      case "Cancelled":
        return "badge bg-danger";
      default:
        return "badge bg-secondary";
    }
  };

  return (
    <div className="admin-dashboard-wrapper">
      <div className="admin-dashboard-box">
        {/* HEADER */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h3 className="fw-bold">Admin Dashboard</h3>

          <button
            className="btn btn-danger btn-sm"
            onClick={() => {
              if (window.confirm("Are you sure you want to logout?")) {
                logoutAdmin();
                navigate("/admin");
              }
            }}
          >
            Logout
          </button>
        </div>

        {/* FILTER */}
        <div className="mb-3">
          <label className="fw-semibold me-2">Filter by status:</label>
          <select
            className="form-select d-inline-block w-auto"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option>All</option>
            <option>Created</option>
            <option>Processing</option>
            <option>Shipped</option>
            <option>Delivered</option>
            <option>Cancelled</option>
          </select>
        </div>

        {/* TABLE */}
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
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {orders.map((o, i) => (
                <tr key={o._id}>
                  <td>{i + 1}</td>
                  <td>{o._id}</td>
                  <td>{new Date(o.createdAt).toLocaleString()}</td>
                  <td>
                    {o.items.map((it, j) => (
                      <div key={j}>
                        {it.title} × {it.qty}
                      </div>
                    ))}
                  </td>
                  <td>{o.total}</td>
                  <td>
                    <span className={statusClass(o.status)}>
                      {o.status}
                    </span>
                  </td>
                  <td>
                    <select
                      className="form-select form-select-sm"
                      value={o.status}
                      onChange={(e) =>
                        updateStatus(o._id, e.target.value)
                      }
                    >
                      <option>Created</option>
                      <option>Processing</option>
                      <option>Shipped</option>
                      <option>Delivered</option>
                      <option>Cancelled</option>
                    </select>
                  </td>
                </tr>
              ))}

              {!orders.length && (
                <tr>
                  <td colSpan="7" className="text-center text-muted">
                    No orders found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}