let isMenuOpen = false;
let isDashboardOpen = false;
let btnToggleMenu, menuItemsDiv;
let dashboardMainBtn, dashboardSubmenu, dashboardArrow;
let settingsModal;

/**
 * @param {Object} options
 * @param {Object} options.user
 * @param {Object} options.selectors
 */
export function initSidebar({ user, selectors = {} } = {}) {
  const ids = {
    btnToggleMenu: "BtnToggleMenu",
    menuItems: "MenuItems",
    dashboardMainBtn: "DashboardMainBtn",
    dashboardSubmenu: "DashboardSubmenu",
    dashboardArrow: "DashboardArrow",
    settingsModal: "SettingsModal",
    userAvatar: "UserAvatar",
    loggedInUserName: "LoggedInUserName",
    loggedInUserRole: "LoggedInUserRole",
    loggedInUserInfo: "LoggedInUserInfo",
    userStatusText: "UserStatusText",
    adminManagementCard: "AdminManagementCard",
    adminRailBtn: "AdminRailBtn",
    adminManagementSubmenu: "AdminManagementSubmenu",
    ...selectors,
  };

  btnToggleMenu = document.getElementById(ids.btnToggleMenu);
  menuItemsDiv = document.getElementById(ids.menuItems);
  dashboardMainBtn = document.getElementById(ids.dashboardMainBtn);
  dashboardSubmenu = document.getElementById(ids.dashboardSubmenu);
  dashboardArrow = document.getElementById(ids.dashboardArrow);
  settingsModal = document.getElementById(ids.settingsModal);

  if (btnToggleMenu) {
    btnToggleMenu.addEventListener("click", toggleMainMenu);
  }

  if (dashboardMainBtn) {
    dashboardMainBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleDashboardMenu(e);
    });
  }

  if (dashboardSubmenu) {
    dashboardSubmenu.addEventListener("click", (e) => e.stopPropagation());
  }

  document.addEventListener("click", handleOutsideClick);
  window._sidebarCleanup = function() {
    document.removeEventListener("click", handleOutsideClick);
    if (btnToggleMenu) btnToggleMenu.removeEventListener("click", toggleMainMenu);
    if (dashboardMainBtn) dashboardMainBtn.removeEventListener("click", toggleDashboardMenu);
  };

  if (user) {
    updateUserInfo(user);
    applyRoleBasedVisibility(user);
  }

  if (menuItemsDiv) {
    menuItemsDiv.style.transition = "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)";
    menuItemsDiv.style.overflow = "hidden";
  }
}

function toggleMainMenu() {
  if (!menuItemsDiv) return;
  const menuIcon = document.querySelector(".menu-icon");

  if (isMenuOpen) {
    menuItemsDiv.classList.remove("menu-open");
    menuItemsDiv.classList.add("menu-closed");
    if (menuIcon) menuIcon.classList.remove("active");
    setTimeout(() => {
      menuItemsDiv.style.width = "0";
      menuItemsDiv.style.opacity = "0";
      menuItemsDiv.style.visibility = "hidden";
      menuItemsDiv.style.padding = "0";
    }, 150);
  } else {
    menuItemsDiv.style.width = "256px";
    menuItemsDiv.style.opacity = "1";
    menuItemsDiv.style.visibility = "visible";
    menuItemsDiv.style.padding = "";
    menuItemsDiv.classList.remove("menu-closed");
    menuItemsDiv.classList.add("menu-open");
    if (menuIcon) menuIcon.classList.add("active");
    setTimeout(() => menuItemsDiv.classList.remove("menu-open"), 400);
  }
  isMenuOpen = !isMenuOpen;
}

function toggleDashboardMenu(event) {
  if (event) event.stopPropagation();
  isDashboardOpen = !isDashboardOpen;
  if (isDashboardOpen) {
    dashboardSubmenu?.classList.remove("hidden");
    dashboardSubmenu?.classList.add("scale-in");
    if (dashboardArrow) dashboardArrow.style.transform = "rotate(180deg)";
  } else {
    dashboardSubmenu?.classList.add("hidden");
    if (dashboardArrow) dashboardArrow.style.transform = "rotate(0deg)";
  }
}

function handleOutsideClick(event) {
  const isModalOpen =
    settingsModal && !settingsModal.classList.contains("hidden");
  if (isModalOpen) return;

  if (isMenuOpen) {
    const sidebar = document.querySelector("aside");
    const clickedInsideSidebar = sidebar?.contains(event.target);
    const clickedOnToggle = btnToggleMenu?.contains(event.target);
    if (!clickedInsideSidebar && !clickedOnToggle) {
      closeMainMenu();
    }
  }

  if (isDashboardOpen) {
    const clickedInside =
      dashboardMainBtn?.contains(event.target) ||
      dashboardSubmenu?.contains(event.target);
    if (!clickedInside) {
      isDashboardOpen = false;
      dashboardSubmenu?.classList.add("hidden");
      if (dashboardArrow) dashboardArrow.style.transform = "rotate(0deg)";
    }
  }
}

function closeMainMenu() {
  if (menuItemsDiv) {
    menuItemsDiv.style.width = "0";
    menuItemsDiv.style.opacity = "0";
    menuItemsDiv.style.visibility = "hidden";
    menuItemsDiv.style.padding = "0";
  }
  const menuIcon = document.querySelector(".menu-icon");
  if (menuIcon) menuIcon.classList.remove("active");
  isMenuOpen = false;
}

export function updateUserInfo(user) {
  if (!user) return;

  const avatar = document.getElementById("UserAvatar");
  const nameEl = document.getElementById("LoggedInUserName");
  const roleEl = document.getElementById("LoggedInUserRole");
  const infoBox = document.getElementById("LoggedInUserInfo");
  const statusText = document.getElementById("UserStatusText");

  const isSuper = user.role === "super_admin";

  if (infoBox) infoBox.classList.remove("hidden");
  if (nameEl) nameEl.textContent = user.name || user.email || "کاربر";
  if (roleEl) roleEl.textContent = isSuper ? "سوپر ادمین" : "ادمین";
  if (avatar) {
    avatar.textContent = (user.name || user.email || "AD")
      .charAt(0)
      .toUpperCase();
  }
  if (statusText) statusText.textContent = isSuper ? "سوپر ادمین" : "ادمین";
}

export function applyRoleBasedVisibility(user) {
  const isSuper = user?.role === "super_admin";

  const card = document.getElementById("AdminManagementCard");
  if (card) card.style.display = isSuper ? "block" : "none";

  const railBtn = document.getElementById("AdminRailBtn");
  if (railBtn) railBtn.style.display = isSuper ? "flex" : "none";

  const submenu = document.getElementById("AdminManagementSubmenu");
  if (submenu) submenu.style.display = isSuper ? "flex" : "none";
}

export function isSidebarOpen() {
  return isMenuOpen;
}
