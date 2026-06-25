import * as api from "./api.js";

let products = [];
let categories = [];
let currentFilter = "all";
let cart = JSON.parse(localStorage.getItem("cart")) || [];
let categoryIconMap = new Map();
let catSlugMap = {};

const CAT_ICONS = [
  "fa-mug-hot",
  "fa-glass-martini-alt",
  "fa-birthday-cake",
  "fa-cookie",
  "fa-ice-cream",
  "fa-coffee",
  "fa-candy-cane",
];

function escapeHtml(str) {
  if (!str) return "";
  return String(str).replace(/[&<>]/g, function (m) {
    if (m === "&") return "&amp;";
    if (m === "<") return "&lt;";
    if (m === ">") return "&gt;";
    return m;
  });
}

function createSkeletons() {
  const container = document.getElementById("skeleton-container");
  if (!container) return;
  container.innerHTML = "";
  for (let i = 0; i < 6; i++) {
    const skeleton = document.createElement("div");
    skeleton.className = "menu-card";
    skeleton.innerHTML = `
            <div class="skeleton" style="aspect-ratio: 1/1;"></div>
            <div class="menu-card-body">
                <div class="skeleton h-4 w-3/4 mb-2"></div>
                <div class="skeleton h-3 w-full mb-1"></div>
                <div class="skeleton h-3 w-2/3"></div>
            </div>
            <div class="menu-card-footer">
                <div class="skeleton h-5 w-20"></div>
                <div class="skeleton h-8 w-16"></div>
            </div>
        `;
    container.appendChild(skeleton);
  }
}

async function loadData() {
  try {
    const [menuResponse, catResponse] = await Promise.all([
      api.getMenuItems(),
      api.getCategories(),
    ]);

    let rawCategories = [];
    if (Array.isArray(catResponse)) {
      rawCategories = catResponse;
    } else if (catResponse?.data) {
      rawCategories = catResponse.data;
    }
    const uniqueMap = new Map();
    rawCategories.forEach((cat) => {
      if (!uniqueMap.has(cat.name)) {
        uniqueMap.set(cat.name, cat);
      }
    });
    categories = Array.from(uniqueMap.values());
    categories.sort(
      (a, b) => (a.display_order ?? Infinity) - (b.display_order ?? Infinity),
    );

    categories.forEach((cat, idx) => {
      categoryIconMap.set(cat.id, {
        icon: CAT_ICONS[idx % CAT_ICONS.length],
      });

      const name = cat.name || "";
      if (name.includes("گرم")) catSlugMap["hot"] = cat.id;
      else if (name.includes("سرد")) catSlugMap["cold"] = cat.id;
      else if (name.includes("دسر") || name.includes("کیک"))
        catSlugMap["cake"] = cat.id;
      catSlugMap[`cat-${cat.id}`] = cat.id;
    });

    let rawProducts = [];
    if (menuResponse?.data) {
      rawProducts = menuResponse.data;
    } else if (Array.isArray(menuResponse)) {
      rawProducts = menuResponse;
    }

    products = rawProducts
      .filter((item) => item.is_available)
      .map((item) => {
        // Convert category_id to string for comparison
        const catId = String(
          item.category_id || item.categoryId || item.cat_id || "",
        );

        // Find category by comparing strings
        const category = categories.find((c) => String(c.id) === catId);

        return {
          id: item.id,
          name: item.name,
          price: parseFloat(item.price) || 0,
          catId: catId, // Store as string
          catName: category?.name || "بدون دسته",
          desc: item.description || "بدون توضیحات",
          img: item.image_url || "",
        };
      });

    buildFilterPills();
    renderProducts(products);
    updateCartBadge();
    updateFooterLinks();
  } catch (error) {
    const container = document.getElementById("products-container");
    if (container) {
      container.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-triangle empty-state-icon"></i><h3>خطا در ارتباط با سرور</h3><p>لطفاً بعداً مجدد تلاش کنید</p></div>`;
      container.classList.remove("hidden");
    }
    document.getElementById("skeleton-container")?.classList.add("hidden");
  }
}
function buildFilterPills() {
  const container = document.getElementById("filter-pills");
  if (!container) return;
  container.innerHTML = "";

  if (!categories || categories.length === 0) {
    container.innerHTML =
      '<div class="text-white/40 text-sm p-2">در حال بارگذاری دسته‌بندی‌ها...</div>';
    return;
  }

  const allBtn = document.createElement("button");
  allBtn.className = "filter-pill active";
  allBtn.setAttribute("data-cat", "all");
  allBtn.innerHTML = `<i class="fas fa-utensils"></i> همه <span class="pill-count">${products.length}</span>`;
  allBtn.onclick = () => handleFilter("all");
  container.appendChild(allBtn);

  categories.forEach((cat) => {
    const style = categoryIconMap.get(cat.id) || { icon: "fa-tag" };
    const count = products.filter(
      (p) => String(p.catId) === String(cat.id),
    ).length;
    const btn = document.createElement("button");
    btn.className = "filter-pill";
    btn.setAttribute("data-cat", cat.id);
    btn.innerHTML = `<i class="fas ${style.icon}"></i> ${cat.name} <span class="pill-count">${count}</span>`;
    btn.onclick = () => handleFilter(cat.id.toString());
    container.appendChild(btn);
  });
}

function formatPrice(price) {
  return Math.floor(Number(price)).toLocaleString("fa-IR");
}

function renderProducts(list) {
  const container = document.getElementById("products-container");
  const skeleton = document.getElementById("skeleton-container");
  const noResult = document.getElementById("no-result");

  if (!container) return;

  skeleton?.classList.add("hidden");
  container.classList.remove("hidden");
  container.innerHTML = "";

  if (list.length === 0) {
    noResult?.classList.remove("hidden");
    return;
  }

  noResult?.classList.add("hidden");

  list.forEach((product, idx) => {
    const style = categoryIconMap.get(product.catId) || {
      icon: "fa-tag",
    };

    const card = document.createElement("div");
    card.className = "menu-card product-card";
    card.style.transitionDelay = `${idx * 70}ms`;
    card.innerHTML = `
            <img src="${product.img || "https://api.shayaniranpor.ir/images/menu-items/default.jpg"}" alt="${escapeHtml(product.name)}" class="menu-card-image" loading="lazy" onerror="this.style.display='none'">
            <div class="menu-card-overlay">
                <span class="menu-card-category"><i class="fas ${style.icon}"></i> ${escapeHtml(product.catName)}</span>
            </div>
            <div class="menu-card-body">
                <h3 class="menu-card-title">${escapeHtml(product.name)}</h3>
                <p class="menu-card-desc">${escapeHtml(product.desc)}</p>
            </div>
            <div class="menu-card-footer">
                <span class="menu-card-price">${formatPrice(product.price)} تومان</span>
                <button class="btn-cart" onclick="addToCart(${product.id}, this)"><i class="fas fa-plus"></i> افزودن</button>
            </div>
        `;
    container.appendChild(card);
    requestAnimationFrame(() => card.classList.add("visible"));
  });
}

window.handleFilter = function (cat) {
  let filterId = cat;
  if (cat === "all") {
    currentFilter = "all";
  } else if (catSlugMap[cat]) {
    filterId = catSlugMap[cat].toString();
    currentFilter = filterId;
  } else {
    currentFilter = cat;
  }

  const filtered =
    currentFilter === "all"
      ? products
      : products.filter((p) => String(p.catId) === String(currentFilter));
  renderProducts(filtered);

  document.querySelectorAll(".filter-pill").forEach((btn) => {
    btn.classList.remove("active");
    if (
      btn.getAttribute("data-cat") == cat ||
      (cat === "all" && btn.getAttribute("data-cat") === "all")
    ) {
      btn.classList.add("active");
    }
  });
};

function normalizePersian(str) {
  return str.replace(/[يى]/g, "ی").replace(/ك/g, "ک").replace(/ة/g, "ه");
}

window.handleSearch = function (query) {
  const normalizedQuery = normalizePersian(query);
  const filtered = products.filter(
    (p) =>
      normalizePersian(p.name).includes(normalizedQuery) ||
      normalizePersian(p.desc).includes(normalizedQuery),
  );
  renderProducts(filtered);
  document
    .querySelectorAll(".filter-pill")
    .forEach((btn) => btn.classList.remove("active"));
  if (document.querySelector('.filter-pill[data-cat="all"]')) {
    document
      .querySelector('.filter-pill[data-cat="all"]')
      .classList.add("active");
  }
  currentFilter = "all";
};

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartBadge();
}

function updateCartBadge() {
  const badge = document.getElementById("cart-count");
  if (badge) {
    const totalCount = cart.reduce((acc, item) => acc + (item.qty || 1), 0);
    badge.textContent = totalCount;
    if (totalCount > 0) {
      badge.classList.add("show");
    } else {
      badge.classList.remove("show");
    }
  }
}

window.addToCart = function (id, btn) {
  const product = products.find((p) => p.id === id);
  if (!product) return;

  const exist = cart.find((c) => c.id === id);
  if (exist) {
    exist.qty++;
  } else {
    cart.push({ ...product, qty: 1 });
  }
  saveCart();

  const originalText = btn.innerHTML;
  btn.innerHTML = '<i class="fas fa-check"></i> اضافه شد';
  btn.style.background = "#f59e0b";
  btn.style.color = "#1a0e0a";
  setTimeout(() => {
    btn.innerHTML = originalText;
    btn.style.background = "";
    btn.style.color = "";
  }, 1200);
};

function goToCheckout() {
  window.location.href = "checkout.html";
}

function updateFooterLinks() {
  const container = document.getElementById("footer-category-links");
  if (!container) return;
  container.innerHTML = "";

  categories.forEach((cat) => {
    const style = categoryIconMap.get(cat.id) || { icon: "fa-tag" };
    const li = document.createElement("li");
    li.innerHTML = `<a href="#" class="footer-link" data-cat-id="${cat.id}"><i class="fas ${style.icon} text-white/20 ml-2"></i> ${escapeHtml(cat.name)}</a>`;
    li.querySelector("a").onclick = (e) => {
      e.preventDefault();
      handleFilter(cat.id.toString());
      window.scrollTo({ top: 0, behavior: "smooth" });
    };
    container.appendChild(li);
  });
}

createSkeletons();
document.getElementById("cart")?.addEventListener("click", goToCheckout);
loadData();
