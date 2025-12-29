import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container-fluid">
        <Link className="navbar-brand" to="/">
          🛒 Shopping - Online
        </Link>

        <div className="collapse navbar-collapse show">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <Link className="nav-link" to="/products">Shop</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/categories">Categories</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/orders">My Orders</Link>
            </li>
          </ul>

          <div className="d-flex align-items-center gap-2">
            {user && <span className="text-light me-2">{user}</span>}

            <button onClick={() => navigate("/register")} className="btn btn-outline-light">
              Register
            </button>

            <button onClick={() => navigate("/login")} className="btn btn-outline-light">
              Login
            </button>

            <button onClick={() => navigate("/admin")} className="btn btn-outline-light">
              Admin
            </button>

            <button onClick={() => navigate("/profile")} className="btn btn-outline-light">
              My Profile
            </button>

            <button onClick={() => navigate("/cart")} className="btn btn-outline-light">
              Cart ({cartCount})
            </button>

            <button
              onClick={() => {
                logout();
                setTimeout (() => {
                   navigate("/" , { replace: true});
                }, 0);
               
              }}
              className="btn btn-warning"
            >
              Signout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}