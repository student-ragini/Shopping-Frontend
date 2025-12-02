/* eslint-disable no-unused-vars */
/* global $, document */

// Backend base URL
const API_BASE =
  import.meta.env.VITE_API_BASE ||
  "https://shopping-backend-jb5p.onrender.com";

$(function () {
  // Last loaded products (for search + sort)
  let currentProducts = [];

  /* =========================
   * Helpers
   * ======================= */

  function getCurrentUserId() {
    return $.cookie("userid") || null;
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
    } catch (e) {
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
    } catch (err) {
      // ignore
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
    } catch (e) {
      // ignore
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
    } catch (e) {
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
    } catch (err) {
      if ($("#cartCount").length) $("#cartCount").text(0);
    }
  }

  sanitizeCart().then(function () {
    updateCartCount();
  });

  /* =========================
   * Register
   * ======================= */

  $("#btnNavRegister")
    .off("click")
    .on("click", function () {
      $.ajax({ method: "GET", url: "/register.html" }).then(function (html) {
        $("#bodyContainer").html(html);

        $("#btnRegister")
          .off("click")
          .on("click", function () {
            const customerData = {
              UserId: $("#UserId").val().trim(),
              FirstName: $("#FirstName").val().trim(),
              LastName: $("#LastName").val().trim(),
              DateOfBirth: $("#DateOfBirth").val(),
              Email: $("#Email").val().trim(),
              Gender: $("#Gender").val(),
              Address: $("#Address").val().trim(),
              PostalCode: $("#PostalCode").val().trim(),
              State: $("#State").val().trim(),
              Country: $("#Country").val().trim(),
              Mobile: $("#Mobile").val().trim(),
              Password: $("#Password").val(),
            };

            if (
              !customerData.UserId ||
              !customerData.FirstName ||
              !customerData.LastName ||
              !customerData.Email ||
              !customerData.Password
            ) {
              alert("Please fill all required fields");
              return;
            }

            $.ajax({
              method: "POST",
              url: API_BASE + "/customerregister",
              data: customerData,
            })
              .then(function (resp) {
                if (resp && resp.success === false) {
                  alert(resp.message || "Registration failed");
                  return;
                }

                alert((resp && resp.message) || "Registered successfully");

                $.ajax({ method: "GET", url: "/login.html" }).then(function (
                  resp2
                ) {
                  $("#bodyContainer").html(resp2);
                });
              })
              .catch(function () {
                alert("Registration failed");
              });
          });
      });
    });

  /* =========================
   * Login helper
   * ======================= */

  function attachLoginHandler(onSuccess) {
    $("#btnLogin")
      .off("click")
      .on("click", function () {
        const formUserId = $("#txtUserId").val().trim();
        const formPwd = $("#txtPwd").val();

        if (!formUserId || !formPwd) {
          alert("Please enter UserId and Password");
          return;
        }

        $.ajax({
          method: "POST",
          url: API_BASE + "/login",
          data: {
            UserId: formUserId,
            Password: formPwd,
          },
        })
          .then(function (resp) {
            if (!resp || resp.success === false) {
              alert((resp && resp.message) || "Invalid username or password");
              return;
            }

            const uid = resp.userId || formUserId;

            $.cookie("userid", uid, { path: "/" });
            $("#user").text(uid);
            $("#btnSignout").text("Signout");

            try {
              const per = localStorage.getItem("cart_" + uid);
              if (per) localStorage.setItem("cart", per);
            } catch (e) {
              // ignore
            }

            updateCartCount();

            if (typeof onSuccess === "function") {
              onSuccess();
            } else {
              $.ajax({ method: "GET", url: "/shophome.html" }).then(function (
                resp2
              ) {
                $("#bodyContainer").html(resp2);
              });
            }
          })
          .catch(function () {
            alert("Login error");
          });
      });
  }

  /* =========================
   * Nav: Login
   * ======================= */

  $("#btnNavLogin")
    .off("click")
    .on("click", function () {
      $.ajax({ method: "GET", url: "/login.html" })
        .then(function (resp) {
          $("#bodyContainer").html(resp);
          attachLoginHandler();
        })
        .catch(function () {});
    });

  /* =========================
   * Signout
   * ======================= */

  $("#btnSignout")
    .off("click")
    .on("click", function () {
      const uid = getCurrentUserId();

      try {
        const cart = JSON.parse(localStorage.getItem("cart") || "[]");
        if (uid) {
          localStorage.setItem("cart_" + uid, JSON.stringify(cart));
        }
      } catch (e) {
        // ignore
      }

      $.removeCookie("userid", { path: "/" });
      localStorage.removeItem("cart");

      updateCartCount();

      alert("Signed out Successfully");
      $("#user").text("");
      $("#btnSignout").text("Login");

      $.ajax({ method: "GET", url: "/login.html" })
        .then(function (resp) {
          $("#bodyContainer").html(resp);
          attachLoginHandler();
        })
        .catch(function () {});
    });

  /* =========================
   * Nav: Profile
   * ======================= */

  $("#btnNavProfile")
    .off("click")
    .on("click", function () {
      const uid = getCurrentUserId();
      if (!uid) {
        alert("Please login to view your profile.");
        $("#btnNavLogin").click();
        return;
      }

      $.ajax({ method: "GET", url: "/profile.html" })
        .then(function (resp) {
          $("#bodyContainer").html(resp);
          loadProfilePage();
        })
        .catch(function () {});
    });

  /* =========================
   * Nav: Shop
   * ======================= */

  $("#btnNavShopping")
    .off("click")
    .on("click", function () {
      if (!getCurrentUserId()) {
        $.ajax({ method: "GET", url: "/login.html" }).then(function (resp) {
          $("#bodyContainer").html(resp);
          attachLoginHandler(function () {
            $.ajax({ method: "GET", url: "/products.html" }).then(function (
              resp2
            ) {
              $("#bodyContainer").html(resp2);
              getProducts();
            });
          });
        });
      } else {
        $.ajax({ method: "GET", url: "/products.html" }).then(function (resp) {
          $("#bodyContainer").html(resp);
          getProducts();
        });
      }
    });

  /* =========================
   * Nav: Categories
   * ======================= */

  $("#btnNavCategories")
    .off("click")
    .on("click", function () {
      if (!getCurrentUserId()) {
        $.ajax({ method: "GET", url: "/login.html" }).then(function (resp) {
          $("#bodyContainer").html(resp);
          attachLoginHandler(function () {
            $.ajax({ method: "GET", url: "/categories.html" }).then(function (
              resp2
            ) {
              $("#bodyContainer").html(resp2);
              getCategories();
            });
          });
        });
      } else {
        $.ajax({ method: "GET", url: "/categories.html" }).then(function (
          resp
        ) {
          $("#bodyContainer").html(resp);
          getCategories();
        });
      }
    });

  // Footer links
  $("#navShopF")
    .off("click")
    .on("click", function (e) {
      e.preventDefault();
      $("#btnNavShopping").click();
    });

  $("#navRegisterF")
    .off("click")
    .on("click", function (e) {
      e.preventDefault();
      $("#btnNavRegister").click();
    });

  /* =========================
   * Orders (list + detail)
   * ======================= */

  function renderOrderDetails(order) {
    if (!order) {
      alert("Order not found.");
      return;
    }

    const created = order.createdAt
      ? new Date(order.createdAt).toLocaleString()
      : "-";

    const itemsRows =
      Array.isArray(order.items) && order.items.length
        ? order.items
            .map(function (it, i) {
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
            })
            .join("")
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
      (order.status || "created") +
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

    $("#btnBackToOrders")
      .off("click")
      .on("click", function (e) {
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

    $("#bodyContainer").html(
      '<div class="p-4 text-center">Loading your orders...</div>'
    );

    $.ajax({
      method: "GET",
      url: API_BASE + "/orders/" + encodeURIComponent(uid),
    })
      .then(function (resp) {
        if (!resp || resp.success === false) {
          $("#bodyContainer").html(
            '<div class="p-4 text-danger">Unable to load orders.</div>'
          );
          return;
        }

        const orders = resp.orders || [];
        if (!orders.length) {
          $("#bodyContainer").html(
            '<div class="p-4"><h4>No orders found</h4><p>You have not placed any orders yet.</p></div>'
          );
          return;
        }

        let html =
          '<div class="container my-4">' +
          "<h3>My Orders</h3>" +
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
          "</thead><tbody>";

        orders.forEach(function (order, idx) {
          const created = order.createdAt
            ? new Date(order.createdAt).toLocaleString()
            : "-";
          const itemsText = Array.isArray(order.items)
            ? order.items
                .map(function (it) {
                  return (it.title || "Item") + " × " + (it.qty || 1);
                })
                .join(", ")
            : "-";

          html +=
            "<tr>" +
            "<td>" +
            (idx + 1) +
            "</td>" +
            "<td>" +
            (order._id || "") +
            "</td>" +
            "<td>" +
            created +
            "</td>" +
            "<td>" +
            itemsText +
            "</td>" +
            "<td>" +
            (order.total || 0) +
            "</td>" +
            "<td>" +
            (order.status || "created") +
            "</td>" +
            "<td>" +
            '<button class="btn btn-sm btn-outline-primary btn-view-order" data-idx="' +
            idx +
            '">View</button>' +
            "</td>" +
            "</tr>";
        });

        html += "</tbody></table></div></div>";

        $("#bodyContainer").html(html);

        $("#bodyContainer")
          .off("click", ".btn-view-order")
          .on("click", ".btn-view-order", function (e) {
            e.preventDefault();
            const idx = Number($(this).data("idx"));
            const order = orders[idx];
            renderOrderDetails(order);
          });
      })
      .catch(function () {
        $("#bodyContainer").html(
          '<div class="p-4 text-danger">Error loading orders.</div>'
        );
      });
  }

  $("#btnNavOrders")
    .off("click")
    .on("click", function (e) {
      e.preventDefault();
      showOrders();
    });

  /* =========================
   * Cart display + checkout
   * ======================= */

  function showCart(attempt) {
    attempt = attempt || 0;

    let cart;
    try {
      cart = loadCartForCurrentUser();
    } catch (e) {
      cart = [];
    }

    if (!Array.isArray(cart) || cart.length === 0) {
      $("#bodyContainer").html(
        '<div class="p-4"><h4>Your cart is empty</h4></div>'
      );
      return;
    }

    $.ajax({ method: "GET", url: API_BASE + "/getproducts" })
      .then(function (products) {
        const itemsWithProducts = cart.map(function (ci) {
          const prod = products.find(function (p) {
            return (
              (p.id !== undefined && String(p.id) === String(ci.id)) ||
              (p._id !== undefined && String(p._id) === String(ci.id))
            );
          });
          return {
            prod: prod,
            qty: ci.qty || 1,
            cartId: ci.id,
          };
        });

        const missingIds = itemsWithProducts
          .filter(function (it) {
            return !it.prod;
          })
          .map(function (it) {
            return String(it.cartId);
          });

        if (missingIds.length) {
          let newCart;
          try {
            newCart = loadCartForCurrentUser();
          } catch (e) {
            newCart = [];
          }

          newCart = newCart.filter(function (it) {
            return missingIds.indexOf(String(it.id)) === -1;
          });

          saveCartToLocalAndUser(newCart);
          updateCartCount();

          if (attempt < 1) {
            showCart(attempt + 1);
            return;
          }

          $("#bodyContainer").html(
            '<div class="p-4"><h4>Some items were removed from your cart because they are no longer available.</h4></div>'
          );
          return;
        }

        const validItems = itemsWithProducts.filter(function (it) {
          return it.prod;
        });
        if (!validItems.length) {
          $("#bodyContainer").html(
            '<div class="p-4"><h4>No items found (maybe data mismatch)</h4></div>'
          );
          return;
        }

        let html =
          '<div class="container my-4"><h3>Your Cart</h3><div class="list-group">';
        validItems.forEach(function (it) {
          const p = it.prod;
          html +=
            '<div class="list-group-item d-flex justify-content-between align-items-center">' +
            "<div>" +
            "<strong>" +
            (p.title || "") +
            "</strong><br/>" +
            '<small class="text-muted">' +
            (p.description || "") +
            "</small><br/>" +
            "₹" +
            (p.price || 0) +
            " × " +
            it.qty +
            "</div>" +
            "<div>" +
            '<button class="btn btn-sm btn-outline-secondary btn-decrease" data-id="' +
            it.cartId +
            '">−</button> ' +
            '<button class="btn btn-sm btn-outline-secondary btn-increase" data-id="' +
            it.cartId +
            '">+</button> ' +
            '<button class="btn btn-sm btn-danger btn-remove" data-id="' +
            it.cartId +
            '">Remove</button>' +
            "</div>" +
            "</div>";
        });
        html +=
          "</div>" +
          '<div class="mt-3">' +
          '<button id="btnCheckout" class="btn btn-primary">Checkout</button> ' +
          '<button id="btnContinue" class="btn btn-link">Continue Shopping</button>' +
          "</div>" +
          "</div>";

        $("#bodyContainer").html(html);

        $(".btn-remove")
          .off("click")
          .on("click", function () {
            const id = String($(this).data("id"));
            let c = loadCartForCurrentUser();
            c = c.filter(function (it) {
              return String(it.id) !== id;
            });
            saveCartToLocalAndUser(c);
            updateCartCount();
            showCart();
          });

        $(".btn-increase")
          .off("click")
          .on("click", function () {
            const id = String($(this).data("id"));
            let c = loadCartForCurrentUser();
            c.forEach(function (it) {
              if (String(it.id) === id) it.qty = (it.qty || 1) + 1;
            });
            saveCartToLocalAndUser(c);
            updateCartCount();
            showCart();
          });

        $(".btn-decrease")
          .off("click")
          .on("click", function () {
            const id = String($(this).data("id"));
            let c = loadCartForCurrentUser();
            c.forEach(function (it) {
              if (String(it.id) === id) {
                it.qty = Math.max(1, (it.qty || 1) - 1);
              }
            });
            saveCartToLocalAndUser(c);
            updateCartCount();
            showCart();
          });

        $("#btnContinue")
          .off("click")
          .on("click", function () {
            $.ajax({ method: "GET", url: "/products.html" }).then(function (
              resp
            ) {
              $("#bodyContainer").html(resp);
              getProducts();
            });
          });

        $("#btnCheckout")
          .off("click")
          .on("click", async function () {
            let currentCart = loadCartForCurrentUser();
            if (!Array.isArray(currentCart) || !currentCart.length) {
              alert("Your cart is empty.");
              return;
            }

            try {
              const productsResp = await $.ajax({
                method: "GET",
                url: API_BASE + "/getproducts",
              });

              const orderItems = currentCart.map(function (ci) {
                const prod =
                  productsResp.find(function (p) {
                    return (
                      String(p.id) === String(ci.id) ||
                      String(p._id) === String(ci.id)
                    );
                  }) || {};
                const unitPrice = Number(prod.price || 0);
                const qty = ci.qty || 1;
                return {
                  productId: ci.id,
                  title: prod.title || "",
                  unitPrice: unitPrice,
                  qty: qty,
                  lineTotal: unitPrice * qty,
                };
              });

              const badItem = orderItems.find(function (it) {
                return !it.title && !it.unitPrice;
              });
              if (badItem) {
                alert(
                  "Some items in cart are no longer available. Please refresh your cart."
                );
                showCart();
                return;
              }

              const subtotal = orderItems.reduce(function (s, it) {
                return s + it.lineTotal;
              }, 0);
              const shipping = 0;
              const tax = 0;
              const total = subtotal + shipping + tax;

              if (
                !window.confirm(
                  "You are about to place an order for ₹" +
                    total +
                    ". Proceed?"
                )
              ) {
                return;
              }

              const payload = {
                userId: getCurrentUserId(),
                items: orderItems.map(function (it) {
                  return {
                    productId: it.productId,
                    qty: it.qty,
                    price: it.unitPrice,
                  };
                }),
                subtotal: subtotal,
                shipping: shipping,
                tax: tax,
                total: total,
                createdAt: new Date().toISOString(),
              };

              const createResp = await $.ajax({
                method: "POST",
                url: API_BASE + "/createorder",
                data: JSON.stringify(payload),
                contentType: "application/json",
                dataType: "json",
              });

              if (createResp && createResp.success) {
                localStorage.removeItem("cart");
                const uid = getCurrentUserId();
                if (uid) {
                  localStorage.removeItem("cart_" + uid);
                }
                updateCartCount();

                $("#bodyContainer").html(
                  '<div class="container my-5">' +
                    "<h3>Order Confirmed</h3>" +
                    "<p>Order ID: <strong>" +
                    (createResp.orderId || "") +
                    "</strong></p>" +
                    "<p>" +
                    (createResp.message || "Thank you for your order!") +
                    "</p>" +
                    "<p>Total Paid: ₹" +
                    total +
                    "</p>" +
                    '<a href="#" id="btnBackToShop" class="btn btn-primary">Continue Shopping</a>' +
                    "</div>"
                );

                $("#btnBackToShop")
                  .off("click")
                  .on("click", function (e) {
                    e.preventDefault();
                    $.ajax({ method: "GET", url: "/products.html" }).then(
                      function (resp) {
                        $("#bodyContainer").html(resp);
                        getProducts();
                      }
                    );
                  });
              } else {
            alert(
              "Unable to create order: " +
                (createResp && createResp.message
                  ? createResp.message
                  : "Unknown error")
            );
          }
        } catch (err) {
          console.error("Checkout error:", err);
          alert("Error during checkout. See console for details.");
        }
      });
  })
    .catch(function (err) {
      console.error("Failed to load products for cart:", err);
      $("#bodyContainer").html(
        '<div class="p-4 text-danger">Unable to load cart items</div>'
      );
    });
  }

  // Cart button → show cart
  $("#btnCart")
    .off("click")
    .on("click", function (e) {
      e.preventDefault();
      showCart();
    });

  /* =========================
   * Products + Categories (search + sort)
   * ======================= */

  function renderProducts(list) {
    $("#productCatalog").empty();

    if (!Array.isArray(list) || !list.length) {
      $("#productCatalog").html('<p class="p-3">No products found.</p>');
      return;
    }

    list.forEach(function (value) {
      const title = value.title || "No title";
      const img = fixImageUrl(value.image || "");
      const price = value.price ? "₹" + value.price : "";
      const idVal =
        value.id !== undefined
          ? String(value.id)
          : value._id
          ? String(value._id)
          : "";

      const card =
        '<div class="card m-2 p-2 product-card" ' +
        'style="width:200px;cursor:pointer;" ' +
        'data-id="' +
        idVal +
        '">' +
        '<img src="' +
        img +
        '" class="card-img-top" height="150" alt="' +
        title +
        '">' +
        '<div class="card-body">' +
        '<h6 class="card-title small">' +
        title +
        "</h6>" +
        '<p class="card-text small text-muted">' +
        price +
        "</p>" +
        "</div>" +
        "</div>";

      $("#productCatalog").append(card);
    });
  }

  function applyFilters() {
    if (!Array.isArray(currentProducts)) {
      currentProducts = [];
    }

    let filtered = currentProducts.slice();

    const search = ($("#txtSearch").val() || "").toLowerCase().trim();
    const sort = $("#ddlSort").val();

    if (search) {
      filtered = filtered.filter(function (p) {
        const name = (p.title || "").toLowerCase();
        const desc = (p.description || "").toLowerCase();
        return name.includes(search) || desc.includes(search);
      });
    }

    if (sort === "price-asc" || sort === "price-desc") {
      filtered.sort(function (a, b) {
        const pa = Number(a.price || 0);
        const pb = Number(b.price || 0);
        return sort === "price-asc" ? pa - pb : pb - pa;
      });
    } else if (sort === "title-asc" || sort === "title-desc") {
      filtered.sort(function (a, b) {
        const ta = (a.title || "").toLowerCase();
        const tb = (b.title || "").toLowerCase();
        if (ta < tb) return sort === "title-asc" ? -1 : 1;
        if (ta > tb) return sort === "title-asc" ? 1 : -1;
        return 0;
      });
    }

    renderProducts(filtered);
  }

  function bindProductFilters() {
    if ($("#txtSearch").length) {
      $("#txtSearch").off("input").on("input", applyFilters);
    }
    if ($("#ddlSort").length) {
      $("#ddlSort").off("change").on("change", applyFilters);
    }
  }

  function getProducts(categoryName) {
    let url = API_BASE + "/getproducts";
    if (categoryName) {
      url = API_BASE + "/categories/" + encodeURIComponent(categoryName);
    }

    $.ajax({ method: "GET", url: url })
      .then(function (response) {
        currentProducts = Array.isArray(response) ? response : [];

        bindProductFilters();
        applyFilters();

        $("#productCatalog")
          .off("click", ".product-card")
          .on("click", ".product-card", function () {
            const productId = $(this).data("id");
            if (productId !== undefined) {
              showProductDetails(String(productId));
            }
          });
      })
      .catch(function (err) {
        console.error("getProducts error:", err);
        $("#productCatalog").html(
          '<p class="text-danger p-3">Unable to load products.</p>'
        );
      });
  }

  function getCategories() {
    $.ajax({ method: "GET", url: API_BASE + "/categories" })
      .then(function (response) {
        $("#categoryList").empty();

        if (!Array.isArray(response) || !response.length) {
          $("#categoryList").html('<p class="p-3">No categories defined.</p>');
          return;
        }

        response.forEach(function (cat) {
          const name = cat.CategoryName || cat.category || "Unnamed";
          const card =
            '<div class="card p-2 m-2" style="width:180px;cursor:pointer;" data-name="' +
            name +
            '">' +
            '<div class="card-body text-center">' +
            '<h6 class="card-title">' +
            name +
            "</h6>" +
            "</div>" +
            "</div>";

          $("#categoryList").append(card);
        });

        $("#categoryList")
          .off("click", ".card")
          .on("click", ".card", function () {
            const categoryName = $(this).data("name");
            $.ajax({ method: "GET", url: "/products.html" }).then(function (
              resp
            ) {
              $("#bodyContainer").html(resp);
              getProducts(categoryName);
            });
          });
      })
      .catch(function (err) {
        console.error("getCategories error:", err);
        $("#categoryList").html(
          '<p class="text-danger p-3">Unable to load categories.</p>'
        );
      });
  }

  /* =========================
   * Profile page – load & update
   * ======================= */

  function loadProfilePage() {
    const uid = getCurrentUserId();
    if (!uid) {
      alert("Please login again.");
      $("#btnNavLogin").click();
      return;
    }

    // Back button
    $("#btnBackFromProfile")
      .off("click")
      .on("click", function () {
        $.ajax({ method: "GET", url: "/products.html" }).then(function (resp) {
          $("#bodyContainer").html(resp);
          getProducts();
        });
      });

    // Fetch profile data
    $.ajax({
      method: "GET",
      url: API_BASE + "/customers/" + encodeURIComponent(uid),
    })
      .then(function (resp) {
        if (!resp || resp.success === false || !resp.customer) {
          alert(
            (resp && resp.message) ||
              "Unable to load profile. Please try again later."
          );
          return;
        }

        const c = resp.customer;

        $("#UserId").val(c.UserId || uid).prop("disabled", true);
        $("#FirstName").val(c.FirstName || "");
        $("#LastName").val(c.LastName || "");
        $("#Email").val(c.Email || "");
        $("#Gender").val(c.Gender || "");
        $("#Address").val(c.Address || "");
        $("#PostalCode").val(c.PostalCode || "");
        $("#State").val(c.State || "");
        $("#Country").val(c.Country || "");
        $("#Mobile").val(c.Mobile || "");

        if (c.DateOfBirth) {
          const d = new Date(c.DateOfBirth);
          const iso = d.toISOString().slice(0, 10);
          $("#DateOfBirth").val(iso);
        } else {
          $("#DateOfBirth").val("");
        }

        // Update click handler
        $("#btnUpdateProfile")
          .off("click")
          .on("click", function () {
            const payload = {
              FirstName: $("#FirstName").val().trim(),
              LastName: $("#LastName").val().trim(),
              DateOfBirth: $("#DateOfBirth").val(),
              Email: $("#Email").val().trim(),
              Gender: $("#Gender").val(),
              Address: $("#Address").val().trim(),
              PostalCode: $("#PostalCode").val().trim(),
              State: $("#State").val().trim(),
              Country: $("#Country").val().trim(),
              Mobile: $("#Mobile").val().trim(),
            };

            const newPwd = $("#Password").val();
            if (newPwd && newPwd.trim() !== "") {
              if (newPwd.trim().length < 6) {
                alert("New password must be at least 6 characters.");
                return;
              }
              payload.Password = newPwd.trim();
            }

            $.ajax({
              method: "PUT",
              url: API_BASE + "/customers/" + encodeURIComponent(uid),
              data: payload,
            })
              .then(function (r) {
                if (!r || r.success === false) {
                  alert((r && r.message) || "Profile update failed.");
                  return;
                }

                alert(r.message || "Profile updated successfully.");
                $("#Password").val(""); // clear password box
              })
              .catch(function (err) {
                console.error("Profile update error:", err);
                alert("Profile update failed. Please try again.");
              });
          });
      })
      .catch(function (err) {
        console.error("Load profile data error:", err);
        alert("Unable to load profile right now.");
      });
  }

  /* =========================
   * Product detail page
   * ======================= */

  function showProductDetails(productId) {
    $.ajax({ method: "GET", url: API_BASE + "/getproducts" })
      .then(function (products) {
        const product = products.find(function (p) {
          return (
            (p.id !== undefined && String(p.id) === String(productId)) ||
            (p._id !== undefined && String(p._id) === String(productId))
          );
        });

        if (!product) {
          alert("Product not found");
          return;
        }

        const title = product.title || product.name || "Product";
        const image = product.image || product.img || "";
        const price = product.price || product.Price || "";
        const description = product.description || product.desc || "";
        const rating =
          product.rating !== undefined
            ? product.rating
            : product.rate || "N/A";
        const category = product.category || product.Category || "-";
        const idVal =
          product.id !== undefined
            ? String(product.id)
            : product._id
            ? String(product._id)
            : "";

        const html =
          '<div class="container my-4">' +
          '<div class="row">' +
          '<div class="col-md-5">' +
          '<img src="' +
          fixImageUrl(image) +
          '" alt="' +
          title +
          '" ' +
          'class="img-fluid rounded" style="max-height:500px;width:100%;object-fit:cover;">' +
          "</div>" +
          '<div class="col-md-7">' +
          "<h2>" +
          title +
          "</h2>" +
          '<h4 class="text-success">' +
          (price ? "₹" + price : "") +
          "</h4>" +
          '<p class="text-muted"><strong>Category:</strong> ' +
          category +
          "</p>" +
          "<p>" +
          description +
          "</p>" +
          "<p>" +
          "<strong>Rating:</strong> " +
          '<span class="stars" style="--rating:' +
          (Number(rating) || 0) +
          '"></span> ' +
          '<span class="rating-value">(' +
          (Number(rating) || "NA") +
          ")</span>" +
          "</p>" +
          '<div class="mt-3">' +
          '<button id="btnAddToCart" data-id="' +
          idVal +
          '" class="btn btn-primary me-2">Add to Cart</button>' +
          '<button id="btnBackToCatalog" class="btn btn-outline-secondary">Back to Catalog</button>' +
          "</div>" +
          "</div>" +
          "</div>" +
          "</div>";

        $("#bodyContainer").html(html);

        $("#btnBackToCatalog")
          .off("click")
          .on("click", function () {
            $.ajax({ method: "GET", url: "/products.html" }).then(function (
              resp
            ) {
              $("#bodyContainer").html(resp);
              getProducts();
            });
          });

        $("#btnAddToCart")
          .off("click")
          .on("click", function () {
            const pid = String($(this).data("id"));
            let cart = loadCartForCurrentUser();
            if (!Array.isArray(cart)) cart = [];

            const existing = cart.find(function (item) {
              return String(item.id) === pid;
            });

            if (existing) {
              existing.qty = (existing.qty || 1) + 1;
            } else {
              cart.push({ id: pid, qty: 1 });
            }

            saveCartToLocalAndUser(cart);
            updateCartCount();
            alert("Added to Cart!");
          });
      })
      .catch(function (err) {
        console.error("showProductDetails error:", err);
        alert("Failed to load product details.");
      });
  }

  /* =========================
   * Initial sync on page load
   * ======================= */

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
  } catch (e) {
    // ignore
  }

  updateCartCount();

  // Footer year
  const yearSpan = document.getElementById("year");
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }
});