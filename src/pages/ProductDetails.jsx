import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api/api";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();

  const [product, setProduct] = useState(null);
  const [rating, setRating] = useState({ avg: 0, count: 0 });
  const [myRating, setMyRating] = useState(0);

  useEffect(() => {
    api.getProductById(id).then(setProduct);
    api.getProductRating(id).then(res => {
      if (res.success) setRating(res.rating);
    });
  }, [id]);

  const submitRating = async (value) => {
    setMyRating(value);
    await api.rateProduct(id, {
      userId: user,
      rating: value,
    });
    const r = await api.getProductRating(id);
    if (r.success) setRating(r.rating);
  };

  if (!product) return null;

  return (
    <div className="product-details">
      <div className="row align-items-center">
        <div className="col-md-5 text-center">
          <img src={product.image} className="details-img img-fluid" />
        </div>

        <div className="col-md-6">
          <h3>{product.title}</h3>
          <h4 className="text-success">₹{product.price}</h4>

          {/* ⭐ RATING DISPLAY */}
          <div className="mb-2">
            <strong>{rating.avg}</strong> ⭐ ({rating.count} reviews)
          </div>

          {/* ⭐ RATE PRODUCT */}
          <div className="mb-3">
           {[1, 2, 3, 4, 5].map((n) => (
            <span
             key={n}
             style={{
             cursor: "pointer",
             fontSize: "1.4rem",
             color: n <= (myRating || rating.avg) ? "#f5b301" : "#ccc",
             }}
            onClick={() => submitRating(n)}
            >
            ★
          </span>
          ))}
          </div>

          <p>{product.description}</p>

          <div className="d-flex flex-column gap-2" style={{ maxWidth: "260px" }}>
            <button className="btn btn-info fw-bold" onClick={() => addToCart(product)}>
              Add to Cart
            </button>

            <button
              className="btn btn-warning fw-bold"
              onClick={() =>
                navigate("/checkout", {
                  state: { buyNow: { ...product, qty: 1 } },
                })
              }
            >
              Buy Now
            </button>

            <button
              className="btn btn-outline-secondary"
              onClick={() => navigate(-1)}
            >
               Back to Catalog
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}