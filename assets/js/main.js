// DigiBridge main.js - handles API calls, auth tokens, utilities

const CONFIG = {
  API_BASE_URL: 'http://localhost',
  API_PORT: 3000,
  TIMEOUT: 10000 // in ms
};

const Utils = {
  showLoading(buttonId, loadingText = 'Loading...') {
    const btn = document.getElementById(buttonId);
    if (!btn) return;
    const text = btn.querySelector('.btn-text') || btn;
    btn.dataset.originalText = text.innerHTML;
    text.innerHTML = `<span class="loading"></span> ${loadingText}`;
    btn.disabled = true;
    btn.classList.add('loading-state');
  },

  hideLoading(buttonId, originalText = null) {
    const btn = document.getElementById(buttonId);
    if (!btn) return;
    const text = btn.querySelector('.btn-text') || btn;
    text.innerHTML = originalText || btn.dataset.originalText || 'Submit';
    btn.disabled = false;
    btn.classList.remove('loading-state');
  },

  showNotification(message, type = 'info', duration = 5000) {
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <span class="notification-message">${message}</span>
        <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      if (notification.parentElement) {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 300);
      }
    }, duration);
  },

  validatePhone(phone) {
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone.trim());
  },

  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
};

const API = {
  getToken() {
    return localStorage.getItem('jwtToken');
  },

  setToken(token) {
    localStorage.setItem('jwtToken', token);
  },

  removeToken() {
    localStorage.removeItem('jwtToken');
  },

  async request(endpoint, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT);

    const token = API.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };
    if (token) {
      headers['Authorization'] = 'Bearer ' + token;
    }

    const fetchOptions = {
      ...options,
      headers,
      signal: controller.signal
    };

    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}:${CONFIG.API_PORT}${endpoint}`, fetchOptions);
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        return await response.text();
      }
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - please check your connection');
      }
      throw error;
    }
  },

  get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  },

  post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
};

const Auth = {
  async saveProfile(profileData) {
    if (!Utils.validateEmail(profileData.email)) {
      throw new Error('Invalid email address');
    }
    if (!Utils.validatePhone(profileData.phone)) {
      throw new Error('Invalid phone number');
    }
    return await API.post('/api/auth/profile', profileData);
  },

  async verifyTOTP(email, token) {
    return await API.post('/api/auth/verify', { email, token });
  },

  logout() {
    API.removeToken();
    window.location.href = '/profile.html';
  }
};

document.addEventListener('DOMContentLoaded', () => {
  // Add event listener to logout button if it exists
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', Auth.logout);
});

window.DigiBridge = { Utils, API, Auth };
