export default function Footer() {
  return (
    <footer className="bg-dark text-light mt-5">
      <div className="container py-4">
        <div className="row">
          <div className="col-md-6">
            <h5>Shopping - Online</h5>
            <p className="small">
              Fast, reliable shopping. Quality products at the best prices.
            </p>
          </div>

          <div className="col-md-3">
            <h6>Quick Links</h6>
            <ul className="list-unstyled small">
              <li>Shop</li>
              <li>Register</li>
            </ul>
          </div>

          <div className="col-md-3 text-md-end">
            <h6>Follow us</h6>
            <span className="me-2">Twitter</span>
            <span className="me-2">Facebook</span>
            <span>Instagram</span>
          </div>
        </div>

        <div className="text-center small mt-3">
          © {new Date().getFullYear()} Shopping - Online
        </div>
      </div>
    </footer>
  );
}