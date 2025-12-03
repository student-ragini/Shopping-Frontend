// src/main.js

// ---- CONFIG ----
// Replace this with your deployed backend API if different.
const API_BASE = window.API_BASE || "https://shopping-backend-jb5p.onrender.com";

// ---- Utilities ----
function safeLog(...args) {
  // Pretty console logging for debug
  console.log("[APP]", ...args);
}

function showYear() {
  try {
    document.getElementById("year").textContent = new Date().getFullYear();
  } catch (e) {}
}

// ---- Auth / user helpers ----
function getCurrentUserId() {
  // Default: read from cookie named "userId" (we included jquery-cookie).
  // If you store user id elsewhere (localStorage or cookie name different) change here.
  try {
    const u = $.cookie("userId");
    if (u) return u;
  } catch (e) {}
  // If you used localStorage:
  // return localStorage.getItem('userId');
  return null;
}

function setCurrentUserId(id) {
  try {
    $.cookie("userId", id, { path: "/" });
  } catch (e) {}
}

// ---- Fetch & populate customer ----
async function fetchCustomerAndFill(uid) {
  if (!uid) return;
  const url = API_BASE + "/customers/" + encodeURIComponent(uid);
  safeLog("PROFILE LOAD -> fetching", url);
  try {
    const r = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
    });
    const txt = await r.text();
    let resp = null;
    try {
      resp = txt ? JSON.parse(txt) : null;
    } catch (e) {
      // Not JSON
      resp = txt;
    }
    safeLog("PROFILE LOAD →", resp);

    // If server returns a wrapper with success and customer
    if (resp && resp.success && resp.customer) {
      fillProfileForm(resp.customer);
      return resp.customer;
    }

    // Some servers might directly return a customer object
    if (resp && resp._id) {
      fillProfileForm(resp);
      return resp;
    }

    // fallback: if response is string (banner), show console and alert
    safeLog("PROFILE LOAD: unexpected response:", resp);
    // don't alert here to avoid spam; just return null
    return null;
  } catch (err) {
    console.error("PROFILE LOAD ERROR:", err);
    return null;
  }
}

function fillProfileForm(c) {
  // Accept both camelCase and PascalCase server fields
  $("#UserId").val(c.UserId || c.userId || c._id || c.id || "");
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
  const dobStr = c.DateOfBirth || c.dateOfBirth || c.DOB || null;
  if (dobStr) {
    const dt = new Date(dobStr);
    if (!isNaN(dt.getTime())) {
      const mm = String(dt.getMonth() + 1).padStart(2, "0");
      const dd = String(dt.getDate()).padStart(2, "0");
      $("#DateOfBirth").val(dt.getFullYear() + "-" + mm + "-" + dd);
    }
  }
}

// ---- Update profile: handlers + fallback attempts ----

// Primary attach function (call once at init or when loading profile page)
function attachProfileUpdateHandler() {
  $("#btnUpdateProfile")
    .off("click")
    .on("click", function (e) {
      e.preventDefault();
      const uid = getCurrentUserId();
      if (!uid) {
        alert("Please login first.");
        $("#btnNavLogin").click();
        return;
      }

      const payload = {
        UserId: $("#UserId").val(),
        userId: $("#UserId").val(),
        _id: $("#UserId").val(),
        FirstName: $("#FirstName").val(),
        LastName: $("#LastName").val(),
        Email: $("#Email").val(),
        Gender: $("#Gender").val(),
        Address: $("#Address").val(),
        PostalCode: $("#PostalCode").val(),
        State: $("#State").val(),
        Country: $("#Country").val(),
        Mobile: $("#Mobile").val(),
        DateOfBirth: $("#DateOfBirth").val() || null,
      };

      if ($("#Password").length && $("#Password").val().trim() !== "") {
        payload.Password = $("#Password").val().trim();
      }

      // Try canonical REST PUT first
      const putUrl = API_BASE + "/customers/" + encodeURIComponent(uid);
      safeLog("PROFILE UPDATE -> trying PUT", putUrl, payload);

      fetch(putUrl, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      })
        .then(async (res) => {
          safeLog("PUT RESPONSE STATUS:", res.status);
          const txt = await res.text();
          safeLog("PUT RESPONSE TEXT:", txt);

          let json = null;
          try {
            json = txt ? JSON.parse(txt) : null;
          } catch (e) {}

          if (res.ok && json && json.success) {
            alert(json.message || "Profile updated successfully.");
            if ($("#Password").length) $("#Password").val("");
            fetchCustomerAndFill(uid);
            return;
          }

          // If PUT returned 404 or didn't have success -> fallback
          safeLog("PUT didn't return success -> trying POST fallbacks");
          tryPostFormThenJsonFallback(payload);
        })
        .catch((err) => {
          safeLog("PUT error -> trying fallbacks", err);
          tryPostFormThenJsonFallback(payload);
        });
    });
}

// Try POST /updatecustomer as form-encoded (older backends) then JSON POST fallback
function tryPostFormThenJsonFallback(payload) {
  safeLog("PROFILE UPDATE -> attempt A: POST form-encoded to /updatecustomer");
  $.ajax({
    method: "POST",
    url: API_BASE + "/updatecustomer",
    data: payload,
    success: function (resp) {
      safeLog("POST (form) success:", resp);

      const respText = typeof resp === "string" ? resp : JSON.stringify(resp);

      // If the server returned the placeholder banner, it's not the endpoint
      if (respText && respText.indexOf("Shopping Backend API is running") !== -1) {
        safeLog("POST (form) responded with generic banner -> trying JSON POST");
      } else if (resp && resp.success) {
        alert(resp.message || "Profile updated successfully (form POST).");
        if ($("#Password").length) $("#Password").val("");
        const uid = getCurrentUserId();
        if (uid) fetchCustomerAndFill(uid);
        return;
      } else {
        safeLog("POST (form) returned non-success, trying JSON POST fallback:", resp);
      }

      // Try JSON-POST fallback
      fetch(API_BASE + "/updatecustomer", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      })
        .then(async (r) => {
          const text = await r.text();
          safeLog("POST JSON status:", r.status, "text:", text);
          let j = null;
          try {
            j = text ? JSON.parse(text) : null;
          } catch (e) {}
          if (r.ok && j && j.success) {
            alert(j.message || "Profile updated successfully (JSON POST).");
            if ($("#Password").length) $("#Password").val("");
            const uid = getCurrentUserId();
            if (uid) fetchCustomerAndFill(uid);
          } else {
            const serverMsg = (j && j.message) || text || ("Server returned " + r.status);
            safeLog("JSON POST fallback failed:", serverMsg);
            alert("Profile update failed. Server response: " + serverMsg);
          }
        })
        .catch((err) => {
          safeLog("POST JSON error:", err);
          alert("Profile update failed (network). See console for details.");
        });
    },
    error: function (xhr, status, err) {
      safeLog("POST (form) error:", status, err, xhr.responseText);
      // Try JSON POST fallback anyway
      fetch(API_BASE + "/updatecustomer", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      })
        .then(async (r) => {
          const text = await r.text();
          safeLog("POST JSON after form-error status:", r.status, "text:", text);
          let j = null;
          try {
            j = text ? JSON.parse(text) : null;
          } catch (e) {}
          if (r.ok && j && j.success) {
            alert(j.message || "Profile updated successfully (JSON POST after error).");
            if ($("#Password").length) $("#Password").val("");
            const uid = getCurrentUserId();
            if (uid) fetchCustomerAndFill(uid);
          } else {
            const serverMsg = (j && j.message) || text || ("Server returned " + r.status);
            safeLog("All fallback attempts failed:", serverMsg);
            alert("Profile update failed. Server response: " + serverMsg);
          }
        })
        .catch((err2) => {
          safeLog("POST JSON final error:", err2);
          alert("Profile update failed (network). See console for details.");
        });
    },
  });
}

// ---- Page load / nav handlers ----
function loadProfilePage() {
  const uid = getCurrentUserId();
  if (!uid) {
    alert("Please login first.");
    $("#btnNavLogin").click();
    return;
  }

  // Fetch and fill profile
  fetchCustomerAndFill(uid).then(() => {
    // Attach update handler after form filled
    attachProfileUpdateHandler();

    // Back button
    $("#btnBackFromProfile")
      .off("click")
      .on("click", function () {
        $.ajax({ method: "GET", url: "/products.html" }).then(function (p) {
          $("#bodyContainer").html(p);
          // If your getProducts() function exists, call it
          if (typeof getProducts === "function") getProducts();
        });
      });
  });
}

function loadHome() {
  $("#bodyContainer").html(`
    <div class="text-center py-5">
      <h2>Welcome to Shopping Online</h2>
      <p class="lead">Click <strong>Shop</strong> to browse products or <strong>Register</strong> / <strong>Login</strong>.</p>
    </div>
  `);
}

// Hook navigation buttons (basic)
function attachNavHandlers() {
  $("#btnNavShopping, #navShopF").off("click").on("click", function (e) {
    e && e.preventDefault();
    // Load products page
    $.ajax({ method: "GET", url: "/products.html" })
      .then(function (p) {
        $("#bodyContainer").html(p);
        if (typeof getProducts === "function") getProducts();
      })
      .catch(() => {
        loadHome();
      });
  });

  $("#btnNavProfile").off("click").on("click", function (e) {
    e && e.preventDefault();
    // Load profile page html then run loadProfilePage()
    $.ajax({ method: "GET", url: "/profile.html" })
      .then(function (p) {
        $("#bodyContainer").html(p);
        // small delay to allow DOM elements to exist
        setTimeout(() => {
          loadProfilePage();
        }, 50);
      })
      .catch(() => {
        alert("Could not load profile page.");
      });
  });

  $("#btnNavLogin").off("click").on("click", function (e) {
    e && e.preventDefault();
    // show login modal or navigate to login page. If you have login.html, load it.
    $.ajax({ method: "GET", url: "/login.html" })
      .then(function (p) {
        $("#bodyContainer").html(p);
      })
      .catch(() => {
        alert("Open login flow here.");
      });
  });

  $("#btnNavRegister").off("click").on("click", function (e) {
    e && e.preventDefault();
    $.ajax({ method: "GET", url: "/register.html" })
      .then(function (p) {
        $("#bodyContainer").html(p);
      })
      .catch(() => {
        alert("Open register flow here.");
      });
  });

  $("#btnSignout").off("click").on("click", function (e) {
    e && e.preventDefault();
    try {
      $.removeCookie("userId", { path: "/" });
    } catch (e) {}
    // redirect to homepage
    loadHome();
  });
}

// ---- Init ----
$(document).ready(function () {
  safeLog("App starting. API_BASE =", API_BASE);
  showYear();
  attachNavHandlers();

  // On first load show home
  loadHome();

  // If the bodyContainer is replaced by server routing, you can auto-open profile if user clicked My Profile link
  // If you want to auto-load profile when page loads and user is logged in:
  const uid = getCurrentUserId();
  if (uid && window.location.hash === "#profile") {
    // load profile.html and then the profile
    $.ajax({ method: "GET", url: "/profile.html" })
      .then(function (p) {
        $("#bodyContainer").html(p);
        setTimeout(() => {
          loadProfilePage();
        }, 50);
      })
      .catch(() => {});
  }
});