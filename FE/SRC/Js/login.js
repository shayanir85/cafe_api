import {
        login,
        saveAuthData,
        getStoredUser,
        isAdmin,
        clearAuth,
      } from "../Js/api.js";

      const form = document.getElementById("loginForm");
      const emailInput = document.getElementById("email");
      const submitBtn = document.getElementById("submitBtn");
      const btnText = document.getElementById("btnText");
      const btnLoading = document.getElementById("btnLoading");
      const errorMsgDiv = document.getElementById("errorMsg");
      const errorText = document.getElementById("errorText");
      const rememberCheckbox = document.getElementById("remember");
      const togglePasswordBtn = document.getElementById("togglePasswordBtn");
      const passwordInput = document.getElementById("password");
      const eyeIcon = document.getElementById("eyeIcon");

      if (togglePasswordBtn && passwordInput && eyeIcon) {
        togglePasswordBtn.addEventListener("click", function () {
          if (passwordInput.type === "password") {
            passwordInput.type = "text";
            eyeIcon.className = "fas fa-eye";
          } else {
            passwordInput.type = "password";
            eyeIcon.className = "fas fa-eye-slash";
          }
        });
      }

      function showError(message) {
        errorText.textContent = message;
        errorMsgDiv.classList.remove("hidden");
        const card = document.querySelector(".bg-white");
        if (card) card.classList.add("animate-shake");
        setTimeout(() => {
          if (card) card.classList.remove("animate-shake");
        }, 500);
      }

      function hideError() {
        errorMsgDiv.classList.add("hidden");
      }

      function showLoading() {
        hideError();
        btnText.classList.add("hidden");
        btnLoading.classList.remove("hidden");
        submitBtn.disabled = true;
      }

      function hideLoading() {
        btnText.classList.remove("hidden");
        btnLoading.classList.add("hidden");
        submitBtn.disabled = false;
      }

      form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const remember = rememberCheckbox.checked;

        if (!email) {
          showError("لطفاً آدرس ایمیل را وارد کنید");
          emailInput.focus();
          return;
        }

        if (!password) {
          showError("لطفاً رمز عبور را وارد کنید");
          passwordInput.focus();
          return;
        }

        if (password.length < 8) {
          showError("رمز عبور باید حداقل ۸ کاراکتر باشد");
          passwordInput.focus();
          return;
        }

        showLoading();

        try {
          const response = await login({ email, password });

          if (response && response.token) {
            const saved = saveAuthData(response);

            if (!saved) {
              showError("خطا در ذخیره اطلاعات کاربر");
              hideLoading();
              return;
            }

            if (remember) {
              localStorage.setItem("rememberedEmail", email);
            } else {
              localStorage.removeItem("rememberedEmail");
            }

            const user = getStoredUser();

            if (
              user &&
              (user.role === "admin" || user.role === "super_admin")
            ) {

              window.location.href = "dashboard.html";
            } else {
              showError("شما دسترسی ادمین ندارید");
              clearAuth();
              hideLoading();
            }
          } else {
            showError("خطا در دریافت اطلاعات کاربر");
            hideLoading();
          }
        } catch (error) {
          const errorMessage =
            error.response?.data?.message ||
            error.response?.data?.error ||
            error.message ||
            "ایمیل یا رمز عبور اشتباه است";
          showError(errorMessage);
          hideLoading();
          passwordInput.value = "";
          passwordInput.focus();
        }
      });

      if (isAdmin()) {
        window.location.href = "dashboard.html";
      }