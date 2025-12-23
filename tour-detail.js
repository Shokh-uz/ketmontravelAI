/**
 * KETMON Tour Detail Logic
 */

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const tourId = urlParams.get('id');
    const content = document.getElementById('tour-detail-content');

    if (!tourId) {
        window.location.href = 'index.html';
        return;
    }

    try {
        // Show Skeleton
        content.innerHTML = `
            <div class="skeleton-detail-hero skeleton"></div>
            <div class="skeleton-detail-grid">
                <div style="display: flex; flex-direction: column; gap: 20px;">
                    <div class="skeleton-text skeleton" style="height: 40px; width: 70%;"></div>
                    <div class="skeleton-text skeleton" style="height: 20px; width: 40%;"></div>
                    <div class="skeleton-text skeleton" style="height: 200px; width: 100%;"></div>
                </div>
                <div class="skeleton-card">
                    <div class="skeleton-content">
                        <div class="skeleton-text skeleton" style="height: 30px; margin-bottom: 20px;"></div>
                        <div class="skeleton-btn skeleton" style="width: 100%;"></div>
                    </div>
                </div>
            </div>
        `;

        // Artificial delay for smooth feel
        await new Promise(r => setTimeout(r, 600));

        // Fetch tour details from API
        const tour = await window.ketmonApi.tours.getById(tourId);

        // Render UI
        renderTourDetail(tour);
    } catch (error) {
        console.error('Error loading tour:', error);
        content.innerHTML = `
            <div style="text-align: center; padding: 100px 20px;">
                <h2 style="font-size: 32px; margin-bottom: 20px;">Sayohat topilmadi</h2>
                <p style="color: var(--text-secondary); margin-bottom: 30px;">Kechirasiz, ushbu sayohat mavjud emas yoki o'chirib tashlangan.</p>
                <a href="index.html" class="btn-primary" style="padding: 12px 24px; text-decoration: none;">Asosiy sahifaga qaytish</a>
            </div>
        `;
    }
});

function renderTourDetail(tour) {
    const content = document.getElementById('tour-detail-content');
    const lang = localStorage.getItem('ketmon_lang') || 'uz';

    // Translation helpers
    const title = lang === 'uz' ? tour.titleUz : (lang === 'ru' ? tour.titleRu : tour.titleEn) || tour.titleUz;
    const desc = lang === 'uz' ? tour.descriptionUz : (lang === 'ru' ? tour.descriptionRu : tour.descriptionEn) || tour.descriptionUz;
    const price = parseFloat(tour.pricePerPerson).toLocaleString();

    // Images
    const images = tour.images && tour.images.length > 0
        ? tour.images.map(img => img.imageUrl)
        : ['https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200', 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800', 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=800'];

    content.innerHTML = `
        <div class="tour-hero">
            <img src="${images[0]}" class="hero-main-img" alt="${title}">
            <div class="hero-side-imgs">
                <img src="${images[1] || images[0]}" class="side-img" alt="Detail 1">
                <img src="${images[2] || images[0]}" class="side-img" alt="Detail 2">
            </div>
        </div>

        <div class="tour-content-wrapper">
            <div class="tour-info-main">
                <div class="tour-header-info">
                    <h1 class="tour-title">${title}</h1>
                    <div class="tour-meta">
                        <span class="meta-item">📍 ${tour.destinationCity}, ${tour.destinationCountry}</span>
                        <span class="meta-item">⏱️ ${tour.durationDays} kun / ${tour.durationNights} tun</span>
                        <span class="meta-item">⭐ ${tour.rating} (${tour.totalReviews} sharh)</span>
                    </div>
                </div>

                <div class="tour-quick-stats">
                    <div class="stat-box">
                        <span class="stat-val">${tour.category}</span>
                        <span class="stat-lbl">Kategoriya</span>
                    </div>
                    <div class="stat-box">
                        <span class="stat-val">${tour.durationDays}</span>
                        <span class="stat-lbl">Kunlar</span>
                    </div>
                    <div class="stat-box">
                        <span class="stat-val">Barchasi</span>
                        <span class="stat-lbl">Inkluziv</span>
                    </div>
                    <div class="stat-box">
                        <span class="stat-val">Oson</span>
                        <span class="stat-lbl">Daraja</span>
                    </div>
                </div>

                <section class="detail-section">
                    <h2 class="section-title">Sayohat haqida</h2>
                    <p class="description-text">${desc || 'Ushbu sayohat haqida batafsil ma\'lumot tez kunda qo\'shiladi.'}</p>
                </section>

                <section class="detail-section">
                    <h2 class="section-title">Nimalar kiradi?</h2>
                    <ul class="description-text" style="padding-left: 20px;">
                        <li>Parvoz va transferlar</li>
                        <li>4* yoki 5* mehmonxonada yashash</li>
                        <li>Kuniga 3 mahal ovqatlanish</li>
                        <li>Professional gid xizmati</li>
                        <li>Sayohat sug'urtasi</li>
                    </ul>
                </section>

                <section class="detail-section">
                    <h2 class="section-title">Sharhlar</h2>
                    <div id="reviews-container">
                        <p>Sharhlar yuklanmoqda...</p>
                    </div>
                </section>

                <section class="detail-section">
                    <h3 class="section-title" style="font-size: 20px;">Sharh qoldirish</h3>
                    <form id="review-form" class="review-form" style="background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid var(--border-color);">
                        <div style="margin-bottom: 15px;">
                            <label style="display: block; margin-bottom: 5px; font-weight: 500;">Reyting:</label>
                            <select id="review-rating" style="padding: 10px; border-radius: 8px; border: 1px solid #ccc; width: 100px;">
                                <option value="5">⭐⭐⭐⭐⭐ 5</option>
                                <option value="4">⭐⭐⭐⭐ 4</option>
                                <option value="3">⭐⭐⭐ 3</option>
                                <option value="2">⭐⭐ 2</option>
                                <option value="1">⭐ 1</option>
                            </select>
                        </div>
                        <div style="margin-bottom: 15px;">
                            <label style="display: block; margin-bottom: 5px; font-weight: 500;">Izohingiz:</label>
                            <textarea id="review-comment" rows="4" placeholder="Sayohat qanday o'tdi?" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #ccc;"></textarea>
                        </div>
                        <button type="submit" class="btn-primary" id="btn-submit-review">Yuborish</button>
                    </form>
                </section>
            </div>

            <aside class="tour-sidebar">
                <div class="booking-card">
                    <div class="booking-price tour-price" data-original-price="${tour.pricePerPerson}" data-original-currency="usd">$${price}</div>
                    <div class="price-sub">Kishi boshiga</div>
                    
                    <form class="booking-form" id="booking-form">
                        <div class="booking-input-group">
                            <label>Sayohat sanasi</label>
                            <input type="date" id="book-date" required min="${new Date().toISOString().split('T')[0]}">
                        </div>
                        <div class="booking-input-group">
                            <label>Kattalar soni</label>
                            <input type="number" id="book-adults" value="1" min="1" required>
                        </div>
                        <div class="booking-input-group">
                            <label>Bolalar soni</label>
                            <input type="number" id="book-children" value="0" min="0">
                        </div>
                        <button type="submit" class="btn-book-now" id="btn-submit-booking">Bron qilish</button>
                    </form>

                    <hr style="margin: 20px 0; border: none; border-top: 1px solid var(--border-color);">
                    
                    <div class="ask-agency-section">
                        <p style="font-size: 14px; font-weight: 600; margin-bottom: 10px;">Savollaringiz bormi?</p>
                        <textarea id="ask-text" placeholder="Agentlikka savol qoldiring..." style="width: 100%; border-radius: 8px; border: 1px solid var(--border-color); padding: 10px; font-size: 13px; min-height: 80px; margin-bottom: 10px;"></textarea>
                        <button onclick="handleAskAgency('${tour.id}', '${tour.agency.userId}')" class="btn secondary" style="width: 100%; font-size: 13px;">Agentlikdan so'rash</button>
                    </div>
                </div>
            </aside>
        </div>
    `;

    // Load Reviews
    loadReviews(tour.id);

    // Handle Review Submit
    document.getElementById('review-form').addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!window.ketmonApi.auth.isLoggedIn()) {
            showError('Iltimos, sharh qoldirish uchun tizimga kiring.');
            return;
        }

        const btn = document.getElementById('btn-submit-review');
        btn.innerText = 'Yuborilmoqda...';
        btn.disabled = true;

        try {
            await window.ketmonApi.reviews.create({
                tourId: tour.id,
                rating: document.getElementById('review-rating').value,
                comment: document.getElementById('review-comment').value
            });

            showSuccess('Sharhingiz qabul qilindi!');
            document.getElementById('review-form').reset();
            loadReviews(tour.id);
        } catch (error) {
            showError('Sharh yuborishda xatolik.');
        } finally {
            btn.innerText = 'Yuborish';
            btn.disabled = false;
        }
    });

    // Handle Booking Form Submit
    const form = document.getElementById('booking-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!window.ketmonApi.auth.isLoggedIn()) {
            showError('Iltimos, bron qilish uchun tizimga kiring.');
            // Open login modal if we had a reference to it
            return;
        }

        const btn = document.getElementById('btn-submit-booking');
        const originalText = btn.innerText;
        btn.innerText = 'Bron qilinmoqda...';
        btn.disabled = true;

        try {
            const bookingData = {
                tourId: tour.id,
                tourDate: document.getElementById('book-date').value,
                numAdults: document.getElementById('book-adults').value,
                numChildren: document.getElementById('book-children').value
            };

            const response = await window.ketmonApi.bookings.create(bookingData);
            showSuccess(`Muvaffaqiyatli bron qilindi! Reference: ${response.booking.bookingRef}`);

            setTimeout(() => {
                window.location.href = 'profile.html';
            }, 2000);
        } catch (error) {
            showError(error.message || 'Bron qilishda xatolik yuz berdi.');
            btn.innerText = originalText;
            btn.disabled = false;
        }
    });

    // Update prices to current currency
    if (window.updatePrices) {
        const currentCurrency = localStorage.getItem('ketmon_currency') || 'sum';
        window.updatePrices(currentCurrency);
    }
}

/**
 * Handle direct question to agency
 */
async function handleAskAgency(tourId, agencyUserId) {
    if (!window.ketmonApi.auth.isLoggedIn()) {
        showError('Iltimos, savol so\'rash uchun tizimga kiring.');
        return;
    }

    const textArea = document.getElementById('ask-text');
    const text = textArea.value.trim();

    if (!text) {
        showError('Iltimos, xabar matnini kiriting.');
        return;
    }

    try {
        await window.ketmonApi.messages.sendMessage({
            recipientId: agencyUserId,
            text: `[Savol: Sayohat ID ${tourId.substring(0, 5)}] ${text}`
        });
        showSuccess('Savolingiz yuborildi! Agentlik tez orada javob beradi.');
        textArea.value = '';
    } catch (error) {
        showError('Xabar yuborishda xatolik.');
    }
}

async function loadReviews(tourId) {
    const list = document.getElementById('reviews-container');
    try {
        const reviews = await window.ketmonApi.reviews.getForTour(tourId);

        if (reviews.length === 0) {
            list.innerHTML = '<p style="color: var(--text-secondary);">Hali sharhlar yo\'q. Birinchi bo\'lib qoldiring!</p>';
            return;
        }

        list.innerHTML = reviews.map(r => `
            <div style="border-bottom: 1px solid #eee; padding: 15px 0;">
                <div style="display: flex; gap: 10px; margin-bottom: 5px;">
                    <div style="font-weight: 700;">${r.user.name}</div>
                    <div style="color: #f59e0b;">${'⭐'.repeat(r.rating)}</div>
                    <div style="color: #999; font-size: 13px;">${new Date(r.createdAt).toLocaleDateString()}</div>
                </div>
                <p style="color: #333;">${r.comment || ''}</p>
            </div>
        `).join('');
    } catch (error) {
        console.error('Reviews error:', error);
    }
}
