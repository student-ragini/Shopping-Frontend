import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";

export default function ProductCard({ product }) {
  const navigate = useNavigate();
  const { addToCart } = useCart();

  return (
    <div className="product-card">
      <div
        className="product-img-wrapper"
        onClick={() => navigate(`/products/${product._id}`)}
      >
        <img src={product.image} alt={product.title} />
      </div>

      <div className="product-info">
        <h6
          className="product-title"
          onClick={() => navigate(`/products/${product._id}`)}
        >
          {product.title}
        </h6>

        <p className="product-price">₹{product.price}</p>

        <button
          className="btn btn-sm btn-primary"
          onClick={() => addToCart(product)}
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
}
