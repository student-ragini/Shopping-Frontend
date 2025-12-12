/* eslint-disable no-unused-vars */
/* global $, document */

const API_BASE =
  import.meta.env.VITE_API_BASE ||
  "https://shopping-backend-jb5p.onrender.com";

$(function () {
  let currentProducts = [];

  /* HELPERS */

  function getCurrentUserId() {
    try {
      return $.cookie("userid") || null;
    } catch {
      return null;
    }
  }

  function fixImageUrl(raw) {
    if (!raw) return "";
    try {
      if (/^https?:\/\//i.test(raw)) {
        if (/^(https?:\/\/)(127\.0\.0\.1|localhost)/i.test(raw)) {
          const fname = raw.split("/").pop();
          return fname ? "/public/" + fname : "";
        }
        return raw;
      }
      if (/^public[\\/]/i.test(raw)) {
        return "/" + raw.replace(/^[\\/]+/, "");
      }
      const fname = raw.split(/[\\/]/).pop();
      return fname ? "/public/" + fname : "";
    } catch {
      return "";
    }
  }

  async function sanitizeCart() {
    try {
      let cart = JSON.parse(localStorage.getItem("cart") || "[]");
      if (!Array.isArray(cart)) cart = [];
      cart = cart.map((it) => ({ id: String(it.id), qty: Number(it.qty) || 1 }));

      const resp = await fetch(API_BASE + "/getproducts");
      if (!resp.ok) return;
      const products = await resp.json();

      const valid = new Set();
      products.forEach((p) => {
        if (p.id !== undefined) valid.add(String(p.id));
        if (p._id !== undefined) valid.add(String(p._id));
      });

      const filtered = cart.filter((it) => valid.has(String(it.id)));
      if (filtered.length !== cart.length) {
        localStorage.setItem("cart", JSON.stringify(filtered));
      }
    } catch {
      /* ignore */
    }
  }

  function saveCartToLocalAndUser(cart) {
    try {
      const arr = Array.isArray(cart) ? cart : [];
      localStorage.setItem("cart", JSON.stringify(arr));
      const uid = getCurrentUserId();
      if (uid) {
        localStorage.setItem("cart_" + uid, JSON.stringify(arr));
      }
    } catch {
      /* ignore */
    }
  }

  function loadCartForCurrentUser() {
    try {
      const uid = getCurrentUserId();
      if (uid) {
        const per = localStorage.getItem("cart_" + uid);
        if (per) return JSON.parse(per || "[]");
      }
      return JSON.parse(localStorage.getItem("cart") || "[]");
    } catch {
      return [];
    }
  }

  function updateCartCount() {
    try {
      const cart = loadCartForCurrentUser();
      let total = 0;
      if (Array.isArray(cart)) {
        total = cart.reduce((sum, it) => sum + (Number(it.qty) || 0), 0);
      }
      if ($("#cartCount").length) {
        $("#cartCount").text(total);
      } else if ($("#btnCart").length) {
        $("#btnCart").text("Cart(" + total + ")");
      }
    } catch {
      if ($("#cartCount").length) $("#cartCount").text(0);
    }
  }

  sanitizeCart().then(updateCartCount);

  /* ========== ... (rest of your UI code unchanged, omitted here for brevity) ========== */

  // ------------ ORDERS code (improved cancel + fetch handling) --------------

  function renderOrderDetails(order) {
    if (!order) {
      alert("Order not found.");
      return;
    }

    const created = order.createdAt ? new Date(order.createdAt).toLocaleString() : "-";

    const itemsRows = Array.isArray(order.items) && order.items.length
      ? order.items.map(function (it, i) {
          const title = it.title || "Item " + (i + 1);
          const qty = it.qty || 1;
          const price = it.unitPrice || it.price || 0;
          const total = Number(price) * Number(qty);
          return (
            "<tr>" +
            "<td>" +
            (i + 1) +
            "</td>" +
            "<td>" +
            title +
            "</td>" +
            "<td>" +
            qty +
            "</td>" +
            "<td>" +
            price +
            "</td>" +
            "<td>" +
            total +
            "</td>" +
            "</tr>"
          );
        }).join("")
      : '<tr><td colspan="5" class="text-center">No items</td></tr>';

    const html =
      '<div class="container my-4">' +
      '<h3 class="mb-3">Order Details</h3>' +
      '<div class="card mb-3">' +
      '<div class="card-body">' +
      "<p><strong>Order ID:</strong> " +
      (order._id || "") +
      "</p>" +
      "<p><strong>Date:</strong> " +
      created +
      "</p>" +
      "<p><strong>Status:</strong> " +
      (order.status || "Created") +
      "</p>" +
      "<p><strong>Total:</strong> ₹" +
      (order.total || 0) +
      "</p>" +
      "</div>" +
      "</div>" +
      '<div class="card">' +
      '<div class="card-body">' +
      "<h5 class='card-title mb-3'>Items</h5>" +
      '<div class="table-responsive">' +
      '<table class="table table-striped table-bordered align-middle">' +
      "<thead><tr>" +
      "<th>#</th>" +
      "<th>Item</th>" +
      "<th>Qty</th>" +
      "<th>Price (₹)</th>" +
      "<th>Total (₹)</th>" +
      "</tr></thead><tbody>" +
      itemsRows +
      "</tbody></table>" +
      "</div>" +
      "</div>" +
      "</div>" +
      '<div class="mt-3">' +
      '<button id="btnBackToOrders" class="btn btn-secondary">Back to My Orders</button>' +
      "</div>" +
      "</div>";

    $("#bodyContainer").html(html);

    $("#btnBackToOrders").off("click").on("click", function (e) {
      e.preventDefault();
      showOrders();
    });
  }

  function showOrders() {
    const uid = getCurrentUserId();
    if (!uid) {
      alert("Please login to view your orders.");
      $("#btnNavLogin").click();
      return;
    }

    $("#bodyContainer").html('<div class="p-4 text-center">Loading your orders...</div>');

    $.ajax({
      method: "GET",
      url: API_BASE + "/orders/user/" + encodeURIComponent(uid),
    })
      .then(function (resp) {
        if (!resp || resp.success === false) {
          $("#bodyContainer").html('<div class="p-4 text-danger">Unable to load orders.</div>');
          return;
        }

        let allOrders = resp.orders || [];
        if (!allOrders.length) {
          $("#bodyContainer").html('<div class="p-4"><h4>No orders found</h4><p>You have not placed any orders yet.</p></div>');
          return;
        }

        // index by string(_id)
        const ordersById = {};
        allOrders.forEach(function (o) {
          const key = String(o._id || o.id || "");
          if (key) ordersById[key] = o;
        });

        let html =
          '<div class="container my-4">' +
          '<div class="d-flex justify-content-between align-items-center">' +
          '<h3 class="mb-0">My Orders</h3>' +
          '<div class="d-flex align-items-center">' +
          '<label class="me-2 mb-0 small">Filter by status:</label>' +
          '<select id="orderStatusFilter" class="form-select form-select-sm" style="width:auto">' +
          '<option value="All">All</option>' +
          '<option value="Created">Created</option>' +
          '<option value="Processing">Processing</option>' +
          '<option value="Shipped">Shipped</option>' +
          '<option value="Delivered">Delivered</option>' +
          '<option value="Cancelled">Cancelled</option>' +
          "</select>" +
          "</div>" +
          "</div>" +
          '<div class="table-responsive mt-3">' +
          '<table class="table table-striped table-bordered align-middle">' +
          "<thead>" +
          "<tr>" +
          "<th>#</th>" +
          "<th>Order ID</th>" +
          "<th>Date</th>" +
          "<th>Items</th>" +
          "<th>Total (₹)</th>" +
          "<th>Status</th>" +
          "<th>Actions</th>" +
          "</tr>" +
          "</thead><tbody id='ordersTableBody'></tbody></table></div></div>";

        $("#bodyContainer").html(html);

        function getStatusBadgeClass(status) {
          switch (status) {
            case "Processing":
              return "bg-warning text-dark";
            case "Shipped":
              return "bg-info text-dark";
            case "Delivered":
              return "bg-success";
            case "Cancelled":
              return "bg-danger";
            default:
              return "bg-secondary";
          }
        }

        function renderOrdersList(list) {
          const $tbody = $("#ordersTableBody");
          if (!list || !list.length) {
            $tbody.html('<tr><td colspan="7" class="text-center">No orders found</td></tr>');
            return;
          }

          let rowsHtml = "";
          list.forEach(function (order, idx) {
            const created = order.createdAt ? new Date(order.createdAt).toLocaleString() : "-";
            const itemsText = Array.isArray(order.items)
              ? order.items.map(function (it) { return (it.title || "Item") + " × " + (it.qty || 1); }).join(", ")
              : "-";

            const status = order.status || "Created";
            const badgeClass = getStatusBadgeClass(status);

            const canCancel = status === "Created" || status === "Processing";

            const key = String(order._id || order.id || "");

            rowsHtml +=
              "<tr>" +
              "<td>" + (idx + 1) + "</td>" +
              "<td>" + key + "</td>" +
              "<td>" + created + "</td>" +
              "<td>" + itemsText + "</td>" +
              "<td>" + (order.total || 0) + "</td>" +
              "<td>" + '<span class="badge ' + badgeClass + '">' + status + "</span>" + "</td>" +
              "<td>" +
              '<button class="btn btn-sm btn-outline-primary btn-view-order" data-id="' + key + '">View</button> ';

            if (canCancel) {
              rowsHtml += '<button class="btn btn-sm btn-outline-danger btn-cancel-order" data-id="' + key + '">Cancel</button>';
            }

            rowsHtml += "</td></tr>";
          });

          $tbody.html(rowsHtml);
        }

        renderOrdersList(allOrders);

        $("#orderStatusFilter").off("change").on("change", function () {
          const val = $(this).val();
          if (val === "All") {
            renderOrdersList(allOrders);
          } else {
            const filtered = allOrders.filter(function (o) { return (o.status || "Created") === val; });
            renderOrdersList(filtered);
          }
        });

        $("#bodyContainer").off("click", ".btn-view-order").on("click", ".btn-view-order", function (e) {
          e.preventDefault();
          const id = String($(this).data("id"));
          const order = ordersById[id];
          if (!order) {
            // try to fetch single order from server as fallback
            $.ajax({ method: "GET", url: API_BASE + "/orders/" + encodeURIComponent(id) })
              .then(function (r) {
                if (r && r.success && r.order) {
                  renderOrderDetails(r.order);
                } else {
                  alert("Order not found");
                }
              })
              .catch(function () { alert("Unable to fetch order details"); });
            return;
          }
          renderOrderDetails(order);
        });

        // cancel button (customer)
        $("#bodyContainer").off("click", ".btn-cancel-order").on("click", ".btn-cancel-order", function () {
          const orderId = String($(this).data("id"));
          const order = ordersById[orderId];

          if (!order) {
            alert("Order not found in local list.");
            return;
          }

          const st = order.status || "Created";
          if (st === "Shipped" || st === "Delivered" || st === "Cancelled") {
            alert("This order can no longer be cancelled.");
            return;
          }

          if (!window.confirm("Are you sure you want to cancel this order?")) return;

          // use PATCH (but some hosts restrict PATCH) -> fallback to POST
          fetch(API_BASE + "/orders/" + encodeURIComponent(orderId) + "/status", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "Cancelled" }),
          })
            .then(function (r) {
              // try to parse json even if status != 200
              return r.text().then((t) => {
                try { return JSON.parse(t); } catch { return { success: false, message: t || "Server error" }; }
              });
            })
            .then(function (resp2) {
              if (!resp2 || resp2.success === false) {
                alert((resp2 && resp2.message) || "Failed to cancel the order.");
                return;
              }

              alert("Order cancelled.");

              // update local copy
              if (ordersById[orderId]) ordersById[orderId].status = "Cancelled";
              allOrders = allOrders.map(function (o) { if (String(o._id || o.id) === orderId) o.status = "Cancelled"; return o; });

              const currentFilter = $("#orderStatusFilter").val();
              if (currentFilter === "All") renderOrdersList(allOrders);
              else {
                const filtered = allOrders.filter(function (o) { return (o.status || "Created") === currentFilter; });
                renderOrdersList(filtered);
              }
            })
            .catch(function (err) {
              console.error("Cancel order error:", err);
              // try fallback using POST (some platforms block PATCH)
              fetch(API_BASE + "/orders/" + encodeURIComponent(orderId) + "/status", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "Cancelled" }),
              })
                .then((r) => r.json())
                .then((r2) => {
                  if (r2 && r2.success) {
                    alert("Order cancelled.");
                    if (ordersById[orderId]) ordersById[orderId].status = "Cancelled";
                    allOrders = allOrders.map(function (o) { if (String(o._id || o.id) === orderId) o.status = "Cancelled"; return o; });
                    const currentFilter = $("#orderStatusFilter").val();
                    if (currentFilter === "All") renderOrdersList(allOrders);
                    else {
                      const filtered = allOrders.filter(function (o) { return (o.status || "Created") === currentFilter; });
                      renderOrdersList(filtered);
                    }
                  } else {
                    alert("Error while cancelling order.");
                  }
                })
                .catch(function () {
                  alert("Error while cancelling order.");
                });
            });
        });
      })
      .catch(function () {
        $("#bodyContainer").html('<div class="p-4 text-danger">Error loading orders.</div>');
      });
  }

  // My Orders nav
  $("#btnNavOrders").off("click").on("click", function (e) { e.preventDefault(); showOrders(); });

  /* =========================
   * Remaining functions (products, cart, admin etc.) remain same as your original script.
   * For brevity I have only included the updated/robust order-cancel logic and the helpers above.
   *
   * Please replace your main.js with your full original file but ensure:
   *  - the showOrders / renderOrderDetails and cancel logic (above) replaces the old code,
   *  - and API_BASE is correct (pointing to your backend).
   *
   * The rest of your main.js functions (getProducts, showCart, checkout, profile, admin) can remain the same.
   */

  /* ========== INITIAL SETUP ON PAGE LOAD ========== */

  try {
    const uid = getCurrentUserId();
    if (uid) {
      const perCart = localStorage.getItem("cart_" + uid);
      if (perCart) {
        localStorage.setItem("cart", perCart);
      }
      $("#user").text(uid);
      $("#btnSignout").text("Signout");
    }
  } catch {
    /* ignore */
  }

  updateCartCount();

  const yearSpan = document.getElementById("year");
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }
});