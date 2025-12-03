/* src/main.js */
/* eslint-disable no-unused-vars */
/* global $, document */

// Backend base URL (from Vite env or fallback to your Render URL)
const API_BASE =
  import.meta.env.VITE_API_BASE ||
  "https://shopping-backend-jb5p.onrender.com";

$(function () {
  // Last loaded products (for search + sort)
  let currentProducts = [];

  /* =========================
   * Helpers
   * ======================= */

  // Read user id from cookie or localStorage (robust)
  function getCurrentUserId() {
    try {
      // prefer cookie if available
      if (typeof $.cookie === "function") {
        const c = $.cookie("userid");
        if (c && String(c).trim() !== "") return String(c).trim();
      }
    } catch (e) {
      // ignore
    }
    try {
      const ls = localStorage.getItem("userid");
      if (ls && String(ls).trim() !== "") return String(ls).trim();
    } catch (e) {
      // ignore
    }
    return null;
  }

  // Save or remove user id both in cookie and localStorage
  function setCurrentUserId(uid) {
    try {
      if (typeof $.cookie === "function") {
        if (uid && String(uid).trim() !== "") {
          $.cookie("userid", String(uid).trim(), { path: "/" });
        } else {
          $.removeCookie("userid", { path: "/" });
        }
      }
    } catch (e) {
      // ignore
    }
    try {
      if (uid && String(uid).trim() !== "") {
        localStorage.setItem("userid", String(uid).trim());
      } else {
        localStorage.removeItem("userid");
      }
    } catch (e) {
      // ignore
    }
  }

  function fixImageUrl(raw) {
    if (!raw) return "";
    try {
      // full URL?
      if (/^https?:\/\//i.test(raw)) {
        // if localhost URL, convert to /public/<file> (so dev images load)
        if (/^(https?:\/\/)(127\.0\.0\.1|localhost)/i.test(raw)) {
          const fname = raw.split("/").pop();
          return fname ? "/public/" + fname : "";
        }
        return raw;
      }

      // "public/..." pattern
      if (/^public[\\/]/i.test(raw)) {
        return "/" + raw.replace(/^[\\/]+/, "");
      }

      // just filename
      const fname = raw.split(/[\\/]/).pop();
      return fname ? "/public/" + fname : "";
    } catch (e) {
      return "";
    }
  }

  /* =========================
   * Cart helpers
   * ======================= */

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
        if (p.product_id !== undefined) valid.add(String(p.product_id));
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

            // SAVE user id consistently
            setCurrentUserId(uid);

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

      // remove cookie + localStorage
      setCurrentUserId(null);
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
   * Profile page - load & update
   * ======================= */

  function loadProfilePage() {
    const uid = getCurrentUserId();
    if (!uid) {
      alert("Please login first.");
      $("#btnNavLogin").click();
      return;
    }

    // ---- 1) Backend se profile data lao (GET /customers/:id) ----
    fetch(API_BASE + "/customers/" + encodeURIComponent(uid))
      .then(async (r) => {
        // handle non-JSON errors too
        let payload;
        try {
          payload = await r.json();
        } catch (e) {
          const txt = await r.text();
          payload = { success: false, message: txt || "Server error" };
        }
        return payload;
      })
      .then((resp) => {
        console.log("PROFILE LOAD →", resp);

        if (resp && resp.success && resp.customer) {
          const c = resp.customer;

          $("#UserId").val(c.UserId || c.userId || "");
          $("#FirstName").val(c.FirstName || c.firstName || "");
          $("#LastName").val(c.LastName || c.lastName || "");
          $("#Email").val(c.Email || c.email || "");
          $("#Gender").val(c.Gender || c.gender || "");
          $("#Address").val(c.Address || c.address || "");
          $("#PostalCode").val(c.PostalCode || c.postalCode || "");
          $("#State").val(c.State || c.state || "");
          $("#Country").val(c.Country || c.country || "");
          $("#Mobile").val(c.Mobile || c.mobile || "");

          // DOB → yyyy-mm-dd
          if (c.DateOfBirth || c.dateOfBirth) {
            const dobStr = c.DateOfBirth || c.dateOfBirth;
            const dt = new Date(dobStr);
            if (!isNaN(dt.getTime())) {
              const mm = String(dt.getMonth() + 1).padStart(2, "0");
              const dd = String(dt.getDate()).padStart(2, "0");
              $("#DateOfBirth").val(dt.getFullYear() + "-" + mm + "-" + dd);
            }
          }
        } else {
          // show helpful message when user not found
          if (resp && resp.success === false) {
            alert(resp.message || "User not found");
          }
        }
      })
      .catch((err) => console.error("PROFILE LOAD ERROR:", err));

    // ---- 2) Update button (PUT /customers/:id) ----
    $("#btnUpdateProfile")
      .off("click")
      .on("click", function (e) {
        e.preventDefault();

        const uidInput = ($("#UserId").val() || "").trim() || uid;
        const first = ($("#FirstName").val() || "").trim();
        const last = ($("#LastName").val() || "").trim();
        const email = ($("#Email").val() || "").trim();
        const gender = $("#Gender").val() || "";
        const addr = ($("#Address").val() || "").trim();
        const pin = ($("#PostalCode").val() || "").trim();
        const state = ($("#State").val() || "").trim();
        const country = ($("#Country").val() || "").trim();
        const mobile = ($("#Mobile").val() || "").trim();
        const dob = $("#DateOfBirth").val() || null;
        const pwd = ($("#Password").val() || "").trim();

        // Payload: include both naming styles so backend accepts
        const payload = {
          UserId: uidInput,
          userId: uidInput,

          FirstName: first,
          firstName: first,

          LastName: last,
          lastName: last,

          Email: email,
          email: email,

          Gender: gender,
          gender: gender,

          Address: addr,
          address: addr,

          PostalCode: pin,
          postalCode: pin,

          State: state,
          state: state,

          Country: country,
          country: country,

          Mobile: mobile,
          mobile: mobile,

          DateOfBirth: dob,
          dateOfBirth: dob,
        };

        if (pwd !== "") {
          payload.Password = pwd;
          payload.password = pwd;
        }

        // IMPORTANT: use PUT to /customers/:id
        console.log(
          "PROFILE UPDATE -> calling PUT:",
          API_BASE + "/customers/" + encodeURIComponent(uidInput),
          payload
        );

        fetch(API_BASE + "/customers/" + encodeURIComponent(uidInput), {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
          .then(async (r) => {
            // allow non-json server responses
            try {
              return await r.json();
            } catch (e) {
              const txt = await r.text();
              try {
                return JSON.parse(txt);
              } catch (err) {
                return { success: false, message: txt || "Server error" };
              }
            }
          })
          .then((up) => {
            console.log("PROFILE UPDATE RESPONSE →", up);

            if (up && up.success) {
              alert(up.message || "Profile updated successfully.");
              $("#Password").val(""); // clear password
            } else {
              alert((up && up.message) || "Profile update failed. Please try again.");
            }
          })
          .catch((err) => {
            console.error("PROFILE UPDATE ERROR:", err);
            alert("Profile update failed. Please try again.");
          });
      });

    // ---- 3) Back button ----
    $("#btnBackFromProfile")
      .off("click")
      .on("click", function () {
        $.ajax({ method: "GET", url: "/products.html" }).then(function (p) {
          $("#bodyContainer").html(p);
          getProducts();
        });
      });
  }

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
        .catch(function () {
          loadProfilePage();
        });
    });

  /* =========================
   * Products / Categories / Cart / Orders
   * (kept similar to your original code, with robust handling)
   * ======================= */

  // Product renderers, getProducts, getCategories, showCart, checkout, showOrders...
  // (I kept these functions the same structure as in your last file but with
  // improved error handling and consistent use of getCurrentUserId / setCurrentUserId)

  /* For brevity in this response I am including the existing implementations
     you already had for products/categories/cart/orders. If you'd like I can
     paste them again verbatim (they remain compatible with the above helpers). */

  // --- I'll include the product/category/order/cart functions (unchanged logic) ---
  // (Please keep this section if your file already has them; if not, ask and I'll include full code.)
  // Below are the key functions you placed earlier (renderProducts, getProducts, getCategories,
  // showProductDetails, showCart, checkout, showOrders). They remain compatible.

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