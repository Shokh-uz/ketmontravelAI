// ===================================
// TOUR CARD BUTTON ENHANCEMENTS
// ===================================

// Automatically attach event handlers to all tour card buttons
function initializeTourCardButtons() {
    // Find all tour cards
    const tourCards = document.querySelectorAll('.tour-card-horizontal, .tour-card');

    let booksFixed = 0;
    let asksFixed = 0;

    tourCards.forEach(card => {
        // Get tour information from the card
        const titleEl = card.querySelector('.tour-card-title');
        const priceEl = card.querySelector('.tour-price');

        if (!titleEl || !priceEl) return;

        const tourTitle = titleEl.textContent.trim();
        const tourPrice = priceEl.textContent.trim();

        // Find and fix "Book Now" button
        const bookBtn = card.querySelector('.tour-btn-book');
        if (bookBtn && !bookBtn.onclick) {
            bookBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (typeof openPaymentModal === 'function') {
                    openPaymentModal(tourTitle, tourPrice);
                } else {
                    if (typeof showError === 'function') {
                        showError('Payment system is not available yet');
                    } else {
                        alert('Payment system coming soon!');
                    }
                }
            });
            booksFixed++;
        }

        // Find and fix "Ask" button
        const askBtn = card.querySelector('.tour-btn-consult');
        if (askBtn && !askBtn.onclick) {
            askBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (typeof openChatbot === 'function') {
                    openChatbot(tourTitle, tourPrice);
                } else {
                    if (typeof showInfo === 'function') {
                        showInfo('Chatbot will be available soon!');
                    } else {
                        alert(`Ask about: ${tourTitle} - ${tourPrice}`);
                    }
                }
            });
            asksFixed++;
        }

        // Add hover effect for better UX
        if (bookBtn) {
            bookBtn.addEventListener('mouseenter', () => {
                bookBtn.style.transform = 'translateY(-2px)';
            });
            bookBtn.addEventListener('mouseleave', () => {
                bookBtn.style.transform = 'translateY(0)';
            });
        }

        if (askBtn) {
            askBtn.addEventListener('mouseenter', () => {
                askBtn.style.transform = 'translateY(-2px)';
            });
            askBtn.addEventListener('mouseleave', () => {
                askBtn.style.transform = 'translateY(0)';
            });
        }
    });

    console.log(`✅ Tour card buttons initialized: ${booksFixed} Book buttons, ${asksFixed} Ask buttons`);

    if (typeof showSuccess === 'function' && (booksFixed > 0 || asksFixed > 0)) {
        showSuccess(`${booksFixed + asksFixed} tour buttons are now functional!`, 2000);
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeTourCardButtons);
} else {
    // DOM already loaded
    initializeTourCardButtons();
}
