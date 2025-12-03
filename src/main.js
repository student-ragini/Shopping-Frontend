/* eslint-disable no-unused-vars */
/* global $, document */

// ===========================================
// BACKEND BASE URL
// ===========================================
const API_BASE =
  import.meta.env.VITE_API_BASE ||
  "https://shopping-backend-jb5p.onrender.com";

$(function () {
  let currentProducts = [];

  // ===========================================
  // Helper Functions
  // ===========================================
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

  // ===========================================
  // PROFILE PAGE
  // ===========================================
  function loadProfilePage() {
    const uid = getCurrentUserId();
    if (!uid) {
      alert("Please login first.");
      $("#btnNavLogin").click();
      return;
    }

    // GET PROFILE DATA
    fetch(API_BASE + "/customers/" + encodeURIComponent(uid))
      .then((r) => r.json())
      .then((resp) => {
        if (resp.success && resp.customer) {
          const c = resp.customer;

          $("#UserId").val(c.UserId || "");
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
            const mm = String(d.getMonth() + 1).padStart(2, "0");
            const dd = String(d.getDate()).padStart(2, "0");
            $("#DateOfBirth").val(d.getFullYear() + "-" + mm + "-" + dd);
          }
        }
      });

    // UPDATE PROFILE (PUT)
    $("#btnUpdateProfile")
      .off("click")
      .on("click", function (e) {
        e.preventDefault();

        const uidInput = ($("#UserId").val() || "").trim();
        const payload = {
          UserId: uidInput,
          FirstName: $("#FirstName").val().trim(),
          LastName: $("#LastName").val().trim(),
          Email: $("#Email").val().trim(),
          Gender: $("#Gender").val(),
          Address: $("#Address").val().trim(),
          PostalCode: $("#PostalCode").val().trim(),
          State: $("#State").val().trim(),
          Country: $("#Country").val().trim(),
          Mobile: $("#Mobile").val().trim(),
          DateOfBirth: $("#DateOfBirth").val(),
        };

        const pwd = $("#Password").val().trim();
        if (pwd !== "") payload.Password = pwd;

        fetch(API_BASE + "/customers/" + encodeURIComponent(uidInput), {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
          .then((r) => r.json())
          .then((resp) => {
            if (resp.success) {
              alert("Profile updated successfully.");
              $("#Password").val("");
            } else {
              alert(resp.message || "Profile update failed.");
            }
          })
          .catch(() => alert("Profile update failed."));
      });

    // BACK TO SHOP
    $("#btnBackFromProfile")
      .off("click")
      .on("click", function () {
        $.ajax({ url: "/products.html" }).then((html) => {
          $("#bodyContainer").html(html);
          getProducts();
        });
      });
  }

  // ===========================================
  // LOGIN
  // ===========================================
  function attachLoginHandler(onSuccess) {
    $("#btnLogin")
      .off("click")
      .on("click", function () {
        const uid = $("#txtUserId").val().trim();
        const pwd = $("#txtPwd").val().trim();

        if (!uid || !pwd) {
          alert("Please enter UserId & Password");
          return;
        }

        $.ajax({
          method: "POST",
          url: API_BASE + "/login",
          data: { UserId: uid, Password: pwd },
        }).then((resp) => {
          if (!resp.success) {
            alert(resp.message || "Invalid login");
            return;
          }

          $.cookie("userid", resp.userId, { path: "/" });
          $("#user").text(resp.userId);
          $("#btnSignout").text("Signout");

          if (onSuccess) onSuccess();
          else {
            $.ajax({ url: "/shophome.html" }).then((html) => {
              $("#bodyContainer").html(html);
            });
          }
        });
      });
  }

  // ===========================================
  // LOAD NAVIGATION
  // ===========================================
  $("#btnNavProfile").click(function () {
    $.ajax({ url: "/profile.html" }).then((html) => {
      $("#bodyContainer").html(html);
      loadProfilePage();
    });
  });

  $("#btnNavLogin").click(function () {
    $.ajax({ url: "/login.html" }).then((html) => {
      $("#bodyContainer").html(html);
      attachLoginHandler();
    });
  });

  $("#btnNavRegister").click(function () {
    $.ajax({ url: "/register.html" }).then((html) => {
      $("#bodyContainer").html(html);
    });
  });

  $("#btnNavShopping").click(function () {
    $.ajax({ url: "/products.html" }).then((html) => {
      $("#bodyContainer").html(html);
      getProducts();
    });
  });

  // ===========================================
  // PRODUCTS
  // ===========================================
  function getProducts() {
    $.ajax({
      method: "GET",
      url: API_BASE + "/getproducts",
    }).then((resp) => {
      currentProducts = resp;
      renderProducts(resp);
    });
  }

  function renderProducts(list) {
    $("#productCatalog").empty();
    list.forEach((p) => {
      const card = `
        <div class="card m-2 p-2 product-card" data-id="${p._id || p.id}">
          <img src="${fixImageUrl(p.image)}" class="card-img-top" height="140">
          <div class="card-body">
            <h6>${p.title}</h6>
            <p class="text-muted">₹${p.price}</p>
          </div>
        </div>`;
      $("#productCatalog").append(card);
    });
  }

  $("#productCatalog").on("click", ".product-card", function () {
    const pid = $(this).data("id");
    showProductDetails(pid);
  });

  // ===========================================
  // PRODUCT DETAILS
  // ===========================================
  function showProductDetails(pid) {
    $.ajax({
      url: API_BASE + "/getproducts",
    }).then((resp) => {
      const product = resp.find(
        (p) => String(p.id) === String(pid) || String(p._id) === String(pid)
      );

      if (!product) {
        alert("Product not found");
        return;
      }

      const html = `
        <div class="container my-4">
          <h2>${product.title}</h2>
          <img src="${fixImageUrl(product.image)}" class="img-fluid">
          <h4 class="mt-3">₹${product.price}</h4>
          <p>${product.description}</p>
          <button id="btnAddToCart" data-id="${pid}" class="btn btn-primary">Add to Cart</button>
          <button id="btnBackToCatalog" class="btn btn-secondary">Back</button>
        </div>
      `;

      $("#bodyContainer").html(html);

      $("#btnAddToCart").click(function () {
        let cart = JSON.parse(localStorage.getItem("cart") || "[]");
        const existing = cart.find((x) => x.id == pid);

        if (existing) existing.qty++;
        else cart.push({ id: pid, qty: 1 });

        localStorage.setItem("cart", JSON.stringify(cart));
        alert("Added to cart");
      });

      $("#btnBackToCatalog").click(function () {
        $.ajax({ url: "/products.html" }).then((h) => {
          $("#bodyContainer").html(h);
          getProducts();
        });
      });
    });
  }

  // ===========================================
  // SIGNOUT
  // ===========================================
  $("#btnSignout").click(function () {
    $.removeCookie("userid", { path: "/" });
    alert("Signed out");
    $("#user").text("");
    $("#btnSignout").text("Login");
  });

  // ===========================================
  // INIT
  // ===========================================
  const uid = getCurrentUserId();
  if (uid) {
    $("#user").text(uid);
    $("#btnSignout").text("Signout");
  }
});