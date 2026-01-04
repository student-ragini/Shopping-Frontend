 const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const api = {
  login: async (data) => {
    const res = await fetch(`${API_BASE_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  getProducts: async () => {
    const res = await fetch(`${API_BASE_URL}/products`);
    return res.json();
  },

  getProductById: async (id) => {
    const res = await fetch(`${API_BASE_URL}/products/${id}`);
    return res.json();
  },

  createOrder: async (data) => {
    const res = await fetch(`${API_BASE_URL}/createorder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  
  getOrders: async (userId) => {
    const res = await fetch(`${API_BASE_URL}/orders/${userId}`);
    return res.json();
  },

  // ADMIN
adminLogin: async (data) => {
  const res = await fetch(`${API_BASE_URL}/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
},

getAdminOrders: async (status = "All") => {
  const q = status && status !== "All" ? `?status=${status}` : "";
  const res = await fetch(`${API_BASE_URL}/admin/orders${q}`);
  return res.json();
},

updateOrderStatus: async (orderId, status) => {
  const res = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  return res.json();
},

//  RATING APIs
rateProduct: async (productId, data) => {
  const res = await fetch(`${API_BASE_URL}/products/${productId}/rate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
},

getProductRating: async (productId) => {
  const res = await fetch(`${API_BASE_URL}/products/${productId}/rating`);
  return res.json();
},

};