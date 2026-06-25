import { getStoredUser, isAdmin, clearAuth, fetchAndValidateUser } from "../Js/api.js";
import { initSidebar, updateUserInfo, applyRoleBasedVisibility } from "../Js/sidebar.js";

async function initDashboard() {
    if (!isAdmin()) {
        window.location.href = "login.html";
        return;
    }

    const validUser = await fetchAndValidateUser();
    if (!validUser) {
        window.location.href = "login.html";
        return;
    }

    const freshUser = getStoredUser();
    initSidebar({ user: freshUser });
}

initDashboard();

const settingsRailBtn = document.getElementById("settingsRailBtn");
const settingsModal = document.getElementById("SettingsModal");
const modalContent = document.getElementById("ModalContent");
const settingsBtn = document.getElementById("SettingsBtn");
const closeModalBtn = document.getElementById("CloseModalBtn");
const cancelSettingsBtn = document.getElementById("CancelSettingsBtn");

function openModal() {
    if (!settingsModal || !modalContent) return;
    settingsModal.classList.remove("hidden");
    settingsModal.classList.add("flex");
    setTimeout(() => {
        modalContent.classList.remove("scale-95", "opacity-0");
        modalContent.classList.add("scale-100", "opacity-100");
    }, 10);
}

function closeModal() {
    if (!settingsModal || !modalContent) return;
    modalContent.classList.add("scale-95", "opacity-0");
    modalContent.classList.remove("scale-100", "opacity-100");
    setTimeout(() => {
        settingsModal.classList.add("hidden");
        settingsModal.classList.remove("flex");
    }, 200);
}

if (settingsRailBtn) settingsRailBtn.addEventListener("click", openModal);
if (settingsBtn) settingsBtn.addEventListener("click", (e) => { e.stopPropagation(); openModal(); });
if (closeModalBtn) closeModalBtn.addEventListener("click", closeModal);
if (cancelSettingsBtn) cancelSettingsBtn.addEventListener("click", closeModal);
if (settingsModal) settingsModal.addEventListener("click", (e) => { if (e.target === settingsModal) closeModal(); });

function logoutUser() {
    if (confirm("آیا مطمئن هستید که می‌خواهید خارج شوید؟")) {
        clearAuth();
        window.location.href = "login.html";
    }
}
document.getElementById("LogoutIconBtn")?.addEventListener("click", logoutUser);
document.getElementById("LogoutMenuBtn")?.addEventListener("click", logoutUser);
document.getElementById("LogoutBtn")?.addEventListener("click", logoutUser);

document.querySelectorAll(".font-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        const size = btn.getAttribute("data-font");
        document.querySelectorAll(".font-btn").forEach(b => {
            b.classList.remove("bg-blue-50", "text-blue-600", "border-blue-200");
            b.classList.add("bg-gray-50", "text-gray-700", "border-gray-200");
        });
        btn.classList.add("bg-blue-50", "text-blue-600", "border-blue-200");
        localStorage.setItem("fontSize", size);
    });
});

const lightModeBtn = document.getElementById("LightModeBtn");
const darkModeBtn = document.getElementById("DarkModeBtn");

function updateModeButtons(isDark) {
    if (!lightModeBtn || !darkModeBtn) return;
    if (isDark) {
        darkModeBtn.style.background = "#3b82f6";
        darkModeBtn.style.color = "white";
        darkModeBtn.style.borderColor = "#3b82f6";
        lightModeBtn.style.background = "transparent";
        lightModeBtn.style.color = "#64748b";
        lightModeBtn.style.borderColor = "#cbd5e1";
    } else {
        lightModeBtn.style.background = "#3b82f6";
        lightModeBtn.style.color = "white";
        lightModeBtn.style.borderColor = "#3b82f6";
        darkModeBtn.style.background = "transparent";
        darkModeBtn.style.color = "#64748b";
        darkModeBtn.style.borderColor = "#cbd5e1";
    }
}

function applyTheme(isDark) {
    if (isDark) {
        document.body.classList.add("dark-mode");
        localStorage.setItem("darkMode", "true");
        updateModeButtons(true);
    } else {
        document.body.classList.remove("dark-mode");
        localStorage.setItem("darkMode", "false");
        updateModeButtons(false);
    }
}

lightModeBtn?.addEventListener("click", () => applyTheme(false));
darkModeBtn?.addEventListener("click", () => applyTheme(true));
applyTheme(localStorage.getItem("darkMode") === "true");

const savedFontSize = localStorage.getItem("fontSize");
if (savedFontSize === "small") document.body.style.fontSize = "13px";
else if (savedFontSize === "large") document.body.style.fontSize = "18px";
else document.body.style.fontSize = "16px";

function handleKeydown(e) {
    if (e.key === "Escape" && settingsModal && !settingsModal.classList.contains("hidden")) {
        closeModal();
    }
    if (e.ctrlKey && e.key === "b") {
        e.preventDefault();
        document.getElementById("BtnToggleMenu")?.click();
    }
}
document.addEventListener("keydown", handleKeydown);
window.addEventListener('beforeunload', () => {
    document.removeEventListener("keydown", handleKeydown);
});