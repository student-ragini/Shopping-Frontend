import { useNavigate } from "react-router-dom";

export default function Categories() {
  const navigate = useNavigate();

  return (
    <div className="container">
      <h3 className="mt-3">Categories</h3>

      <div className="d-flex gap-3 mt-4 flex-wrap">
        <div
          className="card p-3 cursor-pointer"
          style={{ cursor: "pointer" }}
          onClick={() => navigate("/products?category=mens")}
        >
          Men's Fashion
        </div>

        <div
          className="card p-3"
          style={{ cursor: "pointer" }}
          onClick={() => navigate("/products?category=womens")}
        >
          Women's Fashion
        </div>

        <div
          className="card p-3"
          style={{ cursor: "pointer" }}
          onClick={() => navigate("/products?category=electronics")}
        >
          Electronics
        </div>

        <div
          className="card p-3"
          style={{ cursor: "pointer" }}
          onClick={() => navigate("/products?category=jewelery")}
        >
          Jewelery
        </div>
      </div>
    </div>
  );
}
