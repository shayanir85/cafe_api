import axios from '../Js/axios/dist/esm/axios.js';

const API_BASE = window.__API_CONFIG__?.apiUrl || 'http://127.0.0.1:8000';
const BaseUrl = `${API_BASE}/api/v1`;

const Api = axios.create({
  baseURL: BaseUrl,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 10000,
});

Api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

Api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;
      const isPublicPage = currentPath.includes('/Html/menu.html') || currentPath.includes('/Html/checkout.html') || currentPath.endsWith('index.html');
      if (!isPublicPage) {
        clearAuth();
        window.location.href = '/FE/Html/login.html';
      }
    }
    return Promise.reject(error);
  }
);

export async function login(Data) {
  try {
    const response = await Api.post('/auth/login', {
      email: Data.email,
      password: Data.password,
    });
  
    const originalData = response.data?.original || response.data;
  
    return originalData;
  } catch (error) {
    console.error(error.response?.data || error.message);
    throw error;
  }
}

export async function logout() {
  try {
    const response = await Api.post('/auth/logout');
    clearAuth();
    return response.data;
  } catch (error) {
    console.error(error.response?.data || error.message);
    throw error;
  }
}

export async function getUser() {
  try {
    const response = await Api.get('/auth/user');
    return response.data;
  } catch (error) {
    console.error(error.response?.data || error.message);
    throw error;
  }
}

export async function getCategoryStatus() {
  try {
    const response = await Api.get('/Dashboard/CategoryStatus');
    return response.data;
  } catch (error) {
    console.error(error.response?.data || error.message);
    throw error;
  }
}

export async function getMenuStatus() {
  try {
    const response = await Api.get('/Dashboard/MenuStatus');
    return response.data;
  } catch (error) {
    console.error(error.response?.data || error.message);
    throw error;
  }
}

export async function getTodayIncome() {
  try {
    const response = await Api.get('/Dashboard/todayIncomeStatus');
    return response.data;
  } catch (error) {
    console.error(error.response?.data || error.message);
    throw error;
  }
}

export async function getMonthIncome() {
  try {
    const response = await Api.get('/Dashboard/monthIncomeStatus');
    return response.data;
  } catch (error) {
    console.error(error.response?.data || error.message);
    throw error;
  }
}

export async function getUserLoginStatus() {
  try {
    const response = await Api.get('/Dashboard/userLoginStatus');
    return response.data;
  } catch (error) {
    console.error(error.response?.data || error.message);
    throw error;
  }
}

export async function getUsers() {
  try {
    const response = await Api.get('/Dashboard/users');
    return response.data;
  } catch (error) {
    console.error(error.response?.data || error.message);
    throw error;
  }
}

export async function updateUser(id, userData) {
  try {
    const response = await Api.put(`/Dashboard/users/${id}`, userData);
    return response.data;
  } catch (error) {
    console.error(error.response?.data || error.message);
    throw error;
  }
}

export async function deleteUser(id) {
  try {
    const response = await Api.delete(`/Dashboard/users/${id}`);
    return response.data;
  } catch (error) {
    console.error(error.response?.data || error.message);
    throw error;
  }
}

export async function createUser(userData) {
  try {
    const response = await Api.post('/Dashboard/users', userData);
    return response.data;
  } catch (error) {
    console.error(error.response?.data || error.message);
    throw error;
  }
}

export async function getCategories() {
  try {
    const response = await Api.get('/category');
    return response.data;
  } catch (error) {
    console.error('Error in getCategories:', error.response?.data || error.message);
    throw error;
  }
}

export async function getCategory(id) {
  try {
    const response = await Api.get(`/Dashboard/admin/category/${id}`);
    return response.data;
  } catch (error) {
    console.error(error.response?.data || error.message);
    throw error;
  }
}

export async function createCategory(categoryData) {
  try {
    const response = await Api.post('/Dashboard/admin/category', categoryData);
    return response.data;
  } catch (error) {
    console.error(error.response?.data || error.message);
    throw error;
  }
}

export async function updateCategory(id, categoryData) {
  try {
    const response = await Api.put(`/Dashboard/admin/category/${id}`, categoryData);
    return response.data;
  } catch (error) {
    console.error(error.response?.data || error.message);
    throw error;
  }
}

export async function deleteCategory(id) {
  try {
    const response = await Api.delete(`/Dashboard/admin/category/${id}`);
    return response.data;
  } catch (error) {
    console.error(error.response?.data || error.message);
    throw error;
  }
}

export async function getMenuItems() {
  try {
    const response = await Api.get('/menu-items');
    return response.data;
  } catch (error) {
    console.error(error.response?.data || error.message);
    throw error;
  }
}

export async function getMenuItem(id) {
  try {
    const response = await Api.get(`/menu-items/${id}`);
    return response.data;
  } catch (error) {
    console.error(error.response?.data || error.message);
    throw error;
  }
}

export async function createMenuItem(menuItemData) {
  try {
    const response = await Api.post('/Dashboard/admin/menu-items', menuItemData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error(error.response?.data || error.message);
    throw error;
  }
}

export async function updateMenuItem(id, menuItemData) {
  try {
    let response;
    
    if (menuItemData instanceof FormData) {
      response = await Api.post(`/Dashboard/admin/menu-items/${id}`, menuItemData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        params: {
          '_method': 'PUT'
        }
      });
    } else {
      response = await Api.put(`/Dashboard/admin/menu-items/${id}`, menuItemData);
    }
    
    return response.data;
  } catch (error) {
    console.error('Update menu item error:', error.response?.data || error.message);
    throw error;
  }
}

export async function patchMenuItem(id, menuItemData) {
  try {
    const response = await Api.patch(`/Dashboard/admin/menu-items/${id}`, menuItemData);
    return response.data;
  } catch (error) {
    console.error(error.response?.data || error.message);
    throw error;
  }
}

export async function deleteMenuItem(id) {
  try {
    const response = await Api.delete(`/Dashboard/menu-items/${id}`);
    return response.data;
  } catch (error) {
    console.error(error.response?.data || error.message);
    throw error;
  }
}

export async function getOrders(filters = {}) {
  try {
    let url = '/Dashboard/admin/orders';
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.date_from) params.append('date_from', filters.date_from);
    if (filters.date_to) params.append('date_to', filters.date_to);
    if (filters.table_number) params.append('table_number', filters.table_number);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    const response = await Api.get(url);
    return response.data;
  } catch (error) {
    console.error(error.response?.data || error.message);
    throw error;
  }
}

export async function updateOrderStatus(id, status) {
  try {
    const response = await Api.patch(`/Dashboard/admin/orders/${id}/status`, { status });
    return response.data;
  } catch (error) {
    console.error(error.response?.data || error.message);
    throw error;
  }
}
export async function createOrder(orderData) {
  try {
    const response = await Api.post('/orders', orderData);
    return response.data;
  } catch (error) {
    console.error(error.response?.data || error.message);
    throw error;
  }
}

export async function resetPass(data) {
  try {
    const response = await Api.post(`/auth/resetPassword`, data);
    return response.data;
  } catch(error) {
    console.error(error.response?.data || error.message);
    throw error;
  }
}


export function getImageUrl(path) {
    if (!path) return null;
    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }
    if (path.startsWith('/')) {
        return `${API_BASE}${path}`;
    }
    if (path.startsWith('storage')) {
        return `${API_BASE}/${path}`;
    }
    return `${API_BASE}/storage/${path}`;
}

export function saveAuthData(data) {
  const token = data.token || data.access_token;
  
  if (!token) {
    console.error('No token found in response');
    return false;
  }
  
  sessionStorage.setItem('access_token', token);
  
  const user = {
    id: data.id || null,
    name: data.name || 'کاربر',
    email: data.email || null,
    role: data.role || 'user',
    phone_number: data.phone_number || null
  };
  
  sessionStorage.setItem('user', JSON.stringify(user));

  
  return true;
}

export function getStoredToken() {
  return sessionStorage.getItem('access_token');
}

export function getStoredUser() {
  const userStr = sessionStorage.getItem('user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

export function isAdmin() {
  const user = getStoredUser();
  if (!user) return false;
  const isAdminRole = user.role === 'admin' || user.role === 'super_admin';
  return isAdminRole;
}

export function isSuperAdmin() {
  const user = getStoredUser();
  if (!user) return false;
  return user.role === 'super_admin';
}

export async function fetchAndValidateUser() {
  const token = getStoredToken();
  
  if (!token) {
    console.error('No token found');
    return null;
  }
  
  try {
    const response = await Api.post('/auth/sanctum/user', {}, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    

    
    const userData = response.data?.user || response.data;
    
    if (userData) {
      sessionStorage.setItem('user', JSON.stringify(userData));
      return userData;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching user:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      clearAuth();
      window.location.href = '/FE/Html/login.html';
    }
    
    return null;
  }
}

export function clearAuth() {
  sessionStorage.removeItem('access_token');
  sessionStorage.removeItem('user');
}