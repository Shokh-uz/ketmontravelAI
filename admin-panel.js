/**
 * KETMON Admin Panel Logic
 */

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Auth & Role Check
    const user = JSON.parse(localStorage.getItem('ketmon_user'));
    if (!user || user.role !== 'admin') {
        window.location.href = 'index.html';
        return;
    }

    // 2. UI Setup
    document.getElementById('admin-name').textContent = user.name;
    document.getElementById('admin-initials').textContent = user.name.charAt(0).toUpperCase();

    // 3. Tab Management
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    const tabs = document.querySelectorAll('.dashboard-tab');

    sidebarLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const targetTab = link.dataset.tab;
            if (!targetTab) return; // For home link

            e.preventDefault();

            sidebarLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            tabs.forEach(t => t.classList.remove('active'));
            document.getElementById(`tab-${targetTab}`).classList.add('active');

            if (targetTab === 'approvals') loadPendingTours();
            if (targetTab === 'overview') loadPlatformStats();
        });
    });

    // 4. Initial Load
    loadPlatformStats();
});

async function loadPlatformStats() {
    try {
        const stats = await window.ketmonApi.admin.getStats();

        document.getElementById('stat-users').textContent = stats.users;
        document.getElementById('stat-agencies').textContent = stats.agencies;
        document.getElementById('stat-tours').textContent = stats.tours;
        document.getElementById('stat-revenue').textContent = `$${parseFloat(stats.revenue).toLocaleString()}`;
    } catch (error) {
        console.error('Stats Error:', error);
    }
}

async function loadPendingTours() {
    const list = document.getElementById('pending-tours-list');
    list.innerHTML = '<div style="padding: 100px; text-align: center;"><p>Yuklanmoqda...</p></div>';

    try {
        const tours = await window.ketmonApi.admin.getPendingTours();

        if (tours.length === 0) {
            list.innerHTML = `
                <div style="padding: 100px; text-align: center; background: white; border-radius: 20px;">
                    <h3>🛡️ Barcha sayohatlar ko'rib chiqilgan</h3>
                    <p style="color: var(--text-secondary);">Hozirda tasdiqlash uchun yangi sayohatlar yo'q.</p>
                </div>
            `;
            return;
        }

        list.innerHTML = tours.map(t => {
            const img = t.images && t.images.length > 0 ? t.images[0].imageUrl : 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400';

            return `
                <div class="tour-review-card">
                    <img src="${img}" class="review-img" alt="${t.titleUz}">
                    <div class="review-info">
                        <h3 style="margin-bottom: 5px;">${t.titleUz}</h3>
                        <p style="color: var(--admin-accent); font-weight: 700; margin-bottom: 5px;">${t.agency.agencyName}</p>
                        <p style="font-size: 14px; color: var(--text-secondary);">${t.destinationCity}, ${t.destinationCountry} - $${t.pricePerPerson}</p>
                        <p style="font-size: 12px; margin-top: 10px; color: #666; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                            ${t.descriptionUz || 'Tavsif yo\'q'}
                        </p>
                    </div>
                    <div class="review-actions">
                        <button class="btn-approve" onclick="handleUpdateStatus('${t.id}', 'published')">Tasdiqlash</button>
                        <button class="btn-reject" onclick="handleUpdateStatus('${t.id}', 'rejected')">Rad etish</button>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        showError('Sayohatlarni yuklashda xatolik.');
    }
}

async function handleUpdateStatus(tourId, status) {
    if (!confirm(`Sayohatni ${status === 'published' ? 'tasdiqlamoqchimisiz' : 'rad etmoqchimisiz'}?`)) return;

    try {
        await window.ketmonApi.admin.updateTourStatus(tourId, status);
        showSuccess(`Sayohat statusi ${status} ga o'zgartirildi.`);
        loadPendingTours();
    } catch (error) {
        showError('Xatolik yuz berdi.');
    }
}
