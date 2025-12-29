import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { api } from "../api/api";
import { useAdminAuth } from "../context/AdminAuthContext";

export default function Admin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { loginAdmin } = useAdminAuth();

  const handleLogin = async () => {
    if (!username || !password) {
      alert("Username & password required");
      return;
    }

    setLoading(true);

    const res = await api.adminLogin({ username, password });

    setLoading(false);

    if (!res.success) {
      alert(res.message || "Invalid admin credentials");
      return;
    }

    // ✅ SAVE ADMIN IN CONTEXT
    loginAdmin({ username: res.username });

    // ✅ GO TO ADMIN DASHBOARD (NOT HOME)
    navigate("/admin-dashboard");
  };

  return (
    <div className="row">
      {/* LEFT ADMIN LOGIN FORM */}
      <div className="col-md-5 register-form">
        <h3 className="mb-4 fw-bold text-dark">Admin Login</h3>

        <div className="mb-3">
          <label className="form-label-dark">Username</label>
          <input
            className="form-control register-input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        <div className="mb-3">
          <label className="form-label-dark">Password</label>
          <input
            type="password"
            className="form-control register-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button
          className="btn btn-primary px-4"
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </div>

      {/* RIGHT EMPTY (background image visible) */}
      <div className="col-md-7"></div>
    </div>
  );
}