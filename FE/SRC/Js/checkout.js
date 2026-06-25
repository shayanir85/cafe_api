
let cart = JSON.parse(localStorage.getItem('cart')) || [];

function showToast(msg, isSuccess = true) {
    const toast = document.getElementById('toast');
    toast.innerHTML = `<i class="fas ${isSuccess ? 'fa-check-circle' : 'fa-exclamation-circle'}" style="margin-left: 6px; color: ${isSuccess ? '#4ade80' : '#f87171'}"></i>${msg}`;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
    renderCart();
    updateBadge();
}

function updateBadge() {
    const badge = document.getElementById('cartCount');
    if (badge) {
        const total = cart.reduce((s, i) => s + (i.qty || 1), 0);
        badge.innerText = total;
        if (total > 0) badge.classList.add('show');
        else badge.classList.remove('show');
    }
}

window.changeQty = function(id, delta) {
    const item = cart.find(i => i.id === id);
    if (item) {
        item.qty += delta;
        if (item.qty <= 0) {
            cart = cart.filter(i => i.id !== id);
            showToast('محصول حذف شد', false);
        } else {
            showToast(`تعداد: ${item.qty}`);
        }
        saveCart();
    }
}

window.removeItem = function(id) {
    const item = cart.find(i => i.id === id);
    cart = cart.filter(i => i.id !== id);
    saveCart();
    showToast(`${item?.name || 'محصول'} حذف شد`, false);
}

window.clearCart = function() {
    if (cart.length === 0) {
        showToast('هیچ اقلامی یافت نشد', false);
        return;
    }
    cart = [];
    saveCart();
    showToast('همه اقلام حذف شدند', false);
}

window.submitOrder = async function() {
    if (cart.length === 0) {
        showToast('سبد خرید شما خالی است!', false);
        return;
    }

    const submitBtn = document.querySelector('.btn-submit');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> در حال ثبت...';
    }

    try {
        const orderItems = cart.map(item => ({
            menu_item_id: item.id,
            quantity: item.qty,
            price: item.price
        }));

        const { createOrder } = await import('../Js/api.js');
        await createOrder({ items: orderItems });

        showToast('سفارش شما با موفقیت ثبت شد');
        cart = [];
        saveCart();
        setTimeout(() => { window.location.href = 'menu.html'; }, 1500);
    } catch (error) {
        console.error('Order submission error:', error);
        showToast('خطا در ثبت سفارش. لطفاً دوباره تلاش کنید', false);
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-check-circle"></i> ثبت نهایی سفارش';
        }
    }
}

function renderCart() {
    const container = document.getElementById('cartItemsList');
    const countSpan = document.getElementById('itemsCount');
    if (!container) return;

    if (cart.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">
                    <i class="fas fa-shopping-cart"></i>
                </div>
                <h3>هیچ اقلامی یافت نشد</h3>
                <p>هنوز محصولی اضافه نکرده‌اید</p>
                <a href="menu.html">← مشاهده منو</a>
            </div>
        `;
        if (countSpan) countSpan.innerText = '0';
        document.getElementById('subtotalVal').innerText = '0 تومان';
        document.getElementById('totalVal').innerText = '0 تومان';
        return;
    }

    let subtotal = 0;
    let html = '';

    cart.forEach((item, idx) => {
        const itemTotal = item.price * item.qty;
        subtotal += itemTotal;

        html += `
            <div class="cart-item" style="animation: itemSlideIn 0.3s ease forwards; animation-delay: ${idx * 0.05}s">
                <div class="cart-item-img">
                    <img src="${item.img || ''}" loading="lazy" onerror="this.parentElement.innerHTML='<i class=\\'fas fa-mug-hot\\' style=\\'font-size:24px; color:rgba(255,255,255,0.15);\\'></i>'">
                </div>
                <div class="cart-item-info">
                    <div class="cart-item-name">${escapeHtml(item.name)}</div>
                    <div class="cart-item-price">${item.price.toLocaleString('fa-IR')} تومان</div>
                    <div class="cart-item-actions">
                        <button class="qty-btn minus" onclick="changeQty(${item.id}, -1)">−</button>
                        <span class="qty-value">${item.qty}</span>
                        <button class="qty-btn plus" onclick="changeQty(${item.id}, 1)">+</button>
                        <button class="remove-item" onclick="removeItem(${item.id})"><i class="fas fa-trash-alt"></i></button>
                    </div>
                </div>
                <div class="cart-item-total">
                    <span>${itemTotal.toLocaleString('fa-IR')} تومان</span>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
    if (countSpan) countSpan.innerText = cart.reduce((s, i) => s + i.qty, 0);

    const total = subtotal;

    document.getElementById('subtotalVal').innerText = subtotal.toLocaleString('fa-IR') + ' تومان';
    document.getElementById('totalVal').innerText = total.toLocaleString('fa-IR') + ' تومان';
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

document.getElementById('cartBtn')?.addEventListener('click', () => {
    window.location.href = 'checkout.html';
});

document.getElementById('clearCartBtn')?.addEventListener('click', clearCart);

renderCart();
updateBadge();

if (!document.getElementById('checkout-styles')) {
    const style = document.createElement('style');
    style.id = 'checkout-styles';
    style.textContent = `
        @keyframes itemSlideIn {
            from { opacity: 0; transform: translateX(20px); }
            to { opacity: 1; transform: translateX(0); }
        }
    `;
    document.head.appendChild(style);
}
