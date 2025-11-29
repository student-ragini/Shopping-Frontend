/* eslint-disable no-unused-vars */
/* global $, document */

// 👇 Backend base URL
const API_BASE =
  import.meta.env.VITE_API_BASE ||
  "https://shopping-backend-jb5p.onrender.com";

$(function () {
  // Last loaded products (for search + sort)
  let currentProducts = [];

  /* =========================
   * Helpers
   * ======================= */

  // Current logged-in user id from cookie
  function getCurrentUserId() {
    return $.cookie("userid") || null;
  }

  // Normalize product image paths
  function fixImageUrl(raw) {
    if (!raw) return "";
    try {
      // Absolute http(s) URL
      if (/^https?:\/\//i.test(raw)) {
        // If it is pointing to localhost, fall back to public file name
        if (/^(https?:\/\/)(127\.0\.0\.1|localhost)/i.test(raw)) {
          const fname = raw.split("/").pop();
          return fname ? "/public/" + fname : "";
        }
        return raw;
      }

      // Already something like "public/iphone.jpg"
      if (/^public[\\/]/i.test(raw)) {
        return "/" + raw.replace(/^[\\/]+/, "");
      }

      // "iphone.jpg", "/iphone.jpg", "img/iphone.jpg" → "/public/iphone.jpg"
      const fname = raw.split(/[\\/]/).pop();
      return fname ? "/public/" + fname : "";
    } catch (e) {
      console.warn("fixImageUrl error:", e);
      return "";
    }
  }

  // Remove cart items whose products no longer exist
  async function sanitizeCart() {
    try {
      let cart = JSON.parse(localStorage.getItem("cart") || "[]");
      if (!Array.isArray(cart)) cart = [];
      cart = cart.map((it) => ({ id: String(it.id), qty: Number(it.qty) || 1 }));

      const resp = await fetch(API_BASE + "/getproducts");
      if (!resp.ok) {
        console.warn("sanitizeCart: /getproducts returned", resp.status);
        return;
      }
      const products = await resp.json();

      const valid = new Set();
      products.forEach((p) => {
        if (p.id !== undefined) valid.add(String(p.id));
        if (p._id !== undefined) valid.add(String(p._id));
      });

      const filtered = cart.filter((it) => valid.has(String(it.id)));

      if (filtered.length !== cart.length) {
        console.info("sanitizeCart: removed invalid cart items");
        localStorage.setItem("cart", JSON.stringify(filtered));
      }
    } catch (err) {
      console.warn("sanitizeCart error (ignored):", err);
    }
  }

  // Save cart for session + per-user
  function saveCartToLocalAndUser(cart) {
    try {
      const arr = Array.isArray(cart) ? cart : [];
      localStorage.setItem("cart", JSON.stringify(arr));
      const uid = getCurrentUserId();
      if (uid) {
        localStorage.setItem("cart_" + uid, JSON.stringify(arr));
      }
    } catch (e) {
      console.warn("saveCartToLocalAndUser error:", e);
    }
  }

  // Load cart, preferring per-user cart
  function loadCartForCurrentUser() {
    try {
      const uid = getCurrentUserId();
      if (uid) {
        const per = localStorage.getItem("cart_" + uid);
        if (per) return JSON.parse(per || "[]");
      }
      return JSON.parse(localStorage.getItem("cart") || "[]");
    } catch (e) {
      console.warn("loadCartForCurrentUser error:", e);
      return [];
    }
  }

  // Show cart item count in navbar
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
      console.error("updateCartCount error:", err);
      if ($("#cartCount").length) $("#cartCount").text(0);
    }
  }

  // Run cart clean-up once on load
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

            // Simple client-side validation
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
              .catch(function (err) {
                console.error("Register error:", err);
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
        const formUserId = $("#txtUserId").val();
        const formPwd = $("#txtPwd").val();

        $.ajax({ method: "GET", url: API_BASE + "/getcustomers" })
          .then(function (customers) {
            const user = customers.find(function (u) {
              return u.UserId === formUserId;
            });

            if (user && user.Password === formPwd) {
              $.cookie("userid", formUserId, { path: "/" });
              $("#user").text(formUserId);
              $("#btnSignout").text("Signout");

              // restore per-user cart into session
              try {
                const per = localStorage.getItem("cart_" + formUserId);
                if (per) localStorage.setItem("cart", per);
              } catch (e) {
                console.warn("restore cart error:", e);
              }

              updateCartCount();

              if (typeof onSuccess === "function") {
                onSuccess();
              } else {
                $.ajax({ method: "GET", url: "/shophome.html" }).then(function (
                  resp
                ) {
                  $("#bodyContainer").html(resp);
                });
              }
            } else {
              alert("Invalid Username | Password..");
            }
          })
          .catch(function (err) {
            console.error("Login fetch error:", err);
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
        .catch(function (err) {
          console.error("Load login.html error:", err);
        });
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
        /* ignore */
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
        .catch(function (err) {
          console.error("Load login.html error:", err);
        });
    });

  /* =========================
   * Nav: Shop
   * ======================= */

  $("#btnNavShopping")
    .off("click")
    .on("click", function () {
      if (!getCurrentUserId()) {
        // not logged in → first login
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
        // already logged in → directly open products
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

  // (Optional) footer shortcut – safe even if element not present
  $("#navCategoriesFooter")
    .off("click")
    .on("click", function (e) {
      e.preventDefault();
      $("#btnNavCategories").click();
    });

  // Footer links for Shop / Register (if present)
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
          console.warn("Missing product in cart, removing:", missingIds);

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

        // Remove item
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

        // Increase qty
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

        // Decrease qty
        $(".btn-decrease")
          .off("click")
          .on("click", function () {
            const id = String($(this).data("id"));
            let c = loadCartForCurrentUser();
            c.forEach(function (it) {
              if (String(it.id) === id)
                it.qty = Math.max(1, (it.qty || 1) - 1);
            });
            saveCartToLocalAndUser(c);
            updateCartCount();
            showCart();
          });

        // Continue shopping
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

        // Checkout
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

  $("#btnCart")
    .off("click")
    .on("click", function (e) {
      e.preventDefault();
      showCart();
    });

  /* =========================
   * Products + Categories
   * (with search + sort)
   * ======================= */

  // Render products list into #productCatalog
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

      var card =
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

  // Apply search + sort on currentProducts
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

  // Bind input events (ensure only once)
  function bindProductFilters() {
    if ($("#txtSearch").length) {
      $("#txtSearch").off("input").on("input", applyFilters);
    }
    if ($("#ddlSort").length) {
      $("#ddlSort").off("change").on("change", applyFilters);
    }
  }

  // Load products (optionally by category)
  function getProducts(categoryName) {
    var url = API_BASE + "/getproducts";
    if (categoryName) {
      url = API_BASE + "/categories/" + encodeURIComponent(categoryName);
    }

    $.ajax({ method: "GET", url: url })
      .then(function (response) {
        currentProducts = Array.isArray(response) ? response : [];

        // search + sort handlers attach
        bindProductFilters();

        // first render with current filters (if any)
        applyFilters();

        // Product detail click handler
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
    }
  } catch (e) {
    /* ignore */
  }

  updateCartCount();
});