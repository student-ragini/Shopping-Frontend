import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { api } from "../api/api";
import ProductCard from "../components/ProductCard";
import { useAuth } from "../context/AuthContext";

export default function Products() {
  const { user } = useAuth();
  const location = useLocation();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("");

  // 🔐 Login check
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const params = new URLSearchParams(location.search);
  const category = params.get("category");

  useEffect(() => {
    api.getProducts()
      .then((data) => setProducts(data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  let filteredProducts = products.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase())
  );

  const categoryMap = {
    mens: "Men's Fashion",
    womens: "Women's Fashion",
    electronics: "Electronics",
    jewelery: "Jewelery",
  };

  if (category && categoryMap[category]) {
    filteredProducts = filteredProducts.filter(
      (p) => p.category === categoryMap[category]
    );
  }

  if (sort === "low") {
    filteredProducts.sort((a, b) => a.price - b.price);
  }
  if (sort === "high") {
    filteredProducts.sort((a, b) => b.price - a.price);
  }

  if (loading) {
    return <h4 className="text-center mt-5">Loading products...</h4>;
  }

  return (
    <div className="container">
      <h3 className="mt-3">Product Catalog</h3>

      <div className="row my-3">
        <div className="col-md-6">
          <input
            className="form-control"
            placeholder="Search products by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="col-md-3">
          <select
            className="form-select"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="">Sort by</option>
            <option value="low">Price: Low to High</option>
            <option value="high">Price: High to Low</option>
          </select>
        </div>
      </div>

      <div id="productCatalog">
        {filteredProducts.length === 0 ? (
          <p>No products found</p>
        ) : (
          filteredProducts.map((p) => (
            <ProductCard key={p._id} product={p} />
          ))
        )}
      </div>
    </div>
  );
}