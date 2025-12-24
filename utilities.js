// ===================================
// KETMON PLATFORM UTILITIES
// ===================================

// Show error toast notification
function showError(message, duration = 3000) {
    const toast = document.createElement('div');
    toast.className = 'toast-notification toast-error';
    toast.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
        </svg>
        <span>${message}</span>
    `;

    document.body.appendChild(toast);
    toast.style.animation = 'slideInRight 0.3s ease';

    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// Show success toast notification
function showSuccess(message, duration = 3000) {
    const toast = document.createElement('div');
    toast.className = 'toast-notification toast-success';
    toast.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
        <span>${message}</span>
    `;

    document.body.appendChild(toast);
    toast.style.animation = 'slideInRight 0.3s ease';

    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// Show info toast notification
function showInfo(message, duration = 3000) {
    const toast = document.createElement('div');
    toast.className = 'toast-notification toast-info';
    toast.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
        <span>${message}</span>
    `;

    document.body.appendChild(toast);
    toast.style.animation = 'slideInRight 0.3s ease';

    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// Add button loading state
function setButtonLoading(button, loading = true) {
    if (loading) {
        button.classList.add('btn-loading');
        button.disabled = true;
        button.dataset.originalText = button.textContent;
    } else {
        button.classList.remove('btn-loading');
        button.disabled = false;
        if (button.dataset.originalText) {
            button.textContent = button.dataset.originalText;
        }
    }
}

// Smooth scroll to element
function smoothScrollTo(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return true;
    }
    return false;
}

// Load favorites from localStorage
function loadFavorites() {
    try {
        const favorites = JSON.parse(localStorage.getItem('ketmon_favorites') || '[]');
        return favorites;
    } catch (e) {
        console.error('Error loading favorites:', e);
        return [];
    }
}

// Save favorites to localStorage
function saveFavorites(favorites) {
    try {
        localStorage.setItem('ketmon_favorites', JSON.stringify(favorites));
        return true;
    } catch (e) {
        console.error('Error saving favorites:', e);
        showError('Failed to save favorites');
        return false;
    }
}

// Load cart from localStorage
function loadCart() {
    try {
        const cart = JSON.parse(localStorage.getItem('ketmon_cart') || '[]');
        return cart;
    } catch (e) {
        console.error('Error loading cart:', e);
        return [];
    }
}

// Save cart to localStorage
function saveCart(cart) {
    try {
        localStorage.setItem('ketmon_cart', JSON.stringify(cart));
        return true;
    } catch (e) {
        console.error('Error saving cart:', e);
        showError('Failed to save cart');
        return false;
    }
}

// Format price with currency
function formatPrice(price, currency = 'USD') {
    const symbols = {
        'USD': '$',
        'EUR': '€',
        'RUB': '₽',
        'UZS': 'so\'m'
    };

    const symbol = symbols[currency] || '$';
    const formatted = typeof price === 'number' ? price.toLocaleString() : price;

    return currency === 'UZS' ? `${formatted} ${symbol}` : `${symbol}${formatted}`;
}

// Debounce function for search/filter
function debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Initialize utilities on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ KETMON Utilities loaded');
});
