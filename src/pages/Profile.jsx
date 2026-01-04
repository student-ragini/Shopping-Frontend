import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE_URL}/customers/${user}`)
      .then((res) => res.json())
      .then((data) => setProfile(data.customer));
  }, [user]);

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleUpdate = async () => {
    setSaving(true);

    const payload = {
      FirstName: profile.FirstName,
      LastName: profile.LastName,
      Email: profile.Email,
      Mobile: profile.Mobile,
      Gender: profile.Gender,
      Address: profile.Address,
      PostalCode: profile.PostalCode,
      State: profile.State,
      Country: profile.Country,
    };

    if (profile.Password && profile.Password.trim() !== "") {
      payload.Password = profile.Password;
    }

    const res = await fetch(
      `${API_BASE_URL}/customers/${profile.UserId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    const data = await res.json();
    setProfile(data.customer);
    setSaving(false);

    alert("Profile updated successfully");
  };

  if (!profile) return null;

  return (
    <div className="profile-box">
      <h3 className="mb-3">My Profile</h3>

      <div className="row g-3">
        <div className="col-md-4">
          <label>User ID</label>
          <input className="form-control" value={profile.UserId} disabled />
        </div>

        <div className="col-md-4">
          <label>First Name</label>
          <input
            className="form-control"
            name="FirstName"
            value={profile.FirstName || ""}
            onChange={handleChange}
          />
        </div>

        <div className="col-md-4">
          <label>Last Name</label>
          <input
            className="form-control"
            name="LastName"
            value={profile.LastName || ""}
            onChange={handleChange}
          />
        </div>

        <div className="col-md-4">
          <label>Email</label>
          <input
            className="form-control"
            name="Email"
            value={profile.Email || ""}
            onChange={handleChange}
          />
        </div>

        <div className="col-md-4">
          <label>Mobile</label>
          <input
            className="form-control"
            name="Mobile"
            value={profile.Mobile || ""}
            onChange={handleChange}
          />
        </div>

        <div className="col-md-4">
          <label>Gender</label>
          <select
            className="form-control"
            name="Gender"
            value={profile.Gender || ""}
            onChange={handleChange}
          >
            <option value="">Select</option>
            <option>Male</option>
            <option>Female</option>
          </select>
        </div>

        <div className="col-md-12">
          <label>Address</label>
          <input
            className="form-control"
            name="Address"
            value={profile.Address || ""}
            onChange={handleChange}
          />
        </div>

        <div className="col-md-4">
          <label>Postal Code</label>
          <input
            className="form-control"
            name="PostalCode"
            value={profile.PostalCode || ""}
            onChange={handleChange}
          />
        </div>

        <div className="col-md-4">
          <label>State</label>
          <input
            className="form-control"
            name="State"
            value={profile.State || ""}
            onChange={handleChange}
          />
        </div>

        <div className="col-md-4">
          <label>Country</label>
          <input
            className="form-control"
            name="Country"
            value={profile.Country || ""}
            onChange={handleChange}
          />
        </div>

        <div className="col-md-6">
          <label>New Password</label>
          <input
            type="password"
            className="form-control"
            name="Password"
            placeholder="Leave blank to keep same"
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="mt-4">
        <button
          className="btn btn-primary me-2"
          onClick={handleUpdate}
          disabled={saving}
        >
          {saving ? "Updating..." : "Update Profile"}
        </button>

        <a href="/" className="btn btn-secondary">
          Back to Shop
        </a>
      </div>
    </div>
  );
}