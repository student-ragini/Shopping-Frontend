import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/api";

export default function Login() {
  const [form, setForm] = useState({ UserId: "", Password: "" });
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLogin = async () => {
    try {
      const data = await api.login(form);

      if (data.success) {
         alert(" Login Successful✅ ");
        login(data.userId);
        navigate("/products", { replace: true });
      } else {
        alert(data.message || "Invalid credentials");
      }
    } catch (err) {
      alert("Server error");
    }
  };

  return (
    <div className="row">
      <div className="col-md-5 register-form">
        <h3 className="mb-4 fw-bold text-dark">Customer Login</h3>

        <input
          className="form-control register-input mb-3"
          name="UserId"
          placeholder="User ID"
          onChange={handleChange}
        />

        <input
          type="password"
          className="form-control register-input mb-3"
          name="Password"
          placeholder="Password"
          onChange={handleChange}
        />

        <button className="btn btn-primary px-4" onClick={handleLogin}>
          Login
        </button>
      </div>
    </div>
  );
}