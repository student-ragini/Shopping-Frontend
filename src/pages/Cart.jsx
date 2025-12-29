import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";

export default function Cart() {
  const {
    cart,
    increaseQty,
    decreaseQty,
    removeFromCart,
    totalAmount,
  } = useCart();

  const navigate = useNavigate();

  if (cart.length === 0) {
    return <h4 className="text-center mt-5">Your cart is empty</h4>;
  }

  const checkout = () => {
    if (
      window.confirm(
        `You are about to place an order for ₹${totalAmount}. Proceed?`
      )
    ) {
      // ✅ replace:true is THE KEY
      navigate("/checkout", { replace: true });
    }
  };

  return (
    <div className="container">
      <h3 className="mb-3">Your Cart</h3>

      {cart.map((item) => (
        <div key={item._id} className="card mb-3 p-3">
          <div className="row align-items-center">
            <div className="col-md-2">
              <img src={item.image} alt={item.title} className="img-fluid" />
            </div>

            <div className="col-md-4">
              <h6>{item.title}</h6>
              <p>₹{item.price}</p>
            </div>

            <div className="col-md-3">
              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={() => decreaseQty(item._id)}
              >
                −
              </button>
              <span className="mx-2">{item.qty}</span>
              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={() => increaseQty(item._id)}
              >
                +
              </button>
            </div>

            <div className="col-md-3 text-end">
              <button
                className="btn btn-danger btn-sm"
                onClick={() => removeFromCart(item._id)}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      ))}

      <h5 className="text-end mt-3">Total: ₹{totalAmount}</h5>

      <div className="text-end mt-3">
        <button className="btn btn-primary" onClick={checkout}>
          Checkout
        </button>
      </div>
    </div>
  );
}