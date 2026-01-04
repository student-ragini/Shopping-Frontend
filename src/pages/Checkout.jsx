import { useNavigate, useLocation } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/api";

export default function Checkout() {
  const { cart, setCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Buy Now OR Cart
  const items = location.state?.buyNow
  ? [{ ...location.state.buyNow, qty: location.state.buyNow.qty || 1 }]
  : cart;

  const total = items.reduce(
    (sum, item) => sum + item.price * item.qty,
    0
  );

  const placeOrder = async () => {
  try {
    const res = await api.createOrder({
      userId: user,
      items: items.map((i) => ({
        productId: i._id,
        qty: i.qty || 1,
      })),
    });

    if (res?.success) {
      setCart([]);
      navigate("/order-success", {
        replace: true,
        state: {
          orderId: res.orderId,
          total,
        },
      });
    } else {
      alert("Order failed");
    }
  } catch (err) {
    console.error(err);
    alert("Order failed");
  }
};

  return (
    <div className="container mt-5">
      <h3>Checkout</h3>
      <h5>Total Amount: ₹{total}</h5>

      <button className="btn btn-success mt-3" onClick={placeOrder}>
        Place Order
      </button>
    </div>
  );
}