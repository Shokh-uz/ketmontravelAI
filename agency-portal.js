// Agency Portal Logic
document.addEventListener('DOMContentLoaded', function () {
    initDashboard();
});

function initDashboard() {
    const navItems = document.querySelectorAll('.nav-item');
    const pageTitle = document.getElementById('page-title');
    const pageSubtitle = document.getElementById('page-subtitle');
    const contentArea = document.getElementById('dashboard-content');

    const pages = {
        overview: {
            title: "Umumiy ko'rinish",
            subtitle: "Xush kelibsiz! Bu yerda sizning faoliyatingiz haqida qisqacha ma'lumot.",
            render: renderOverview
        },
        tours: {
            title: "Mening turlarim",
            subtitle: "Agentligingiz tomonidan yaratilgan barcha faol va arxivlangan turlar.",
            render: renderMyTours
        },
        'add-tour': {
            title: "Yangi tur qo'shish",
            subtitle: "Sayohat paketini yarating va uni saytga joylashtiring.",
            render: renderAddTour
        }
        // Other pages can be added here
    };

    navItems.forEach(item => {
        item.addEventListener('click', function (e) {
            e.preventDefault();
            const pageId = item.dataset.page;

            if (pages[pageId]) {
                // Update active state
                navItems.forEach(i => i.classList.remove('active'));
                item.classList.add('active');

                // Update headers
                pageTitle.innerText = pages[pageId].title;
                pageSubtitle.innerText = pages[pageId].subtitle;

                // Render content
                contentArea.innerHTML = '';
                pages[pageId].render(contentArea);
            } else {
                contentArea.innerHTML = `<div class="empty-state">
                    <h3>Tez kunda...</h3>
                    <p>${item.querySelector('.nav-label').innerText} sahifasi ishlab chiqilmoqda.</p>
                </div>`;
            }
        });
    });

    // Default load
    renderOverview(contentArea);
}

function renderOverview(container) {
    container.innerHTML = `
        <div class="overview-stats">
            <div class="stat-card">
                <div class="stat-icon" style="background: rgba(10, 77, 104, 0.1);">🎫</div>
                <div class="stat-content">
                    <p class="stat-label">Faol turlar</p>
                    <h3 class="stat-value">12</h3>
                    <p class="stat-change positive">+2 bu oy</p>
                </div>
            </div>
            
            <div class="stat-card">
                <div class="stat-icon" style="background: rgba(16, 185, 129, 0.1);">📅</div>
                <div class="stat-content">
                    <p class="stat-label">Jami bronlar</p>
                    <h3 class="stat-value">148</h3>
                    <p class="stat-change positive">+15 bu hafta</p>
                </div>
            </div>
            
            <div class="stat-card">
                <div class="stat-icon" style="background: rgba(245, 158, 11, 0.1);">💰</div>
                <div class="stat-content">
                    <p class="stat-label">Jami daromad</p>
                    <h3 class="stat-value">$24,580</h3>
                    <p class="stat-change positive">+12% vs o'tgan oy</p>
                </div>
            </div>
            
            <div class="stat-card">
                <div class="stat-icon" style="background: rgba(236, 72, 153, 0.1);">⭐</div>
                <div class="stat-content">
                    <p class="stat-label">O'rtacha reyting</p>
                    <h3 class="stat-value">4.8</h3>
                    <p class="stat-change">120 ta sharh</p>
                </div>
            </div>
        </div>

        <div class="dashboard-section">
            <div class="section-header">
                <h2>Yaqinda amalga oshirilgan bronlar</h2>
                <a href="#bookings" class="view-all-link">Barchasini ko'rish →</a>
            </div>
            
            <div class="bookings-table-wrapper">
                <table class="dashboard-table">
                    <thead>
                        <tr>
                            <th>Bron ID</th>
                            <th>Tur nomi</th>
                            <th>Mijoz</th>
                            <th>Sana</th>
                            <th>Summa</th>
                            <th>Holati</th>
                            <th>Amallar</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>#BK-1234</td>
                            <td>Bali Sayohati</td>
                            <td>Ali Valiyev</td>
                            <td>25 Dek, 2024</td>
                            <td>$1,299</td>
                            <td><span class="status-badge confirmed">Tasdiqlangan</span></td>
                            <td><button class="action-btn-small">Ko'rish</button></td>
                        </tr>
                        <tr>
                            <td>#BK-1235</td>
                            <td>Istanbul Turi</td>
                            <td>Lola Karimoova</td>
                            <td>24 Dek, 2024</td>
                            <td>$850</td>
                            <td><span class="status-badge pending">Kutilmoqda</span></td>
                            <td><button class="action-btn-small">Ko'rish</button></td>
                        </tr>
                        <tr>
                            <td>#BK-1236</td>
                            <td>Dubay Shousi</td>
                            <td>Aziz Toshmatov</td>
                            <td>22 Dek, 2024</td>
                            <td>$1,100</td>
                            <td><span class="status-badge cancelled">Bekor qilingan</span></td>
                            <td><button class="action-btn-small">Ko'rish</button></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <div class="quick-actions">
            <div class="action-card" onclick="document.querySelector('[data-page=add-tour]').click()">
                <span class="action-icon">➕</span>
                <h3>Yangi tur qo'shish</h3>
                <p>Yangi sayohat paketini yarating</p>
            </div>
            <div class="action-card">
                <span class="action-icon">📊</span>
                <h3>Analitika</h3>
                <p>Ko'rsatkichlarni tekshiring</p>
            </div>
            <div class="action-card">
                <span class="action-icon">💬</span>
                <h3>Xabarlar</h3>
                <p>5 ta yangi so'rov mavjud</p>
            </div>
        </div>
    `;
}

function renderMyTours(container) {
    container.innerHTML = `
        <div class="tours-management">
            <div class="management-header">
                <div class="search-box">
                    <input type="text" placeholder="Tur qidirish..." id="tour-search">
                </div>
                <button class="btn-primary" onclick="document.querySelector('[data-page=add-tour]').click()">+ Yangi tur</button>
            </div>

            <div class="tours-grid">
                <!-- Tour Card 1 -->
                <div class="manage-tour-card">
                    <div class="tour-img-placeholder">📸</div>
                    <div class="tour-details">
                        <div class="tour-status published">Nashr etilgan</div>
                        <h3>7 kunlik Bali Sarguzashtlari</h3>
                        <p class="tour-meta">📍 Bali, Indoneziya | 💰 $1,299</p>
                        <div class="tour-footer">
                            <div class="tour-stats">
                                <span>👁️ 1.2k</span>
                                <span>📅 45 bron</span>
                            </div>
                            <div class="tour-actions">
                                <button class="action-btn-small">Tahrirlash</button>
                                <button class="action-btn-small">Statistika</button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Tour Card 2 -->
                <div class="manage-tour-card">
                    <div class="tour-img-placeholder">📸</div>
                    <div class="tour-details">
                        <div class="tour-status draft">Qoralama</div>
                        <h3>Istanbul sirlari</h3>
                        <p class="tour-meta">📍 Istanbul, Turkiya | 💰 $850</p>
                        <div class="tour-footer">
                            <div class="tour-stats">
                                <span>👁️ 450</span>
                                <span>📅 0 bron</span>
                            </div>
                            <div class="tour-actions">
                                <button class="action-btn-small">Tahrirlash</button>
                                <button class="action-btn-small">O'chirish</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderAddTour(container) {
    container.innerHTML = `
        <div class="add-tour-container">
            <form id="add-tour-form" class="tour-form">
                <!-- Basic Information -->
                <div class="form-section">
                    <h2 class="section-title">Asosiy ma'lumotlar</h2>
                    <div class="form-group">
                        <label>Tur nomi *</label>
                        <input type="text" name="title" placeholder="Masalan: 7 kunlik Bali Sarguzashtlari" required>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Yo'nalish (Mamlakat) *</label>
                            <select name="country" required>
                                <option value="">Tanlang</option>
                                <option value="UZ">O'zbekiston</option>
                                <option value="TR">Turkiya</option>
                                <option value="AE">BAA</option>
                                <option value="ID">Indoneziya</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Shahar/Hudud *</label>
                            <input type="text" name="city" placeholder="Masalan: Bali" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Qisqa tavsif *</label>
                        <textarea name="short_description" rows="2" placeholder="Sayohat haqida qisqacha (max 200 belgi)" required></textarea>
                    </div>
                </div>

                <!-- Price & Duration -->
                <div class="form-section">
                    <h2 class="section-title">Narx va Davomiylik</h2>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Narxi (USD) *</label>
                            <input type="number" name="price" placeholder="1299" required>
                        </div>
                        <div class="form-group">
                            <label>Davomiyligi (Kun) *</label>
                            <input type="number" name="duration" placeholder="7" required>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Toifa *</label>
                            <select name="category" required>
                                <option value="">Toifani tanlang</option>
                                <option value="beach">🏖️ Sohildagi dam olish</option>
                                <option value="mountain">🏔️ Tog'li sayohat</option>
                                <option value="cultural">🏛️ Madaniy meros</option>
                                <option value="adventure">🎿 Sarguzasht</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Guruh hajmi (Odam)</label>
                            <input type="text" name="group_size" placeholder="Masalan: 10-15">
                        </div>
                    </div>
                </div>

                <!-- Media -->
                <div class="form-section">
                    <h2 class="section-title">Media</h2>
                    <div class="form-group">
                        <label>Asosiy rasm (URL)</label>
                        <input type="text" name="cover_image" placeholder="https://example.com/image.jpg">
                    </div>
                </div>

                <!-- Status -->
                <div class="form-section">
                    <h2 class="section-title">Holat</h2>
                    <div class="form-group">
                        <label class="checkbox">
                            <input type="checkbox" name="is_published" checked>
                            <span>Darhol saytga chiqarish (Nashr qilish)</span>
                        </label>
                    </div>
                </div>

                <div class="form-actions">
                    <button type="button" class="btn-secondary" onclick="document.querySelector('[data-page=overview]').click()">Bekor qilish</button>
                    <button type="submit" class="btn-primary">Turni saqlash</button>
                </div>
            </form>
        </div>
    `;

    document.getElementById('add-tour-form').addEventListener('submit', function (e) {
        e.preventDefault();
        alert('Tur muvaffaqiyatli saqlandi!');
        document.querySelector('[data-page=tours]').click();
    });
}

function logout() {
    if (confirm('Haqiqatdan ham chiqmoqchimisiz?')) {
        window.location.href = 'agency-login.html';
    }
}
