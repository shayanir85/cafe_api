
import { getOrders, updateOrderStatus, getStoredUser, clearAuth } from '../Js/api.js';

const user = getStoredUser();
if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
    window.location.href = 'login.html';
}

let orders = [];
let currentEditId = null;
let currentDeleteId = null;
let currentStatusId = null;

const statusConfig = {
    pending: { icon: 'fa-clock', badge: 'badge-pending', text: 'در انتظار' },
    preparing: { icon: 'fa-fire', badge: 'badge-preparing', text: 'در حال تهیه' },
    delivered: { icon: 'fa-circle-check', badge: 'badge-delivered', text: 'تحویل شده' },
    cancelled: { icon: 'fa-ban', badge: 'badge-cancelled', text: 'لغو شده' }
};

window.openModal = function(id) { document.getElementById(id).classList.add('active'); }
window.closeModal = function(id) { document.getElementById(id).classList.remove('active'); }

function showToast(msg, type = 'success') {
    const toast = document.getElementById('toast');
    const content = document.getElementById('toastContent');
    const icon = document.getElementById('toastIcon');
    document.getElementById('toastMessage').textContent = msg;

    const isError = type === 'error';
    content.className = `px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 ${isError ? 'bg-red-500' : 'bg-green-500'} text-white`;
    icon.className = `fa-solid ${isError ? 'fa-circle-xmark' : 'fa-circle-check'} text-lg`;

    toast.classList.remove('translate-y-20', 'opacity-0');
    toast.classList.add('translate-y-0', 'opacity-100');
    setTimeout(() => {
        toast.classList.add('translate-y-20', 'opacity-0');
        toast.classList.remove('translate-y-0', 'opacity-100');
    }, 3000);
}

async function loadOrders() {
    try {
        const result = await getOrders();
        let rawOrders = [];
        if (result && result.data && Array.isArray(result.data)) {
            rawOrders = result.data;
        } else if (Array.isArray(result)) {
            rawOrders = result;
        }
        orders = rawOrders;
        renderProducts(orders);
    } catch (error) {
        console.error(error);
        showToast('خطا در بارگذاری سفارشات', 'error');
        orders = [];
        renderProducts(orders);
    }
}

function renderProducts(filteredOrders) {
    const grid = document.getElementById('productsGrid');
    const emptyState = document.getElementById('emptyState');
    const ordersToShow = filteredOrders || orders;

    if (ordersToShow.length === 0) {
        grid.innerHTML = '';
        if (emptyState) emptyState.classList.remove('hidden');
        updateStats(ordersToShow);
        return;
    }

    if (emptyState) emptyState.classList.add('hidden');

    grid.innerHTML = ordersToShow.map(o => {
        const st = statusConfig[o.status] || statusConfig.pending;
        const itemsHtml = (o.items || []).map(item =>
            `${item.name || 'نامشخص'} x${item.quantity || 1}`
        ).join(', ') || 'بدون آیتم';

        return `
        <div class="card-glass fade-in-up">
            <div class="relative p-4">
                <div class="flex items-center justify-between mb-2">
                    <span class="badge ${st.badge}"><i class="fa-solid ${st.icon} ml-1"></i>${st.text}</span>
                    <span class="text-white/40 text-xs"><i class="fa-solid fa-chair ml-1"></i>میز ${o.table_number || '-'}</span>
                </div>
                <div class="flex-1">
                    <h3 class="text-white font-bold mb-1 product-name">سفارش #${o.id}</h3>
                    <p class="text-white/50 text-xs mb-2 line-clamp-2">${itemsHtml}</p>
                    <div class="flex items-center justify-between">
                        <span class="text-white font-bold product-price">${(o.total_price || 0).toLocaleString('fa-IR')} تومان</span>
                        <span class="text-white/30 text-xs">${o.created_at ? new Date(o.created_at).toLocaleDateString('fa-IR') : '-'}</span>
                    </div>
                </div>
            </div>
            <div class="card-actions">
                <button class="action-btn action-status" onclick="openStatusModal(${o.id})"><i class="fa-solid fa-arrows-rotate"></i><span class="hidden sm:inline">وضعیت</span></button>
            </div>
        </div>`;
    }).join('');

    updateStats(ordersToShow);
}

function filterOrders() {
    const search = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const status = document.getElementById('statusFilter')?.value || 'all';
    const table = document.getElementById('tableFilter')?.value || 'all';
    const dateFrom = document.getElementById('dateFrom')?.value || '';
    const dateTo = document.getElementById('dateTo')?.value || '';
    const sort = document.getElementById('sortBy')?.value || 'newest';

    let filtered = [...orders];

    if (search) {
        filtered = filtered.filter(o =>
            String(o.id).includes(search) ||
            (o.items || []).some(item => (item.name || '').toLowerCase().includes(search))
        );
    }
    if (status !== 'all') filtered = filtered.filter(o => o.status === status);
    if (table !== 'all') filtered = filtered.filter(o => String(o.table_number) === table);
    if (dateFrom) filtered = filtered.filter(o => o.created_at && o.created_at >= dateFrom);
    if (dateTo) filtered = filtered.filter(o => o.created_at && o.created_at <= dateTo);

    const sortFns = {
        newest: (a, b) => new Date(b.created_at) - new Date(a.created_at),
        oldest: (a, b) => new Date(a.created_at) - new Date(b.created_at),
        'price-asc': (a, b) => (a.total_price || 0) - (b.total_price || 0),
        'price-desc': (a, b) => (b.total_price || 0) - (a.total_price || 0),
        name: (a, b) => (a.id || 0) - (b.id || 0)
    };
    filtered.sort(sortFns[sort] || sortFns.newest);

    renderProducts(filtered);
}

window.filterOrders = filterOrders;
window.filterProducts = filterOrders;

function resetFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('categoryFilter').value = 'all';
    document.getElementById('statusFilter').value = 'all';
    document.getElementById('tableFilter').value = 'all';
    document.getElementById('dateFrom').value = '';
    document.getElementById('dateTo').value = '';
    document.getElementById('sortBy').value = 'newest';
    renderProducts(orders);
}

window.resetFilters = resetFilters;

function updateStats(data) {
    const el = (id) => document.getElementById(id);
    if (el('totalProducts')) el('totalProducts').textContent = data.length.toLocaleString('fa-IR');
    if (el('pendingCount')) el('pendingCount').textContent = data.filter(o => o.status === 'pending').length.toLocaleString('fa-IR');
    if (el('deliveredCount')) el('deliveredCount').textContent = data.filter(o => o.status === 'delivered').length.toLocaleString('fa-IR');
    if (el('tablesCount')) el('tablesCount').textContent = [...new Set(data.map(o => o.table_number))].length.toLocaleString('fa-IR');
}

function openStatusModal(id) {
    currentStatusId = id;
    const o = orders.find(o => o.id === id);
    if (!o) return;
    document.getElementById('statusProductName').textContent = `سفارش #${o.id}`;
    document.getElementById('statusProductDetails').textContent = `میز ${o.table_number || '-'} | ${(o.total_price || 0).toLocaleString('fa-IR')} تومان`;
    document.querySelectorAll('.status-card-btn').forEach(b => b.classList.remove('selected'));
    const currentBtn = document.getElementById(o.status === 'pending' ? 'statusPendingBtn' : o.status === 'delivered' ? 'statusDeliveredBtn' : null);
    if (currentBtn) currentBtn.classList.add('selected');
    openModal('statusModal');
}

window.openStatusModal = openStatusModal;

window.changeStatusFromModal = async function(newStatus) {
    if (!currentStatusId) return;
    const o = orders.find(o => o.id === currentStatusId);
    if (!o) return;

    try {
        await updateOrderStatus(currentStatusId, newStatus);
        o.status = newStatus;
        filterOrders();
        showToast(`وضعیت سفارش #${o.id} به "${statusConfig[newStatus]?.text || newStatus}" تغییر کرد`);
        closeModal('statusModal');
    } catch (error) {
        console.error(error);
        showToast('خطا در تغییر وضعیت', 'error');
    }
    currentStatusId = null;
}

function handleKeydown(e) {
    if (e.key === 'Escape') {
        ['statusModal', 'deleteModal', 'editModal'].forEach(id => {
            const el = document.getElementById(id);
            if (el && el.classList.contains('active')) closeModal(id);
        });
    }
}
document.addEventListener('keydown', handleKeydown);
window.addEventListener('beforeunload', () => document.removeEventListener('keydown', handleKeydown), { once: true });

document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.addEventListener('click', function(e) {
        if (e.target === this) closeModal(this.id);
    });
});

let searchTimeout;
document.getElementById('searchInput')?.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(filterOrders, 300);
});

loadOrders();