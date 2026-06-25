import { getStoredUser, clearAuth, getUsers, updateUser, deleteUser, createUser } from '../Js/api.js';
import { initSidebar } from '../Js/sidebar.js';

const currentUser = getStoredUser();
if (!currentUser || currentUser.role !== 'super_admin') {
    window.location.href = currentUser ? 'dashboard.html' : 'login.html';
}

initSidebar({ user: currentUser });

function logoutUser() {
    if (confirm('آیا مطمئن هستید که می‌خواهید خارج شوید؟')) {
        clearAuth();
        window.location.href = 'login.html';
    }
}
document.getElementById('LogoutIconBtn')?.addEventListener('click', logoutUser);
document.getElementById('LogoutMenuBtn')?.addEventListener('click', logoutUser);

let allUsers = [];
let filteredUsers = [];
let currentPage = 1;
const PAGE_SIZE = 10;
let deleteTargetId = null;

const usersRows = document.getElementById('UsersRows');
const skeletonLoader = document.getElementById('SkeletonLoader');
const searchInput = document.getElementById('SearchInput');
const roleFilter = document.getElementById('RoleFilter');
const loginFilter = document.getElementById('LoginFilter');
const refreshBtn = document.getElementById('RefreshBtn');
const editModal = document.getElementById('EditModal');
const deleteConfirm = document.getElementById('DeleteConfirm');
const addAdminModal = document.getElementById('AddAdminModal');
const addAdminBtn = document.getElementById('AddAdminBtn');
const statTotal = document.getElementById('StatTotal');
const statAdmins = document.getElementById('StatAdmins');
const statActive = document.getElementById('StatActive');

const AVATAR_COLORS = [
    ['#3b82f6', '#1d4ed8'], ['#8b5cf6', '#6d28d9'], ['#10b981', '#047857'],
    ['#f59e0b', '#b45309'], ['#ef4444', '#b91c1c'], ['#06b6d4', '#0e7490']
];

function avatarColor(id) {
    return AVATAR_COLORS[(id || 0) % AVATAR_COLORS.length];
}

function formatDate(dateStr) {
    if (!dateStr) return '—';
    try {
        const d = new Date(dateStr);
        const now = new Date();
        const diff = Math.floor((now - d) / 1000);
        if (diff < 60) return 'همین الان';
        if (diff < 3600) return `${Math.floor(diff / 60)} دقیقه پیش`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} ساعت پیش`;
        if (diff < 604800) return `${Math.floor(diff / 86400)} روز پیش`;
        return d.toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' }) +
            ` ساعت ${d.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}`;
    } catch { return '—'; }
}

function formatJoinDate(dateStr) {
    if (!dateStr) return '—';
    try {
        return new Date(dateStr).toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch { return '—'; }
}

function roleLabel(role) {
    if (role === 'super_admin') return { text: 'سوپر ادمین', cls: 'role-super_admin' };
    if (role === 'admin') return { text: 'ادمین', cls: 'role-admin' };
    return { text: 'کاربر', cls: 'role-user' };
}

function showToast(msg, type = 'success') {
    const t = document.createElement('div');
    t.className = `toast toast-${type}`;
    t.innerHTML = `
<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
    ${type === 'success'
            ? '<path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>'
            : '<path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>'}
</svg>
<span>${msg}</span>`;
    document.body.appendChild(t);
    setTimeout(() => {
        t.style.opacity = '0';
        t.style.transform = 'translateY(10px)';
        setTimeout(() => t.remove(), 300);
    }, 3000);
}

async function loadUsers() {
    if (skeletonLoader) skeletonLoader.style.display = 'block';
    if (usersRows) usersRows.innerHTML = '';
    try {
        const data = await getUsers();
        allUsers = Array.isArray(data) ? data : (data?.data || data?.users || []);
        applyFilters();
        updateStats();
    } catch (err) {
        console.error(err);
        if (usersRows) {
            usersRows.innerHTML = `
    <div class="empty-state">
        <svg class="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
        </svg>
        <p class="text-sm">خطا در بارگذاری کاربران</p>
        <p class="text-xs mt-1 opacity-60">${err.message}</p>
    </div>`;
        }
        showToast('خطا در بارگذاری کاربران', 'error');
    } finally {
        if (skeletonLoader) skeletonLoader.style.display = 'none';
    }
}

function updateStats() {
    if (statTotal) statTotal.textContent = allUsers.length;
    if (statAdmins) statAdmins.textContent = allUsers.filter(u => u.role === 'admin' || u.role === 'super_admin').length;
    const yesterday = new Date(Date.now() - 86400000);
    if (statActive) statActive.textContent = allUsers.filter(u => u.last_login && new Date(u.last_login) > yesterday).length;
}

function applyFilters() {
    const search = searchInput.value.trim().toLowerCase();
    const role = roleFilter.value;
    const login = loginFilter.value;
    const now = new Date();

    filteredUsers = allUsers.filter(u => {
        if (search) {
            const name = (u.name || '').toLowerCase();
            const email = (u.email || '').toLowerCase();
            if (!name.includes(search) && !email.includes(search)) return false;
        }
        if (role && u.role !== role) return false;
        if (login) {
            const last = u.last_login ? new Date(u.last_login) : null;
            if (login === 'never' && last) return false;
            if (login === 'today') {
                if (!last) return false;
                const today = new Date(now);
                today.setHours(0, 0, 0, 0);
                if (last < today) return false;
            }
            if (login === 'week') {
                if (!last) return false;
                const weekAgo = new Date(now - 7 * 86400000);
                if (last < weekAgo) return false;
            }
            if (login === 'month') {
                if (!last) return false;
                const monthAgo = new Date(now - 30 * 86400000);
                if (last < monthAgo) return false;
            }
        }
        return true;
    });

    currentPage = 1;
    renderPage();
}

function renderPage() {
    const start = (currentPage - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    const page = filteredUsers.slice(start, end);

    if (filteredUsers.length === 0) {
        if (usersRows) {
            usersRows.innerHTML = `
    <div class="empty-state">
        <svg class="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
        </svg>
        <p class="text-sm">هیچ کاربری یافت نشد</p>
    </div>`;
        }
        const pagInfo = document.getElementById('PaginationInfo');
        const pagBtns = document.getElementById('PaginationBtns');
        if (pagInfo) pagInfo.textContent = '';
        if (pagBtns) pagBtns.innerHTML = '';
        return;
    }

    let html = '';
    
    page.forEach(u => {
        const rl = roleLabel(u.role);
        const [c1, c2] = avatarColor(u.id);
        const initials = (u.name || u.email || '?').slice(0, 2).toUpperCase();
        const isSelf = u.id === currentUser?.id;
        const lastLogin = formatDate(u.last_login);
        const joinDate = formatJoinDate(u.created_at);
        const displayName = u.name || '—';

        html += `
        <div class="md:hidden user-card" data-id="${u.id}">
            <div class="flex items-center gap-3">
                <div class="user-card-avatar" style="background:linear-gradient(135deg,${c1},${c2})">
                    ${initials}
                </div>
                <div class="user-card-info">
                    <div class="user-card-name flex items-center gap-1.5">
                        ${displayName}
                        ${isSelf ? '<span class="text-xs text-blue-400 bg-blue-400/10 px-1.5 py-0.5 rounded-md">شما</span>' : ''}
                    </div>
                    <div class="user-card-email">${u.email || '—'}</div>
                    ${u.phone ? `<div class="user-card-phone">${u.phone}</div>` : ''}
                </div>
            </div>
            <div class="user-card-details">
                <div>
                    <div class="user-card-detail-label">نقش</div>
                    <span class="role-badge ${rl.cls} text-xs">${rl.text}</span>
                </div>
                <div>
                    <div class="user-card-detail-label">آخرین ورود</div>
                    <div class="user-card-detail-value">${lastLogin}</div>
                </div>
                <div class="col-span-2">
                    <div class="user-card-detail-label">تاریخ عضویت</div>
                    <div class="user-card-detail-value">${joinDate}</div>
                </div>
            </div>
            <div class="user-card-actions">
                <button class="btn-action btn-edit edit-btn" data-id="${u.id}">
                    <i class="fa-regular fa-pen-to-square"></i> ویرایش
                </button>
                <button class="btn-action btn-delete delete-btn ${isSelf ? 'opacity-30 cursor-not-allowed' : ''}" 
                    data-id="${u.id}" data-name="${displayName}"
                    ${isSelf ? 'disabled' : ''}>
                    <i class="fa-regular fa-trash-can"></i> حذف
                </button>
            </div>
        </div>
        `;

        html += `
        <div class="hidden md:grid grid-cols-12 gap-2 px-5 py-4 items-center hover:bg-white/5 transition-colors border-b border-white/5 last:border-b-0" data-id="${u.id}">
            <div class="col-span-4 flex items-center gap-3 min-w-0">
                <div class="user-avatar flex-shrink-0" style="background:linear-gradient(135deg,${c1},${c2})">
                    ${initials}
                </div>
                <div class="min-w-0">
                    <div class="text-white font-medium text-sm truncate flex items-center gap-1.5">
                        ${displayName}
                        ${isSelf ? '<span class="text-xs text-blue-400 bg-blue-400/10 px-1.5 py-0.5 rounded-md">شما</span>' : ''}
                    </div>
                    <div class="text-white/40 text-xs truncate mt-0.5">${u.email || '—'}</div>
                    ${u.phone ? `<div class="text-white/30 text-xs truncate">${u.phone}</div>` : ''}
                </div>
            </div>
            <div class="col-span-2">
                <span class="role-badge ${rl.cls}">${rl.text}</span>
            </div>
            <div class="col-span-3 text-white/70 text-sm">${lastLogin}</div>
            <div class="col-span-2 text-white/50 text-sm">${joinDate}</div>
            <div class="col-span-1 flex gap-1 justify-end">
                <button class="btn-action btn-edit p-2 edit-btn" data-id="${u.id}" title="ویرایش">
                    <svg class="w-3.5 h-3.5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                    </svg>
                </button>
                <button class="btn-action btn-delete p-2 delete-btn ${isSelf ? 'opacity-30 cursor-not-allowed' : ''}"
                    data-id="${u.id}" data-name="${displayName}" 
                    ${isSelf ? 'disabled' : ''}
                    title="${isSelf ? 'نمی‌توانید خودتان را حذف کنید' : 'حذف'}">
                    <svg class="w-3.5 h-3.5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                </button>
            </div>
        </div>
        `;
    });

    if (usersRows) usersRows.innerHTML = html;

    usersRows.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', () => openEditModal(parseInt(btn.dataset.id)));
    });

    usersRows.querySelectorAll('.delete-btn:not([disabled])').forEach(btn => {
        btn.addEventListener('click', () => openDeleteConfirm(parseInt(btn.dataset.id), btn.dataset.name));
    });

    const total = filteredUsers.length;
    const pages = Math.ceil(total / PAGE_SIZE);
    const pagInfo = document.getElementById('PaginationInfo');
    const pagBtns = document.getElementById('PaginationBtns');
    
    if (pagInfo) {
        pagInfo.textContent = `نمایش ${start + 1}–${Math.min(end, total)} از ${total} کاربر`;
    }

    if (pagBtns) {
        pagBtns.innerHTML = '';

        const prevBtn = document.createElement('button');
        prevBtn.className = 'page-btn';
        prevBtn.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>';
        prevBtn.disabled = currentPage === 1;
        prevBtn.addEventListener('click', () => { currentPage--; renderPage(); });
        pagBtns.appendChild(prevBtn);

        for (let i = 1; i <= pages; i++) {
            if (pages > 7 && i !== 1 && i !== pages && Math.abs(i - currentPage) > 2) {
                if (i === 2 || i === pages - 1) {
                    const dots = document.createElement('span');
                    dots.className = 'page-btn cursor-default opacity-40';
                    dots.textContent = '…';
                    pagBtns.appendChild(dots);
                }
                continue;
            }
            const pb = document.createElement('button');
            pb.className = `page-btn ${i === currentPage ? 'active' : ''}`;
            pb.textContent = i;
            pb.addEventListener('click', () => { currentPage = i; renderPage(); });
            pagBtns.appendChild(pb);
        }

        const nextBtn = document.createElement('button');
        nextBtn.className = 'page-btn';
        nextBtn.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>';
        nextBtn.disabled = currentPage === pages;
        nextBtn.addEventListener('click', () => { currentPage++; renderPage(); });
        pagBtns.appendChild(nextBtn);
    }
}

function openEditModal(userId) {
    const u = allUsers.find(u => u.id === userId);
    if (!u) return;

    document.getElementById('EditUserId').value = u.id;
    document.getElementById('EditName').value = u.name || '';
    document.getElementById('EditEmail').value = u.email || '';
    document.getElementById('EditPhone').value = u.phone_number || '';
    document.getElementById('EditRole').value = u.role || 'user';
    document.getElementById('EditError').classList.add('hidden');

    editModal.classList.add('open');
}

function closeEditModal() {
    editModal.classList.remove('open');
}

document.getElementById('CloseEditModal')?.addEventListener('click', closeEditModal);
document.getElementById('CancelEditBtn')?.addEventListener('click', closeEditModal);
editModal?.addEventListener('click', e => { if (e.target === editModal) closeEditModal(); });

document.getElementById('EditForm')?.addEventListener('submit', async e => {
    e.preventDefault();

    const id = parseInt(document.getElementById('EditUserId').value);
    const name = document.getElementById('EditName').value.trim();
    const email = document.getElementById('EditEmail').value.trim();
    const phone = document.getElementById('EditPhone').value.trim();
    const role = document.getElementById('EditRole').value;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!name || !email) {
        document.getElementById('EditErrorText').textContent = 'نام و ایمیل الزامی هستند';
        document.getElementById('EditError').classList.remove('hidden');
        return;
    }
    if (!emailRegex.test(email)) {
        document.getElementById('EditErrorText').textContent = 'فرمت ایمیل معتبر نیست';
        document.getElementById('EditError').classList.remove('hidden');
        return;
    }

    document.getElementById('SaveBtnText').textContent = 'در حال ذخیره...';
    document.getElementById('SaveBtnSpinner').classList.remove('hidden');
    document.getElementById('SaveEditBtn').disabled = true;

    try {
        await updateUser(id, { name, email, phone_number: phone, role });
        const idx = allUsers.findIndex(u => u.id === id);
        if (idx !== -1) {
            allUsers[idx] = { ...allUsers[idx], name, email, phone_number: phone, role };
        }
        applyFilters();
        updateStats();
        closeEditModal();
        showToast('کاربر با موفقیت ویرایش شد');
    } catch (err) {
        const msg = err.response?.data?.message || err.message || 'خطا در ذخیره اطلاعات';
        document.getElementById('EditErrorText').textContent = msg;
        document.getElementById('EditError').classList.remove('hidden');
        showToast(msg, 'error');
    } finally {
        document.getElementById('SaveBtnText').textContent = 'ذخیره تغییرات';
        document.getElementById('SaveBtnSpinner').classList.add('hidden');
        document.getElementById('SaveEditBtn').disabled = false;
    }
});

function openAddAdminModal() {
    document.getElementById('AddAdminForm').reset();
    document.getElementById('AddAdminError').classList.add('hidden');
    addAdminModal.classList.add('open');
}

function closeAddAdminModal() {
    addAdminModal.classList.remove('open');
}

addAdminBtn?.addEventListener('click', openAddAdminModal);
document.getElementById('CloseAddAdminModal')?.addEventListener('click', closeAddAdminModal);
document.getElementById('CancelAddAdminBtn')?.addEventListener('click', closeAddAdminModal);
addAdminModal?.addEventListener('click', e => { if (e.target === addAdminModal) closeAddAdminModal(); });

document.getElementById('AddAdminForm')?.addEventListener('submit', async e => {
    e.preventDefault();

    const name = document.getElementById('AddAdminName').value.trim();
    const email = document.getElementById('AddAdminEmail').value.trim();
    const phone = document.getElementById('AddAdminPhone').value.trim();
    const password = document.getElementById('AddAdminPassword').value;
    const confirm = document.getElementById('AddAdminPasswordConfirm').value;

    if (!name || !email || !password) {
        document.getElementById('AddAdminErrorText').textContent = 'نام، ایمیل و رمز عبور الزامی هستند';
        document.getElementById('AddAdminError').classList.remove('hidden');
        return;
    }
    if (password !== confirm) {
        document.getElementById('AddAdminErrorText').textContent = 'رمز عبور و تأیید آن یکسان نیستند';
        document.getElementById('AddAdminError').classList.remove('hidden');
        return;
    }
    if (password.length < 8) {
        document.getElementById('AddAdminErrorText').textContent = 'رمز عبور باید حداقل ۸ کاراکتر باشد';
        document.getElementById('AddAdminError').classList.remove('hidden');
        return;
    }

    document.getElementById('AddAdminBtnText').textContent = 'در حال ایجاد...';
    document.getElementById('AddAdminBtnSpinner').classList.remove('hidden');
    document.getElementById('SaveAddAdminBtn').disabled = true;

    try {
        await createUser({ name, email, phone_number: phone, password, password_confirmation: confirm, role: 'admin' });
        await loadUsers();
        closeAddAdminModal();
        showToast('ادمین با موفقیت ایجاد شد');
    } catch (err) {
        const msg = err.response?.data?.message || err.message || 'خطا در ایجاد ادمین';
        document.getElementById('AddAdminErrorText').textContent = msg;
        document.getElementById('AddAdminError').classList.remove('hidden');
        showToast(msg, 'error');
    } finally {
        document.getElementById('AddAdminBtnText').textContent = 'ایجاد ادمین';
        document.getElementById('AddAdminBtnSpinner').classList.add('hidden');
        document.getElementById('SaveAddAdminBtn').disabled = false;
    }
});

function openDeleteConfirm(userId, userName) {
    deleteTargetId = userId;
    const displayName = userName || 'کاربر ناشناس';
    document.getElementById('DeleteConfirmName').textContent = `«${displayName}» حذف خواهد شد و این عملیات قابل بازگشت نیست.`;
    deleteConfirm.classList.add('open');
}

function closeDeleteConfirm() {
    deleteConfirm.classList.remove('open');
    deleteTargetId = null;
}

document.getElementById('CancelDeleteBtn')?.addEventListener('click', closeDeleteConfirm);
deleteConfirm?.addEventListener('click', e => { if (e.target === deleteConfirm) closeDeleteConfirm(); });

document.getElementById('ConfirmDeleteBtn')?.addEventListener('click', async () => {
    if (!deleteTargetId) return;

    document.getElementById('DeleteBtnText').textContent = 'در حال حذف...';
    document.getElementById('DeleteBtnSpinner').classList.remove('hidden');
    document.getElementById('ConfirmDeleteBtn').disabled = true;

    try {
        await deleteUser(deleteTargetId);
        allUsers = allUsers.filter(u => u.id !== deleteTargetId);
        applyFilters();
        updateStats();
        closeDeleteConfirm();
        showToast('کاربر با موفقیت حذف شد');
    } catch (err) {
        const msg = err.response?.data?.message || err.message || 'خطا در حذف کاربر';
        showToast(msg, 'error');
        closeDeleteConfirm();
    } finally {
        document.getElementById('DeleteBtnText').textContent = 'بله، حذف شود';
        document.getElementById('DeleteBtnSpinner').classList.add('hidden');
        document.getElementById('ConfirmDeleteBtn').disabled = false;
    }
});

let searchDebounce;
searchInput?.addEventListener('input', () => {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(applyFilters, 300);
});
roleFilter?.addEventListener('change', applyFilters);
loginFilter?.addEventListener('change', applyFilters);
refreshBtn?.addEventListener('click', async () => {
    const originalText = refreshBtn.innerHTML;
    refreshBtn.innerHTML = '<svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>';
    refreshBtn.disabled = true;
    try {
        await loadUsers();
    } finally {
        refreshBtn.innerHTML = originalText;
        refreshBtn.disabled = false;
    }
});

function handleKeydown(e) {
    if (e.key === 'Escape') {
        closeEditModal();
        closeDeleteConfirm();
        closeAddAdminModal();
    }
}
document.addEventListener('keydown', handleKeydown);
window.addEventListener('beforeunload', () => document.removeEventListener('keydown', handleKeydown), { once: true });

loadUsers();