
import { getStoredUser, clearAuth, resetPass } from "../Js/api.js";

const user = getStoredUser();
if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
    window.location.href = 'login.html';
}

const form = document.getElementById("resetForm");
const submitBtn = document.getElementById("submitBtn");
const btnText = document.getElementById("btnText");
const btnLoading = document.getElementById("btnLoading");
const errorMsgDiv = document.getElementById("errorMsg");
const errorTextEl = document.getElementById("errorText");
const successMsgDiv = document.getElementById("successMsg");
const passwordInput = document.getElementById("password");
const newPasswordInput = document.getElementById("newPassword");
const confirmPasswordInput = document.getElementById("newPassword_confirmation");

function makeToggle(inputEl, iconEl) {
    return function () {
        const show = inputEl.type === "password";
        inputEl.type = show ? "text" : "password";
        iconEl.className = show ? "fas fa-eye w-5" : "fas fa-eye-slash w-5";
    };
}

document.getElementById("togglePassword")
    .addEventListener("click", makeToggle(passwordInput, document.getElementById("eyePassword")));
document.getElementById("toggleNewPassword")
    .addEventListener("click", makeToggle(newPasswordInput, document.getElementById("eyeNewPassword")));
document.getElementById("toggleConfirmPassword")
    .addEventListener("click", makeToggle(confirmPasswordInput, document.getElementById("eyeConfirmPassword")));

function showError(message) {
    errorTextEl.textContent = message;
    errorMsgDiv.classList.remove("hidden");
    successMsgDiv.classList.add("hidden");
    const card = document.querySelector(".bg-white");
    if (card) {
        card.classList.add("animate-shake");
        setTimeout(() => card.classList.remove("animate-shake"), 500);
    }
}

function hideError() {
    errorMsgDiv.classList.add("hidden");
}

function showSuccess() {
    successMsgDiv.classList.remove("hidden");
    hideError();
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

    const password = passwordInput.value.trim();
    const newPassword = newPasswordInput.value.trim();
    const newPassword_confirmation = confirmPasswordInput.value.trim();

    if (!password) {
        showError("لطفاً رمز عبور فعلی خود را وارد کنید");
        passwordInput.focus();
        return;
    }
    if (!newPassword) {
        showError("لطفاً رمز عبور جدید خود را وارد کنید");
        newPasswordInput.focus();
        return;
    }
    if (newPassword.length < 8) {
        showError("رمز عبور جدید باید حداقل ۸ کاراکتر باشد");
        newPasswordInput.focus();
        return;
    }
    if (!newPassword_confirmation) {
        showError("لطفاً رمز عبور جدید را تایید کنید");
        confirmPasswordInput.focus();
        return;
    }
    if (newPassword !== newPassword_confirmation) {
        showError("رمز عبور جدید و تایید آن یکسان نیستند");
        confirmPasswordInput.focus();
        return;
    }

    showLoading();

    try {
        const response = await resetPass({ password, newPassword, newPassword_confirmation });
        showSuccess();
        setTimeout(() => {
            window.location.href = "dashboard.html";
        }, 1500);
    } catch (error) {
        const errorMessage =
            error.response?.data?.message ||
            error.response?.data?.error ||
            error.message ||
            "رمز عبور فعلی اشتباه است";
        showError(errorMessage);
        hideLoading();
        passwordInput.value = "";
        newPasswordInput.value = "";
        confirmPasswordInput.value = "";
        passwordInput.focus();
    }
});
