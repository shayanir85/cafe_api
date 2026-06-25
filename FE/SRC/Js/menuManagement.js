
import { 
    isAdmin, 
    getCategories, 
    getMenuItems,
    createCategory,
    updateCategory,
    deleteCategory,
    updateMenuItem,
    getStoredUser,
    deleteMenuItem,
    getImageUrl
} from '../Js/api.js';

const user = getStoredUser();

if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
    window.location.href = 'login.html';
}

let menuItems = [];
let categories = [];
let currentCategory = 'all';
let currentEditId = null;
let currentDeleteId = null;
let searchTimeout;
let imageFileToUpload = null;
let isLoading = false;
const searchInput = document.getElementById('searchInput');
const statusFilter = document.getElementById('statusFilter');
const sortBy = document.getElementById('sortBy');
const menuGrid = document.getElementById('menuGrid');
const emptyState = document.getElementById('emptyState');
const categoryTabs = document.getElementById('categoryTabs');

function showToast(msg, type = 'success') {
    const toast = document.getElementById('toast');
    document.getElementById('toastMessage').textContent = msg;
    document.getElementById('toastIcon').className = 'fa-solid fa-' + (type === 'error' ? 'circle-xmark' : type === 'info' ? 'circle-info' : 'circle-check');
    toast.className = 'toast toast-' + type;
    toast.classList.add('show');
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => toast.classList.remove('show'), 3000);
}

window.closeModal = function(id) { 
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove('active'); 
}

function openModal(id) { 
    const modal = document.getElementById(id);
    if (modal) modal.classList.add('active'); 
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

async function loadCategories() {
    try {
        const result = await getCategories();
        let rawCategories = Array.isArray(result) ? result : (result?.data || []);
        
        const uniqueMap = new Map();
        rawCategories.forEach(cat => {
            if (!uniqueMap.has(cat.name)) {
                uniqueMap.set(cat.name, cat);
            }
        });
        categories = Array.from(uniqueMap.values());
        
        const statCategories = document.getElementById('statCategories');
        if (statCategories) statCategories.textContent = categories.length;
        
        updateCategorySelects();
        updateCategoryTabs();
        return categories;
    } catch (error) {
        console.error('Error loading categories:', error);
        categories = [];
        updateCategorySelects();
        updateCategoryTabs();
        return [];
    }
}

function updateCategorySelects() {
    const select = document.getElementById('itemCategory');
    if (!select) return;
    const currentVal = select.value;
    select.innerHTML = '<option value="">انتخاب کنید...</option>' + 
        categories.map(cat => `<option value="${cat.id}" ${cat.id == currentVal ? 'selected' : ''}>${escapeHtml(cat.name)}</option>`).join('');
}

async function loadMenuItemsFromAPI() {
    if (isLoading) return;
    isLoading = true;
    
    try {
        const result = await getMenuItems();
        
        if (result && result.data && Array.isArray(result.data)) {
            menuItems = result.data;
        } else if (result && Array.isArray(result)) {
            menuItems = result;
        } else {
            menuItems = [];
        }
        
        renderMenu();
        updateCategoryTabs();
        updateStats();
    } catch (error) {
        console.error(error);
        showToast('خطا در بارگذاری منو', 'error');
        menuItems = [];
        renderMenu();
    } finally {
        isLoading = false;
    }
}

function updateStats() {
    const total = menuItems.length;
    const available = menuItems.filter(i => i.is_available == 1 || i.is_available === true).length;
    const unavailable = total - available;
    
    const statTotal = document.getElementById('statTotal');
    const statAvailable = document.getElementById('statAvailable');
    const statUnavailable = document.getElementById('statUnavailable');
    
    if (statTotal) statTotal.textContent = total;
    if (statAvailable) statAvailable.textContent = available;
    if (statUnavailable) statUnavailable.textContent = unavailable;
}

function updateCategoryTabs() {
    if (!categoryTabs) return;
    
    const categoryMap = {};
    menuItems.forEach(item => {
        const catId = item.category_id;
        categoryMap[catId] = (categoryMap[catId] || 0) + 1;
    });
    
    let html = `<button class="category-tab ${currentCategory === 'all' ? 'active' : ''}" onclick="window.filterByCategory('all', this)">
        همه <span class="count-badge">${menuItems.length}</span>
    </button>`;
    
    categories.forEach(cat => {
        const count = categoryMap[cat.id] || 0;
        html += `<button class="category-tab ${currentCategory == cat.id ? 'active' : ''}" onclick="window.filterByCategory('${cat.id}', this)">
            ${escapeHtml(cat.name)} <span class="count-badge">${count}</span>
        </button>`;
    });
    
    categoryTabs.innerHTML = html;
}

function formatPrice(price) {
  return Math.floor(Number(price)).toLocaleString("fa-IR");
}

function renderMenu() {
    const search = searchInput?.value.toLowerCase() || '';
    const status = statusFilter?.value || 'all';
    const sort = sortBy?.value || 'newest';
    let items = [...menuItems];
    
    if (currentCategory !== 'all') {
        items = items.filter(i => i.category_id == currentCategory);
    }
    
    if (search) {
        items = items.filter(i => 
            (i.name || '').toLowerCase().includes(search) || 
            (i.description || '').toLowerCase().includes(search)
        );
    }
    
    if (status !== 'all') {
        const isAvailable = status === 'available';
        items = items.filter(i => (i.is_available == 1 || i.is_available === true) === isAvailable);
    }
    
    const sortFns = {
        newest: (a, b) => new Date(b.created_at) - new Date(a.created_at),
        oldest: (a, b) => new Date(a.created_at) - new Date(b.created_at),
        'price-asc': (a, b) => (a.price || 0) - (b.price || 0),
        'price-desc': (a, b) => (b.price || 0) - (a.price || 0),
        'name-asc': (a, b) => (a.name || '').localeCompare(b.name || '', 'fa')
    };
    items.sort(sortFns[sort] || sortFns.newest);
    
    if (items.length === 0) {
        if (menuGrid) menuGrid.innerHTML = '';
        if (emptyState) emptyState.classList.remove('hidden');
        return;
    }
    
    if (emptyState) emptyState.classList.add('hidden');
    
    if (!menuGrid) return;
    
    menuGrid.innerHTML = items.map(item => {
        const category = categories.find(c => c.id == item.category_id);
        const categoryName = category?.name || 'دسته‌بندی نشده';
        const isAvailable = item.is_available == 1 || item.is_available === true;
        const imageUrl = item.image_url || item.image || getImageUrl('../images/menu-items/default.jpg');
        
        return `
        <div class="menu-card fade-in-up">
            <img src="${imageUrl}" alt="${escapeHtml(item.name)}" class="menu-card-image" onerror="this.src='${getImageUrl('images/menu-items/default.jpg')}'" loading="lazy">
            <div class="menu-card-overlay">
                <div class="menu-card-badges">
                    <span class="badge ${isAvailable ? 'badge-available' : 'badge-unavailable'}">${isAvailable ? 'موجود' : 'ناموجود'}</span>
                </div>
                <div class="menu-card-actions-overlay">
                    <button class="btn-icon-overlay edit" onclick="event.stopPropagation(); window.openEditModal(${item.id})" title="ویرایش">
                        <i class="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button class="btn-icon-overlay toggle-status" onclick="event.stopPropagation(); window.toggleStatus(${item.id})" title="تغییر وضعیت موجودی">
                        <i class="fa-solid fa-${isAvailable ? 'ban' : 'check-circle'}"></i>
                    </button>
                    <button class="btn-icon-overlay delete" onclick="event.stopPropagation(); window.openDeleteModal(${item.id}, '${escapeHtml(item.name)}')" title="حذف">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            </div>
            <div class="menu-card-body">
                <span class="menu-card-category">${escapeHtml(categoryName)}</span>
                <h3 class="menu-card-title">${escapeHtml(item.name)}</h3>
                <p class="menu-card-desc">${escapeHtml(item.description || '')}</p>
            </div>
            <div class="menu-card-footer">
                <span class="menu-card-price">${formatPrice(item.price)} تومان</span>
            </div>
        </div>`;
    }).join('');
    
    updateStats();
}

window.filterByCategory = function(catId, el) {
    currentCategory = catId;
    document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
    if (el) el.classList.add('active');
    renderMenu();
}

function debouncedRender() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => renderMenu(), 300);
}

window.debouncedRender = debouncedRender;
window.renderMenu = renderMenu;

window.clearAllFilters = function() {
    if (searchInput) searchInput.value = '';
    if (statusFilter) statusFilter.value = 'all';
    if (sortBy) sortBy.value = 'newest';
    if (currentCategory !== 'all') {
        currentCategory = 'all';
        const firstTab = document.querySelector('.category-tab');
        if (firstTab) {
            document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
            firstTab.classList.add('active');
        }
    }
    renderMenu();
    showToast('تمامی فیلترها پاک شد', 'info');
}

window.toggleStatus = async function(id) {
    const item = menuItems.find(i => i.id == id);
    if (!item) return;
    
    const newStatus = (item.is_available == 1 || item.is_available === true) ? 0 : 1;
    
    try {
        const formData = new FormData();
        formData.append('is_available', newStatus);
        formData.append('_method', 'PUT');
        
        const result = await updateMenuItem(id, formData);
        
        if (result.success || result.data) {
            item.is_available = newStatus;
            renderMenu();
            showToast(`وضعیت "${item.name}" تغییر کرد`, 'success');
        } else {
            showToast('خطا در تغییر وضعیت', 'error');
        }
    } catch (error) {
        console.error(error);
        showToast('خطا در ارتباط با سرور', 'error');
    }
}

window.handleImageUpload = function(input) {
    const file = input.files[0];
    
    if (!file) {
        return;
    }
    
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
        showToast('فرمت فایل باید JPG, PNG, WebP یا GIF باشد', 'error');
        input.value = '';
        return;
    }
    
    if (file.size > 2 * 1024 * 1024) {
        showToast('حجم فایل نباید بیشتر از 2 مگابایت باشد', 'error');
        return;
    }
    
    imageFileToUpload = file;

    const reader = new FileReader();
    reader.onload = e => {
        const preview = document.getElementById('uploadPreview');
        const trigger = document.getElementById('uploadTrigger');
        if (preview) {
            preview.innerHTML = `<img src="${e.target.result}" class="upload-preview-img" alt="Preview">`;
        }
        if (trigger) trigger.classList.add('has-image');
    };
    reader.onerror = () => {
        showToast('خطا در خواندن فایل', 'error');
    };
    reader.readAsDataURL(file);
}

window.openEditModal = async function(id) {
    const item = menuItems.find(i => i.id == id);
    if (!item) return;
    
    currentEditId = id;
    imageFileToUpload = null;
    
    await loadCategories();
    
    const nameInput = document.getElementById('itemName');
    const descInput = document.getElementById('itemDescription');
    const priceInput = document.getElementById('itemPrice');
    const catSelect = document.getElementById('itemCategory');
    const statusSelect = document.getElementById('itemStatus');
    const imageHidden = document.getElementById('itemImage');
    const uploadPreviewDiv = document.getElementById('uploadPreview');
    const uploadTriggerDiv = document.getElementById('uploadTrigger');
    const imageInput = document.getElementById('itemImageInput');
    
    if (nameInput) nameInput.value = item.name || '';
    if (descInput) descInput.value = item.description || '';
    if (priceInput) priceInput.value = item.price || '';
    if (catSelect) catSelect.value = item.category_id || '';
    if (statusSelect) statusSelect.value = (item.is_available == 1 || item.is_available === true) ? '1' : '0';
    if (imageHidden) imageHidden.value = item.image || '';
    
    const imageUrl = item.image_url || item.image;
    if (imageUrl && uploadPreviewDiv) {
        uploadPreviewDiv.innerHTML = `<img src="${imageUrl}" class="upload-preview-img" alt="Preview">`;
        if (uploadTriggerDiv) uploadTriggerDiv.classList.add('has-image');
    } else if (uploadPreviewDiv) {
        uploadPreviewDiv.innerHTML = '<i class="fa-solid fa-cloud-arrow-up upload-icon"></i><p class="upload-text">کلیک برای آپلود تصویر جدید</p><p class="upload-hint">JPG, PNG, WebP | حداکثر 2MB</p>';
        if (uploadTriggerDiv) uploadTriggerDiv.classList.remove('has-image');
    }
    
    if (imageInput) imageInput.value = '';
    
    openModal('formModal');
}

window.saveItem = async function(event) {
    event.preventDefault();
    
    const nameInput = document.getElementById('itemName');
    const priceInput = document.getElementById('itemPrice');
    const catSelect = document.getElementById('itemCategory');
    const descInput = document.getElementById('itemDescription');
    const statusSelect = document.getElementById('itemStatus');
    
    const name = nameInput?.value.trim() || '';
    const price = parseInt(priceInput?.value || '0');
    const category = catSelect?.value || '';
    
    if (!name || !price || !category) {
        showToast('فیلدهای ضروری را پر کنید', 'error');
        return;
    }
    
    const saveBtn = document.getElementById('saveBtn');
    const originalText = saveBtn?.innerHTML || '';
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> در حال ذخیره...';
    }
    
    try {
        const formData = new FormData();
        formData.append('name', name);
        formData.append('price', price);
        formData.append('category_id', category);
        formData.append('description', descInput?.value.trim() || '');
        formData.append('is_available', statusSelect?.value === '1' ? 1 : 0);
        
        if (imageFileToUpload) {
            formData.append('image', imageFileToUpload);
        } else {

        }
        
        
        const result = await updateMenuItem(currentEditId, formData);
        
        if (result.success || result.data) {
            imageFileToUpload = null;
            showToast('آیتم با موفقیت ویرایش شد', 'success');
            closeModal('formModal');
            await loadMenuItemsFromAPI();
        } else {
            showToast(result.message || 'خطا در ویرایش آیتم', 'error');
        }
    } catch (error) {
        console.error(error);
        let errorMsg = 'خطا در ارتباط با سرور';
        if (error.response?.data?.message) {
            errorMsg = error.response.data.message;
        } else if (error.response?.data?.errors) {
            const errors = error.response.data.errors;
            errorMsg = Object.values(errors).flat().join(', ');
        }
        showToast(errorMsg, 'error');
    } finally {
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = originalText;
        }
    }
}

window.openDeleteModal = function(id, name) {
    currentDeleteId = id;
    const deleteNameSpan = document.getElementById('deleteItemName');
    if (deleteNameSpan) deleteNameSpan.textContent = name;
    openModal('deleteModal');
}

window.confirmDelete = async function() {
    if (!currentDeleteId) return;
    
    try {
        await deleteMenuItem(currentDeleteId);
        menuItems = menuItems.filter(i => i.id != currentDeleteId);
        renderMenu();
        updateCategoryTabs();
        showToast('آیتم با موفقیت حذف شد', 'success');
        closeModal('deleteModal');
    } catch (error) {
        console.error(error);
        showToast('خطا در حذف آیتم', 'error');
    }
    currentDeleteId = null;
}

window.openManageCategoriesModal = async function() {
    openModal('manageCategoriesModal');
    await loadCategoriesList();
}

async function loadCategoriesList() {
    const container = document.getElementById('categoriesListContainer');
    container.innerHTML = '<div class="loading-spinner" style="margin: 20px auto;"></div>';
    
    try {
        const result = await getCategories();
        let cats = Array.isArray(result) ? result : (result?.data || []);
        
        const uniqueMap = new Map();
        cats.forEach(cat => {
            if (!uniqueMap.has(cat.name)) {
                uniqueMap.set(cat.name, cat);
            }
        });
        cats = Array.from(uniqueMap.values());
        
        const itemCountMap = {};
        menuItems.forEach(item => {
            const catId = item.category_id;
            itemCountMap[catId] = (itemCountMap[catId] || 0) + 1;
        });
        
        if (cats.length === 0) {
            container.innerHTML = '<div class="empty-state" style="padding: 40px;"><i class="fa-solid fa-folder-open empty-state-icon"></i><p>هیچ دسته‌بندی یافت نشد</p></div>';
            return;
        }
        
        container.innerHTML = cats.map(cat => {
            const itemCount = itemCountMap[cat.id] || 0;
            const itemCountText = itemCount === 0 ? 'بدون آیتم' : `${itemCount} آیتم`;
            const itemCountClass = itemCount === 0 ? 'item-count-zero' : 'item-count-badge';
            
            return `
            <div class="category-manage-item" data-id="${cat.id}">
                <div class="category-info">
                    <div class="category-name">
                        ${escapeHtml(cat.name)}
                        <span class="${itemCountClass}">${itemCountText}</span>
                    </div>
                    <div class="category-meta">
                        <span>🆔 ID: ${cat.id}</span>
                        <span>📊 ترتیب: ${cat.display_order || 0}</span>
                        <span class="category-badge ${cat.is_active == 1 ? '' : 'inactive'}">
                            ${cat.is_active == 1 ? '✓ فعال' : '✗ غیرفعال'}
                        </span>
                    </div>
                </div>
                <div class="category-actions">
                    <button class="edit-cat-btn" onclick="editCategory(${cat.id}, '${escapeHtml(cat.name)}', ${cat.display_order || 0}, ${cat.is_active == 1})" title="ویرایش">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="delete-cat-btn" onclick="deleteCategoryConfirm(${cat.id}, '${escapeHtml(cat.name)}')" title="حذف">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </div>`;
        }).join('');
        
    } catch (error) {
        console.error(error);
        container.innerHTML = '<div class="empty-state" style="padding: 40px;"><i class="fa-solid fa-circle-exclamation empty-state-icon"></i><p>خطا در بارگذاری دسته‌بندی‌ها</p></div>';
    }
}

window.openAddCategoryForm = function() {
    document.getElementById('categoryFormTitle').innerHTML = '<i class="fa-solid fa-folder-plus"></i> افزودن دسته‌بندی';
    document.getElementById('categoryName').value = '';
    document.getElementById('categoryOrder').value = '0';
    document.getElementById('categoryActive').checked = true;
    document.getElementById('editCategoryId').value = '';
    closeModal('manageCategoriesModal');
    openModal('categoryFormModal');
}

window.editCategory = function(id, name, order, isActive) {
    document.getElementById('categoryFormTitle').innerHTML = '<i class="fa-solid fa-pen-to-square"></i> ویرایش دسته‌بندی';
    document.getElementById('categoryName').value = name;
    document.getElementById('categoryOrder').value = order;
    document.getElementById('categoryActive').checked = isActive;
    document.getElementById('editCategoryId').value = id;
    closeModal('manageCategoriesModal');
    openModal('categoryFormModal');
}

window.saveCategory = async function(event) {
    event.preventDefault();
    
    const name = document.getElementById('categoryName').value.trim();
    const display_order = parseInt(document.getElementById('categoryOrder').value) || 0;
    const is_active = document.getElementById('categoryActive').checked ? 1 : 0;
    const editId = document.getElementById('editCategoryId').value;
    
    if (!name) {
        showToast('نام دسته‌بندی الزامی است', 'error');
        return;
    }
    
    try {
        if (editId) {
            await updateCategory(editId, { name, display_order, is_active });
            showToast('دسته‌بندی با موفقیت ویرایش شد', 'success');
        } else {
            await createCategory({ name, display_order, is_active });
            showToast(`دسته‌بندی "${name}" با موفقیت اضافه شد`, 'success');
        }
        
        closeModal('categoryFormModal');
        await loadCategories();
        await loadMenuItemsFromAPI();
        
        const manageModal = document.getElementById('manageCategoriesModal');
        if (manageModal.classList.contains('active')) {
            await loadCategoriesList();
        }
        
    } catch (error) {
        console.error(error);
        showToast('خطا در ذخیره دسته‌بندی', 'error');
    }
}

window.deleteCategoryConfirm = function(id, name) {
    if (confirm(`آیا از حذف دسته‌بندی "${name}" اطمینان دارید؟\nتوجه: آیتم‌های مربوط به این دسته‌بندی حذف نمی‌شوند.`)) {
        deleteCategoryById(id, name);
    }
}

async function deleteCategoryById(id, name) {
    try {
        await deleteCategory(id);
        showToast(`دسته‌بندی "${name}" با موفقیت حذف شد`, 'success');
        
        await loadCategories();
        await loadMenuItemsFromAPI();
        
        const manageModal = document.getElementById('manageCategoriesModal');
        if (manageModal.classList.contains('active')) {
            await loadCategoriesList();
        }
        
    } catch (error) {
        console.error(error);
        showToast('خطا در حذف دسته‌بندی', 'error');
    }
}

function handleKeydown(e) {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal.active').forEach(m => closeModal(m.id));
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInput?.focus();
    }
}
document.addEventListener('keydown', handleKeydown);
window.addEventListener('beforeunload', () => document.removeEventListener('keydown', handleKeydown), { once: true });

window.filterByCategory = filterByCategory;
window.openEditModal = openEditModal;
window.openDeleteModal = openDeleteModal;
window.toggleStatus = toggleStatus;
window.saveItem = saveItem;
window.confirmDelete = confirmDelete;
window.handleImageUpload = handleImageUpload;
window.clearAllFilters = clearAllFilters;
window.debouncedRender = debouncedRender;
window.renderMenu = renderMenu;
window.openManageCategoriesModal = openManageCategoriesModal;
window.openAddCategoryForm = openAddCategoryForm;
window.editCategory = editCategory;
window.saveCategory = saveCategory;
window.deleteCategoryConfirm = deleteCategoryConfirm;

async function init() {
    await loadCategories();
    await loadMenuItemsFromAPI();
}

init();

window.addEventListener('beforeunload', function() {
    history.scrollRestoration = 'auto';
});
