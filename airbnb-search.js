// Airbnb-Style Search Bar Interactions
(function () {
    'use strict';

    // State management
    const searchState = {
        destination: '',
        checkIn: '',
        checkOut: '',
        adults: 2,
        children: 0,
        infants: 0,
        activeSection: null
    };

    // Initialize search bar
    function initAirbnbSearch() {
        const sections = document.querySelectorAll('.search-section');
        const backdrop = document.querySelector('.search-backdrop');
        const searchButton = document.querySelector('.airbnb-search-button');

        if (!sections.length) {
            console.warn('Airbnb search sections not found');
            return;
        }

        // Section click handlers
        sections.forEach(section => {
            section.addEventListener('click', (e) => {
                e.stopPropagation();
                const sectionType = section.dataset.section;
                toggleSection(sectionType);
            });
        });

        // Backdrop click to close
        if (backdrop) {
            backdrop.addEventListener('click', closeAllSections);
        }

        // Search button click
        if (searchButton) {
            searchButton.addEventListener('click', handleSearch);
        }

        // Guest counter buttons
        initGuestCounters();

        // Destination input
        initDestinationInput();

        // Date inputs
        initDateInputs();

        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeAllSections();
            }
        });
    }

    // Toggle section dropdown
    function toggleSection(sectionType) {
        const section = document.querySelector(`[data-section="${sectionType}"]`);
        const dropdown = document.querySelector(`[data-dropdown="${sectionType}"]`);
        const backdrop = document.querySelector('.search-backdrop');

        if (!section || !dropdown) return;

        // Close other sections
        document.querySelectorAll('.search-section').forEach(s => {
            if (s !== section) s.classList.remove('active');
        });
        document.querySelectorAll('.search-dropdown').forEach(d => {
            if (d !== dropdown) d.classList.remove('active');
        });

        // Toggle current section
        const isActive = section.classList.contains('active');

        if (isActive) {
            section.classList.remove('active');
            dropdown.classList.remove('active');
            backdrop.classList.remove('active');
            searchState.activeSection = null;
        } else {
            section.classList.add('active');
            dropdown.classList.add('active');
            backdrop.classList.add('active');
            searchState.activeSection = sectionType;

            // Focus first input in dropdown
            const firstInput = dropdown.querySelector('input');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 100);
            }
        }
    }

    // Close all sections
    function closeAllSections() {
        document.querySelectorAll('.search-section').forEach(s => s.classList.remove('active'));
        document.querySelectorAll('.search-dropdown').forEach(d => d.classList.remove('active'));
        const backdrop = document.querySelector('.search-backdrop');
        if (backdrop) backdrop.classList.remove('active');
        searchState.activeSection = null;
    }

    // Initialize guest counters
    function initGuestCounters() {
        const guestTypes = ['adults', 'children', 'infants'];

        guestTypes.forEach(type => {
            const decreaseBtn = document.querySelector(`[data-guest-action="decrease-${type}"]`);
            const increaseBtn = document.querySelector(`[data-guest-action="increase-${type}"]`);

            if (decreaseBtn) {
                decreaseBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    updateGuestCount(type, -1);
                });
            }

            if (increaseBtn) {
                increaseBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    updateGuestCount(type, 1);
                });
            }
        });

        updateGuestDisplay();
    }

    // Update guest count
    function updateGuestCount(type, delta) {
        const min = type === 'adults' ? 1 : 0;
        const max = 16;

        searchState[type] = Math.max(min, Math.min(max, searchState[type] + delta));
        updateGuestDisplay();
        updateGuestSectionValue();
    }

    // Update guest counter display
    function updateGuestDisplay() {
        const types = ['adults', 'children', 'infants'];

        types.forEach(type => {
            const countEl = document.querySelector(`[data-guest-count="${type}"]`);
            const decreaseBtn = document.querySelector(`[data-guest-action="decrease-${type}"]`);

            if (countEl) {
                countEl.textContent = searchState[type];
            }

            if (decreaseBtn) {
                const min = type === 'adults' ? 1 : 0;
                decreaseBtn.disabled = searchState[type] <= min;
            }
        });
    }

    // Update guest section value text
    function updateGuestSectionValue() {
        const valueEl = document.querySelector('[data-section="guests"] .section-value');
        if (!valueEl) return;

        const total = searchState.adults + searchState.children;
        const parts = [];

        if (total > 0) {
            parts.push(`${total} guest${total !== 1 ? 's' : ''}`);
        }
        if (searchState.infants > 0) {
            parts.push(`${searchState.infants} infant${searchState.infants !== 1 ? 's' : ''}`);
        }

        if (parts.length > 0) {
            valueEl.textContent = parts.join(', ');
            valueEl.classList.add('has-value');
        } else {
            valueEl.textContent = 'Add guests';
            valueEl.classList.remove('has-value');
        }
    }

    // Initialize destination input
    function initDestinationInput() {
        const input = document.querySelector('[data-destination-input]');
        if (!input) return;

        input.addEventListener('input', (e) => {
            searchState.destination = e.target.value;
            updateDestinationSectionValue();
        });
    }

    // Update destination section value
    function updateDestinationSectionValue() {
        const valueEl = document.querySelector('[data-section="destination"] .section-value');
        if (!valueEl) return;

        if (searchState.destination) {
            valueEl.textContent = searchState.destination;
            valueEl.classList.add('has-value');
        } else {
            valueEl.textContent = 'Search destinations';
            valueEl.classList.remove('has-value');
        }
    }

    // Initialize date inputs
    function initDateInputs() {
        const checkInInput = document.querySelector('[data-date-input="check-in"]');
        const checkOutInput = document.querySelector('[data-date-input="check-out"]');

        if (checkInInput) {
            checkInInput.addEventListener('change', (e) => {
                searchState.checkIn = e.target.value;
                updateDatesSectionValue();
            });
        }

        if (checkOutInput) {
            checkOutInput.addEventListener('change', (e) => {
                searchState.checkOut = e.target.value;
                updateDatesSectionValue();
            });
        }
    }

    // Update dates section value
    function updateDatesSectionValue() {
        const valueEl = document.querySelector('[data-section="dates"] .section-value');
        if (!valueEl) return;

        if (searchState.checkIn && searchState.checkOut) {
            const checkIn = new Date(searchState.checkIn);
            const checkOut = new Date(searchState.checkOut);
            const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));

            valueEl.textContent = `${formatDate(checkIn)} - ${formatDate(checkOut)}`;
            valueEl.classList.add('has-value');
        } else if (searchState.checkIn) {
            valueEl.textContent = `${formatDate(new Date(searchState.checkIn))}`;
            valueEl.classList.add('has-value');
        } else {
            valueEl.textContent = 'Add dates';
            valueEl.classList.remove('has-value');
        }
    }

    // Format date for display
    function formatDate(date) {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${months[date.getMonth()]} ${date.getDate()}`;
    }

    // Handle search submission
    function handleSearch(e) {
        e.preventDefault();
        closeAllSections();

        console.log('Search submitted:', searchState);

        // Trigger existing search logic if available
        if (window.performSearch) {
            window.performSearch(searchState);
        }

        // Show notification
        if (window.showInfo) {
            window.showInfo('Searching for tours...');
        }
    }

    // Expose state getter
    window.getAirbnbSearchState = () => ({ ...searchState });

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAirbnbSearch);
    } else {
        initAirbnbSearch();
    }
})();
