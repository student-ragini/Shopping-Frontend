import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    UserId: "",
    FirstName: "",
    LastName: "",
    DateOfBirth: "",
    Email: "",
    Gender: "",
    Address: "",
    PostalCode: "",
    State: "",
    Country: "",
    Mobile: "",
    Password: "",
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const handleRegister = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/customerregister`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (data.success) {
      alert("✅ Registration Successful");
      navigate("/login");
    } else {
      alert("❌ User already exists");
    }
  } catch (err) {
    console.error(err);
    alert("❌ Server error");
  }
};

  return (
    <div className="row">
      <div className="col-md-5 register-form">
        <h3 className="mb-3 fw-bold text-dark">Register New User</h3>

        <input className="form-control register-input mb-2" name="UserId" placeholder="User ID" onChange={handleChange} />
        <input className="form-control register-input mb-2" name="FirstName" placeholder="First Name" onChange={handleChange} />
        <input className="form-control register-input mb-2" name="LastName" placeholder="Last Name" onChange={handleChange} />

        <input type="date" className="form-control register-input mb-2" name="DateOfBirth" onChange={handleChange} />

        <input type="email" className="form-control register-input mb-2" name="Email" placeholder="Email" onChange={handleChange} />

        <select className="form-select register-input mb-2" name="Gender" onChange={handleChange}>
          <option value="">Select Gender</option>
          <option>Male</option>
          <option>Female</option>
          <option>Other</option>
        </select>

        <input className="form-control register-input mb-2" name="Address" placeholder="Address" onChange={handleChange} />
        <input className="form-control register-input mb-2" name="PostalCode" placeholder="Postal Code" onChange={handleChange} />
        <input className="form-control register-input mb-2" name="State" placeholder="State" onChange={handleChange} />
        <input className="form-control register-input mb-2" name="Country" placeholder="Country" onChange={handleChange} />
        <input className="form-control register-input mb-2" name="Mobile" placeholder="Mobile" onChange={handleChange} />

        <input
          type="password"
          className="form-control register-input mb-3"
          name="Password"
          placeholder="Password"
          onChange={handleChange}
        />

        <button className="btn btn-primary px-4" onClick={handleRegister}>
          Register
        </button>
      </div>

      <div className="col-md-7"></div>
    </div>
  );
}
