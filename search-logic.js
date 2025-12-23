/**
 * KETMON Search & Filter Logic
 * Handles advanced search, filtering, and result rendering
 */

const SearchManager = {
    state: {
        destination: '',
        date: '',
        guests: '1',
        priceMin: 0,
        priceMax: 5000,
        duration: null,
        categories: []
    },

    init() {
        // Attach Event Listeners
        document.getElementById('heroSearchBtn')?.addEventListener('click', () => this.handleSearch());

        // Advanced Filter Toggle
        const toggleBtn = document.getElementById('advancedFilterToggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                const panel = document.getElementById('advancedFilterPanel');
                panel.classList.toggle('visible');
                toggleBtn.classList.toggle('active');
            });
        }

        // Real-time price slider update
        const priceInput = document.getElementById('filterPriceRaw');
        if (priceInput) {
            priceInput.addEventListener('input', (e) => {
                const rawVal = e.target.value;
                const displayEl = document.getElementById('filterPriceDisplay');
                if (!displayEl) return;

                // Update data-original-price so subsequent currency switches work
                displayEl.setAttribute('data-original-price', rawVal);

                // Convert and format for immediate display
                // (assuming slider value is always USD)
                if (window.convertPrice && window.formatPrice) {
                    const currentCurrency = localStorage.getItem('ketmon_currency') || 'sum';
                    const converted = window.convertPrice(rawVal, 'usd', currentCurrency);
                    displayEl.textContent = window.formatPrice(converted, currentCurrency);
                } else {
                    displayEl.textContent = `$${rawVal}`;
                }
            });
        }
    },

    async handleSearch() {
        const btn = document.getElementById('heroSearchBtn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<span class="loader-mini"></span> Searching...';
        btn.disabled = true;

        const resultsSection = document.getElementById('searchResultsSection');
        const container = document.getElementById('searchResultsGrid');
        const countDisplay = document.getElementById('resultsCount');

        try {
            // 1. Show Skeletons immediately
            resultsSection.style.display = 'block';
            countDisplay.textContent = 'Searching...';

            // Generate 4 skeletons
            container.innerHTML = Array(4).fill(0).map(() => `
                <div class="skeleton-card">
                    <div class="skeleton-img"></div>
                    <div class="skeleton-content">
                        <div class="skeleton-title skeleton"></div>
                        <div class="skeleton-text skeleton"></div>
                        <div class="skeleton-text short skeleton"></div>
                        <div class="skeleton-footer">
                            <div class="skeleton-price skeleton"></div>
                            <div class="skeleton-btn skeleton"></div>
                        </div>
                    </div>
                </div>
            `).join('');

            window.scrollTo({
                top: resultsSection.offsetTop - 100,
                behavior: 'smooth'
            });

            // 2. Gather Inputs
            this.state.destination = document.getElementById('heroCitySelect').value;
            this.state.date = document.getElementById('heroDateInput').value;
            this.state.guests = document.getElementById('heroGuestsSelect').value;

            // Advanced Filters
            const priceVal = document.getElementById('filterPriceRaw')?.value;
            this.state.priceMax = priceVal ? parseInt(priceVal) : null;

            this.state.duration = document.getElementById('filterDuration')?.value || null;

            const checkedCats = document.querySelectorAll('.filter-cat-checkbox:checked');
            this.state.categories = Array.from(checkedCats).map(cb => cb.value);

            // 3. Fetch Results
            const filters = {
                destination: this.state.destination,
                maxPrice: this.state.priceMax,
            };

            if (this.state.categories.length > 0) {
                filters.category = this.state.categories[0];
            }

            // Artificial delay to show off skeletons (keep it for 600ms minimum)
            // In production, remove this wait
            await new Promise(r => setTimeout(r, 600));

            // Call API
            const results = await window.ketmonApi.tours.getAll(filters);

            // Client-side filtering
            const finalResults = this.filterResultsClientSide(results);

            // 4. Render Actual Results
            this.renderResults(finalResults);

        } catch (error) {
            console.error('Search error:', error);
            showError('Qidiruvda xatolik yuz berdi.');
            countDisplay.textContent = 'Error';
            container.innerHTML = '';
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    },

    filterResultsClientSide(tours) {
        return tours.filter(tour => {
            // Filter by Duration
            if (this.state.duration) {
                const days = tour.durationDays;
                if (this.state.duration === 'short' && days > 3) return false; // 1-3 days
                if (this.state.duration === 'medium' && (days < 4 || days > 7)) return false; // 4-7 days
                if (this.state.duration === 'long' && days < 8) return false; // 8+ days
            }

            // Filter by Multiple Categories
            if (this.state.categories.length > 0) {
                // If API only filtered by one, make sure we check if tour matches ANY of selected
                // (Depends on if API returns everything or specific)
                // Assuming API returns generic list if we didn't pass strict params
                // Simple verify: has to match one of the selected categories
                if (!this.state.categories.includes(tour.category.toLowerCase())) return false;
            }

            return true;
        });
    },

    renderResults(tours) {
        const container = document.getElementById('searchResultsGrid');
        const countDisplay = document.getElementById('resultsCount');

        countDisplay.textContent = `${tours.length} ta sayohat topildi`;

        if (tours.length === 0) {
            container.innerHTML = `
                <div class="no-results-state" style="grid-column: 1/-1; text-align: center; padding: 40px;">
                    <div style="font-size: 48px; margin-bottom: 20px;">🔍</div>
                    <h3>Hech narsa topilmadi</h3>
                    <p>Iltimos, qidiruv parametrlarini o'zgartirib ko'ring.</p>
                    <button class="btn secondary" onclick="document.getElementById('advancedFilterPanel').classList.remove('visible')">Filtrlarni tozalash</button>
                </div>
            `;
            return;
        }

        container.innerHTML = tours.map(tour => {
            const img = tour.images && tour.images.length > 0 ? tour.images[0].imageUrl : 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400';
            return `
                <div class="result-card">
                    <div class="result-img-wrapper">
                        <img src="${img}" alt="${tour.titleUz}" loading="lazy">
                        <span class="result-badge">${tour.category}</span>
                    </div>
                    <div class="result-content">
                        <div class="result-header">
                            <h4>${tour.titleUz}</h4>
                            <div class="result-rating">⭐ ${tour.rating} (${tour.totalReviews})</div>
                        </div>
                        <p class="result-location">📍 ${tour.destinationCity}, ${tour.destinationCountry}</p>
                         <div class="result-meta">
                            <span>⏱️ ${tour.durationDays} kun</span>
                            <span class="tour-price" data-original-price="${tour.pricePerPerson}" data-original-currency="usd">$${tour.pricePerPerson}</span>
                        </div>
                        <div class="result-footer">
                            <div class="result-total">
                                <span class="label">Jami 1 kishi:</span>
                                <span class="val tour-price" data-original-price="${tour.pricePerPerson}" data-original-currency="usd">$${tour.pricePerPerson}</span>
                            </div>
                            <a href="tour-detail.html?id=${tour.id}" class="btn-view-deal">Batafsil</a>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Update prices to current currency
        if (window.updatePrices) {
            const currentCurrency = localStorage.getItem('ketmon_currency') || 'sum';
            window.updatePrices(currentCurrency);
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    SearchManager.init();
});
