/* src/main.js */
/* eslint-disable no-unused-vars */
/* global $, document */

// Backend base URL - change if needed
const API_BASE =
  (import.meta && import.meta.env && import.meta.env.VITE_API_BASE) ||
  "https://shopping-backend-jb5p.onrender.com";

$(function () {
  // ------------------------
  // Utilities
  // ------------------------
  function getCurrentUserId() {
    return $.cookie("userid") || null;
  }

  function safeLog() {
    try {
      console.log.apply(console, arguments);
    } catch (e) {}
  }

  // ------------------------
  // Basic UI helpers
  // ------------------------
  function showLoadingMessage(msg) {
    $("#bodyContainer").html(
      '<div class="p-4 text-center">' + (msg || "Loading...") + "</div>"
    );
  }

  function showErrorMessage(msg) {
    $("#bodyContainer").html(
      '<div class="p-4 text-danger text-center">' + (msg || "Error") + "</div>"
    );
  }

  // ------------------------
  // Profile: load & update
  // ------------------------
  async function loadProfilePage() {
    const uid = getCurrentUserId();
    if (!uid) {
      alert("Please login first.");
      $("#btnNavLogin").click();
      return;
    }

    // Load profile.html from server (local static file)
    $.ajax({ method: "GET", url: "/profile.html" })
      .then(function (html) {
        $("#bodyContainer").html(html);
        // After HTML loaded, fetch customer data
        fetchCustomerAndFill(uid);
        // attach update handler
        attachProfileUpdateHandler();
        // back button
        $("#btnBackFromProfile")
          .off("click")
          .on("click", function () {
            $.ajax({ method: "GET", url: "/products.html" }).then(function (
              p
            ) {
              $("#bodyContainer").html(p);
              // if you have getProducts function - call it; else user can navigate
              if (typeof getProducts === "function") getProducts();
            });
          });
      })
      .catch(function (err) {
        safeLog("Failed to load profile.html", err);
        showErrorMessage("Unable to load profile form.");
      });
  }

  // Fetch customer by uid with fallbacks
  function fetchCustomerAndFill(uid) {
    const url = API_BASE + "/customers/" + encodeURIComponent(uid);
    safeLog("PROFILE LOAD -> GET", url);

    fetch(url)
      .then((r) => {
        safeLog("PROFILE LOAD HTTP STATUS:", r.status);
        if (!r.ok) {
          // try fallback: maybe backend exposes /customers?userId=...
          throw { status: r.status, response: r };
        }
        return r.json();
      })
      .then((resp) => {
        safeLog("PROFILE LOAD →", resp);
        if (resp && resp.success && resp.customer) {
          fillProfileForm(resp.customer);
        } else if (Array.isArray(resp) && resp.length) {
          // in case backend returns array
          fillProfileForm(resp[0]);
        } else {
          // fallback: try /customers?userId=...
          safeLog("PROFILE LOAD: unexpected format, trying fallback query");
          return fetch(API_BASE + "/customers?userId=" + encodeURIComponent(uid))
            .then((r2) => r2.json())
            .then((rjson) => {
              safeLog("FALLBACK GET →", rjson);
              if (rjson && rjson.success && rjson.customer) {
                fillProfileForm(rjson.customer);
              } else if (Array.isArray(rjson) && rjson.length) {
                fillProfileForm(rjson[0]);
              } else {
                alert("Profile not found.");
              }
            });
        }
      })
      .catch(async (err) => {
        safeLog("PROFILE LOAD ERROR:", err);
        // If err has response, try to read body for message
        if (err && err.response) {
          try {
            const txt = await err.response.text();
            safeLog("PROFILE LOAD ERROR BODY:", txt);
            alert("Unable to load profile: " + txt);
            return;
          } catch (e) {}
        }
        alert("Profile load failed. See console for details.");
      });
  }

  function fillProfileForm(c) {
    try {
      $("#UserId").val(c.UserId || c.userId || c.UserID || "");
      $("#FirstName").val(c.FirstName || c.firstName || c.Firstname || "");
      $("#LastName").val(c.LastName || c.lastName || "");
      $("#Email").val(c.Email || c.email || "");
      $("#Gender").val(c.Gender || c.gender || "");
      $("#Address").val(c.Address || c.address || "");
      $("#PostalCode").val(c.PostalCode || c.postalCode || "");
      $("#State").val(c.State || c.state || "");
      $("#Country").val(c.Country || c.country || "");
      $("#Mobile").val(c.Mobile || c.mobile || "");
      if (c.DateOfBirth || c.dateOfBirth) {
        const dt = new Date(c.DateOfBirth || c.dateOfBirth);
        if (!isNaN(dt.getTime())) {
          const mm = String(dt.getMonth() + 1).padStart(2, "0");
          const dd = String(dt.getDate()).padStart(2, "0");
          $("#DateOfBirth").val(dt.getFullYear() + "-" + mm + "-" + dd);
        }
      }
    } catch (e) {
      safeLog("fillProfileForm error", e);
    }
  }

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

        // add password only if present
        if ($("#Password").length && $("#Password").val().trim() !== "") {
          payload.Password = $("#Password").val().trim();
        }

        // Try PUT /customers/:id (JSON)
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
            } catch (e) {
              safeLog("PUT parse json error", e);
            }

            if (res.ok && json && json.success) {
              alert(json.message || "Profile updated successfully.");
              if ($("#Password").length) $("#Password").val("");
              // optionally reload profile
              fetchCustomerAndFill(uid);
            } else if (res.status === 404) {
              // fallback -> try POST to updatecustomer (form-encoded)
              safeLog("PUT returned 404 -> trying POST /updatecustomer (form-encoded)");
              tryPostFormFallback(payload);
            } else if (res.status >= 400 && res.status < 600) {
              const msg =
                (json && json.message) ||
                "Profile update failed (PUT). Server returned " + res.status;
              alert(msg);
            } else {
              alert("Profile update failed. See console for details.");
            }
          })
          .catch((err) => {
            safeLog("PUT failed:", err);
            // network or CORS issue -> try fallback to POST form
            tryPostFormFallback(payload);
          });
      });
  }

  // fallback function -> POST /updatecustomer (form-encoded using jQuery)
  function tryPostFormFallback(payload) {
    safeLog("PROFILE UPDATE -> POST /updatecustomer (form fallback)", payload);
    $.ajax({
      method: "POST",
      url: API_BASE + "/updatecustomer",
      data: payload, // jQuery will send as application/x-www-form-urlencoded
      success: function (resp) {
        safeLog("PROFILE UPDATE RESPONSE (POST):", resp);
        if (resp && resp.success) {
          alert(resp.message || "Profile updated successfully (POST).");
          if ($("#Password").length) $("#Password").val("");
          const uid = getCurrentUserId();
          if (uid) fetchCustomerAndFill(uid);
        } else {
          alert((resp && resp.message) || "Profile update failed (POST).");
        }
      },
      error: function (xhr, status, err) {
        safeLog("PROFILE UPDATE (POST) ERROR:", status, err, xhr.responseText);
        let msg = "Profile update failed (server).";
        try {
          const j = JSON.parse(xhr.responseText || "{}");
          if (j && j.message) msg = j.message;
        } catch (e) {}
        alert(msg + " See console for details.");
      },
    });
  }

  // ------------------------
  // Auth helpers (minimal)
  // ------------------------
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
          data: { UserId: formUserId, Password: formPwd },
        })
          .then(function (resp) {
            safeLog("LOGIN RESP:", resp);
            if (!resp || resp.success === false) {
              alert((resp && resp.message) || "Invalid username or password");
              return;
            }
            const uid = resp.userId || formUserId;
            $.cookie("userid", uid, { path: "/" });
            $("#user").text(uid);
            $("#btnSignout").text("Signout");
            if (typeof onSuccess === "function") onSuccess();
            else {
              $.ajax({ method: "GET", url: "/shophome.html" }).then(function (
                resp2
              ) {
                $("#bodyContainer").html(resp2);
              });
            }
          })
          .catch(function (err) {
            safeLog("LOGIN ERROR", err);
            alert("Login error. See console.");
          });
      });
  }

  // Signout
  $("#btnSignout")
    .off("click")
    .on("click", function () {
      const uid = getCurrentUserId();
      try {
        const cart = JSON.parse(localStorage.getItem("cart") || "[]");
        if (uid) {
          localStorage.setItem("cart_" + uid, JSON.stringify(cart));
        }
      } catch (e) {}
      $.removeCookie("userid", { path: "/" });
      localStorage.removeItem("cart");
      $("#user").text("");
      $("#btnSignout").text("Login");
      alert("Signed out Successfully");
      $.ajax({ method: "GET", url: "/login.html" }).then(function (resp) {
        $("#bodyContainer").html(resp);
        attachLoginHandler();
      });
    });

  // Nav: Profile button
  $("#btnNavProfile")
    .off("click")
    .on("click", function () {
      const uid = getCurrentUserId();
      if (!uid) {
        alert("Please login to view your profile.");
        $("#btnNavLogin").click();
        return;
      }
      loadProfilePage();
    });

  // Nav Login / Register basic handlers
  $("#btnNavLogin")
    .off("click")
    .on("click", function () {
      $.ajax({ method: "GET", url: "/login.html" })
        .then(function (resp) {
          $("#bodyContainer").html(resp);
          attachLoginHandler(function () {
            // after successful login, load profile page automatically (optional)
            loadProfilePage();
          });
        })
        .catch(function () {});
    });

  $("#btnNavRegister")
    .off("click")
    .on("click", function () {
      $.ajax({ method: "GET", url: "/register.html" }).then(function (html) {
        $("#bodyContainer").html(html);
        // register button logic can live in register.html's script
      });
    });

  // On load: set UI for logged-in user (if cookie present)
  try {
    const uid = getCurrentUserId();
    if (uid) {
      $("#user").text(uid);
      $("#btnSignout").text("Signout");
    } else {
      $("#btnSignout").text("Login");
    }
  } catch (e) {}

  // Footer year
  const yearSpan = document.getElementById("year");
  if (yearSpan) yearSpan.textContent = new Date().getFullYear();
});