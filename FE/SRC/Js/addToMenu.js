
import { 
    isAdmin, 
    getCategories, 
    createMenuItem,
    getStoredUser 
} from '../Js/api.js';

if (!isAdmin()) {
    window.location.href = 'login.html';
}

const user = getStoredUser();
const isSuper = user?.role === 'super_admin';

const submitBtn = document.getElementById('submitBtn');
const productName = document.getElementById('productName');
const ingredients = document.getElementById('ingredients');
const mainCategory = document.getElementById('mainCategory');
const productPrice = document.getElementById('productPrice');
const itemUnavailable = document.getElementById('itemUnavailable');
const mainImageInput = document.getElementById('mainImage');
const galleryImageInput = document.getElementById('galleryImages');

let mainImageFile = null;
let galleryImageFile = null;

async function loadCategories() {
    try {
        const categories = await getCategories();
        
        if (categories && categories.length > 0) {
            mainCategory.innerHTML = '<option value="">انتخاب کنید...</option>';
            categories.forEach(cat => {
                mainCategory.innerHTML += `<option value="${cat.id}">${cat.name}</option>`;
            });
        } else {
            mainCategory.innerHTML = '<option value="">هیچ دسته‌بندی یافت نشد</option>';
        }
    } catch (error) {
        console.error(error);
        mainCategory.innerHTML = '<option value="">خطا در بارگذاری دسته‌بندی‌ها</option>';
        showToast('خطا در بارگذاری دسته‌بندی‌ها', 'error');
    }
}

window.previewImage = function(input, previewId) {
    const file = input.files[0];
    if (!file) return;
    
    if (input.id === 'mainImage') {
        mainImageFile = file;
    }
    
    const reader = new FileReader();
    reader.onload = e => {
        document.getElementById(previewId).innerHTML = `<img src="${e.target.result}" class="preview-img" alt="Preview">`;
        document.getElementById('previewImageContainer').innerHTML = `<img src="${e.target.result}" alt="Preview">`;
    };
    reader.onerror = () => {
        showToast('خطا در خواندن فایل', 'error');
    };
    reader.readAsDataURL(file);
}

window.previewGallery = function(input) {
    const file = input.files[0];
    if (!file) return;
    
    galleryImageFile = file;
    
    const preview = document.getElementById('galleryPreview');
    const reader = new FileReader();
    reader.onload = e => {
        preview.innerHTML = `<img src="${e.target.result}" class="preview-img" alt="Gallery">`;
    };
    reader.onerror = () => {
        showToast('خطا در خواندن فایل', 'error');
    };
    reader.readAsDataURL(file);
}

productName.addEventListener('input', function() {
    document.getElementById('previewName').textContent = this.value || 'نام محصول';
});

ingredients.addEventListener('input', function() {
    document.getElementById('previewDesc').textContent = this.value || 'مواد اولیه...';
});

productPrice.addEventListener('input', function() {
    const p = this.value ? parseInt(this.value).toLocaleString('fa-IR') : '۱۵۰,۰۰۰';
    document.getElementById('previewPrice').textContent = p + ' تومان';
});

mainCategory.addEventListener('change', function() {
    const selectedText = this.options[this.selectedIndex]?.text || 'دسته‌بندی';
    document.getElementById('previewCategory').textContent = selectedText;
});

window.submitForm = async function() {
    const name = productName.value.trim();
    const price = productPrice.value;
    const category = mainCategory.value;
    
    if (!name) {
        showToast('لطفاً نام محصول را وارد کنید', 'error');
        productName.focus();
        return;
    }
    
    if (!price) {
        showToast('لطفاً قیمت محصول را وارد کنید', 'error');
        productPrice.focus();
        return;
    }
    
    if (!category) {
        showToast('لطفاً دسته‌بندی را انتخاب کنید', 'error');
        mainCategory.focus();
        return;
    }
    
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> در حال ذخیره...';
    
    try {
        const formData = new FormData();
        formData.append('name', name);
        formData.append('price', parseInt(price));
        formData.append('category_id', category);
        formData.append('description', ingredients.value.trim() || '');
        formData.append('is_available', !itemUnavailable.checked ? 1 : 0);
        
        if (mainImageFile) {
            formData.append('image', mainImageFile);
        }
        
        if (galleryImageFile) {
            formData.append('gallery_image', galleryImageFile);
        }
        
        const result = await createMenuItem(formData);

        if (result.success || result.data) {
            showToast('محصول با موفقیت اضافه شد', 'success');
            
            productName.value = '';
            ingredients.value = '';
            productPrice.value = '';
            mainCategory.value = '';
            itemUnavailable.checked = false;
            mainImageFile = null;
            galleryImageFile = null;
            
            document.getElementById('mainPreview').innerHTML = '<i class="fa-solid fa-cloud-arrow-up upload-icon"></i><p class="upload-text">کلیک برای آپلود</p>';
            document.getElementById('galleryPreview').innerHTML = '<i class="fa-solid fa-images upload-icon"></i><p class="upload-text">کلیک برای آپلود</p>';
            document.getElementById('previewImageContainer').innerHTML = '<i class="fa-solid fa-image text-2xl" style="color: rgba(255,255,255,0.15);"></i>';
            document.getElementById('previewName').textContent = 'نام محصول';
            document.getElementById('previewDesc').textContent = 'مواد اولیه...';
            document.getElementById('previewPrice').textContent = '۱۵۰,۰۰۰ تومان';
            document.getElementById('previewCategory').textContent = 'دسته‌بندی';
            mainImageInput.value = '';
            galleryImageInput.value = '';
            
            setTimeout(() => {
                window.location.href = 'menuManagement.html';
            }, 1500);
        } else {
            const errorMsg = result.message || 'خطا در ذخیره محصول';
            showToast(errorMsg, 'error');
        }
    } catch (error) {
        console.error(error);
        const errorMessage = error.response?.data?.message || 
                            error.response?.data?.errors || 
                            error.message || 
                            'خطا در ارتباط با سرور';
        showToast(typeof errorMessage === 'string' ? errorMessage : 'خطا در ذخیره محصول', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
    }
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    document.getElementById('toastMessage').textContent = message;
    document.getElementById('toastIcon').className = 'fa-solid fa-' + (type === 'error' ? 'circle-xmark' : type === 'info' ? 'circle-info' : 'circle-check');
    toast.className = 'toast ' + (type === 'error' ? 'toast-error' : type === 'info' ? 'toast-info' : 'toast-success');
    toast.classList.add('show');
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => toast.classList.remove('show'), 3000);
}

function handleKeydown(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        submitForm();
    }
}
document.addEventListener('keydown', handleKeydown);
window.addEventListener('beforeunload', () => document.removeEventListener('keydown', handleKeydown), { once: true });
loadCategories();
