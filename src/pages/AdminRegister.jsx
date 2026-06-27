import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function AdminRegister() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async () => {
    if (!username || !password) {
      alert("Username & Password required");
      return;
    }

    const res = await fetch(`${API_BASE_URL}/admin/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();

    if (data.success) {
      alert("Admin Registered Successfully");
      navigate("/admin");
    } else {
      alert(data.message);
    }
  };

  return (
    <div className="row">
      <div className="col-md-5 register-form">
        <h3 className="mb-4 fw-bold text-dark">Admin Register</h3>

        <input
          className="form-control register-input mb-3"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          type="password"
          className="form-control register-input mb-3"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          className="btn btn-primary"
          onClick={handleRegister}
        >
          Register
        </button>
      </div>

      <div className="col-md-7"></div>
    </div>
  );
}