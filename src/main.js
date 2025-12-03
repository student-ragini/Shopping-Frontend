/* src/main.js */
/* eslint-disable no-unused-vars */
/* global $, document */

const API_BASE =
  import.meta.env.VITE_API_BASE ||
  "https://shopping-backend-jb5p.onrender.com";

$(function () {
  let currentProducts = [];

  function getCurrentUserId() {
    try {
      // prefer cookie, fallback to localStorage (helps when cookies blocked)
      return $.cookie("userid") || localStorage.getItem("userid") || null;
    } catch (e) {
      return localStorage.getItem("userid") || null;
    }
  }

  function setCurrentUserId(uid) {
    try {
      if (uid) {
        $.cookie("userid", uid, { path: "/" });
        localStorage.setItem("userid", uid);
      } else {
        $.removeCookie("userid", { path: "/" });
        localStorage.removeItem("userid");
      }
    } catch (e) {
      try {
        localStorage.setItem("userid", uid || "");
      } catch {}
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

  /* REGISTER (same as before) */
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

  /* LOGIN helper */
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

            // backend may return userId in resp.userId
            const uid = resp.userId || formUserId;

            try {
              setCurrentUserId(uid);
            } catch (e) {
              console.warn("Could not set cookie/localStorage userid:", e);
            }

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

  /* SIGNOUT */
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

  /* PROFILE load + update */
  function loadProfilePage() {
    const uid = getCurrentUserId();
    if (!uid) {
      alert("Please login first.");
      $("#btnNavLogin").click();
      return;
    }

    // GET profile
    fetch(API_BASE + "/customers/" + encodeURIComponent(uid))
      .then((r) => r.json())
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

          if (c.DateOfBirth || c.dateOfBirth) {
            const dobStr = c.DateOfBirth || c.dateOfBirth;
            const dt = new Date(dobStr);
            if (!isNaN(dt.getTime())) {
              const mm = String(dt.getMonth() + 1).padStart(2, "0");
              const dd = String(dt.getDate()).padStart(2, "0");
              $("#DateOfBirth").val(dt.getFullYear() + "-" + mm + "-" + dd);
            }
          }
        }
      })
      .catch((err) => console.error("PROFILE LOAD ERROR:", err));

    // Update
    $("#btnUpdateProfile")
      .off("click")
      .on("click", function (e) {
        e.preventDefault();

        const inputUser = ($("#UserId").val() || "").trim();
        const cookieUser = getCurrentUserId() || "";

        // prefer cookieUser unless manual input exactly matches cookie
        const uidInput = (inputUser && inputUser === cookieUser) ? inputUser : cookieUser;

        console.log("PROFILE UPDATE -> uidInput:", uidInput, "inputUser:", inputUser, "cookieUser:", cookieUser);

        if (!uidInput) {
          alert("Unable to determine your user id. Please login again.");
          $("#btnNavLogin").click();
          return;
        }

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

        console.log("PROFILE UPDATE -> calling PUT:", API_BASE + "/customers/" + encodeURIComponent(uidInput), payload);

        fetch(API_BASE + "/customers/" + encodeURIComponent(uidInput), {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
          .then((r) => {
            if (!r.ok) {
              return r.text().then((text) => {
                try {
                  const parsed = JSON.parse(text);
                  return parsed;
                } catch (e) {
                  return { success: false, message: text || "Server error" };
                }
              });
            }
            return r.json();
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

    // Back button
    $("#btnBackFromProfile")
      .off("click")
      .on("click", function () {
        $.ajax({ method: "GET", url: "/products.html" }).then(function (p) {
          $("#bodyContainer").html(p);
          getProducts();
        });
      });
  }

  /* NAV: Profile */
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

  /* Rest of frontend unchanged (products, cart, orders...) */
  // For brevity: include your existing getProducts, getCategories, showCart etc.
  // (Assume rest of your file is same as original)
  // If you want, I can paste full remaining code; but key changes are getCurrentUserId + setCurrentUserId + logs above.

  // Initial sync
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

  const yearSpan = document.getElementById("year");
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }
});