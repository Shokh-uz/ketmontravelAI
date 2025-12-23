/**
 * KETMON Agency Dashboard Logic
 */

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Auth Check
    const user = JSON.parse(localStorage.getItem('ketmon_user'));
    if (!user || user.role !== 'agency') {
        window.location.href = 'index.html';
        return;
    }

    // 2. UI Setup
    document.getElementById('welcome-name').textContent = user.name;
    document.getElementById('agency-name').textContent = user.name;
    document.getElementById('agency-initials').textContent = user.name.charAt(0).toUpperCase();

    // 3. Tab Management
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    const tabs = document.querySelectorAll('.dashboard-tab');

    sidebarLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetTab = link.dataset.tab;

            sidebarLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            tabs.forEach(t => t.classList.remove('active'));
            document.getElementById(`tab-${targetTab}`).classList.add('active');

            // Load data for specific tabs
            if (targetTab === 'tours') loadAgencyTours();
            if (targetTab === 'bookings') loadAgencyBookings();
            if (targetTab === 'messages') loadAgencyConversations();
        });
    });

    // 4. Initial Load (Overview)
    loadOverviewStats();
});

// Load Overview Stats
async function loadOverviewStats() {
    try {
        // Show Skeletons
        document.getElementById('stat-tours').innerHTML = '<div class="skeleton-stat-value skeleton"></div>';
        document.getElementById('stat-bookings').innerHTML = '<div class="skeleton-stat-value skeleton"></div>';
        document.getElementById('stat-revenue').innerHTML = '<div class="skeleton-stat-value skeleton"></div>';
        document.getElementById('recent-bookings-list').innerHTML = `
            <div class="skeleton-list-item"><div class="skeleton-list-content"><div class="skeleton-text skeleton"></div></div></div>
            <div class="skeleton-list-item"><div class="skeleton-list-content"><div class="skeleton-text skeleton"></div></div></div>
        `;

        await new Promise(r => setTimeout(r, 600)); // Artificial delay

        const tours = await window.ketmonApi.tours.getMyTours();
        const bookings = await window.ketmonApi.bookings.getAgencyBookings();

        document.getElementById('stat-tours').textContent = tours.length;
        document.getElementById('stat-bookings').textContent = bookings.length;

        // Calculate Revenue
        const revenue = bookings
            .filter(b => b.status === 'paid' || b.status === 'confirmed')
            .reduce((sum, b) => sum + parseFloat(b.totalPrice), 0);

        document.getElementById('stat-revenue').textContent = `$${revenue.toLocaleString()}`;

        // Render Recent Bookings
        const recentList = document.getElementById('recent-bookings-list');
        if (bookings.length > 0) {
            recentList.innerHTML = bookings.slice(0, 5).map(b => `
                <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f1f5f9;">
                    <span>${b.user.name}</span>
                    <span class="status-pill status-${b.status}">${b.status}</span>
                </div>
            `).join('');
        } else {
            recentList.innerHTML = '<p class="empty-msg">Hali bronlar yo\'q</p>';
        }
    } catch (error) {
        console.error('Stats Error:', error);
    }
}

// Load Agency Tours
async function loadAgencyTours() {
    const container = document.getElementById('tours-list-container');
    container.innerHTML = `
        <div class="skeleton-manage-card"><div class="skeleton-manage-img skeleton"></div><div class="skeleton-manage-content"><div class="skeleton-text skeleton"></div><div class="skeleton-text short skeleton"></div></div></div>
        <div class="skeleton-manage-card"><div class="skeleton-manage-img skeleton"></div><div class="skeleton-manage-content"><div class="skeleton-text skeleton"></div><div class="skeleton-text short skeleton"></div></div></div>
        <div class="skeleton-manage-card"><div class="skeleton-manage-img skeleton"></div><div class="skeleton-manage-content"><div class="skeleton-text skeleton"></div><div class="skeleton-text short skeleton"></div></div></div>
    `;

    try {
        await new Promise(r => setTimeout(r, 600));

        const tours = await window.ketmonApi.tours.getMyTours();

        if (tours.length === 0) {
            container.innerHTML = '<p class="empty-msg">Hali sayohatlar yo\'q. Birinchisini qo\'shing!</p>';
            return;
        }

        container.innerHTML = tours.map(t => {
            const img = t.images && t.images.length > 0 ? t.images[0].imageUrl : 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400';
            const statusClass = t.status === 'published' ? 'status-published' : 'status-pending';

            return `
                <div class="tour-manage-card">
                    <img src="${img}" class="tour-manage-img" alt="${t.titleUz}">
                    <div class="tour-manage-body">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                            <span class="status-pill ${statusClass}">${t.status}</span>
                            <span style="font-weight: 700; color: var(--accent-primary);">$${t.pricePerPerson}</span>
                        </div>
                        <h4 style="margin-bottom: 5px;">${t.titleUz}</h4>
                        <p style="font-size: 13px; color: var(--text-secondary);">${t.destinationCity}, ${t.destinationCountry}</p>
                        <div style="margin-top: 15px; display: flex; gap: 10px;">
                            <button class="btn secondary" style="flex: 1; padding: 6px;">Tahrirlash</button>
                            <button class="btn secondary" style="flex: 1; padding: 6px; color: red;">O'chirish</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        showError('Sayohatlarni yuklashda xatolik.');
    }
}

// Load Agency Bookings
async function loadAgencyBookings() {
    const tableBody = document.getElementById('agency-bookings-table');
    tableBody.innerHTML = `
        <tr class="skeleton-row"><td colspan="7"><div class="skeleton-row-bar skeleton"></div></td></tr>
        <tr class="skeleton-row"><td colspan="7"><div class="skeleton-row-bar skeleton"></div></td></tr>
        <tr class="skeleton-row"><td colspan="7"><div class="skeleton-row-bar skeleton"></div></td></tr>
    `;

    try {
        await new Promise(r => setTimeout(r, 600));

        const bookings = await window.ketmonApi.bookings.getAgencyBookings();

        if (bookings.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px;">Hali bronlar mavjud emas.</td></tr>';
            return;
        }

        tableBody.innerHTML = bookings.map(b => {
            const date = new Date(b.tourDate).toLocaleDateString('uz-UZ');
            const statusClass = b.status === 'paid' ? 'status-published' : 'status-pending';

            return `
                <tr>
                    <td><strong>${b.user.name}</strong><br><small>${b.user.email}</small></td>
                    <td>${b.tour.titleUz}</td>
                    <td>${date}</td>
                    <td>${b.numAdults} + ${b.numChildren}</td>
                    <td>$${b.totalPrice}</td>
                    <td><span class="status-pill ${statusClass}">${b.status}</span></td>
                    <td><button class="btn secondary" onclick="alert('Tez kunda...')">Batafsil</button></td>
                </tr>
            `;
        }).join('');
    } catch (error) {
        showError('Bronlarni yuklashda xatolik.');
    }
}

// Modal Functions
function openCreateTourModal() {
    document.getElementById('tour-modal').style.display = 'flex';
    document.getElementById('tour-form').reset();
    document.getElementById('modal-title').textContent = 'Yangi sayohat qo\'shish';
}

function closeModal() {
    document.getElementById('tour-modal').style.display = 'none';
}

async function handleTourSubmit(e) {
    e.preventDefault();
    const btn = document.getElementById('btn-save-tour');
    btn.innerText = 'Saqlanmoqda...';
    btn.disabled = true;

    try {
        const tourData = {
            titleUz: document.getElementById('t-title-uz').value,
            titleEn: document.getElementById('t-title-en').value,
            titleRu: document.getElementById('t-title-uz').value, // Placeholder for same
            descriptionUz: document.getElementById('t-desc-uz').value,
            descriptionRu: document.getElementById('t-desc-uz').value,
            descriptionEn: document.getElementById('t-desc-uz').value,
            destinationCity: document.getElementById('t-city').value,
            destinationCountry: document.getElementById('t-country').value,
            durationDays: document.getElementById('t-days').value,
            durationNights: parseInt(document.getElementById('t-days').value) - 1,
            pricePerPerson: document.getElementById('t-price').value,
            category: document.getElementById('t-category').value
        };

        await window.ketmonApi.tours.create(tourData);
        showSuccess('Sayohat muvaffaqiyatli saqlandi va tasdiqlash uchun yuborildi.');
        closeModal();
        loadAgencyTours();
    } catch (error) {
        showError(error.message || 'Saqlashda xatolik yuz berdi.');
    } finally {
        btn.innerText = 'Saqlash';
        btn.disabled = false;
    }
}

// MESSAGING SYSTEM
let activePartnerId = null;

async function loadAgencyConversations() {
    const list = document.getElementById('conversations-list');

    // Skeleton
    list.innerHTML = `
        <div class="skeleton-list-item"><div class="skeleton-avatar skeleton"></div><div class="skeleton-list-content"><div class="skeleton-text skeleton"></div><div class="skeleton-text short skeleton"></div></div></div>
        <div class="skeleton-list-item"><div class="skeleton-avatar skeleton"></div><div class="skeleton-list-content"><div class="skeleton-text skeleton"></div><div class="skeleton-text short skeleton"></div></div></div>
    `;

    try {
        await new Promise(r => setTimeout(r, 600));

        const convs = await window.ketmonApi.messages.getConversations();
        if (convs.length === 0) {
            list.innerHTML = '<div style="padding: 20px; text-align:center;">Hali xabarlar yo\'q</div>';
            return;
        }

        list.innerHTML = convs.map(c => `
            <div class="conversation-item ${activePartnerId === c.partner.id ? 'active' : ''}" onclick="selectConversation('${c.partner.id}', '${c.partner.name}')">
                <div class="chat-partner-avatar">${c.partner.name.charAt(0).toUpperCase()}</div>
                <div class="partner-info">
                    <div class="partner-name">${c.partner.name}</div>
                    <div class="last-msg-preview">${c.lastMessage.text}</div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Conv Error:', error);
    }
}

async function selectConversation(partnerId, partnerName) {
    activePartnerId = partnerId;

    // Update UI
    document.querySelectorAll('.conversation-item').forEach(item => item.classList.remove('active'));
    document.getElementById('chat-header').style.display = 'flex';
    document.getElementById('chat-input-area').style.display = 'flex';
    document.getElementById('active-chat-name').textContent = partnerName;
    document.getElementById('active-chat-avatar').textContent = partnerName.charAt(0).toUpperCase();

    loadMessages();
}

async function loadMessages() {
    if (!activePartnerId) return;
    const chatBox = document.getElementById('chat-messages');

    try {
        const messages = await window.ketmonApi.messages.getMessagesWith(activePartnerId);
        const userId = JSON.parse(localStorage.getItem('ketmon_user')).id;

        chatBox.innerHTML = messages.map(m => `
            <div class="msg-bubble ${m.senderId === userId ? 'msg-sent' : 'msg-received'}">
                ${m.text}
                <span class="msg-time">${new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
        `).join('');

        chatBox.scrollTop = chatBox.scrollHeight;
    } catch (error) {
        console.error('Msg Error:', error);
    }
}

async function handleSendMessage() {
    const input = document.getElementById('message-input');
    const text = input.value.trim();
    if (!text || !activePartnerId) return;

    try {
        await window.ketmonApi.messages.sendMessage({
            recipientId: activePartnerId,
            text: text
        });
        input.value = '';
        loadMessages();
        loadAgencyConversations(); // Refresh last message preview
    } catch (error) {
        showError('Xabarni yuborishda xatolik.');
    }
}
