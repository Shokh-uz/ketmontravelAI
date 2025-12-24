/**
 * KETMON API Service
 * Centralized service for all backend communication
 */

const API_BASE_URL = 'http://localhost:5000/api';

const api = {
    // Helper to get headers
    getHeaders() {
        const token = localStorage.getItem('ketmon_token');
        const headers = {
            'Content-Type': 'application/json'
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        return headers;
    },

    // Generic Request Handler
    async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        const config = {
            ...options,
            headers: {
                ...this.getHeaders(),
                ...options.headers
            }
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Something went wrong');
            }

            return data;
        } catch (error) {
            console.error(`API Error [${endpoint}]:`, error);
            throw error;
        }
    },

    // AUTH ENTITY
    auth: {
        async login(email, password) {
            const data = await api.request('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password })
            });
            if (data.token) {
                localStorage.setItem('ketmon_token', data.token);
                localStorage.setItem('ketmon_user', JSON.stringify(data.user));
            }
            return data;
        },

        async register(userData) {
            const data = await api.request('/auth/register', {
                method: 'POST',
                body: JSON.stringify(userData)
            });
            if (data.token) {
                localStorage.setItem('ketmon_token', data.token);
                localStorage.setItem('ketmon_user', JSON.stringify(data.user));
            }
            return data;
        },

        async getProfile() {
            return api.request('/auth/profile');
        },

        logout() {
            localStorage.removeItem('ketmon_token');
            localStorage.removeItem('ketmon_user');
            window.location.reload();
        },

        isLoggedIn() {
            return !!localStorage.getItem('ketmon_token');
        }
    },

    // TOURS ENTITY
    tours: {
        async getAll(filters = {}) {
            const params = new URLSearchParams(filters).toString();
            return api.request(`/tours?${params}`);
        },

        async getById(id) {
            return api.request(`/tours/${id}`);
        },

        async create(tourData) {
            return api.request('/tours', {
                method: 'POST',
                body: JSON.stringify(tourData)
            });
        },

        async getMyTours() {
            return api.request('/tours/my/all');
        }
    },

    // BOOKINGS ENTITY
    bookings: {
        async create(bookingData) {
            return api.request('/bookings', {
                method: 'POST',
                body: JSON.stringify(bookingData)
            });
        },

        async getMyBookings() {
            return api.request('/bookings/my');
        },

        async getAgencyBookings() {
            return api.request('/bookings/agency');
        }
    },

    // MESSAGES ENTITY
    messages: {
        async sendMessage(messageData) {
            return api.request('/messages', {
                method: 'POST',
                body: JSON.stringify(messageData)
            });
        },

        async getConversations() {
            return api.request('/messages/conversations');
        },

        async getMessagesWith(partnerId) {
            return api.request(`/messages/${partnerId}`);
        }
    },

    // ADMIN ENTITY
    admin: {
        async getPendingTours() {
            return api.request('/admin/pending-tours');
        },

        async updateTourStatus(tourId, status) {
            return api.request(`/admin/tours/${tourId}/status`, {
                method: 'PATCH',
                body: JSON.stringify({ status })
            });
        },

        async getStats() {
            return api.request('/admin/stats');
        }
    },

    // REVIEWS ENTITY
    reviews: {
        async getForTour(tourId) {
            return api.request(`/reviews/tours/${tourId}`);
        },

        async create(reviewData) {
            return api.request('/reviews', {
                method: 'POST',
                body: JSON.stringify(reviewData)
            });
        }
    }
};

// Global export for use in and other scripts
window.ketmonApi = api;

// Auth Helpers for UI
window.setAuthToken = (token) => {
    if (token) {
        localStorage.setItem('ketmon_token', token);
    } else {
        localStorage.removeItem('ketmon_token');
    }
};

window.updateHeaderAuth = () => {
    const user = JSON.parse(localStorage.getItem('ketmon_user'));
    const token = localStorage.getItem('ketmon_token');
    const loginBtns = document.querySelectorAll('.nav-login-btn, [data-text="nav_login"]');
    const userDropdown = document.querySelector('.user-account-dropdown');

    if (token && user) {
        // Logged in state
        loginBtns.forEach(btn => {
            if (btn.tagName === 'A' || btn.tagName === 'BUTTON') {
                btn.style.display = 'none';
            }
        });

        // Find or create user profile button in header
        let profileBtn = document.getElementById('headerProfileBtn');
        if (!profileBtn) {
            const navActions = document.querySelector('.nav-actions');
            if (navActions) {
                profileBtn = document.createElement('div');
                profileBtn.id = 'headerProfileBtn';
                profileBtn.className = 'user-profile-nav';
                profileBtn.innerHTML = `
                    <div class="user-avatar-mini">${user.name.charAt(0).toUpperCase()}</div>
                    <span class="user-name-mini">${user.name.split(' ')[0]}</span>
                    <div class="user-dropdown-menu">
                        <a href="profile.html">Profil</a>
                        ${user.role === 'agency' ? '<a href="agency-dashboard.html">Dashboard</a>' : ''}
                        <a href="#" onclick="window.ketmonApi.auth.logout()">Chiqish</a>
                    </div>
                `;
                navActions.appendChild(profileBtn);
            }
        } else {
            profileBtn.style.display = 'flex';
        }
    } else {
        // Logged out state
        loginBtns.forEach(btn => btn.style.display = 'flex');
        const profileBtn = document.getElementById('headerProfileBtn');
        if (profileBtn) profileBtn.style.display = 'none';
    }
};

// Initialize header on load
document.addEventListener('DOMContentLoaded', () => {
    window.updateHeaderAuth();
});

// Legacy Aliases for script.js compatibility
window.authAPI = {
    login: async (email, password) => {
        const res = await window.ketmonApi.auth.login(email, password);
        return { success: true, ...res };
    },
    registerCustomer: async (data) => {
        const res = await window.ketmonApi.auth.register({ ...data, role: 'customer' });
        return { success: true, ...res };
    },
    registerAgency: async (data) => {
        const res = await window.ketmonApi.auth.register({ ...data, role: 'agency' });
        return { success: true, ...res };
    },
    getProfile: async () => {
        const res = await window.ketmonApi.auth.getProfile();
        return { success: true, ...res };
    }
};

window.tourAPI = {
    getAll: (filters) => window.ketmonApi.tours.getAll(filters),
    getById: (id) => window.ketmonApi.tours.getById(id)
};

window.bookingAPI = {
    create: (data) => window.ketmonApi.bookings.create(data),
    getMyBookings: () => window.ketmonApi.bookings.getMyBookings()
};
