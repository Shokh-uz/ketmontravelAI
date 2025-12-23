
// Header scroll effect
(function () {
    const mainHeader = document.querySelector('.main-header');
    if (mainHeader) {
        let lastScroll = 0;
        window.addEventListener('scroll', function () {
            const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
            if (currentScroll > 50) {
                mainHeader.classList.add('scrolled');
            } else {
                mainHeader.classList.remove('scrolled');
            }
            lastScroll = currentScroll;
        });
    }
})();

// Initialize theme immediately to prevent flash
(function () {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
})();

// Custom smooth scroll function for sections - responsive and smooth
function smoothScrollTo(element, offset = 0, duration = 600) {
    if (!element) return;

    // Stop any ongoing wheel scrolling animation
    if (window.smoothScrollAnimation) {
        cancelAnimationFrame(window.smoothScrollAnimation);
        window.smoothScrollAnimation = null;
    }

    // Stop wheel scrolling if active
    if (window.wheelScrollingActive) {
        window.wheelScrollingActive = false;
        if (window.wheelScrollAnimation) {
            cancelAnimationFrame(window.wheelScrollAnimation);
            window.wheelScrollAnimation = null;
        }
    }

    const startPosition = window.pageYOffset || document.documentElement.scrollTop;
    const elementPosition = element.getBoundingClientRect().top + startPosition;
    const targetPosition = elementPosition - offset;
    const distance = targetPosition - startPosition;

    // If distance is very small, just scroll immediately
    if (Math.abs(distance) < 10) {
        window.scrollTo({ top: targetPosition, behavior: 'auto' });
        return;
    }

    let startTime = null;
    let animationFrameId = null;

    function easeInOutCubic(t) {
        return t < 0.5
            ? 4 * t * t * t
            : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    function animation(currentTime) {
        if (startTime === null) startTime = currentTime;
        const timeElapsed = currentTime - startTime;
        const progress = Math.min(timeElapsed / duration, 1);

        const ease = easeInOutCubic(progress);
        const currentPosition = startPosition + (distance * ease);

        window.scrollTo({
            top: Math.round(currentPosition),
            behavior: 'auto'
        });

        if (progress < 1) {
            animationFrameId = requestAnimationFrame(animation);
            window.smoothScrollAnimation = animationFrameId;
        } else {
            // Ensure we end exactly at target
            window.scrollTo({ top: targetPosition, behavior: 'auto' });
            window.smoothScrollAnimation = null;
        }
    }

    animationFrameId = requestAnimationFrame(animation);
    window.smoothScrollAnimation = animationFrameId;
}

// Make function globally accessible
window.smoothScrollTo = smoothScrollTo;

// Smooth scroll for internal links and section navigation
document.addEventListener('click', function (e) {
    const target = e.target.closest('a[href^="#"]');
    if (!target) return;
    const hash = target.getAttribute('href');
    if (!hash || hash === '#') return;

    const el = document.querySelector(hash);
    if (el) {
        e.preventDefault();
        e.stopPropagation();

        // Get header height for offset (if header is fixed)
        const header = document.querySelector('.main-header');
        const headerHeight = header ? header.offsetHeight : 80;

        // Smooth scroll to section with header offset (faster, more responsive)
        smoothScrollTo(el, headerHeight, 600);
    }
});

// Smooth scrolling for the entire page
(function () {
    // Check if element is in a scrollable container
    function isInScrollableContainer(element) {
        if (!element) return false;
        let parent = element.parentElement;
        while (parent && parent !== document.body) {
            const style = window.getComputedStyle(parent);
            const overflow = style.overflow + style.overflowY + style.overflowX;
            if (overflow.includes('scroll') || overflow.includes('auto')) {
                return true;
            }
            parent = parent.parentElement;
        }
        return false;
    }

    let isScrolling = false;
    let scrollTarget = 0;
    let currentScroll = 0;
    let animationFrame = null;

    // Expose wheel scrolling state for section scrolling to stop it
    window.wheelScrollingActive = false;
    window.wheelScrollAnimation = null;

    function animateScroll() {
        if (!isScrolling) {
            window.wheelScrollingActive = false;
            if (animationFrame) {
                cancelAnimationFrame(animationFrame);
                animationFrame = null;
                window.wheelScrollAnimation = null;
            }
            return;
        }

        window.wheelScrollingActive = true;

        const diff = scrollTarget - currentScroll;

        if (Math.abs(diff) < 0.5) {
            window.scrollTo({ top: scrollTarget, behavior: 'auto' });
            currentScroll = scrollTarget;
            isScrolling = false;
            window.wheelScrollingActive = false;
            if (animationFrame) {
                cancelAnimationFrame(animationFrame);
                animationFrame = null;
                window.wheelScrollAnimation = null;
            }
            return;
        }

        // Smooth interpolation - using exponential easing for natural feel
        const speed = 0.12; // Lower = slower, smoother (0.08-0.15 range works well)
        const step = diff * speed;
        currentScroll += step;

        // Use scrollTo with smooth behavior for better browser optimization
        window.scrollTo({
            top: Math.round(currentScroll),
            behavior: 'auto'
        });

        animationFrame = requestAnimationFrame(animateScroll);
        window.wheelScrollAnimation = animationFrame;
    }

    // Handle mouse wheel scrolling
    let wheelTimeout = null;
    let accumulatedDelta = 0;

    document.addEventListener('wheel', function (e) {
        // Skip if in scrollable container
        if (isInScrollableContainer(e.target)) {
            return;
        }

        // Skip horizontal scrolling
        if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
            return;
        }

        // Skip if scrolling inside input/textarea
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
            return;
        }

        e.preventDefault();
        e.stopPropagation();

        const now = Date.now();
        const delta = e.deltaY;

        // Accumulate small scrolls for smoother experience
        accumulatedDelta += delta;

        // Update scroll target
        scrollTarget += delta * 0.6; // Reduce scroll distance
        scrollTarget = Math.max(0, Math.min(scrollTarget,
            document.documentElement.scrollHeight - window.innerHeight));

        // Start animation if not already running
        if (!isScrolling) {
            currentScroll = window.pageYOffset || document.documentElement.scrollTop;
            isScrolling = true;
            animateScroll();
        }

        // Reset accumulated delta after a pause
        clearTimeout(wheelTimeout);
        wheelTimeout = setTimeout(function () {
            accumulatedDelta = 0;
            // Keep scrolling for a bit after wheel stops for smooth deceleration
            setTimeout(function () {
                if (isScrolling) {
                    isScrolling = false;
                }
            }, 100);
        }, 150);

    }, { passive: false, capture: true });

    // Sync with manual scrolling (scrollbar, keyboard)
    let syncTimeout = null;
    let lastScrollPos = window.pageYOffset || document.documentElement.scrollTop;

    window.addEventListener('scroll', function () {
        const currentPos = window.pageYOffset || document.documentElement.scrollTop;

        // If scroll happened without our animation, sync
        if (!isScrolling && Math.abs(currentPos - lastScrollPos) > 1) {
            clearTimeout(syncTimeout);
            syncTimeout = setTimeout(function () {
                currentScroll = currentPos;
                scrollTarget = currentPos;
            }, 50);
        }

        lastScrollPos = currentPos;
    }, { passive: true });
})();

// Hide/show top bar on scroll for mobile devices
(function () {
    let lastScrollTop = 0;
    let ticking = false;
    const topBar = document.querySelector('.top-bar');

    if (!topBar) return;

    // Only apply on mobile devices
    function isMobile() {
        return window.innerWidth <= 768;
    }

    function handleScroll() {
        if (!isMobile()) {
            topBar.classList.remove('hidden');
            return;
        }

        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

        // Show top bar when at the top of the page
        if (scrollTop <= 10) {
            topBar.classList.remove('hidden');
            lastScrollTop = scrollTop;
            ticking = false;
            return;
        }

        // Hide top bar when scrolling down, show when scrolling up
        if (scrollTop > lastScrollTop && scrollTop > 100) {
            // Scrolling down
            topBar.classList.add('hidden');
        } else {
            // Scrolling up
            topBar.classList.remove('hidden');
        }

        lastScrollTop = scrollTop;
        ticking = false;
    }

    window.addEventListener('scroll', function () {
        if (!ticking) {
            window.requestAnimationFrame(handleScroll);
            ticking = true;
        }
    }, { passive: true });

    // Show top bar on window resize if switching from desktop to mobile
    window.addEventListener('resize', function () {
        if (!isMobile()) {
            topBar.classList.remove('hidden');
        }
    });
})();

// Theme Toggle Functionality
(function () {
    // Get theme from localStorage or default to light
    function getTheme() {
        return localStorage.getItem('theme') || 'light';
    }

    // Set theme
    function setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        updateThemeIcons(theme);
    }

    // Update theme toggle button icons
    function updateThemeIcons(theme) {
        const toggleTopBar = document.getElementById('topBarThemeToggle');
        if (toggleTopBar) {
            const thumb = toggleTopBar.querySelector('.theme-toggle-thumb');
            if (thumb) {
                // Sun icon for light mode, moon icon for dark mode
                if (theme === 'light') {
                    thumb.innerHTML = `
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="5"></circle>
                            <line x1="12" y1="1" x2="12" y2="3"></line>
                            <line x1="12" y1="21" x2="12" y2="23"></line>
                            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                            <line x1="1" y1="12" x2="3" y2="12"></line>
                            <line x1="21" y1="12" x2="23" y2="12"></line>
                            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                        </svg>
                    `;
                } else {
                    thumb.innerHTML = `
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="#fbbf24">
                            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                        </svg>
                    `;
                }
            }
        }
    }

    // Toggle theme
    function toggleTheme() {
        const currentTheme = getTheme();
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
    }

    // Initialize theme on page load
    document.addEventListener('DOMContentLoaded', function () {
        const savedTheme = getTheme();
        setTheme(savedTheme);

        // Add event listeners to toggle buttons (top bar only)
        const toggleTopBar = document.getElementById('topBarThemeToggle');

        if (toggleTopBar) {
            toggleTopBar.addEventListener('click', toggleTheme);
        }
    });
})();


// Language switcher (minimal demo)
(function () {
    var i18n = {
        uz: {
            phone: "+998 93 301 52 18",
            email: "info@ketmon.uz",
            nav_home: "Bosh sahifa",
            nav_calculator: "Smart Kalkulyator",
            hero_try_calculator: "🧮 Smart Kalkulyatorni sinab ko'ring",
            nav_destinations: "Yo'nalishlar",
            nav_services: "Xizmatlar",
            nav_about: "Biz haqimizda",
            nav_contact: "Aloqa",
            nav_book: "Bron qilish",
            nav_login: "Kirish",
            nav_register: "Ro'yxatdan o'tish",
            login_email_label: "Email",
            login_email_placeholder: "you@example.com",
            login_password_label: "Parol",
            login_password_placeholder: "â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢",
            register_switch: "Ro'yxatdan o'tish",
            register_role_label: "Ro'l tanlang",
            register_customer_tab: "Mijoz",
            register_agency_tab: "Agentlik",
            register_name_label: "Ism",
            register_name_placeholder: "Ismingiz",
            register_email_label: "Email",
            register_email_placeholder: "you@example.com",
            register_password_label: "Parol",
            register_password_placeholder: "â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢",
            register_agency_name_label: "Agentlik nomi",
            register_agency_name_placeholder: "Agentlik nomi",
            register_license_label: "Litsenziya raqami",
            register_license_placeholder: "ABC-123456",
            register_agency_email_label: "Agentlik Email",
            register_agency_email_placeholder: "agency@example.com",
            register_agency_phone_label: "Telefon",
            register_agency_phone_placeholder: "+998 xx xxx xx xx",
            register_agency_password_label: "Parol",
            register_agency_password_placeholder: "â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢",
            register_submit: "Yaratish",
            hero_title: "100+ Ishonchli Agentliklardan Turlarni Solishtiring va Bron Qiling",
            hero_subtitle: "Yagona platforma. Barcha yo'nalishlar. Eng yaxshi narxlar kafolatlangan.",
            hero_btn1: "Yo'nalishlarni Ko'rish",
            hero_btn2: "Maslahat Olish",
            tour_consult_btn: "Maslahat olish",
            search_title: "Qayerga bormoqchisiz? 🌍",
            search_destination: "Yo'nalish",
            search_destination_placeholder: "Qayerga bormoqchisiz?",
            search_date: "Sana",
            search_date_label: "Qachon? 📅",
            search_guests_label: "Sayyohlar 👥",
            search_duration: "Davomiyligi",
            duration_3: "3 kun",
            duration_7: "7 kun",
            duration_14: "14 kun",
            duration_custom: "Boshqa",
            search_agency: "Agentlik",
            agency_select_all: "Barcha agentliklar",
            agency_section_title: "Hamkor Agentliklar",
            agency_section_subtitle: "Eng ishonchli sayohat hamkorlarini tanlang",
            agency_filter_all: "Barcha hamkorlar",
            agency_filter_local: "O'zbek sayyohlari uchun",
            agency_filter_global: "Xorijiy sayyohlar uchun",
            agency_badge_verified: "Tasdiqlangan",
            agency_view_tours: "Agentlik turlarini ko'rish",
            license_title: "Sayohat Agentligi Litsenziyasi",
            license_verified: "Tasdiqlangan sayohat agentligi",
            license_number: "Litsenziya raqami:",
            license_issued: "Berilgan sana:",
            license_expires: "Amal qilish muddati:",
            license_authority: "Bergan organ:",
            license_status: "Holati:",
            license_active: "Faol",
            license_note: "Ushbu litsenziya O'zbekiston Respublikasi Turizm va madaniy meros vazirligi tomonidan berilgan va tasdiqlangan. Agentlik barcha qonuniy talablarga javob beradi.",
            agency_atlas_name: "Atlas Travel",
            agency_atlas_desc: "Markaziy Osiyodan dunyoning 40+ manziliga premium paketlar va VIP xizmatlar.",
            agency_samarqand_name: "Samarqand Tours",
            agency_samarqand_desc: "Madaniy sayohatlar, tarixiy gidlar va mahalliy tajribalar bo'yicha mutaxassis.",
            agency_nomad_name: "Nomad Explorer",
            agency_nomad_desc: "Aktiv sayohatlar, tog' yurishlari va ekologik turizm bo'yicha mutaxassis.",
            agency_silk_name: "Silk Road Elite",
            agency_silk_desc: "Luks mehmonxonalar, TNPL rejalar va shaxsiy gidlar bilan premium xizmat.",
            agency_clubtravel_name: "ClubTravel UZ",
            agency_clubtravel_desc: "Oila va guruhlar uchun hamyonbop paketlar, Toshkentdan charter reyslar.",
            agency_azialux_name: "AziaLux Travel",
            agency_azialux_desc: "Osiyo va Yevropadagi eksklyuziv gastro-turlar, premium servis va gidlar.",
            agency_globalvoyage_name: "Global Voyage Hub",
            agency_globalvoyage_desc: "Xalqaro konferensiya va MICE turlar, 24/7 qo'llab-quvvatlash va viza xizmati.",
            about_title: "KETMON haqida",
            about_subtitle: "Markaziy Osiyoning eng ishonchli sayohat marketpleysida agentliklar va sayohatchilar birlashadi.",
            about_story_title: "Missiyamiz",
            about_story_body1: "Ketmon qadriyatlaridan ilhomlanib, biz doimo mehnatsevarlik va taraqqiyot ramzini xizmatlarimiz markaziga qo'yamiz.",
            about_story_body2: "Platformamizda tasdiqlangan agentliklar, shaffof narxlar va TNPL imkoniyatlari yordamida sayohatchilar vaqtini va byudjetini tejashadi.",
            about_bullet_network: "Hamkorlarimiz real vaqt rejimida paketlarni yangilaydi va video-reels orqali yo'nalishlarni jonlantiradi.",
            about_bullet_support: "24/7 yordam, integratsiyalangan chat va Telegram bildirishnomalari bilan agentliklar mijozlar bilan tezkor aloqa qiladi.",
            about_bullet_ai: "AI tavsiyalari shaxsiylashgan marshrutlarni taklif etib, sayohatchilarga tez qaror qabul qilishga yordam beradi.",
            about_stat_partners_value: "120+",
            about_stat_partners_label: "hamkor agentliklar",
            about_stat_tours_value: "650+",
            about_stat_tours_label: "faol tur paketlar",
            about_stat_travelers_value: "45k+",
            about_stat_travelers_label: "mamnun sayohatchilar",
            about_stat_languages_value: "3",
            about_stat_languages_label: "tilda qo'llab-quvvatlash",
            contact_title: "Aloqada bo'laylik",
            contact_subtitle: "Savol va takliflaringizni qoldiring â€” jamoamiz 24/7 yordam beradi.",
            contact_info_title: "Nega KETMON?",
            contact_info_body: "Ketmon orqali siz tasdiqlangan agentliklar bilan ishlaysiz, narxlarni solishtirasiz va TNPL orqali to'lovlarni bo'lib-bo'lib amalga oshirasiz. Mijozlar va agentliklar uchun yagona panel barcha jarayonlarni bir joyga jamlaydi.",
            contact_phone_label: "Telefon",
            contact_phone_value: "+998 90 765 43 21",
            contact_email_label: "Email",
            contact_email_value: "support@ketmon.uz",
            contact_address_label: "Manzil",
            contact_address_value: "Toshkent, Navoiy ko'chasi 12, KETMON HUB",
            contact_form_name_label: "Ism",
            contact_form_name_placeholder: "Ismingiz",
            contact_form_email_label: "Email",
            contact_form_email_placeholder: "you@example.com",
            contact_form_message_label: "Xabar",
            contact_form_message_placeholder: "Savolingizni yozing...",
            contact_submit_btn: "Yuborish",
            fav_title: "Saralanganlar",
            fav_clear: "Tozalash",
            fav_empty: "Xozircha bo'sh",
            cart_title: "Savatcha",
            cart_clear: "Tozalash",
            cart_empty: "Savatcha bo'sh",
            cart_total: "Jami:",
            cart_checkout: "Rasmiylashtirish",
            compare_similar: "O'xshashlarni solishtirish",
            cart_cancel_24h: "24 soat ichida bepul bekor qilish",
            btn_view_all: "Barchasini ko'rish",
            cat_luxury: "Lyuqs",
            cat_cultural: "Madaniy",
            cat_wellness: "Sog'lomlashtirish",
            cat_winter: "Qishki",
            calc_subtitle: "Hamyoningizga mos turni toping",
            calc_min_price: "Minimal narx",
            calc_max_price: "Maksimal narx",
            calc_category: "Sayohat uslubi",
            calc_show_results: "Turlarni ko'rsatish",
            dest_antalya: "Antalya",
            dest_baku: "Boku",
            dest_fergana: "Farg'ona",
            dest_kuala_lumpur: "Kuala-Lumpur",
            dest_london: "London",
            dest_paris: "Parij",
            dest_seoul: "Seul",
            dest_tokyo: "Tokio",
            contact_status_placeholder: "Yuborilgan xabarlarimizga odatda 30 daqiqada javob beramiz.",
            contact_success_message: "Xabaringiz qabul qilindi! Tez orada siz bilan bog'lanamiz.",
            contact_error_message: "Iltimos, barcha maydonlarni to'liq kiriting.",
            calc_title: "Narx, baho, so'm",
            calc_clear: "Tozalash",
            calc_from: "dan",
            calc_before: "oldin",
            search_guests: "Odamlar soni",
            search_btn: "Qidirish",
            late_escape_title: "Yaxshi vaqt o'tkazish, uzoq emas",
            late_escape_subtitle: "Yozning oxirgi kunlarini kamida 15% chegirma bilan foydalaning",
            late_escape_btn: "Topish",
            trending_title: "Trend yo'nalishlar",
            trending_subtitle: "O'zbekiston sayohatchilari uchun eng mashhur tanlovlar",
            explore_uz_title: "O'zbekistanni kashf eting",
            explore_uz_subtitle: "Bu mashhur yo'nalishlar ko'p narsa taklif qiladi",
            explore_properties: "ob'ektlar",
            property_type_title: "Ob'ekt turi bo'yicha qidiruv",
            property_hotels: "Mehmonxonalar",
            property_apartments: "Kvartiralar",
            property_resorts: "Kurortlar",
            property_villas: "Villalar",
            trip_planner_title: "Tez va oson sayohat rejalashtiruvchi",
            trip_planner_subtitle: "Mavzuni tanlang va O'zbekistondagi eng yaxshi yo'nalishlarni kashf eting",
            trip_festivals: "Festivallar",
            trip_shopping: "Sotib olish va hunarmandchilik",
            trip_gastronomic: "Gastronomik sayohatlar",
            trip_cultural: "Madaniy tadqiqot",
            trip_architecture: "Arxitektura turlari",
            trip_historical: "Tarixiy joylar",
            weekend_deals_title: "Dam olish kunlari uchun takliflar",
            weekend_deals_subtitle: "14-16 noyabr kunlari uchun yashash joylarida tejang",
            dest_tashkent: "Toshkent",
            dest_samarkand: "Samarqand",
            dest_istanbul: "Istanbul",
            dest_bukhara: "Buxoro",
            dest_dubai: "Dubai",
            dest_khiva: "Xiva",
            dest_chimgan: "Chimgan",
            dest_fergana: "Farg'ona",
            dest_kokand: "Qo'qon",
            explore_tashkent_props: "1,409 ob'ektlar",
            explore_samarkand_props: "914 ob'ektlar",
            explore_bukhara_props: "587 ob'ektlar",
            explore_khiva_props: "163 ob'ektlar",
            explore_chimgan_props: "20 ob'ektlar",
            explore_fergana_props: "46 ob'ektlar",
            trip_tashkent_distance: "7 km uzoqlikda",
            trip_kokand_distance: "165 km uzoqlikda",
            trip_fergana_distance: "237 km uzoqlikda",
            trip_samarkand_distance: "262 km uzoqlikda",
            trip_bukhara_distance: "438 km uzoqlikda",
            trip_khiva_distance: "739 km uzoqlikda",
            deal_premium_hotel: "Premium mehmonxona",
            deal_luxury_apartment: "Luks kvartira",
            deal_resort_stay: "Kurort mehmonxonasi",
            deal_villa_retreat: "Villa dam olish maskani",
            deal_price_89: "$89/kecha",
            deal_price_75: "$75/kecha",
            deal_price_120: "$120/kecha",
            deal_price_150: "$150/kecha",
            destinations_title: "Mashhur Yo'nalishlar",
            destinations_subtitle: "Eng yaxshi takliflarimiz",
            badge_popular: "Mashhur",
            badge_sale: "Chegirma",
            badge_new: "Yangi",
            btn_details: "Batafsil",
            price_per_person: "kishi uchun",
            dest1_name: "Dubay, BAA",
            dest1_desc: "Zamonaviy arxitektura va qadimiy an'analarning ajoyib uyg'unligi",
            dest2_name: "Parij, Fransiya",
            dest2_desc: "Sevgi va romantika poytaxti, go'zal arxitektura",
            dest3_name: "Istanbul, Turkiya",
            dest3_desc: "Sharq va G'arb madaniyatining ajoyib qo'shilishi",
            dest4_name: "Shveysariya",
            dest4_desc: "Alp tog'lari va kristal toza ko'llar",
            dest5_name: "Tokio, Yaponiya",
            dest5_desc: "Texnologiya va an'analarning noyob uyg'unligi",
            dest6_name: "Rim, Italiya",
            dest6_desc: "Qadimiy tarix va ajoyib arxitektura",
            dest7_name: "Bangkok Gourmet, Tailand",
            dest7_desc: "Gastro sayohatlar, Michelin restoranlari va shaxsiy gidlar.",
            dest8_name: "London Summit, Buyuk Britaniya",
            dest8_desc: "Biznes konferensiya paketi, premium mehmonxona va transferlar.",
            dest9_name: "Boku Weekend, Ozarbayjon",
            dest9_desc: "Toshkentdan to'g'ridan-to'g'ri reys, 4* mehmonxona va shahar sayohati.",
            services_title: "Bizning Xizmatlarimiz",
            services_subtitle: "Nega bizni tanlash kerak? Biz sizga eng yaxshi narxlar, professional xizmat va 24/7 qo'llab-quvvatlashni ta'minlaymiz",
            service1_title: "Aviachiptalar",
            service1_desc: "Eng arzon narxlarda aviachiptalar bron qilish xizmati",
            service2_title: "Mehmonxonalar",
            service2_desc: "Dunyoning istalgan joyida qulay mehmonxonalar",
            service3_title: "Ekskursiyalar",
            service3_desc: "Professional gidlar bilan qiziqarli sayohatlar",
            service4_title: "Viza Xizmati",
            service4_desc: "Viza olish",
            service_why: "Nega biz?",
            service1_advantage_text: "Real vaqtda narxlar, 500+ aviakompaniya, tezkor bron qilish",
            service2_advantage_text: "50,000+ mehmonxona, eng yaxshi narxlar, bepul bekor qilish",
            service3_advantage_text: "Mahalliy gidlar, shaxsiylashtirilgan marshrutlar, 24/7 qo'llab-quvvatlash",
            service4_advantage_text: "Tezkor viza olish, professional yordam, yuqori muvaffaqiyat darajasi",
            btn_ask: "Maslahat",
            btn_book_now: "Bron qilish",
            cat_all: "🔥 Hot",
            cat_solo: "👤 Solo",
            cat_eco: "🌿 Eco",
            cat_family: "👨‍👩‍👧‍👦 Family",
            cat_adventure: "🧗 Adventure",
            cat_exotic: "🏝 Exotic",
            cat_honeymoon: "💍 Honeymoon",
            cat_football: "⚽ Football",
            cat_beach: "🏖 Beach",
            cat_umrah: "🕌 Umrah",
            badge_secure: "Xavfsiz to'lov",
            badge_verified: "Tasdiqlangan agentlik",
            badge_rated: "Eng yuqori reyting",
            badge_support: "24/7 Qo'llab-quvvatlash",

            // Smart Calculator & Tours
            calc_title_main: "Smart Kalkulyator",
            calc_results_title: "Siz uchun mukammal variantlar",
            calc_title: "Aqlli Byudjet Kalkulyatori",
            calc_subtitle: "Byudjetingizni ayting, sayohatingizni topamiz",
            calc_step1_title: "1-qadam: Byudjet va asosiy ma'lumotlar",
            calc_step2_title: "2-qadam: Sayohat uslubingizni tanlang",
            calc_budget_label: "Byudjetingiz qancha?",
            calc_travelers_label: "Sayohatchilar soni",
            calc_duration_label: "Sayohat davomiyligi (kunlar - ixtiyoriy)",
            calc_preferences_label: "Sayohat uslubini tanlang (ixtiyoriy)",
            calc_continue_btn: "Afzalliklarga o'tish",
            calc_back_btn: "Orqaga",
            calc_find_btn: "Mening mukammal sayohatimni toping",
            calc_start_over: "Qaytadan boshlash",
            calc_results_subtitle: "{count} ta tur topildi • Narx bo'yicha saralangan",
            calc_searching: "Eng yaxshi mosliklar qidirilmoqda...",
            calc_no_results_title: "Hech qanday natija topilmadi",
            calc_no_results_text: "Ko'proq variantlarni ko'rish uchun byudjetingizni yoki afzalliklaringizni o'zgartirib ko'ring.",
            calc_total_for: "{count} kishi uchun jami",
            calc_sorted_by: "Narx bo'yicha saralangan (arzondan qimmmatga)",

            // Budget Ranges
            budget_100_500: "$100 - $500",
            budget_500_1000: "$500 - $1,000",
            budget_1000_2000: "$1,000 - $2,000",
            budget_2000_5000: "$2,000 - $5,000",
            budget_5000_10000: "$5,000 - $10,000",
            budget_10000_plus: "$10,000+",

            // Travel Styles
            style_adventure: "🏔️ Sarguzasht",
            style_luxury: "💎 Hashamat",
            style_family: "👨‍👩‍👧‍👦 Oila",
            style_beach: "🏖️ Plyaj",
            style_culture: "🏛️ Madaniyat",
            style_nature: "🌴 Tabiat",
            style_city: "🌆 Shahar",
            style_romantic: "💑 Romantik",

            loader_loading: "Yuklanmoqda...",
            tour_new_adventure: "Yangi Sarguzasht",
            tour_new_desc: "Ajoyib sayohatlar va unutilmas xotiralar.",
            btn_consult: "Maslahat",
            btn_book_short: "Bron",
            calc_city_default: "Shahar tanlang",
            calc_group_popular: "Mashhur",
            calc_group_all: "Barchasi (A-Z)",
            calc_recommend_btn: "Tavsiyalarni ko'rsatish",
            calc_no_results: "Ushbu narxda ({budget} so'm) turlar topilmadi. Iltimos, byudjetni oshiring.",
            calc_days: "Kun",
            calc_book_btn: "Bron qilish",
            calc_tier_label: "Sayohat darajasi",
            calc_tier_affordable: "Hamyonbop",
            calc_tier_medium: "O'rtacha",
            calc_tier_premium: "Premium",

            // Titles
            tour_istanbul_classic_title: "Istanbul Klassik",
            tour_istanbul_premium_title: "Istanbul Premium",
            tour_dubai_trip_title: "Dubay Sayyohati",
            tour_dubai_luxe_title: "Dubay Luks",
            tour_sharm_relax_title: "Sharm Relax",
            tour_paris_romantic_title: "Parij Romantikasi",
            tour_london_tour_title: "London Ekskursiyasi",
            tour_tashkent_city_title: "Toshkent Bo'ylab",
            tour_baku_wind_title: "Boku Shamoli",
            tour_antalya_beach_title: "Antalya Plyajlari",
            tour_tokyo_future_title: "Tokio Kelajagi",
            tour_seoul_culture_title: "Seul Madaniyati",
            tour_kl_tropics_title: "Malayziya Tropiklari",

            // Notes
            tour_note_cheapest: "Eng arzon variant",
            tour_note_comfort: "Qulaylikni sevuvchilar uchun",
            tour_note_fast: "Tezkor sayohat",
            tour_note_unforgettable: "Unutilmas taassurotlar",
            tour_note_ideal: "Dam olish uchun ideal",
            tour_note_couples: "Juftliklar uchun",
            tour_note_history: "Tarix ixlosmandlari uchun",
            tour_note_guests: "Poytaxt mehmonlari uchun",
            tour_note_budget: "Hamyonbop sayohat",
            tour_note_summer: "Yozgi ta'til uchun",
            tour_note_tech: "Texnologiya va madaniyat",
            tour_note_kpop: "K-Pop va tarix",
            tour_note_nature: "Tabiat va shahar",

            // Includes
            inc_hotel_bf_trans: "Mehmonxona, Nonushta, Transfer",
            inc_5star_all_guide: "5* Mehmonxona, Barcha ovqatlar, Gid",
            inc_hotel_visa_trans: "Mehmonxona, Viza, Transfer",
            inc_burj_safari_5star: "Burj Khalifa, Safari, 5* Hotel",
            inc_all_sea: "All Inclusive, Dengiz bo'yi",
            inc_hotel_trans_eiffel: "Mehmonxona, Transfer, Eiffel",
            inc_hotel_guide_museum: "Mehmonxona, Gid, Muzeylar",
            inc_hotel_guide_meal: "Mehmonxona, Gid, Ovqatlanish",
            inc_hotel_trans_oldcity: "Mehmonxona, Transfer, Eski shahar",
            inc_all_avia: "All Inclusive, Avia",
            inc_hotel_metro_guide: "Mehmonxona, Metro kartasi, Gid",
            inc_hotel_palace_trans: "Mehmonxona, Saroylar, Transfer",
            inc_hotel_trans_excur: "Mehmonxona, Transfer, Ekskursiya",

            // Payment Modal
            pay_modal_title: "To'lov",
            pay_tour_info: "Sayohat ma'lumotlari",
            pay_payment_details: "To'lov ma'lumotlari",
            pay_method_label: "To'lov usuli",
            pay_method_full: "To'liq to'lash",
            pay_method_full_desc: "To'liq summani bir vaqtda to'lash",
            pay_method_part: "Bo'lib to'lash",
            pay_method_part_desc: "TNPL - qismlarga bo'lib to'lash",
            pay_label_name: "To'liq ism",
            pay_ph_name: "Ism Familiya",
            pay_label_email: "Email",
            pay_label_phone: "Telefon raqami",
            pay_label_card: "Karta raqami",
            pay_label_expiry: "Muddati (MM/YY)",
            pay_label_cvv: "CVV",
            pay_label_address: "Manzil",
            pay_ph_address: "To'liq manzil",
            pay_ph_phone: "+998 xx xxx xx xx",
            pay_ph_card: "1234 5678 9012 3456",
            pay_ph_expiry: "MM/YY",
            pay_ph_cvv: "123",
            forgot_ph_email: "you@example.com",
            reset_ph_new: "••••••••",
            reset_ph_confirm: "••••••••",

            pay_terms_pre: "Men ",
            pay_terms_link: "shartlar va qoidalar",
            pay_terms_post: " bilan tanishdim va roziman",
            pay_btn_submit: "To'lovni amalga oshirish",
            pay_btn_cancel: "Bekor qilish",

            hero_city_placeholder: "Qayerga boramiz?",
            hero_date_placeholder: "Qachon?",
            dest_istanbul: "Istanbul",
            dest_dubai: "Dubay",
            dest_moscow: "Moskva",
            dest_st_petersburg: "Sankt-Peterburg",
            dest_kazan: "Qozon",
            dest_sochi: "Sochi",
            dest_sharm: "Sharm el-Sheyx",
            dest_tashkent: "Toshkent",
            dest_samarkand: "Samarqand",
            dest_bukhara: "Buxoro",
            dest_khiva: "Xiva",
            hero_guests_1: "1 kishi",
            hero_guests_2: "2 kishi",
            hero_guests_3: "3 kishi",
            hero_guests_4: "4+ kishi",
            hero_group_popular: "Mashhur yo'nalishlar",
            hero_group_all: "Barcha shaharlar (A-Z)",
            nav_categories: "Barcha Kategoriyalar",

            // New Login Keys
            login_remember_me: "Akkauntni saqlash",
            login_forgot_password: "Parolni unutdingizmi?",
            login_google: "Google bilan kirish",
            login_divider_or: "yoki",
            login_saved_account: "Saqlangan akkaunt",
            login_forget_account: "Unutish",
            login_use_saved: "Saqlangan akkaunt bilan kirish",
            login_enter_new: "Boshqa akkaunt bilan kirish",

            // New Footer Keys
            footer_all_rights: "Barcha huquqlar himoyalangan.",
            footer_about: "Biz haqimizda",
            footer_contact: "Aloqa",
            footer_privacy: "Maxfiylik",
            footer_terms: "Shartlar",

            // Categories & Badges
            cat_popular: "🔥 Mashhur",
            cat_affordable: "💰 Hamyonbop",
            cat_exotic: "🏝 Ekzotik",
            cat_nature: "🌲 Tabiat",
            badge_top_choice: "Eng yaxshi tanlov",
            badge_trending: "Trendda",
            badge_iconic: "Mashhur",
            badge_history: "Tarixiy",
            badge_classic: "Klassik",
            badge_best_value: "Eng yaxshi qiymat",
            badge_hot_deal: "Qaynoq taklif",
            badge_budget: "Arzon",
            badge_all_inclusive: "Barchasi ichida",
            badge_culture: "Madaniyat",
            badge_relax: "Hordiq",
            badge_luxury: "Luks",
            badge_stunning: "Ajoyib",
            badge_adventure: "Sarguzasht",
            badge_hot: "Qaynoq",
            badge_paradise: "Jannatmonand",
            badge_value: "Hamyonbop",
            badge_sea: "Dengiz",
            badge_fast: "Tezkor",
            badge_affordable: "Hamyonbop",
            badge_premium: "Premium",
            badge_active: "Aktiv",
            badge_beautiful: "Go'zal",
            badge_economy: "Tejamkor",
            badge_educational: "Ma'rifiy",
            badge_exciting: "Qiziqarli",
            badge_fun: "Quvnoq",
            badge_group: "Guruhli",
            badge_majestic: "Muhtasham",
            badge_pure: "Musaffo",
            badge_romance: "Romantika",
            badge_romantic: "Romantik",
            badge_scenic: "Manzarali",
            badge_season: "Mavsumiy",
            badge_serene: "Sokin",
            badge_sunset: "Shom",
            badge_unique: "Noyob",
            badge_vip: "VIP",
            badge_wilderness: "Yovvoyi tabiat",
            badge_beach: "Sohil",
            alert_login_empty: "Iltimos, email va parolni kiriting.",
            alert_login_fail: "Noto'g'ri email yoki parol. Iltimos, qayta urinib ko'ring.",
            btn_details: "Batafsil",
            alert_fill_all: "Iltimos, barcha majburiy maydonlarni to'ldiring.",
            alert_pass_length: "Parol kamida 6 ta belgidan iborat bo'lishi kerak.",
            alert_login_success: "Muvaffaqiyatli kirdingiz!",
            alert_google_load_fail: "Google Identity Services yuklanmagan. Iltimos, sahifani yangilang.",
            alert_google_cancel: "Google kirish bekor qilindi yoki xatolik yuz berdi.",
            alert_error_general: "Xatolik yuz berdi. Iltimos, qayta urinib ko'ring.",
            alert_email_required: "Iltimos, email manzilingizni kiriting.",
            alert_pass_mismatch: "Parollar mos kelmaydi. Iltimos, qayta kiriting.",
            alert_pass_updated: "Parol muvaffaqiyatli yangilandi!",
            alert_select_city: "Iltimos, shaharni tanlang!",
            alert_searching: "Qidirilmoqda: {city}",
            alert_cat_selected: "Kategoriya tanlandi: {cat}",
            alert_booking_open: "{title} uchun bron qilish oynasi ochilmoqda...",



            // Testimonials
            testim_title: "Sayyohlarimiz nima deydi?",
            testim_subtitle: "Haqiqiy sayyohlardan haqiqiy tajribalar",
            testim_1_name: "Sarah Johnson",
            testim_1_loc: "Nyu-York, AQSH",
            testim_1_text: "\"KETMON bizning Dubay sayohatimizni mutlaqo unutilmas qildi! Bron qilish jarayoni oson bo'ldi va mijozlarga xizmat ko'rsatish ajoyib edi. Tavsiya qilaman!\"",
            testim_1_dest: "📍 Dubay, BAA",
            testim_2_name: "Michael Chen",
            testim_2_loc: "Singapur",
            testim_2_text: "\"Men ishlagan eng yaxshi sayohat agentligi. Parij paketi mukammal tuzilgan va har bir detal e'tiborga olingan. Albatta yana bron qilaman!\"",
            testim_2_dest: "📍 Parij, Fransiya",
            testim_3_name: "Emma Williams",
            testim_3_loc: "London, Buyuk Britaniya",
            testim_3_text: "\"Boshidan oxirigacha ajoyib tajriba. Jamoa professional va tezkor bo'lib, bizga bir umrga tatigulik xotiralar yaratishga yordam berdi!\"",
            testim_3_dest: "📍 Tokio, Yaponiya",
            stats_travelers: "Mamnun sayyohlar",
            stats_destinations: "Yo'nalishlar",
            stats_satisfaction: "Mamnuniyat darajasi",
            stats_experience: "Yillik tajriba",
            partners_title: "Bizning ishonchli hamkorlarimiz",
            partners_subtitle: "Dunyoning yetakchi sayohat brendlari bilan ishlash",
            chatbot_title: "KETMON Yordamchi",
            chatbot_status: "Onlayn",
            chatbot_greeting: "Salom! Men KETMON yordamchisiman. Sizga qanday yordam bera olaman?",
            chatbot_resp_project: "KETMON - Markaziy Osiyo turizm sohasini inqilob qiluvchi keng qamrovli platforma. Biz sayyohlar va agentliklar uchun asosiy sayohat muammolarini hal qilamiz.",
            chatbot_resp_booking: "Bron qilish uchun kerakli manzilni toping, 'Bron qilish' tugmasini bosing va to'lov ma'lumotlarini kiriting.",
            chatbot_resp_price: "Narxlar turli agentliklar va paketlarga qarab farq qiladi. Minimal byudjet 100 USD dan boshlanadi.",
            chatbot_resp_default: "Kechirasiz, men bu savolga javob bera olmayman. Iltimos, boshqa savol bering yoki biz bilan aloqa qiling.",
            chatbot_placeholder: "Savolingizni yozing...",
            forgot_modal_title: "Parolni tiklash",
            forgot_email_label: "Email manzilingiz",
            forgot_note: "Email manzilingizga parolni tiklash havolasi yuboriladi.",
            forgot_btn_send: "Yuborish",
            reset_modal_title: "Yangi parol o'rnatish",
            reset_new_label: "Yangi parol",
            reset_confirm_label: "Parolni tasdiqlang",
            reset_btn_submit: "Parolni yangilash",
        },
        ru: {
            phone: "+998 93 301 52 18",
            email: "info@ketmon.uz",
            nav_home: "Главная",
            nav_calculator: "Smart Калькулятор",
            hero_try_calculator: "🧮 Попробуйте Smart Калькулятор",
            nav_destinations: "Направления",
            nav_services: "Услуги",
            nav_about: "О нас",
            nav_contact: "Контакты",
            nav_book: "Бронирование",
            nav_login: "Войти",
            nav_register: "Регистрация",
            login_email_label: "Email",
            login_email_placeholder: "you@example.com",
            login_password_label: "Пароль",
            login_password_placeholder: "••••••••",
            register_switch: "Регистрация",
            register_role_label: "Выберите роль",
            register_customer_tab: "Клиент",
            register_agency_tab: "Агентство",
            register_name_label: "Имя",
            register_name_placeholder: "Ваше имя",
            register_email_label: "Email",
            register_email_placeholder: "you@example.com",
            register_password_label: "Пароль",
            register_password_placeholder: "••••••••",
            register_agency_name_label: "Название агентства",
            register_agency_name_placeholder: "Название агентства",
            register_license_label: "Номер лицензии",
            register_license_placeholder: "ABC-123456",
            register_agency_email_label: "Email агентства",
            register_agency_email_placeholder: "agency@example.com",
            register_agency_phone_label: "Телефон",
            register_agency_phone_placeholder: "+998 xx xxx xx xx",
            register_agency_password_label: "Пароль",
            register_agency_password_placeholder: "••••••••",
            register_submit: "Создать",
            hero_title: "Сравнивайте и бронируйте туры от 100+ проверенных агентств",
            hero_subtitle: "Одна платформа. Все направления. Гарантия лучшей цены.",
            hero_btn1: "Смотреть направления",
            hero_btn2: "Получить консультацию",
            tour_consult_btn: "Получить консультацию",
            search_title: "Куда хотите поехать? 🌍",
            search_destination: "Направление",
            search_destination_placeholder: "Куда хотите поехать?",
            search_date: "Дата",
            search_date_label: "Когда? 📅",
            search_guests_label: "Путешественники 👥",
            search_duration: "Продолжительность",
            duration_3: "3 дня",
            duration_7: "7 дней",
            duration_14: "14 дней",
            duration_custom: "Другое",
            search_agency: "Агентство",
            agency_select_all: "Все агентства",
            agency_section_title: "Партнерские агентства",
            agency_section_subtitle: "Выберите надежного партнера для путешествия",
            agency_filter_all: "Все партнеры",
            agency_filter_local: "Для путешественников Узбекистана",
            agency_filter_global: "Для иностранных гостей",
            agency_badge_verified: "Проверено",
            agency_view_tours: "Посмотреть туры агентства",
            license_title: "Лицензия туристического агентства",
            license_verified: "Проверенное туристическое агентство",
            license_number: "Номер лицензии:",
            license_issued: "Дата выдачи:",
            license_expires: "Срок действия:",
            license_authority: "Выдавший орган:",
            license_status: "Статус:",
            license_active: "Активна",
            license_note: "Эта лицензия выдана и подтверждена Министерством туризма и культурного наследия Республики Узбекистан. Агентство соответствует всем правовым требованиям.",
            agency_atlas_name: "Atlas Travel",
            agency_atlas_desc: "Премиальные пакеты и VIP-сервис в 40+ направлениях по всему миру.",
            agency_samarqand_name: "Samarqand Tours",
            agency_samarqand_desc: "Эксперты по культурным путешествиям, историческим гидам и местному опыту.",
            agency_nomad_name: "Nomad Explorer",
            agency_nomad_desc: "Активные туры, треккинг и экологический туризм.",
            agency_silk_name: "Silk Road Elite",
            agency_silk_desc: "Лакшери-отели, TNPL планы и персональные гиды премиум-класса.",
            agency_clubtravel_name: "ClubTravel UZ",
            agency_clubtravel_desc: "Доступные пакеты для семей и групп, чартеры из Ташкента.",
            agency_azialux_name: "AziaLux Travel",
            agency_azialux_desc: "Эксклюзивные гастротуры по Азии и Европе, премиум-сервис.",
            agency_globalvoyage_name: "Global Voyage Hub",
            agency_globalvoyage_desc: "Международные конференции и MICE-туры, поддержка 24/7 и визовая помощь.",
            about_title: "О платформе KETMON",
            about_subtitle: "Надёжный маркетплейс путешествий Центральной Азии, объединяющий агентства и путешественников.",
            about_story_title: "Наша миссия",
            about_story_body1: "Вдохновляясь символом кетмона, мы ставим трудолюбие и рост в основу каждого продукта и сервиса.",
            about_story_body2: "На платформе собраны проверенные агентства, прозрачные цены и TNPL — всё, чтобы экономить время и бюджет путешественников.",
            about_bullet_network: "Партнёры обновляют пакеты в реальном времени и рассказывают о направлениях через видео и сторис.",
            about_bullet_support: "Круглосуточная поддержка, встроенный чат и уведомления в Telegram помогают агентствам оставаться на связи с клиентами.",
            about_bullet_ai: "AI-рекомендации предлагают персональные маршруты и ускоряют выбор тура.",
            about_stat_partners_value: "120+",
            about_stat_partners_label: "партнёрских агентств",
            about_stat_tours_value: "650+",
            about_stat_tours_label: "активных турпакетов",
            about_stat_travelers_value: "45k+",
            about_stat_travelers_label: "довольных путешественников",
            about_stat_languages_value: "3",
            about_stat_languages_label: "языка поддержки",
            contact_title: "Свяжитесь с нами",
            contact_subtitle: "Оставьте вопрос или предложение — мы на связи 24/7.",
            contact_info_title: "Почему KETMON?",
            contact_info_body: "С KETMON вы сотрудничаете только с проверенными агентствами, сравниваете цены и используете TNPL для рассрочки. Единая панель упрощает работу и для клиентов, и для агентств.",
            contact_phone_label: "Телефон",
            contact_phone_value: "+998 90 765 43 21",
            contact_email_label: "Email",
            contact_email_value: "support@ketmon.uz",
            contact_address_label: "Адрес",
            contact_address_value: "Ташкент, ул. Навои 12, KETMON HUB",
            contact_form_name_label: "Имя",
            contact_form_name_placeholder: "Ваше имя",
            contact_form_email_label: "Email",
            contact_form_email_placeholder: "you@example.com",
            contact_form_message_label: "Сообщение",
            contact_form_message_placeholder: "Опишите запрос...",
            contact_submit_btn: "Отправить",
            fav_title: "Избранное",
            fav_clear: "Очистить",
            fav_empty: "Пока пусто",
            cart_title: "Корзина",
            cart_clear: "Очистить",
            cart_empty: "Корзина пуста",
            cart_total: "Итого:",
            cart_checkout: "Оформить заказ",
            compare_similar: "Сравнить похожие",
            cart_cancel_24h: "Бесплатная отмена в течение 24 часов",
            btn_view_all: "Посмотреть все",
            cat_luxury: "Люкс",
            cat_cultural: "Культурный",
            cat_wellness: "Оздоровительный",
            cat_winter: "Зимний",
            calc_subtitle: "Найдите идеальный тур для вашего кошелька",
            calc_min_price: "Мин. цена",
            calc_max_price: "Макс. цена",
            calc_category: "Стиль отдыха",
            calc_show_results: "Показать результаты",
            contact_status_placeholder: "Обычно отвечаем в течение 30 минут.",
            contact_success_message: "Ваше сообщение принято! Мы свяжемся с вами в ближайшее время.",
            contact_error_message: "Заполните, пожалуйста, все поля формы.",
            calc_title: "Цена, оценка, сум",
            calc_clear: "Очистить",
            calc_from: "от",
            calc_before: "до",
            search_guests: "Количество людей",
            search_btn: "Искать",
            late_escape_title: "Хорошее время, а не долгое",
            late_escape_subtitle: "Выжмите последнее из лета со скидкой не менее 15%",
            late_escape_btn: "Найти",
            trending_title: "Популярные направления",
            trending_subtitle: "Самые популярные выборы для путешественников из Узбекистана",
            explore_uz_title: "Исследуйте Узбекистан",
            explore_uz_subtitle: "Эти популярные направления предлагают многое",
            explore_properties: "объектов",
            property_type_title: "Поиск по типу недвижимости",
            property_hotels: "Отели",
            property_apartments: "Апартаменты",
            property_resorts: "Курорты",
            property_villas: "Виллы",
            trip_planner_title: "Быстрый и простой планировщик поездок",
            trip_planner_subtitle: "Выберите настроение и исследуйте лучшие направления в Узбекистане",
            trip_festivals: "Фестивали",
            trip_shopping: "Шопинг и ремесла",
            trip_gastronomic: "Гастрономические путешествия",
            trip_cultural: "Культурное исследование",
            trip_architecture: "Архитектурные туры",
            trip_historical: "Исторические места",
            weekend_deals_title: "Предложения на выходные",
            weekend_deals_subtitle: "Экономьте на проживании с 14 по 16 ноября",
            dest_tashkent: "Ташкент",
            dest_samarkand: "Самарканд",
            dest_istanbul: "Стамбул",
            dest_dubai: "Дубай",
            dest_moscow: "Москва",
            dest_st_petersburg: "Санкт-Петербург",
            dest_kazan: "Казань",
            dest_sochi: "Сочи",
            dest_sharm: "Шарм-эль-Шейх",
            dest_bukhara: "Бухара",
            dest_khiva: "Хива",
            dest_antalya: "Анталья",
            dest_baku: "Баку",
            dest_fergana: "Фергана",
            dest_kuala_lumpur: "Куала-Лумпур",
            dest_london: "Лондон",
            dest_paris: "Париж",
            dest_seoul: "Сеул",
            dest_tokyo: "Токио",
            explore_tashkent_props: "1,409 объектов",
            explore_samarkand_props: "914 объектов",
            explore_bukhara_props: "587 объектов",
            explore_khiva_props: "163 объекта",
            explore_chimgan_props: "20 объектов",
            explore_fergana_props: "46 объектов",
            trip_tashkent_distance: "7 км",
            trip_kokand_distance: "165 км",
            trip_fergana_distance: "237 км",
            trip_samarkand_distance: "262 км",
            trip_bukhara_distance: "438 км",
            trip_khiva_distance: "739 км",
            deal_premium_hotel: "Премиум отель",
            deal_luxury_apartment: "Роскошная квартира",
            deal_resort_stay: "Курортный отель",
            deal_villa_retreat: "Вилла для отдыха",
            deal_price_89: "$89/ночь",
            deal_price_75: "$75/ночь",
            deal_price_120: "$120/ночь",
            deal_price_150: "$150/ночь",
            destinations_title: "Популярные направления",
            destinations_subtitle: "Наши лучшие предложения",
            badge_popular: "Популярно",
            badge_sale: "Скидка",
            badge_new: "Новинка",
            btn_details: "Подробнее",
            price_per_person: "за человека",
            dest1_name: "Дубай, ОАЭ",
            dest1_desc: "Современная архитектура и древние традиции",
            dest2_name: "Париж, Франция",
            dest2_desc: "Столица любви и романтики, прекрасная архитектура",
            dest3_name: "Стамбул, Турция",
            dest3_desc: "Удивительное сочетание Востока и Запада",
            dest4_name: "Швейцария",
            dest4_desc: "Альпы и кристально чистые озера",
            dest5_name: "Токио, Япония",
            dest5_desc: "Уникальное сочетание технологий и традиций",
            dest6_name: "Рим, Италия",
            dest6_desc: "Древняя история и потрясающая архитектура",
            dest7_name: "Bangkok Gourmet, Таиланд",
            dest7_desc: "Гастротуры, рестораны Michelin и персональные гиды.",
            dest8_name: "London Summit, Великобритания",
            dest8_desc: "Пакет для бизнес-конференции, премиум-отель и трансферы.",
            dest9_name: "Baku Weekend, Азербайджан",
            dest9_desc: "Прямой рейс из Ташкента, 4* отель и обзорная экскурсия по городу.",
            services_title: "Наши услуги",
            services_subtitle: "Почему выбирают нас? Мы предлагаем лучшие цены, профессиональный сервис и поддержку 24/7",
            service1_title: "Авиабилеты",
            service1_desc: "Бронирование авиабилетов по выгодным ценам",
            service2_title: "Отели",
            service2_desc: "Удобные отели по всему миру",
            service3_title: "Экскурсии",
            service3_desc: "Интересные туры с профессиональными гидами",
            service4_title: "Визовая поддержка",
            service4_desc: "Оформление виз",
            service_why: "Почему мы?",
            service1_advantage_text: "Цены в реальном времени, 500+ авиакомпаний, быстрое бронирование",
            service2_advantage_text: "50,000+ отелей, лучшие цены, бесплатная отмена",
            service3_advantage_text: "Местные гиды, персонализированные маршруты, поддержка 24/7",
            service4_advantage_text: "Быстрое оформление виз, профессиональная помощь, высокий процент успеха",
            btn_ask: "Консультация",
            btn_book_now: "Забронировать",
            cat_all: "🔥 Горячие",
            cat_solo: "👤 Соло",
            cat_eco: "🌿 Эко",
            cat_family: "👨‍👩‍👧‍👦 Семейные",
            cat_adventure: "🧗 Приключения",
            cat_exotic: "🏝 Экзотика",
            cat_honeymoon: "💍 Медовый месяц",
            cat_football: "⚽ Футбол",
            cat_beach: "🏖 Пляж",
            cat_umrah: "🕌 Умра",
            badge_secure: "Безопасная оплата",
            badge_verified: "Проверенное агентство",
            badge_rated: "Высший рейтинг",
            badge_support: "Поддержка 24/7",
            calc_title_main: "Smart Калькулятор",
            calc_results_title: "Идеальные варианты для вас",
            calc_title: "Умный Калькулятор Бюджета",
            calc_subtitle: "Скажите ваш бюджет, найдем ваше путешествие",
            calc_step1_title: "Шаг 1: Бюджет и основная информация",
            calc_step2_title: "Шаг 2: Выберите стиль путешествия",
            calc_budget_label: "Какой у вас бюджет?",
            calc_travelers_label: "Количество путешественников",
            calc_duration_label: "Длительность (дни - необязательно)",
            calc_preferences_label: "Выберите стиль путешествия (необязательно)",
            calc_continue_btn: "Продолжить к предпочтениям",
            calc_back_btn: "Назад",
            calc_find_btn: "Найти мой идеальный тур",
            calc_start_over: "Начать заново",
            calc_results_subtitle: "Найдено {count} туров • Отсортировано по цене",
            calc_searching: "Поиск лучших совпадений...",
            calc_no_results_title: "Результатов не найдено",
            calc_no_results_text: "Попробуйте изменить бюджет или предпочтения для большего выбора.",
            calc_total_for: "Всего для {count} человек",
            calc_sorted_by: "Отсортировано по цене (от дешевых к дорогим)",

            // Budget Ranges
            budget_100_500: "$100 - $500",
            budget_500_1000: "$500 - $1,000",
            budget_1000_2000: "$1,000 - $2,000",
            budget_2000_5000: "$2,000 - $5,000",
            budget_5000_10000: "$5,000 - $10,000",
            budget_10000_plus: "$10,000+",

            // Travel Styles
            style_adventure: "🏔️ Приключения",
            style_luxury: "💎 Люкс",
            style_family: "👨‍👩‍👧‍👦 Семья",
            style_beach: "🏖️ Пляж",
            style_culture: "🏛️ Культура",
            style_nature: "🌴 Природа",
            style_city: "🌆 Город",
            style_romantic: "💑 Романтика",
            loader_loading: "Загрузка...",
            tour_new_adventure: "Новое приключение",
            tour_new_desc: "Удивительные путешествия и незабываемые воспоминания.",
            btn_consult: "Консультация",
            btn_book_short: "Бронь",
            calc_city_default: "Выберите город",
            calc_group_popular: "Популярные направления",
            calc_group_all: "Все города (А-Я)",
            calc_recommend_btn: "Показать рекомендации",
            calc_no_results: "Туры по этой цене ({budget} сум) не найдены. Пожалуйста, увеличьте бюджет.",
            calc_days: "Дней",
            calc_book_btn: "Забронировать",
            calc_tier_label: "Уровень поездки",
            calc_tier_affordable: "Доступный",
            calc_tier_medium: "Средний",
            calc_tier_premium: "Премиум",
            hero_city_placeholder: "Куда поедем?",
            hero_date_placeholder: "Когда?",
            dest_istanbul: "Стамбул",
            dest_dubai: "Дубай",
            dest_moscow: "Москва",
            dest_st_petersburg: "Санкт-Петербург",
            dest_kazan: "Казань",
            dest_sochi: "Сочи",
            dest_sharm: "Шарм-эль-Шейх",
            dest_tashkent: "Ташкент",
            dest_samarkand: "Самарканд",
            dest_bukhara: "Бухара",
            dest_khiva: "Хива",
            hero_guests_1: "1 человек",
            hero_guests_2: "2 человека",
            hero_guests_3: "3 человека",
            hero_guests_4: "4+ человек",
            hero_group_popular: "Популярные направления",
            hero_group_all: "Все города (А-Я)",
            nav_categories: "Все категории",
            pay_ph_address: "Полный адрес",
            pay_ph_phone: "+998 xx xxx xx xx",
            pay_ph_card: "1234 5678 9012 3456",
            pay_ph_expiry: "ММ/ГГ",
            pay_ph_cvv: "123",
            forgot_ph_email: "you@example.com",
            reset_ph_new: "••••••••",
            reset_ph_confirm: "••••••••",


            login_remember_me: "Запомнить меня",
            login_forgot_password: "Забыли пароль?",
            login_google: "Войти через Google",
            login_divider_or: "или",
            login_saved_account: "Сохраненный аккаунт",
            login_forget_account: "Забыть",
            login_use_saved: "Войти с сохраненным аккаунтом",
            login_enter_new: "Войти с другим аккаунтом",
            search_placeholder: "Поиск туров, направлений...",
            cart_checkout: "Оформить",
            footer_all_rights: "Все права защищены.",
            footer_about: "О нас",
            footer_contact: "Контакты",
            footer_privacy: "Конфиденциальность",
            footer_terms: "Условия",
            cat_popular: "🔥 Популярные",
            cat_affordable: "💰 Доступные",
            cat_exotic: "🏝 Экзотика",
            cat_nature: "🌲 Природа",
            badge_top_choice: "Лучший выбор",
            badge_trending: "В тренде",
            badge_iconic: "Легендарно",
            badge_history: "История",
            badge_classic: "Классика",
            badge_best_value: "Лучшая цена",
            badge_hot_deal: "Горящее предложение",
            badge_budget: "Бюджетно",
            badge_all_inclusive: "Все включено",
            badge_culture: "Культура",
            badge_relax: "Отдых",
            badge_luxury: "Люкс",
            badge_stunning: "Потрясающе",
            badge_adventure: "Приключения",
            badge_hot: "Горячее",
            badge_paradise: "Рай",
            badge_value: "Выгодно",
            badge_sea: "Море",
            badge_fast: "Быстро",
            badge_affordable: "Доступно",
            badge_premium: "Премиум",
            badge_active: "Активный",
            badge_beautiful: "Красиво",
            badge_economy: "Эконом",
            badge_educational: "Познавательно",
            badge_exciting: "Захватывающе",
            badge_fun: "Весело",
            badge_group: "Групповой",
            badge_majestic: "Величественно",
            badge_pure: "Чисто",
            badge_romance: "Романтика",
            badge_romantic: "Романтично",
            badge_scenic: "Живописно",
            badge_season: "Сезонный",
            badge_serene: "Спокойно",
            badge_sunset: "Закат",
            badge_unique: "Уникально",
            badge_vip: "VIP",
            badge_wilderness: "Дикая природа",
            badge_beach: "Пляж",
            alert_login_empty: "Пожалуйста, введите email и пароль.",
            alert_login_fail: "Неверный email или пароль. Пожалуйста, попробуйте снова.",
            btn_details: "Подробнее",
            alert_fill_all: "Пожалуйста, заполните все обязательные поля.",
            alert_pass_length: "Пароль должен содержать не менее 6 символов.",
            alert_login_success: "Вы успешно вошли!",
            alert_google_load_fail: "Google Identity Services не загружен. Пожалуйста, обновите страницу.",
            alert_google_cancel: "Вход через Google был отменен или произошла ошибка.",
            alert_error_general: "Произошла ошибка. Пожалуйста, попробуйте еще раз.",
            alert_email_required: "Пожалуйста, введите ваш адрес электронной почты.",
            alert_pass_mismatch: "Пароли не совпадают. Пожалуйста, введите снова.",
            alert_pass_updated: "Пароль успешно обновлен!",
            alert_select_city: "Пожалуйста, выберите город!",
            alert_searching: "Поиск: {city}",
            alert_cat_selected: "Категория выбрана: {cat}",
            alert_booking_open: "Открывается окно бронирования для {title}...",


            testim_title: "Что говорят наши путешественники?",
            testim_subtitle: "Реальные отзывы от реальных людей",
            testim_1_name: "Sarah Johnson",
            testim_1_loc: "Нью-Йорк, США",
            testim_1_text: "\"KETMON сделал нашу поездку в Дубай абсолютно незабываемой! Процесс бронирования был простым, а обслуживание клиентов — исключительным. Рекомендую!\"",
            testim_1_dest: "📍 Дубай, ОАЭ",
            testim_2_name: "Michael Chen",
            testim_2_loc: "Сингапур",
            testim_2_text: "\"Лучшее турагентство, с которым я когда-либо работал. Пакет в Париж был идеально составлен, каждая деталь продумана. Обязательно забронирую снова!\"",
            testim_2_dest: "📍 Париж, Франция",
            testim_3_name: "Emma Williams",
            testim_3_loc: "Лондон, Великобритания",
            testim_3_text: "\"Удивительный опыт от начала до конца. Команда профессиональная и отзывчивая, помогла нам создать воспоминания на всю жизнь!\"",
            testim_3_dest: "📍 Токио, Япония",
            stats_travelers: "Счастливых путешественников",
            stats_destinations: "Направлений",
            stats_satisfaction: "Уровень удовлетворенности",
            stats_experience: "Лет опыта",
            partners_title: "Наши надежные партнеры",
            partners_subtitle: "Работая с ведущими мировыми туристическими брендами",
            chatbot_title: "KETMON Помощник",
            chatbot_status: "Онлайн",
            chatbot_greeting: "Привет! Я помощник KETMON. Чем я могу вам помочь?",
            chatbot_resp_project: "KETMON - это комплексная платформа, совершающая революцию в сфере туризма в Центральной Азии. Мы решаем основные проблемы путешествий для туристов и агентств.",
            chatbot_resp_booking: "Чтобы забронировать, найдите нужное направление, нажмите кнопку 'Забронировать' и введите платежные данные.",
            chatbot_resp_price: "Цены варьируются в зависимости от различных агентств и пакетов. Минимальный бюджет начинается от 100 долларов США.",
            chatbot_resp_default: "Извините, я не могу ответить на этот вопрос. Пожалуйста, задайте другой вопрос или свяжитесь с нами.",
            chatbot_placeholder: "Напишите ваш вопрос...",
            forgot_modal_title: "Восстановление пароля",
            forgot_email_label: "Ваш Email",
            forgot_note: "Ссылка для восстановления пароля будет отправлена на ваш Email.",
            forgot_btn_send: "Отправить",
            reset_modal_title: "Установка нового пароля",
            reset_new_label: "Новый пароль",
            reset_confirm_label: "Подтвердите пароль",
            reset_btn_submit: "Обновить пароль",
        },
        en: {
            phone: "+998 93 301 52 18",
            email: "info@ketmon.uz",
            nav_home: "Home",
            nav_calculator: "Smart Calculator",
            hero_try_calculator: "🧮 Try Smart Calculator",
            nav_destinations: "Destinations",
            nav_services: "Services",
            nav_about: "About",
            nav_contact: "Contact",
            nav_book: "Book Now",
            nav_login: "Login",
            nav_register: "Register",
            login_email_label: "Email",
            login_email_placeholder: "you@example.com",
            login_password_label: "Password",
            login_password_placeholder: "â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢",
            register_switch: "Register",
            register_role_label: "Select role",
            register_customer_tab: "Customer",
            register_agency_tab: "Agency",
            register_name_label: "Full name",
            register_name_placeholder: "Your name",
            register_email_label: "Email",
            register_email_placeholder: "you@example.com",
            register_password_label: "Password",
            register_password_placeholder: "â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢",
            register_agency_name_label: "Agency name",
            register_agency_name_placeholder: "Agency name",
            register_license_label: "License number",
            register_license_placeholder: "ABC-123456",
            register_agency_email_label: "Agency email",
            register_agency_email_placeholder: "agency@example.com",
            register_agency_phone_label: "Phone",
            register_agency_phone_placeholder: "+998 xx xxx xx xx",
            register_agency_password_label: "Password",
            register_agency_password_placeholder: "â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢",
            register_submit: "Create",
            hero_title: "Compare & Book Tours from 100+ Trusted Agencies",
            hero_subtitle: "One platform. All destinations. Best prices guaranteed.",
            hero_btn1: "View Destinations",
            hero_btn2: "Get a Consultation",
            tour_consult_btn: "Get Consultation",
            search_title: "Where do you want to go? 🌍",
            search_destination: "Destination",
            search_destination_placeholder: "Where do you want to go?",
            search_date: "Date",
            search_date_label: "When? 📅",
            search_guests_label: "Travelers 👥",
            search_duration: "Duration",
            duration_3: "3 days",
            duration_7: "7 days",
            duration_14: "14 days",
            duration_custom: "Custom",
            search_agency: "Agency",
            agency_select_all: "All agencies",
            agency_section_title: "Partner Agencies",
            agency_section_subtitle: "Choose the most trusted travel partner for your trip",
            agency_filter_all: "All partners",
            agency_filter_local: "For Uzbek travelers",
            agency_filter_global: "For international visitors",
            agency_badge_verified: "Verified",
            agency_view_tours: "View agency tours",
            license_title: "Travel Agency License",
            license_verified: "Verified travel agency",
            license_number: "License number:",
            license_issued: "Issued date:",
            license_expires: "Expiry date:",
            license_authority: "Issuing authority:",
            license_status: "Status:",
            license_active: "Active",
            license_note: "This license is issued and verified by the Ministry of Tourism and Cultural Heritage of the Republic of Uzbekistan. The agency complies with all legal requirements.",
            agency_atlas_name: "Atlas Travel",
            agency_atlas_desc: "Premium packages and VIP service to 40+ destinations worldwide.",
            agency_samarqand_name: "Samarqand Tours",
            agency_samarqand_desc: "Experts in cultural journeys, historical guides and authentic experiences.",
            agency_nomad_name: "Nomad Explorer",
            agency_nomad_desc: "Adventure tours, mountain trekking and eco experiences.",
            agency_silk_name: "Silk Road Elite",
            agency_silk_desc: "Luxury stays, TNPL plans and personal guides with premium service.",
            agency_clubtravel_name: "ClubTravel UZ",
            agency_clubtravel_desc: "Value-friendly packages for families and groups, charters from Tashkent.",
            agency_azialux_name: "AziaLux Travel",
            agency_azialux_desc: "Exclusive gastro tours across Asia and Europe with premium guides.",
            agency_globalvoyage_name: "Global Voyage Hub",
            agency_globalvoyage_desc: "International conferences and MICE tours with 24/7 support and visa help.",
            about_title: "About KETMON",
            about_subtitle: "The most trusted travel marketplace in Central Asia connecting agencies and travellers.",
            about_story_title: "Our Mission",
            about_story_body1: "Inspired by the ketmon spirit, we put dedication and growth at the heart of our services.",
            about_story_body2: "Verified agencies, transparent pricing, and TNPL financing help travellers save time and budget with confidence.",
            about_bullet_network: "Partners refresh packages in real time and bring destinations to life with reels and stories.",
            about_bullet_support: "24/7 support, integrated chat, and Telegram alerts keep agencies in sync with their customers.",
            about_bullet_ai: "AI recommendations surface personalised itineraries so guests can decide faster.",
            about_stat_partners_value: "120+",
            about_stat_partners_label: "partner agencies",
            about_stat_tours_value: "650+",
            about_stat_tours_label: "active tour packages",
            about_stat_travelers_value: "45k+",
            about_stat_travelers_label: "happy travellers",
            about_stat_languages_value: "3",
            about_stat_languages_label: "languages supported",
            contact_title: "Let's stay in touch",
            contact_subtitle: "Share your questions or ideas â€” our team replies within minutes.",
            contact_info_title: "Why KETMON?",
            contact_info_body: "Collaborate with verified agencies, compare offers, and split payments via TNPL. A single dashboard streamlines the journey for both travellers and partners.",
            contact_phone_label: "Phone",
            contact_phone_value: "+998 90 765 43 21",
            contact_email_label: "Email",
            contact_email_value: "support@ketmon.uz",
            contact_address_label: "Address",
            contact_address_value: "Tashkent, Navoi Street 12, KETMON HUB",
            contact_form_name_label: "Name",
            contact_form_name_placeholder: "Your name",
            contact_form_email_label: "Email",
            contact_form_email_placeholder: "you@example.com",
            contact_form_message_label: "Message",
            contact_form_message_placeholder: "Tell us how we can help...",
            contact_submit_btn: "Send message",
            fav_title: "Favorites",
            fav_clear: "Clear",
            fav_empty: "Nothing saved yet",
            cart_title: "Cart",
            cart_clear: "Clear",
            cart_empty: "Your cart is empty",
            cart_total: "Total:",
            cart_checkout: "Checkout now",
            compare_similar: "Compare similar",
            cart_cancel_24h: "24-hour free cancellation",
            btn_view_all: "View All",
            cat_luxury: "Luxury",
            cat_cultural: "Cultural",
            cat_wellness: "Wellness",
            cat_winter: "Winter",
            calc_subtitle: "Find the perfect tour for your wallet",
            calc_min_price: "Min Price",
            calc_max_price: "Max Price",
            calc_category: "Style",
            calc_show_results: "Show Results",
            contact_status_placeholder: "We usually reply within 30 minutes.",
            contact_success_message: "Thanks for reaching out! We will get back to you shortly.",
            contact_error_message: "Please fill in every field before sending.",
            calc_title: "Price, rating, sum",
            calc_clear: "Clear",
            calc_from: "from",
            calc_before: "to",
            search_guests: "Guests",
            search_btn: "Search",
            late_escape_title: "Go for a good time, not a long time",
            late_escape_subtitle: "Squeeze out the last bit of summer at least 15% off",
            late_escape_btn: "Find",
            trending_title: "Trending destinations",
            trending_subtitle: "Most popular choices for travellers from Uzbekistan",
            explore_uz_title: "Explore Uzbekistan",
            explore_uz_subtitle: "These popular destinations have a lot to offer",
            explore_properties: "properties",
            property_type_title: "Browse by property type",
            property_hotels: "Hotels",
            property_apartments: "Apartments",
            property_resorts: "Resorts",
            property_villas: "Villas",
            trip_planner_title: "Quick and easy trip planner",
            trip_planner_subtitle: "Pick a vibe and explore the top destinations in Uzbekistan",
            trip_festivals: "Festivals",
            trip_shopping: "Shopping & Crafts",
            trip_gastronomic: "Gastronomic Journeys",
            trip_cultural: "Cultural Exploration",
            trip_architecture: "Architecture Tours",
            trip_historical: "Historical Sites",
            weekend_deals_title: "Deals for the weekend",
            weekend_deals_subtitle: "Save on stays for 14 November - 16 November",
            dest_tashkent: "Tashkent",
            dest_samarkand: "Samarkand",
            dest_istanbul: "Istanbul",
            dest_bukhara: "Bukhara",
            dest_dubai: "Dubai",
            dest_khiva: "Khiva",
            dest_chimgan: "Chimgan",
            dest_fergana: "Fergana",
            dest_kokand: "Kokand",
            explore_tashkent_props: "1,409 properties",
            explore_samarkand_props: "914 properties",
            explore_bukhara_props: "587 properties",
            explore_khiva_props: "163 properties",
            explore_chimgan_props: "20 properties",
            explore_fergana_props: "46 properties",
            trip_tashkent_distance: "7 km away",
            trip_kokand_distance: "165 km away",
            trip_fergana_distance: "237 km away",
            trip_samarkand_distance: "262 km away",
            trip_bukhara_distance: "438 km away",
            trip_khiva_distance: "739 km away",
            deal_premium_hotel: "Premium Hotel",
            deal_luxury_apartment: "Luxury Apartment",
            deal_resort_stay: "Resort Stay",
            deal_villa_retreat: "Villa Retreat",
            deal_price_89: "$89/night",
            deal_price_75: "$75/night",
            deal_price_120: "$120/night",
            deal_price_150: "$150/night",
            destinations_title: "Popular Destinations",
            destinations_subtitle: "Our best offers",
            badge_popular: "Popular",
            badge_sale: "Sale",
            badge_new: "New",
            btn_details: "Details",
            price_per_person: "per person",
            dest1_name: "Dubai, UAE",
            dest1_desc: "Modern architecture meets ancient traditions",
            dest2_name: "Paris, France",
            dest2_desc: "City of love and romance, beautiful architecture",
            dest3_name: "Istanbul, Turkey",
            dest3_desc: "A stunning blend of East and West",
            dest4_name: "Switzerland",
            dest4_desc: "Alps and crystal-clear lakes",
            dest5_name: "Tokyo, Japan",
            dest5_desc: "A unique mix of technology and tradition",
            dest6_name: "Rome, Italy",
            dest6_desc: "Ancient history and magnificent architecture",
            dest7_name: "Bangkok Gourmet, Thailand",
            dest7_desc: "Gastronomic adventures, Michelin dining and personal guides.",
            dest8_name: "London Summit, United Kingdom",
            dest8_desc: "Business conference package, premium hotel and private transfers.",
            dest9_name: "Baku Weekend, Azerbaijan",
            dest9_desc: "Direct flight from Tashkent, 4* hotel and guided city tour.",
            services_title: "Our Services",
            services_subtitle: "Why choose us? We provide the best prices, professional service, and 24/7 support",
            service1_title: "Flights",
            service1_desc: "Book flight tickets at great prices",
            service2_title: "Hotels",
            service2_desc: "Comfortable hotels worldwide",
            service3_title: "Excursions",
            service3_desc: "Exciting tours with professional guides",
            service4_title: "Visa Service",
            service4_desc: "Visa processing",
            service_why: "Why us?",
            service1_advantage_text: "Real-time prices, 500+ airlines, instant booking",
            service2_advantage_text: "50,000+ hotels, best prices, free cancellation",
            service3_advantage_text: "Local guides, personalized itineraries, 24/7 support",
            service4_advantage_text: "Fast visa processing, professional assistance, high success rate",
            btn_ask: "Ask",
            btn_book_now: "Book",
            cat_all: "🔥 Hot",
            cat_solo: "👤 Solo",
            cat_eco: "🌿 Eco",
            cat_family: "👨‍👩‍👧‍👦 Family",
            cat_adventure: "🧗 Adventure",
            cat_exotic: "🏝 Exotic",
            cat_honeymoon: "💍 Honeymoon",
            cat_football: "⚽ Football",
            cat_beach: "🏖 Beach",
            cat_umrah: "🕌 Umrah",
            badge_secure: "Secure Payment",
            badge_verified: "Verified Agency",
            badge_rated: "Top Rated",
            badge_support: "24/7 Support",
            calc_title_main: "Smart Calculator",
            loader_loading: "Loading...",
            tour_new_adventure: "New Adventure",
            tour_new_desc: "Amazing travels and unforgettable memories.",
            btn_consult: "Consult",
            btn_book_short: "Book",
            calc_city_default: "Select city",
            calc_group_popular: "Popular",
            calc_group_all: "All (A-Z)",
            calc_recommend_btn: "Show Recommendations",
            calc_no_results: "No tours found at this price ({budget} sum). Please increase your budget.",
            calc_days: "Days",
            calc_book_btn: "Book Now",
            calc_tier_label: "Travel Tier",
            calc_tier_affordable: "Affordable",
            calc_tier_medium: "Medium",
            calc_tier_premium: "Premium",
            hero_city_placeholder: "Where to?",
            hero_date_placeholder: "When?",
            dest_istanbul: "Istanbul",
            dest_dubai: "Dubai",
            dest_moscow: "Moscow",
            dest_st_petersburg: "St. Petersburg",
            dest_kazan: "Kazan",
            dest_sochi: "Sochi",
            dest_sharm: "Sharm El Sheikh",
            dest_tashkent: "Tashkent",
            dest_samarkand: "Samarkand",
            dest_bukhara: "Bukhara",
            dest_khiva: "Khiva",
            dest_antalya: "Antalya",
            dest_baku: "Baku",
            dest_fergana: "Fergana",
            dest_kuala_lumpur: "Kuala Lumpur",
            dest_london: "London",
            dest_paris: "Paris",
            dest_seoul: "Seoul",
            dest_tokyo: "Tokyo",
            hero_guests_1: "1 person",
            hero_guests_2: "2 persons",
            hero_guests_3: "3 persons",
            hero_guests_4: "4+ persons",
            hero_group_popular: "Popular Destinations",
            hero_group_all: "All Cities (A-Z)",
            nav_categories: "All Categories",
            pay_ph_address: "Full address",
            pay_ph_phone: "+998 xx xxx xx xx",
            pay_ph_card: "1234 5678 9012 3456",
            pay_ph_expiry: "MM/YY",
            pay_ph_cvv: "123",
            forgot_ph_email: "you@example.com",
            reset_ph_new: "••••••••",
            reset_ph_confirm: "••••••••",
            calc_results_title: "Perfect Matches for You",
            calc_title: "Smart Budget Calculator",
            calc_subtitle: "Tell us your budget, we'll find your trip",
            calc_step1_title: "Step 1: Budget & Basic Info",
            calc_step2_title: "Step 2: Choose Your Travel Style",
            calc_budget_label: "What's Your Budget?",
            calc_travelers_label: "Number of Travelers",
            calc_duration_label: "Trip Duration (days - optional)",
            calc_preferences_label: "Choose Your Travel Style (optional)",
            calc_continue_btn: "Continue to Preferences",
            calc_back_btn: "Back",
            calc_find_btn: "Find My Perfect Trip",
            calc_start_over: "Start Over",
            calc_results_subtitle: "Found {count} tours • Sorted by price",
            calc_searching: "Searching for the best matches...",
            calc_no_results_title: "No Matches Found",
            calc_no_results_text: "Try adjusting your budget or preferences to see more options.",
            calc_total_for: "Total for {count} travelers",
            calc_sorted_by: "Sorted by price (cheapest to most expensive)",

            // Budget Ranges
            budget_100_500: "$100 - $500",
            budget_500_1000: "$500 - $1,000",
            budget_1000_2000: "$1,000 - $2,000",
            budget_2000_5000: "$2,000 - $5,000",
            budget_5000_10000: "$5,000 - $10,000",
            budget_10000_plus: "$10,000+",

            // Travel Styles
            style_adventure: "🏔️ Adventure",
            style_luxury: "💎 Luxury",
            style_family: "👨‍👩‍👧‍👦 Family",
            style_beach: "🏖️ Beach",
            style_culture: "🏛️ Culture",
            style_nature: "🌴 Nature",
            style_city: "🌆 City Break",
            style_romantic: "💑 Romantic",



            login_remember_me: "Remember me",
            login_forgot_password: "Forgot password?",
            login_google: "Sign in with Google",
            login_divider_or: "or",
            login_saved_account: "Saved account",
            login_forget_account: "Forget",
            login_use_saved: "Sign in with saved account",
            login_enter_new: "Sign in with another account",
            search_placeholder: "Search tours, destinations...",
            cart_clear: "Clear",
            cart_empty: "Cart is empty",
            cart_total: "Total:",
            cart_checkout: "Checkout",
            footer_all_rights: "All rights reserved.",
            footer_about: "About",
            footer_contact: "Contact",
            footer_privacy: "Privacy",
            footer_terms: "Terms",
            cat_popular: "🔥 Popular",
            cat_affordable: "💰 Affordable",
            cat_exotic: "🏝 Exotic",
            cat_nature: "🌲 Nature",
            badge_top_choice: "Top Choice",
            badge_trending: "Trending",
            badge_iconic: "Iconic",
            badge_history: "History",
            badge_classic: "Classic",
            badge_best_value: "Best Value",
            badge_hot_deal: "Hot Deal",
            badge_budget: "Budget",
            badge_all_inclusive: "All Inclusive",
            badge_culture: "Culture",
            badge_relax: "Relax",
            badge_luxury: "Luxury",
            badge_stunning: "Stunning",
            badge_adventure: "Adventure",
            badge_hot: "Hot",
            badge_paradise: "Paradise",
            badge_value: "Value",
            badge_sea: "Sea",
            badge_fast: "Fast",
            badge_affordable: "Affordable",
            badge_premium: "Premium",
            badge_active: "Active",
            badge_beautiful: "Beautiful",
            badge_economy: "Economy",
            badge_educational: "Educational",
            badge_exciting: "Exciting",
            badge_fun: "Fun",
            badge_group: "Group",
            badge_majestic: "Majestic",
            badge_pure: "Pure",
            badge_romance: "Romance",
            badge_romantic: "Romantic",
            badge_scenic: "Scenic",
            badge_season: "Season",
            badge_serene: "Serene",
            badge_sunset: "Sunset",
            badge_unique: "Unique",
            badge_vip: "VIP",
            badge_wilderness: "Wilderness",
            badge_beach: "Beach",
            alert_login_empty: "Please enter email and password.",
            alert_login_fail: "Incorrect email or password. Please try again.",
            btn_details: "Details",
            alert_fill_all: "Please fill in all required fields.",
            alert_pass_length: "Password must be at least 6 characters long.",
            alert_login_success: "Successfully logged in!",
            alert_google_load_fail: "Google Identity Services not loaded. Please refresh the page.",
            alert_google_cancel: "Google sign-in was canceled or an error occurred.",
            alert_error_general: "An error occurred. Please try again.",
            alert_email_required: "Please enter your email address.",
            alert_pass_mismatch: "Passwords do not match. Please enter again.",
            alert_pass_updated: "Password successfully updated!",
            alert_select_city: "Please select a city!",
            alert_searching: "Searching for: {city}",
            alert_cat_selected: "Category selected: {cat}",
            alert_booking_open: "Opening booking window for {title}...",


            testim_title: "What our travelers say?",
            testim_subtitle: "Real reviews from real people",
            testim_1_name: "Sarah Johnson",
            testim_1_loc: "New York, USA",
            testim_1_text: "\"KETMON made our trip to Dubai absolutely unforgettable! The booking process was simple and customer service was exceptional. Highly recommend!\"",
            testim_1_dest: "📍 Dubai, UAE",
            testim_2_name: "Michael Chen",
            testim_2_loc: "Singapore",
            testim_2_text: "\"Best travel agency I've ever worked with. The Paris package was perfectly curated, every detail thought of. Will definitely book again!\"",
            testim_2_dest: "📍 Paris, France",
            testim_3_name: "Emma Williams",
            testim_3_loc: "London, UK",
            testim_3_text: "\"An amazing experience from start to finish. The team is professional and responsive, helping us create memories of a lifetime!\"",
            testim_3_dest: "📍 Tokyo, Japan",
            stats_travelers: "Happy Travelers",
            stats_destinations: "Destinations",
            stats_satisfaction: "Satisfaction Rate",
            stats_experience: "Years Experience",
            partners_title: "Our Trusted Partners",
            partners_subtitle: "Working with the world's leading travel brands",
            chatbot_title: "KETMON Assistant",
            chatbot_status: "Online",
            chatbot_greeting: "Hello! I am KETMON assistant. How can I help you?",
            chatbot_resp_project: "KETMON is a comprehensive platform revolutionizing tourism in Central Asia. We solve main travel problems for tourists and agencies.",
            chatbot_resp_booking: "To book, find the desired destination, click the 'Book Now' button and enter payment details.",
            chatbot_resp_price: "Prices vary depending on different agencies and packages. Minimum budget starts from 100 USD.",
            chatbot_resp_default: "Sorry, I cannot answer this question. Please ask another question or contact us.",
            chatbot_placeholder: "Type your question...",
            forgot_modal_title: "Reset Password",
            forgot_email_label: "Your Email",
            forgot_note: "A password reset link will be sent to your email address.",
            forgot_btn_send: "Send",
            reset_modal_title: "Set New Password",
            reset_new_label: "New Password",
            reset_confirm_label: "Confirm Password",
            reset_btn_submit: "Update Password",
        },
    };

    // Expose for global access
    window.ketmonI18n = i18n;

    // Helper function for localized alerts
    window.showLocalAlert = function (key, params) {
        var lang = localStorage.getItem('ketmon_lang') || 'uz';
        var dict = (window.ketmonI18n || i18n)[lang] || {};
        var msg = dict[key] || "";
        if (params) {
            for (var p in params) {
                msg = msg.replace('{' + p + '}', params[p]);
            }
        }
        if (msg) alert(msg);
    };


    // Destination Management with Locale Sorting
    const CITIES = [
        { id: 'moscow', popular: true },
        { id: 'st-petersburg', popular: true },
        { id: 'kazan', popular: true },
        { id: 'sochi', popular: true },
        { id: 'tashkent', popular: true },
        { id: 'istanbul', popular: true },
        { id: 'dubai', popular: true },
        { id: 'sharm', popular: true },
        { id: 'antalya', popular: false },
        { id: 'baku', popular: false },
        { id: 'bukhara', popular: false },
        { id: 'fergana', popular: false },
        { id: 'khiva', popular: false },
        { id: 'kuala-lumpur', popular: false },
        { id: 'london', popular: false },
        { id: 'paris', popular: false },
        { id: 'samarkand', popular: false },
        { id: 'seoul', popular: false },
        { id: 'tokyo', popular: false }
    ];

    function populateDestinations(lang) {
        var dict = i18n[lang] || i18n.uz;
        var popularGroupLabel = dict.hero_group_popular || "Popular Destinations";
        var allGroupLabel = dict.hero_group_all || "All Cities (A-Z)";
        var placeholder = dict.hero_city_placeholder || "Qayerga boramiz?";

        // Helper to get translated name
        var getName = function (id) {
            return dict['dest_' + id.replace(/-/g, '_')] || id;
        };

        // Split into groups
        var popular = CITIES.filter(function (c) { return c.popular; });
        var others = CITIES.filter(function (c) { return !c.popular; });

        // Sort 'others' alphabetically by localized name
        others.sort(function (a, b) {
            return getName(a.id).localeCompare(getName(b.id), lang);
        });

        var buildOptions = function (groups) {
            var html = '<option value="" disabled selected>' + placeholder + '</option>';
            groups.forEach(function (g) {
                html += '<optgroup label="' + g.label + '">';
                g.items.forEach(function (item) {
                    html += '<option value="' + item.id + '">' + getName(item.id) + '</option>';
                });
                html += '</optgroup>';
            });
            return html;
        };

        var html = buildOptions([
            { label: popularGroupLabel, items: popular },
            { label: allGroupLabel, items: others }
        ]);

        // Apply to elements
        ['heroCitySelect', 'calcCity'].forEach(function (id) {
            var el = document.getElementById(id);
            if (el) el.innerHTML = html;
        });
    }

    function applyTranslations(lang) {
        var dict = i18n[lang] || i18n.uz;
        // Helper to check whether a user is currently authenticated (local-only check)
        function isAuthenticated() {
            try {
                var u = JSON.parse(localStorage.getItem('ketmon_user') || 'null');
                return !!(u && (u.name || u.email));
            } catch (e) {
                return false;
            }
        }

        // Get all elements with data-text attribute, process from deepest to shallowest
        // This ensures child elements are translated before parent elements
        var allElements = Array.from(document.querySelectorAll('[data-text]'));
        // Sort by depth (deepest first) to avoid overwriting child translations
        allElements.sort(function (a, b) {
            var depthA = 0, depthB = 0;
            var tempA = a, tempB = b;
            while (tempA.parentNode) { depthA++; tempA = tempA.parentNode; }
            while (tempB.parentNode) { depthB++; tempB = tempB.parentNode; }
            return depthB - depthA;
        });

        // Replace inner text for all [data-text] elements
        allElements.forEach(function (el) {
            var key = el.getAttribute('data-text');
            if (key && dict[key] !== undefined) {
                // Skip AI budget label - it should be controlled by currency, not language
                if (key === 'ai_budget_label') {
                    return;
                }

                // Only update if this element doesn't have child elements with data-text
                // (to avoid overwriting child translations)
                var hasTranslatableChildren = Array.from(el.children).some(function (child) {
                    return child.hasAttribute('data-text') || child.querySelector('[data-text]') !== null;
                });

                if (!hasTranslatableChildren) {
                    // If the element represents phone/email and the user is NOT authenticated,
                    // show anonymized placeholders instead of real contact details.
                    if (!isAuthenticated() && (key === 'phone' || key === 'email')) {
                        if (key === 'phone') el.textContent = '*** *** ** **';
                        if (key === 'email') el.textContent = '***@******.uz';
                    } else {
                        el.textContent = dict[key];
                    }
                }
            }
        });

        // Replace placeholders for all elements declaring [data-placeholder]
        document.querySelectorAll('[data-placeholder]').forEach(function (el) {
            var key = el.getAttribute('data-placeholder');
            if (key && dict[key] !== undefined && 'placeholder' in el) {
                el.placeholder = dict[key];
            }
        });

        // Update select options
        document.querySelectorAll('select option[data-text]').forEach(function (option) {
            var key = option.getAttribute('data-text');
            if (key && dict[key] !== undefined) {
                option.textContent = dict[key];
            }
        });

        // Update optgroup labels
        document.querySelectorAll('optgroup[data-text]').forEach(function (group) {
            var key = group.getAttribute('data-text');
            if (key && dict[key] !== undefined) {
                group.label = dict[key];
            }
        });

        // Update AI budget label based on currency (not language) after translation
        var currentCurrency = localStorage.getItem('ketmon_currency') || 'usd';
        if (typeof updateAIBudgetLabel === 'function') {
            updateAIBudgetLabel(currentCurrency);
        }

        // Force update for header buttons specifically (in case they're in hidden containers)
        var headerBookBtns = document.querySelectorAll('header [data-text="nav_book"]');
        headerBookBtns.forEach(function (btn) {
            if (dict.nav_book) btn.textContent = dict.nav_book;
        });
    }

    function changeLang(lang) {
        // Update current language display
        var langCurrent = document.getElementById('langCurrent');
        if (langCurrent) {
            langCurrent.textContent = lang.toUpperCase();
        }

        // Update dropdown items
        var dropdownItems = document.querySelectorAll('.lang-dropdown-item');
        dropdownItems.forEach(function (item) {
            item.classList.remove('active');
            if (item.textContent.trim().toUpperCase() === lang.toUpperCase()) {
                item.classList.add('active');
            }
        });

        applyTranslations(lang);
        populateDestinations(lang);
        localStorage.setItem('ketmon_lang', lang);

        // Dispatch global event for other components
        if (window.cartManager) window.cartManager.updateUI();
        if (window.wishlistManager) window.wishlistManager.updateUI();

        document.dispatchEvent(new CustomEvent('languageChanged', {
            detail: { language: lang }
        }));
    }

    function toggleLangDropdown(e) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
            // Prevent double-tap zoom on mobile
            if (e.touches && e.touches.length > 0) {
                e.preventDefault();
            }
        }
        var dropdown = document.getElementById('langDropdown');
        var selector = document.querySelector('.lang-selector');
        var icon = document.getElementById('langDropdownIcon');
        if (dropdown && selector) {
            var isOpen = dropdown.classList.contains('show');
            // Close currency dropdown if open
            var currencyDropdown = document.getElementById('currencyDropdown');
            if (currencyDropdown) currencyDropdown.classList.remove('show');
            var currencySelector = document.querySelector('.currency-selector');
            if (currencySelector) currencySelector.classList.remove('active');
            var currencyIcon = document.getElementById('currencyDropdownIcon');
            if (currencyIcon) currencyIcon.style.transform = 'rotate(0deg)';

            if (isOpen) {
                dropdown.classList.remove('show');
                selector.classList.remove('active');
                if (icon) icon.style.transform = 'rotate(0deg)';
            } else {
                dropdown.classList.add('show');
                selector.classList.add('active');
                if (icon) icon.style.transform = 'rotate(180deg)';
            }
        }
    }

    function closeLangDropdown() {
        var dropdown = document.getElementById('langDropdown');
        var selector = document.querySelector('.lang-selector');
        var icon = document.getElementById('langDropdownIcon');
        if (dropdown) dropdown.classList.remove('show');
        if (selector) selector.classList.remove('active');
        if (icon) icon.style.transform = 'rotate(0deg)';
    }

    function selectLang(lang, e) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        // Update current language display
        var langCurrent = document.getElementById('langCurrent');
        if (langCurrent) {
            langCurrent.textContent = lang.toUpperCase();
        }

        // Remove active class from all dropdown items
        document.querySelectorAll('.lang-dropdown-item').forEach(function (btn) {
            btn.classList.remove('active');
        });

        // Add active class to selected item
        var items = document.querySelectorAll('.lang-dropdown-item');
        items.forEach(function (item) {
            if (item.textContent.trim() === lang.toUpperCase()) {
                item.classList.add('active');
            }
        });

        // Close dropdown
        closeLangDropdown();

        // Change language
        changeLang(lang);
    }

    window.changeLang = changeLang;
    window.toggleLangDropdown = toggleLangDropdown;
    window.closeLangDropdown = closeLangDropdown;
    window.selectLang = selectLang;
    window.applyTranslations = applyTranslations;
    window.i18n = i18n;

    // Close dropdown when clicking outside
    document.addEventListener('click', function (e) {
        var langDropdown = document.getElementById('langDropdown');
        var langSelector = document.querySelector('.lang-selector');
        var langBtn = document.getElementById('langDropdownBtn');

        if (langDropdown && langSelector && langBtn) {
            // Check if click is outside the language selector
            if (!langSelector.contains(e.target) && !langBtn.contains(e.target)) {
                closeLangDropdown();
            }
        }
    });

    // Init language on load
    document.addEventListener('DOMContentLoaded', function () {
        var saved = localStorage.getItem('ketmon_lang') || 'uz';
        changeLang(saved);
        populateDestinations(saved);
        // Update display and active state
        var langCurrent = document.getElementById('langCurrent');
        if (langCurrent) langCurrent.textContent = saved.toUpperCase();
        var items = document.querySelectorAll('.lang-dropdown-item');
        items.forEach(function (item) {
            item.classList.remove('active');
            if (item.textContent.trim() === saved.toUpperCase()) {
                item.classList.add('active');
            }
        });

        // Ensure the button has proper event handling
        var langBtn = document.getElementById('langDropdownBtn');
        if (langBtn) {
            // Remove any existing onclick and add event listener
            langBtn.onclick = null;
            langBtn.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                toggleLangDropdown(e);
            });
        }
    });
})();

// Currency switcher
(function () {
    // Exchange rates (approximate, update as needed)
    var exchangeRates = {
        usd: {
            sum: 12500,  // 1 USD = 12500 UZS
            rub: 90      // 1 USD = 90 RUB
        },
        rub: {
            sum: 139,    // 1 RUB = 139 UZS
            usd: 0.011   // 1 RUB = 0.011 USD
        },
        sum: {
            usd: 0.00008, // 1 UZS = 0.00008 USD
            rub: 0.0072   // 1 UZS = 0.0072 RUB
        }
    };

    // Store original prices in data attributes
    function initPrices() {
        // Select both .price and .tour-price
        document.querySelectorAll('.price, .tour-price, .total-amount').forEach(function (priceEl) {
            if (!priceEl.hasAttribute('data-original-price')) {
                var text = priceEl.textContent.trim();
                // Extract number from price (e.g., "$1,200" -> 1200)
                var match = text.match(/[\d,.]+/);
                if (match) {
                    var num = parseFloat(match[0].replace(/,/g, ''));
                    priceEl.setAttribute('data-original-price', num);
                    priceEl.setAttribute('data-original-currency', 'usd'); // Defaulting to USD for static content
                }
            }
        });
    }

    // Convert price based on currency
    function convertPrice(originalPrice, fromCurrency, toCurrency) {
        if (fromCurrency === toCurrency) return originalPrice;

        if (fromCurrency === 'usd') {
            if (toCurrency === 'sum') {
                return originalPrice * exchangeRates.usd.sum;
            } else if (toCurrency === 'rub') {
                return originalPrice * exchangeRates.usd.rub;
            }
        } else if (fromCurrency === 'rub') {
            if (toCurrency === 'sum') {
                return originalPrice * exchangeRates.rub.sum;
            } else if (toCurrency === 'usd') {
                return originalPrice * exchangeRates.rub.usd;
            }
        } else if (fromCurrency === 'sum') {
            if (toCurrency === 'usd') {
                return originalPrice * exchangeRates.sum.usd;
            } else if (toCurrency === 'rub') {
                return originalPrice * exchangeRates.sum.rub;
            }
        }
        return originalPrice;
    }

    // Format price with currency symbol
    function formatPrice(amount, currency) {
        var symbols = {
            usd: '$',
            rub: '₽',
            sum: 'so\'m'
        };
        var symbol = symbols[currency] || '';

        if (currency === 'sum') {
            // Format SUM with spaces (e.g., 15 000 000 so'm), round to nearest 1000 if large
            return Math.round(amount).toLocaleString('uz-UZ').replace(/,/g, ' ') + ' ' + symbol;
        } else {
            // Format USD and RUB with commas
            return symbol + Math.round(amount).toLocaleString('en-US');
        }
    }

    // Update all prices on the page
    function updatePrices(currency) {
        document.querySelectorAll('.price, .tour-price, .total-amount').forEach(function (priceEl) {
            var originalPrice = parseFloat(priceEl.getAttribute('data-original-price'));
            var originalCurrency = priceEl.getAttribute('data-original-currency') || 'usd';

            if (!isNaN(originalPrice)) {
                var convertedPrice = convertPrice(originalPrice, originalCurrency, currency);
                priceEl.textContent = formatPrice(convertedPrice, currency);
            }
        });
    }

    function changeCurrency(currency) {
        var currencyMap = {
            'sum': 'SUM',
            'usd': 'USD',
            'rub': 'RUB'
        };

        // Save to local storage
        localStorage.setItem('ketmon_currency', currency);

        // Update current currency display
        var currencyCurrent = document.getElementById('currencyCurrent');
        if (currencyCurrent) {
            currencyCurrent.textContent = currencyMap[currency] || 'SUM';
        }

        // Update dropdown items
        var dropdownItems = document.querySelectorAll('.currency-dropdown-item');
        dropdownItems.forEach(function (item) {
            item.classList.remove('active');
            if (item.textContent.trim() === currencyMap[currency]) {
                item.classList.add('active');
            }
        });

        // Update AI Assistant budget label
        if (typeof updateAIBudgetLabel === 'function') {
            updateAIBudgetLabel(currency);
        }

        // Trigger global price update
        updatePrices(currency);
    }

    // Initialize currency
    var initialCurrency = localStorage.getItem('ketmon_currency') || 'sum';
    initPrices();
    changeCurrency(initialCurrency);

    // Expose helpers
    window.changeCurrency = changeCurrency;
    window.updatePrices = updatePrices;
    window.convertPrice = convertPrice;
    window.formatPrice = formatPrice;
})();

function toggleCurrencyDropdown(e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
        // Prevent double-tap zoom on mobile
        if (e.touches && e.touches.length > 0) {
            e.preventDefault();
        }
    }
    var dropdown = document.getElementById('currencyDropdown');
    var selector = document.querySelector('.currency-selector');
    var icon = document.getElementById('currencyDropdownIcon');
    if (dropdown && selector) {
        var isOpen = dropdown.classList.contains('show');
        // Close language dropdown if open
        var langDropdown = document.getElementById('langDropdown');
        if (langDropdown) langDropdown.classList.remove('show');
        var langSelector = document.querySelector('.lang-selector');
        if (langSelector) langSelector.classList.remove('active');
        var langIcon = document.getElementById('langDropdownIcon');
        if (langIcon) langIcon.style.transform = 'rotate(0deg)';

        if (isOpen) {
            dropdown.classList.remove('show');
            selector.classList.remove('active');
            if (icon) icon.style.transform = 'rotate(0deg)';
        } else {
            dropdown.classList.add('show');
            selector.classList.add('active');
            if (icon) icon.style.transform = 'rotate(180deg)';
        }
    }
}

function closeCurrencyDropdown() {
    var dropdown = document.getElementById('currencyDropdown');
    var selector = document.querySelector('.currency-selector');
    var icon = document.getElementById('currencyDropdownIcon');
    if (dropdown) dropdown.classList.remove('show');
    if (selector) selector.classList.remove('active');
    if (icon) icon.style.transform = 'rotate(0deg)';
}

function selectCurrency(curr, e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    // Update current currency display
    var currencyCurrent = document.getElementById('currencyCurrent');
    if (currencyCurrent) {
        currencyCurrent.textContent = curr.toUpperCase();
    }

    // Remove active class from all dropdown items
    document.querySelectorAll('.currency-dropdown-item').forEach(function (btn) {
        btn.classList.remove('active');
    });

    // Add active class to selected item
    var items = document.querySelectorAll('.currency-dropdown-item');
    items.forEach(function (item) {
        if (item.textContent.trim() === curr.toUpperCase()) {
            item.classList.add('active');
        }
    });

    // Close dropdown
    closeCurrencyDropdown();

    // Update AI Assistant budget label based on currency
    updateAIBudgetLabel(curr);

    // Update currency via existing function
    if (typeof changeCurrency === 'function') {
        changeCurrency(curr);
    }
}

// Update AI Assistant budget label based on selected currency
function updateAIBudgetLabel(currency) {
    var aiBudgetLabel = document.querySelector('label[for="aiBudget"]');
    var aiBudgetInput = document.getElementById('aiBudget');

    if (!aiBudgetLabel || !aiBudgetInput) return;

    // Get current language for "Budjet" word translation
    var currentLang = localStorage.getItem('ketmon_lang') || 'uz';
    var budgetWord = 'Budjet';
    if (currentLang === 'ru') {
        budgetWord = 'Ð‘ÑŽÐ´Ð¶ÐµÑ‚';
    } else if (currentLang === 'en') {
        budgetWord = 'Budget';
    }

    var currencyLabels = {
        'sum': budgetWord + ' (SO\'M)',
        'usd': budgetWord + ' (USD)',
        'rub': budgetWord + ' (RUB)'
    };

    var currencyPlaceholders = {
        'sum': '15000000',
        'usd': '1500',
        'rub': '135000'
    };

    var currencyMinValues = {
        'sum': '1250000',
        'usd': '100',
        'rub': '9000'
    };

    // Update label
    aiBudgetLabel.textContent = currencyLabels[currency] || currencyLabels['usd'];

    // Update placeholder
    if (aiBudgetInput) {
        aiBudgetInput.placeholder = currencyPlaceholders[currency] || currencyPlaceholders['usd'];
        aiBudgetInput.setAttribute('min', currencyMinValues[currency] || currencyMinValues['usd']);
    }
}

// Make functions globally accessible
window.changeCurrency = changeCurrency;
window.toggleCurrencyDropdown = toggleCurrencyDropdown;
window.closeCurrencyDropdown = closeCurrencyDropdown;
window.selectCurrency = selectCurrency;
window.updateAIBudgetLabel = updateAIBudgetLabel;

// Close dropdowns when clicking outside
document.addEventListener('click', function (e) {
    var langSelector = document.querySelector('.lang-selector');
    var langDropdown = document.getElementById('langDropdown');
    var currencySelector = document.querySelector('.currency-selector');
    var currencyDropdown = document.getElementById('currencyDropdown');
    var userAccountSelector = document.querySelector('.user-account-selector');
    var userAccountDropdown = document.getElementById('userAccountDropdown');

    if (langSelector && langDropdown) {
        if (!langSelector.contains(e.target) && langDropdown.classList.contains('show')) {
            closeLangDropdown();
        }
    }

    if (currencySelector && currencyDropdown) {
        if (!currencySelector.contains(e.target) && currencyDropdown.classList.contains('show')) {
            closeCurrencyDropdown();
        }
    }

    if (userAccountSelector && userAccountDropdown) {
        if (!userAccountSelector.contains(e.target) && userAccountDropdown.classList.contains('show')) {
            closeUserAccountDropdown();
        }
    }
});

// User Account Dropdown Functions
function toggleUserAccountDropdown(e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    var dropdown = document.getElementById('userAccountDropdown');
    var selector = document.querySelector('.user-account-selector');
    if (dropdown && selector) {
        var isOpen = dropdown.classList.contains('show');
        // Close other dropdowns if open
        var langDropdown = document.getElementById('langDropdown');
        if (langDropdown) langDropdown.classList.remove('show');
        var langSelector = document.querySelector('.lang-selector');
        if (langSelector) langSelector.classList.remove('active');
        var currencyDropdown = document.getElementById('currencyDropdown');
        if (currencyDropdown) currencyDropdown.classList.remove('show');
        var currencySelector = document.querySelector('.currency-selector');
        if (currencySelector) currencySelector.classList.remove('active');

        if (isOpen) {
            dropdown.classList.remove('show');
            selector.classList.remove('active');
        } else {
            // Show dropdown first, then add show class for animation
            dropdown.style.display = 'flex';
            // Force reflow
            dropdown.offsetHeight;
            // Add show class for animation
            setTimeout(function () {
                dropdown.classList.add('show');
                selector.classList.add('active');
            }, 10);
        }
    }
}

function closeUserAccountDropdown() {
    var dropdown = document.getElementById('userAccountDropdown');
    var selector = document.querySelector('.user-account-selector');
    if (dropdown) {
        dropdown.classList.remove('show');
        // Hide after animation completes
        setTimeout(function () {
            if (!dropdown.classList.contains('show')) {
                dropdown.style.display = 'none';
            }
        }, 300);
    }
    if (selector) selector.classList.remove('active');
}

// Make functions globally accessible
window.toggleUserAccountDropdown = toggleUserAccountDropdown;
window.closeUserAccountDropdown = closeUserAccountDropdown;

// Init currency on load
document.addEventListener('DOMContentLoaded', function () {
    initPrices();
    var saved = localStorage.getItem('ketmon_currency') || 'sum';
    changeCurrency(saved);
    // Update display and active state
    var currencyCurrent = document.getElementById('currencyCurrent');
    if (currencyCurrent) currencyCurrent.textContent = saved.toUpperCase();
    var items = document.querySelectorAll('.currency-dropdown-item');
    items.forEach(function (item) {
        item.classList.remove('active');
        if (item.textContent.trim() === saved.toUpperCase()) {
            item.classList.add('active');
        }
    });

    // Update AI Assistant budget label on page load
    if (typeof updateAIBudgetLabel === 'function') {
        updateAIBudgetLabel(saved);
    }
});

/* Removed mobile navigation toggle */

// Search button interaction
(function () {
    var btn = document.querySelector('.search-btn');
    if (!btn) return;
    btn.addEventListener('click', function () {
        var destination = document.querySelector('[data-placeholder=\"search_destination_placeholder\"]')?.value || '';
        var date = document.querySelector('.search-input input[type=\"date\"]')?.value || '';
        var duration = document.querySelectorAll('.search-input select')[0]?.value || '';
        var guests = document.querySelectorAll('.search-input select')[1]?.value || '';

        // Navigate to destinations
        var dest = document.getElementById('destinations');
        if (dest) {
            const header = document.querySelector('.main-header');
            const headerHeight = header ? header.offsetHeight : 80;
            smoothScrollTo(dest, headerHeight, 600);
        }
    });
})();

// Category Filter Logic
(function () {
    const catBtns = document.querySelectorAll('.category-btn');
    const destGrid = document.querySelector('.destination-grid');

    if (!catBtns.length || !destGrid) return; // Grid might be missing if on wrong page

    catBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            // UI Toggle
            catBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            const cat = this.getAttribute('data-cat');

            // Clear grid to simulate fresh filter
            destGrid.innerHTML = '';

            // Visual loading
            const loading = document.createElement('div');
            loading.className = 'loading-spinner-grid';
            loading.style.textAlign = 'center';
            loading.style.padding = '20px';
            loading.style.color = '#fff';
            loading.textContent = 'Loading ' + cat + ' tours...';
            destGrid.appendChild(loading);

            setTimeout(() => {
                loading.remove();

                // Repopulate with mock cards
                // We try to find a template or just create generic ones
                // Note: In a real app we would filter the `tourData` array and render.

                for (let i = 0; i < 6; i++) {
                    const card = document.createElement('div');
                    card.className = 'destination-card';
                    card.setAttribute('data-category', cat);
                    card.innerHTML = `
                        <div class="destination-img">
                             <img src="https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80" alt="Tour ${i}">
                             <span class="destination-badge">${cat.toUpperCase()}</span>
                        </div>
                        <div class="destination-info">
                            <h3 class="destination-title">${cat.charAt(0).toUpperCase() + cat.slice(1)} Adventure ${i + 1}</h3>
                            <p class="destination-desc">Experience the best of ${cat} travel styles with our premium package.</p>
                            <div class="destination-footer">
                                <div class="price-block">
                                    <div class="price">$${600 + i * 50}</div>
                                </div>
                                <div class="card-buttons">
                                    <a href="#" class="btn-consult">Maslahat</a>
                                    <a href="#paymentModal" class="btn-book">Bron</a>
                                </div>
                            </div>
                        </div>
                    `;
                    // Add click handler for modal
                    card.addEventListener('click', function () {
                        // We can call openModal logic if exposed, or just rely on global delegation if setup
                        // The global delegation is setup on document or grid? 
                        // Check HandleCard below... it's inside a closure. 
                        // But we can trigger a click on a known element or just re-add listener if needed.
                        // Actually, existing logic uses delegated event listener on `grid`?
                    });

                    destGrid.appendChild(card);
                }
            }, 600);
        });
    });
})();

// Tour Modal functionality
(function () {
    var modal = document.getElementById('tourModal');
    var closeBtn = document.getElementById('tourModalClose');
    var titleEl = document.getElementById('tourModalTitle');
    var imgEl = document.getElementById('tourModalImage');
    var descEl = document.getElementById('tourModalDescription');
    var metaEl = document.getElementById('tourModalMeta');
    var bookBtn = document.getElementById('tourBookBtn');

    function openModal() {
        if (!modal) modal = document.getElementById('tourModal');
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
    }
    function closeModal() {
        modal.classList.remove('open');
        document.body.style.overflow = '';
    }
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (modal) {
        modal.addEventListener('click', function (e) {
            if (e.target === modal) closeModal();
        });
    }
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
    });

    // Delegated handler so it works for dynamically cloned cards
    function handleCard(card) {
        var titleNode = card.querySelector('.destination-title');
        var descNode = card.querySelector('.destination-desc');
        var priceNode = card.querySelector('.price');
        var badgeNode = card.querySelector('.destination-badge');
        var imgNode = card.querySelector('.destination-img img');

        var title = (titleNode ? titleNode.textContent : 'Tour').trim();
        var desc = (descNode ? descNode.textContent : 'Tour description').trim();
        var price = (priceNode ? priceNode.textContent : '').trim();
        var badge = (badgeNode ? badgeNode.textContent : '').trim();
        var agencyValue = card.getAttribute('data-agency');
        var agencyNameEl = document.querySelector('.agency-card[data-agency="' + agencyValue + '"] h3');
        var agencyName = agencyNameEl ? agencyNameEl.textContent.trim() : '';
        var imgSrc = imgNode ? imgNode.getAttribute('src') : '';

        titleEl.textContent = title;
        descEl.textContent = desc + (price ? ' â€¢ ' + price : '');
        metaEl.innerHTML = '';
        if (badge) {
            var chip = document.createElement('span');
            chip.className = 'meta-chip';
            chip.textContent = badge;
            metaEl.appendChild(chip);
        }
        if (price) {
            var chip2 = document.createElement('span');
            chip2.className = 'meta-chip';
            chip2.textContent = price;
            metaEl.appendChild(chip2);
        }
        if (agencyName) {
            var chip3 = document.createElement('span');
            chip3.className = 'meta-chip';
            chip3.textContent = agencyName;
            metaEl.appendChild(chip3);
        }
        if (imgSrc) {
            imgEl.src = imgSrc;
            imgEl.alt = title + ' image';
        } else {
            imgEl.src = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop';
            imgEl.alt = 'Tour image';
        }

        // Booking button opens payment modal
        bookBtn.onclick = function () {
            window.currentTourBooking = {
                title: title,
                price: price,
                description: desc,
                agency: agencyName,
                image: imgSrc || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop'
            };
            closeModal();
            var paymentModal = document.getElementById('paymentModal');
            if (paymentModal) {
                var paymentTourName = document.getElementById('paymentTourName');
                var paymentTourPrice = document.getElementById('paymentTourPrice');
                if (paymentTourName) paymentTourName.textContent = title;
                if (paymentTourPrice) paymentTourPrice.textContent = price || 'Narx aniqlanmoqda';
                paymentModal.classList.add('open');
                document.body.style.overflow = 'hidden';
            }
        };

        // Consultation Button Logic
        var consultBtn = document.getElementById('tourConsultBtn');
        if (!consultBtn && bookBtn && bookBtn.parentNode) {
            consultBtn = document.createElement('button');
            consultBtn.id = 'tourConsultBtn';
            consultBtn.className = 'btn-secondary';
            consultBtn.setAttribute('data-text', 'tour_consult_btn');

            // Set initial text based on current language
            var currentLang = localStorage.getItem('ketmon_lang') || 'uz';
            if (window.i18n && window.i18n[currentLang]) {
                consultBtn.textContent = window.i18n[currentLang].tour_consult_btn;
            } else {
                consultBtn.textContent = 'Maslahat olish';
            }

            consultBtn.style.marginRight = '10px';
            // Insert before book button
            bookBtn.parentNode.insertBefore(consultBtn, bookBtn);
        }

        if (consultBtn) {
            consultBtn.onclick = function () {
                closeModal();
                if (window.openChatbot) {
                    window.openChatbot('agency', {
                        agencyName: agencyName,
                        tourTitle: title
                    });
                }
            };
        }

        openModal();
    }

    var destGrid = document.querySelector('.destinations .destination-grid');
    if (destGrid) {
        destGrid.addEventListener('click', function (e) {
            var card = e.target.closest('.destination-card');
            if (!card || !destGrid.contains(card)) return;
            handleCard(card);
        });
    }
})();

/* Repeat "Popular Destinations" horizontally on demand so users can keep scrolling on mobile */
(function () {
    var grid = document.querySelector('.destinations .destination-grid');
    if (!grid) return;
    var originals = Array.prototype.slice.call(grid.querySelectorAll('.destination-card'));
    if (!originals.length) return;

    function appendBatch() {
        var frag = document.createDocumentFragment();
        for (var i = 0; i < originals.length; i++) {
            frag.appendChild(originals[i].cloneNode(true));
        }
        grid.appendChild(frag);
    }

    function ensureLength() {
        var rounds = 0;
        while (grid.scrollWidth < grid.clientWidth * 3 && rounds < 4) {
            appendBatch();
            rounds++;
        }
    }

    function maybeExtend() {
        var remaining = grid.scrollWidth - (grid.scrollLeft + grid.clientWidth);
        if (remaining < 80) {
            appendBatch();
        }
    }

    function enable() {
        ensureLength();
        // Throttled scroll listener
        var ticking = false;
        grid.addEventListener('scroll', function () {
            if (!ticking) {
                window.requestAnimationFrame(function () {
                    maybeExtend();
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });
    }

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        enable();
    } else {
        document.addEventListener('DOMContentLoaded', enable);
    }
    window.addEventListener('resize', ensureLength);
})();

// Manual scroll handling removed to strictly use CSS scroll-snap


// Agency filter interactions
(function () {
    var agencySelect = document.getElementById('agencyFilter');
    var tourCards = Array.from(document.querySelectorAll('.destination-card'));
    var agencyTypeButtons = Array.from(document.querySelectorAll('.agency-toolbar button'));
    var currentAgency = 'all';
    var currentType = 'all';

    function syncToolbar() {
        agencyTypeButtons.forEach(function (btn) {
            btn.classList.toggle('active', (btn.getAttribute('data-filter') || 'all') === currentType);
        });
    }

    function applyFilter() {
        // Filter tours
        tourCards.forEach(function (card) {
            var agency = card.getAttribute('data-agency');
            var type = card.getAttribute('data-type') || 'all';
            var agencyMatch = currentAgency === 'all' || agency === currentAgency;
            var typeMatch = currentType === 'all' || type === currentType;
            var shouldShow = agencyMatch && typeMatch;
            card.classList.toggle('hidden', !shouldShow);
        });

        // Filter agencies (query current cards to include any clones)
        var allAgencyCards = Array.from(document.querySelectorAll('.agency-card'));
        allAgencyCards.forEach(function (card) {
            var agency = card.getAttribute('data-agency');
            var type = card.getAttribute('data-type') || 'all';
            var typeAllowed = currentType === 'all' || type === currentType;
            var agencyMatch = currentAgency === 'all' || agency === currentAgency;
            var shouldShow = typeAllowed && (currentAgency === 'all' || agencyMatch);
            card.classList.toggle('hidden', !shouldShow);
            card.classList.toggle('active', agencyMatch);
        });
    }

    if (agencySelect) {
        agencySelect.addEventListener('change', function () {
            currentAgency = agencySelect.value || 'all';
            applyFilter();
        });
        currentAgency = agencySelect.value || 'all';
    }

    agencyTypeButtons.forEach(function (btn) {
        btn.addEventListener('click', function () {
            currentType = btn.getAttribute('data-filter') || 'all';
            currentAgency = 'all';
            if (agencySelect) agencySelect.value = 'all';
            syncToolbar();
            applyFilter();
        });
    });

    // Per-card click for existing cards (kept)
    Array.from(document.querySelectorAll('.agency-card')).forEach(function (card) {
        card.addEventListener('click', function () {
            var value = card.getAttribute('data-agency');
            var type = card.getAttribute('data-type') || 'all';
            currentAgency = value;
            currentType = type;
            if (agencySelect) {
                agencySelect.value = value;
            }
            syncToolbar();
            applyFilter();
            var destEl = document.getElementById('destinations');
            if (destEl) {
                const header = document.querySelector('.main-header');
                const headerHeight = header ? header.offsetHeight : 80;
                smoothScrollTo(destEl, headerHeight, 600);
            }
        });
    });

    // Delegated click so cloned cards behave the same
    var agencyGrid = document.querySelector('.agency-section .agency-grid');
    if (agencyGrid) {
        agencyGrid.addEventListener('click', function (e) {
            var card = e.target.closest('.agency-card');
            if (!card || !agencyGrid.contains(card)) return;
            var value = card.getAttribute('data-agency');
            var type = card.getAttribute('data-type') || 'all';
            currentAgency = value;
            currentType = type;
            if (agencySelect) agencySelect.value = value;
            syncToolbar();
            applyFilter();
            var destEl = document.getElementById('destinations');
            if (destEl) {
                const header = document.querySelector('.main-header');
                const headerHeight = header ? header.offsetHeight : 80;
                smoothScrollTo(destEl, headerHeight, 600);
            }
        });
    }

    // Initialize filter state
    if (agencyTypeButtons.length) {
        var defaultBtn = agencyTypeButtons.find(function (btn) { return btn.classList.contains('active'); }) || agencyTypeButtons[0];
        currentType = defaultBtn ? defaultBtn.getAttribute('data-filter') || 'all' : 'all';
        syncToolbar();
    }
    applyFilter();
})();

/* Infinite horizontal scroll for Agency grid (Hamkor Agentliklar) */
(function () {
    var grid = document.querySelector('.agency-section .agency-grid');
    if (!grid) return;
    var originals = Array.prototype.slice.call(grid.querySelectorAll('.agency-card'));
    if (!originals.length) return;

    function appendBatch() {
        var frag = document.createDocumentFragment();
        for (var i = 0; i < originals.length; i++) {
            frag.appendChild(originals[i].cloneNode(true));
        }
        grid.appendChild(frag);
    }

    function ensureLength() {
        var rounds = 0;
        while (grid.scrollWidth < grid.clientWidth * 3 && rounds < 4) {
            appendBatch();
            rounds++;
        }
    }

    function maybeExtend() {
        var remaining = grid.scrollWidth - (grid.scrollLeft + grid.clientWidth);
        if (remaining < 80) appendBatch();
    }

    function enable() {
        ensureLength();
        // Throttled scroll listener
        var ticking = false;
        grid.addEventListener('scroll', function () {
            if (!ticking) {
                window.requestAnimationFrame(function () {
                    maybeExtend();
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });
    }

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        enable();
    } else {
        document.addEventListener('DOMContentLoaded', enable);
    }
    window.addEventListener('resize', ensureLength);
})();

// Payment Modal functionality
// Payment Modal functionality
(function () {
    var paymentModal = document.getElementById('paymentModal');
    var paymentCloseBtn = document.getElementById('paymentModalClose');
    var paymentCancelBtn = document.getElementById('paymentCancel');
    var paymentForm = document.getElementById('paymentForm');
    var cardNumberInput = document.getElementById('paymentCardNumber');
    var expiryInput = document.getElementById('paymentExpiry');
    var cvvInput = document.getElementById('paymentCVV');

    function openPaymentModal(tourName, tourPrice) {
        // Populate tour details if provided
        if (tourName && tourPrice) {
            var tourNameEl = document.getElementById('paymentTourName');
            var tourPriceEl = document.getElementById('paymentTourPrice');

            // Dynamic Currency Conversion
            // 1. Extract numeric value (assuming input is always USD like "$1,200")
            var rawPrice = parseFloat(tourPrice.replace(/[^0-9.]/g, ''));

            // 2. Get current currency
            var currentCurrency = localStorage.getItem('ketmon_currency') || 'sum';

            // 3. Convert and format if valid number
            var displayPrice = tourPrice;
            if (!isNaN(rawPrice)) {
                // Assume input price is USD if it starts with $ or just generically
                var converted = convertPrice(rawPrice, 'usd', currentCurrency);
                displayPrice = formatPrice(converted, currentCurrency);
            }

            if (tourNameEl) {
                tourNameEl.textContent = tourName;
            }
            if (tourPriceEl) {
                tourPriceEl.textContent = 'Narx: ' + displayPrice;
            }

            // Store tour info for form submission
            window.currentTourBooking = {
                name: tourName,
                price: displayPrice,
                rawPrice: rawPrice, // Store raw USD for backend if needed
                currency: currentCurrency
            };
        }

        paymentModal.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closePaymentModal() {
        paymentModal.classList.remove('open');
        document.body.style.overflow = '';
        paymentForm.reset();
    }

    // Close handlers
    if (paymentCloseBtn) {
        paymentCloseBtn.addEventListener('click', closePaymentModal);
    }
    if (paymentCancelBtn) {
        paymentCancelBtn.addEventListener('click', closePaymentModal);
    }
    if (paymentModal) {
        paymentModal.addEventListener('click', function (e) {
            if (e.target === paymentModal) closePaymentModal();
        });
    }
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && paymentModal.classList.contains('open')) {
            closePaymentModal();
        }
    });

    // Format card number (add spaces every 4 digits)
    if (cardNumberInput) {
        cardNumberInput.addEventListener('input', function (e) {
            var value = e.target.value.replace(/\s/g, '');
            var formatted = value.match(/.{1,4}/g)?.join(' ') || value;
            e.target.value = formatted;
        });
    }

    // Format expiry date (MM/YY)
    if (expiryInput) {
        expiryInput.addEventListener('input', function (e) {
            var value = e.target.value.replace(/\D/g, '');
            if (value.length >= 2) {
                value = value.substring(0, 2) + '/' + value.substring(2, 4);
            }
            e.target.value = value;
        });
    }

    // Only allow numbers for CVV
    if (cvvInput) {
        cvvInput.addEventListener('input', function (e) {
            e.target.value = e.target.value.replace(/\D/g, '');
        });
    }

    // Handle form submission
    // Payment method selection handler
    var paymentMethodInputs = document.querySelectorAll('input[name="paymentMethod"]');
    var paymentCardFields = document.getElementById('paymentCardFields');
    var paymentCardNumberField = document.getElementById('paymentCardNumber');

    function togglePaymentFields(method) {
        var paymentExpiryField = document.getElementById('paymentExpiry');
        var paymentCVVField = document.getElementById('paymentCVV');

        if (method === 'installment') {
            // For installment payment, show only card number, hide CVV and expiry
            if (paymentCardFields) {
                paymentCardFields.style.display = 'none';
            }
            if (paymentCardNumberField) {
                paymentCardNumberField.setAttribute('required', 'required');
            }
            // Remove required from CVV and expiry for installment
            if (paymentExpiryField) {
                paymentExpiryField.removeAttribute('required');
                paymentExpiryField.value = ''; // Clear value
            }
            if (paymentCVVField) {
                paymentCVVField.removeAttribute('required');
                paymentCVVField.value = ''; // Clear value
            }
            // Update submit button text
            var submitBtn = paymentForm.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.textContent = 'Bo\'lib to\'lashni boshlash';
            }
        } else {
            // For full payment, show all card fields and make them required
            if (paymentCardFields) {
                paymentCardFields.style.display = 'grid';
            }
            if (paymentCardNumberField) {
                paymentCardNumberField.setAttribute('required', 'required');
            }
            if (paymentExpiryField) {
                paymentExpiryField.setAttribute('required', 'required');
            }
            if (paymentCVVField) {
                paymentCVVField.setAttribute('required', 'required');
            }
            // Update submit button text
            var submitBtn = paymentForm.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.textContent = 'To\'lovni amalga oshirish';
            }
        }
    }

    // Add event listeners to payment method radio buttons
    if (paymentMethodInputs.length > 0) {
        paymentMethodInputs.forEach(function (radio) {
            radio.addEventListener('change', function () {
                togglePaymentFields(this.value);
            });
        });

        // Initialize on page load
        var selectedMethod = document.querySelector('input[name="paymentMethod"]:checked');
        if (selectedMethod) {
            togglePaymentFields(selectedMethod.value);
        }
    }

    if (paymentForm) {
        paymentForm.addEventListener('submit', function (e) {
            e.preventDefault();

            // Get selected payment method
            var paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value || 'full';

            // Get form data
            var formData = {
                name: document.getElementById('paymentName').value,
                email: document.getElementById('paymentEmail').value,
                phone: document.getElementById('paymentPhone').value,
                paymentMethod: paymentMethod,
                cardNumber: document.getElementById('paymentCardNumber').value.replace(/\s/g, ''),
                expiry: paymentMethod === 'full' ? document.getElementById('paymentExpiry').value : '',
                cvv: paymentMethod === 'full' ? document.getElementById('paymentCVV').value : '',
                address: document.getElementById('paymentAddress').value,
                tour: window.currentTourBooking || {}
            };



            // Simulate payment processing
            var submitBtn = paymentForm.querySelector('button[type="submit"]');
            var originalText = submitBtn.textContent;
            submitBtn.textContent = 'To\'lov amalga oshirilmoqda...';
            submitBtn.disabled = true;

            // Simulate API call
            setTimeout(function () {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;

                // Show success message based on payment method
                var successMessage = paymentMethod === 'installment'
                    ? 'Bo\'lib to\'lash muvaffaqiyatli boshlandi! Batafsil ma\'lumot telefon orqali yuboriladi.'
                    : 'To\'lov muvaffaqiyatli amalga oshirildi! Batafsil ma\'lumot email orqali yuboriladi.';
                alert(successMessage);

                // Close modal and reset form
                closePaymentModal();

                // Optional: Redirect or show confirmation
                // window.location.href = '/confirmation';
            }, 2000);
        });
    }

    // Make openPaymentModal available globally if needed
    window.openPaymentModal = openPaymentModal;
    window.closePaymentModal = closePaymentModal;
})();

// Chatbot functionality moved and consolidated below


// Header CTAs interactions
(function () {
    var book = document.querySelector('header [data-text=\"nav_book\"]');

    if (book) book.addEventListener('click', function (e) {
        // Scroll to search section as a booking entry point
        var anchor = document.getElementById('search');
        if (anchor) {
            e.preventDefault();
            const header = document.querySelector('.main-header');
            const headerHeight = header ? header.offsetHeight : 80;
            smoothScrollTo(anchor, headerHeight, 600);
        }
    });
    // Open login/register modals
    var loginModal = document.getElementById('loginModal');
    var registerModal = document.getElementById('registerModal');
    function open(el) { el.classList.add('open'); document.body.style.overflow = 'hidden'; }
    function close(el) { el.classList.remove('open'); document.body.style.overflow = ''; }

    // Update header actions according to auth state
    function updateHeaderAuth() {
        var acc = document.getElementById('accountLink');
        var logoutBtn = document.getElementById('logoutBtn');
        var loginBtn = document.getElementById('topBarLoginBtn');
        var regBtn = document.getElementById('topBarRegisterBtn');
        // Mobile menu buttons
        var mobileAcc = document.getElementById('mobileAccountLink');
        var mobileLogoutBtn = document.getElementById('mobileLogoutBtn');
        var mobileLoginBtn = document.getElementById('mobileLoginBtn');
        var mobileRegBtn = document.getElementById('mobileRegisterBtn');
        // User account dropdown buttons
        var userAcc = document.getElementById('userAccountLink');
        var userLogoutBtn = document.getElementById('userAccountLogoutBtn');
        var userLoginBtn = document.getElementById('userAccountLoginBtn');
        var userRegBtn = document.getElementById('userAccountRegisterBtn');
        var user = null;
        try { user = JSON.parse(localStorage.getItem('ketmon_user') || 'null'); } catch (e) { }
        if (user && (user.name || user.email)) {
            if (acc) {
                acc.style.display = 'inline-flex';
                acc.textContent = user.name ? (user.name.split(' ')[0]) : 'Profil';
            }
            if (logoutBtn) logoutBtn.style.display = 'inline-flex';
            if (loginBtn) loginBtn.style.display = 'none';
            if (regBtn) regBtn.style.display = 'none';
            // Update mobile menu
            if (mobileAcc) {
                mobileAcc.style.display = 'block';
                mobileAcc.textContent = user.name ? (user.name.split(' ')[0]) : 'Profil';
            }
            if (mobileLogoutBtn) mobileLogoutBtn.style.display = 'block';
            if (mobileLoginBtn) mobileLoginBtn.style.display = 'none';
            if (mobileRegBtn) mobileRegBtn.style.display = 'none';
            // Update user account dropdown
            if (userAcc) {
                userAcc.style.display = 'block';
                userAcc.textContent = user.name ? (user.name.split(' ')[0]) : 'Profil';
            }
            if (userLogoutBtn) userLogoutBtn.style.display = 'block';
            if (userLoginBtn) userLoginBtn.style.display = 'none';
            if (userRegBtn) userRegBtn.style.display = 'none';
        } else {
            if (acc) acc.style.display = 'none';
            if (logoutBtn) logoutBtn.style.display = 'none';
            if (loginBtn) loginBtn.style.display = '';
            if (regBtn) regBtn.style.display = '';
            // Update mobile menu
            if (mobileAcc) mobileAcc.style.display = 'none';
            if (mobileLogoutBtn) mobileLogoutBtn.style.display = 'none';
            if (mobileLoginBtn) mobileLoginBtn.style.display = 'block';
            if (mobileRegBtn) mobileRegBtn.style.display = 'block';
            // Update user account dropdown
            if (userAcc) userAcc.style.display = 'none';
            if (userLogoutBtn) userLogoutBtn.style.display = 'none';
            if (userLoginBtn) userLoginBtn.style.display = 'block';
            if (userRegBtn) userRegBtn.style.display = 'block';
        }
    }

    // Logout function - clears auth data and updates header
    window.logout = function () {
        try {
            localStorage.removeItem('ketmon_user');
            localStorage.removeItem('ketmon_token');
            localStorage.removeItem('ketmon_avatar');
            localStorage.removeItem('ketmon_agency');
        } catch (e) {
            console.error('Logout error:', e);
        }
        updateHeaderAuth();
        // If on profile page, redirect to home
        if (window.location.pathname.includes('profile.html')) {
            window.location.href = 'index.html';
        }
    };
    document.addEventListener('DOMContentLoaded', updateHeaderAuth);
    updateHeaderAuth();

    // Add event listeners to all login/register buttons (top bar only)
    var topBarLoginBtn = document.getElementById('topBarLoginBtn');
    var topBarRegisterBtn = document.getElementById('topBarRegisterBtn');

    // Note: topBarLoginBtn handler will be updated later to include saved account functionality
    if (topBarLoginBtn) {
        topBarLoginBtn.addEventListener('click', function (e) { e.preventDefault(); open(loginModal); });
    }
    if (topBarRegisterBtn) {
        topBarRegisterBtn.addEventListener('click', function (e) { e.preventDefault(); open(registerModal); });
    }

    // Mobile menu login/register buttons
    var mobileLoginBtn = document.getElementById('mobileLoginBtn');
    var mobileRegisterBtn = document.getElementById('mobileRegisterBtn');
    if (mobileLoginBtn) {
        mobileLoginBtn.addEventListener('click', function (e) { e.preventDefault(); open(loginModal); });
    }
    if (mobileRegisterBtn) {
        mobileRegisterBtn.addEventListener('click', function (e) { e.preventDefault(); open(registerModal); });
    }

    // User account dropdown login/register buttons
    var userAccountLoginBtn = document.getElementById('userAccountLoginBtn');
    var userAccountRegisterBtn = document.getElementById('userAccountRegisterBtn');
    var loginModal = document.getElementById('loginModal');
    var registerModal = document.getElementById('registerModal');

    if (userAccountLoginBtn) {
        userAccountLoginBtn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            closeUserAccountDropdown();
            if (loginModal) {
                setTimeout(function () {
                    loginModal.classList.add('open');
                    document.body.style.overflow = 'hidden';
                }, 100);
            }
        });
    }
    if (userAccountRegisterBtn) {
        userAccountRegisterBtn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            closeUserAccountDropdown();
            if (registerModal) {
                setTimeout(function () {
                    registerModal.classList.add('open');
                    document.body.style.overflow = 'hidden';
                }, 100);
            }
        });
    }

    const hamburgerBtn = document.getElementById('hamburgerBtn');
    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            var mobileNav = document.getElementById('mobileNav');
            if (mobileNav) {
                var isOpen = mobileNav.classList.contains('open');
                if (isOpen) {
                    // Close menu
                    mobileNav.classList.remove('open');
                    mobileNav.setAttribute('aria-hidden', 'true');
                    hamburgerBtn.classList.remove('active');
                    document.body.style.overflow = '';
                } else {
                    // Open menu
                    mobileNav.classList.add('open');
                    mobileNav.setAttribute('aria-hidden', 'false');
                    hamburgerBtn.classList.add('active');
                    document.body.style.overflow = 'hidden';
                    // adjust panel top to match header height
                    // var panel = mobileNav.querySelector('.mobile-nav-panel');
                    // try {
                    //     var hdr = document.querySelector('.main-header');
                    //     if (panel && hdr) panel.style.top = (hdr.offsetHeight || 64) + 'px';
                    // } catch (e) {}
                }
            }
        });
    }

    // Hamburger menu toggle functions
    // window.toggleMobileMenu = function(e) {
    //     if (e) {
    //         e.preventDefault();
    //         e.stopPropagation();
    //     }
    //     var mobileNav = document.getElementById('mobileNav');
    //     var hamburgerBtn = document.getElementById('hamburgerBtn');
    //     if (mobileNav && hamburgerBtn) {
    //         var isOpen = mobileNav.classList.contains('open');
    //         if (isOpen) {
    //             // Close menu
    //             mobileNav.classList.remove('open');
    //             mobileNav.setAttribute('aria-hidden', 'true');
    //             hamburgerBtn.classList.remove('active');
    //             document.body.style.overflow = '';
    //             // Remove backdrop
    //             setTimeout(function() {
    //                 if (!mobileNav.classList.contains('open')) {
    //                     mobileNav.style.display = 'none';
    //                 }
    //             }, 300);
    //         } else {
    //             // Open menu
    //             mobileNav.style.display = 'block';
    //             setTimeout(function() {
    //                 mobileNav.classList.add('open');
    //                 mobileNav.setAttribute('aria-hidden', 'false');
    //                 hamburgerBtn.classList.add('active');
    //                 document.body.style.overflow = 'hidden';
    //             }, 10);
    //         }
    //     }
    // };

    // window.closeMobileMenu = function() {
    //     var mobileNav = document.getElementById('mobileNav');
    //     var hamburgerBtn = document.getElementById('hamburgerBtn');
    //     if (mobileNav && hamburgerBtn) {
    //         mobileNav.classList.remove('open');
    //         mobileNav.setAttribute('aria-hidden', 'true');
    //         hamburgerBtn.classList.remove('active');
    //         document.body.style.overflow = '';
    //         // Remove backdrop after animation
    //         setTimeout(function() {
    //             if (!mobileNav.classList.contains('open')) {
    //                 mobileNav.style.display = 'none';
    //             }
    //         }, 300);
    //     }
    // };

    // // Close mobile menu when clicking on backdrop or outside
    // document.addEventListener('click', function(e) {
    //     var mobileNav = document.getElementById('mobileNav');
    //     var hamburgerBtn = document.getElementById('hamburgerBtn');
    //     var mobileNavList = mobileNav && mobileNav.querySelector('.mobile-nav-list');
    //     if (mobileNav && hamburgerBtn && mobileNav.classList.contains('open')) {
    //         // Close if clicking on backdrop (mobile-nav but not on the list) or outside
    //         if (mobileNav === e.target || (!mobileNavList.contains(e.target) && !hamburgerBtn.contains(e.target))) {
    //             window.closeMobileMenu();
    //         }
    //     }
    // });

    // // Add touch event listener for hamburger button (mobile support)
    // document.addEventListener('DOMContentLoaded', function() {
    //     var hamburgerBtn = document.getElementById('hamburgerBtn');
    //     if (hamburgerBtn) {
    //         // Use click event instead of touchstart to avoid conflicts
    //         hamburgerBtn.addEventListener('click', function(e) {
    //             e.preventDefault();
    //             e.stopPropagation();
    //             window.toggleMobileMenu(e);
    //         });
    //     }
    // });

    // Mobile menu toggle: clone desktop nav into mobile panel and handle open/close
    var mobileToggle = document.getElementById('mobileMenuToggle');
    var mobileNav = document.getElementById('mobileNav');
    var mobileNavList = mobileNav && mobileNav.querySelector('.mobile-nav-list');

    function closeMobileNav() {
        if (mobileNav) {
            document.body.style.overflow = '';
            if (mobileToggle) mobileToggle.classList.remove('active');
            mobileNav.classList.remove('open');
            mobileNav.setAttribute('aria-hidden', 'true');
            if (mobileToggle) mobileToggle.setAttribute('aria-expanded', 'false');
            // allow body scroll again
            document.body.classList.remove('no-scroll');
        }
    }

    function openMobileNav() {
        if (mobileNav) {
            mobileNav.classList.add('open');
            mobileNav.setAttribute('aria-hidden', 'false');
            if (mobileToggle) mobileToggle.setAttribute('aria-expanded', 'true');
            // prevent page scroll while menu is open
            document.body.classList.add('no-scroll');
            // adjust panel top to match header height
            var panel = mobileNav.querySelector('.mobile-nav-panel');
            try {
                var hdr = document.querySelector('.main-header');
                if (panel && hdr) panel.style.top = (hdr.offsetHeight || 64) + 'px';
            } catch (e) { }
        }
    }

    function toggleMobileNav(e) {
        if (!mobileNav) return;
        var isOpen = mobileNav.classList.contains('open');
        if (isOpen) closeMobileNav(); else openMobileNav();
    }

    if (mobileToggle && mobileNavList) {
        // Generate mobile nav links from desktop nav
        var desktopNav = document.querySelector('.desktop-nav ul');
        if (desktopNav) {
            mobileNavList.innerHTML = desktopNav.innerHTML;
            // Remove any tooltips or desktop-specific attributes
            mobileNavList.querySelectorAll('[data-text]').forEach(function (el) { el.removeAttribute('data-text'); });
        }
        mobileToggle.addEventListener('click', function (e) {
            e.stopPropagation(); toggleMobileNav(e);
            mobileToggle.setAttribute('aria-expanded', mobileNav.classList.contains('open') ? 'true' : 'false');
        });

        // Backdrop click closes menu
        var mobileNavBackdrop = document.querySelector('.mobile-nav-backdrop');
        if (mobileNavBackdrop) {
            mobileNavBackdrop.addEventListener('click', function () { closeMobileNav(); });
        }

        // Close mobile nav when clicking a nav link
        mobileNavList.addEventListener('click', function (e) {
            var a = e.target.closest('a');
            if (a) { closeMobileNav(); }
        });

        // Close when clicking outside
        document.addEventListener('click', function (e) {
            if (!mobileNav.contains(e.target) && !mobileToggle.contains(e.target)) {
                closeMobileNav();
            }
        });

        // Close on resize to larger screens
        window.addEventListener('resize', function () {
            if (window.innerWidth > 768) closeMobileNav();
            // Also refresh panel top when resizing
            var panel = mobileNav && mobileNav.querySelector('.mobile-nav-panel');
            var hdr = document.querySelector('.main-header');
            try { if (panel && hdr) panel.style.top = (hdr.offsetHeight || 64) + 'px'; } catch (e) { }
        });

        // Close with ESC
        document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMobileNav(); });
    }

    // Expose a friendly alias used by inline onclick attributes
    window.closeMobileMenu = function () { closeMobileNav(); };

    // Close buttons and backdrop clicks
    document.getElementById('loginModalClose').addEventListener('click', function () { close(loginModal); });
    document.getElementById('registerModalClose').addEventListener('click', function () { close(registerModal); });
    loginModal.addEventListener('click', function (e) { if (e.target === loginModal) close(loginModal); });
    registerModal.addEventListener('click', function (e) { if (e.target === registerModal) close(registerModal); });

    // License Modal
    var licenseModal = document.getElementById('licenseModal');
    var licenseData = {
        'atlas': {
            name: 'Atlas Travel',
            number: 'UZ-TA-2021-AT-001234',
            issued: '2021-03-15',
            expires: '2026-03-15',
            authority: 'O\'zbekiston Respublikasi Turizm va madaniy meros vazirligi'
        },
        'samarqand': {
            name: 'Samarqand Tours',
            number: 'UZ-TA-2019-ST-005678',
            issued: '2019-06-20',
            expires: '2024-06-20',
            authority: 'O\'zbekiston Respublikasi Turizm va madaniy meros vazirligi'
        },
        'nomad': {
            name: 'Nomad Explorer',
            number: 'UZ-TA-2020-NE-003456',
            issued: '2020-09-10',
            expires: '2025-09-10',
            authority: 'O\'zbekiston Respublikasi Turizm va madaniy meros vazirligi'
        },
        'clubtravel': {
            name: 'ClubTravel UZ',
            number: 'UZ-TA-2018-CT-007890',
            issued: '2018-11-25',
            expires: '2023-11-25',
            authority: 'O\'zbekiston Respublikasi Turizm va madaniy meros vazirligi'
        },
        'silk': {
            name: 'Silk Road Elite',
            number: 'UZ-TA-2022-SR-009012',
            issued: '2022-01-18',
            expires: '2027-01-18',
            authority: 'O\'zbekiston Respublikasi Turizm va madaniy meros vazirligi'
        },
        'azialux': {
            name: 'AziaLux Travel',
            number: 'UZ-TA-2021-AL-004567',
            issued: '2021-05-12',
            expires: '2026-05-12',
            authority: 'O\'zbekiston Respublikasi Turizm va madaniy meros vazirligi'
        },
        'globalvoyage': {
            name: 'Global Voyage Hub',
            number: 'UZ-TA-2020-GV-008901',
            issued: '2020-08-30',
            expires: '2025-08-30',
            authority: 'O\'zbekiston Respublikasi Turizm va madaniy meros vazirligi'
        }
    };

    window.showLicense = function (agencyId) {
        var data = licenseData[agencyId];
        if (!data) return;

        document.getElementById('licenseAgencyName').textContent = data.name;
        document.getElementById('licenseNumber').textContent = data.number;
        document.getElementById('licenseIssued').textContent = data.issued;
        document.getElementById('licenseExpires').textContent = data.expires;
        document.getElementById('licenseAuthority').textContent = data.authority;

        // Apply translations
        var lang = localStorage.getItem('ketmon_lang') || 'uz';
        var dict = window.i18n && window.i18n[lang] || {};

        // Apply translations to all license modal elements
        var titleEl = document.getElementById('licenseModalTitle');
        if (titleEl && dict.license_title) titleEl.textContent = dict.license_title;

        document.querySelectorAll('[data-text^="license_"]').forEach(function (el) {
            var key = el.getAttribute('data-text');
            if (key && dict[key] !== undefined) {
                el.textContent = dict[key];
            }
        });

        open(licenseModal);
    };

    document.getElementById('licenseModalClose').addEventListener('click', function () { close(licenseModal); });
    licenseModal.addEventListener('click', function (e) { if (e.target === licenseModal) close(licenseModal); });

    // All Destinations Modal
    var allDestinationsModal = document.getElementById('allDestinationsModal');
    var allDestinationsGrid = document.getElementById('allDestinationsGrid');

    window.showAllDestinations = function () {
        // Clear previous content
        allDestinationsGrid.innerHTML = '';

        // Get all destination cards from the page
        var destinationCards = document.querySelectorAll('.destination-card');

        // Clone and add each destination card to the modal
        destinationCards.forEach(function (card) {
            var clonedCard = card.cloneNode(true);
            allDestinationsGrid.appendChild(clonedCard);
        });

        // Apply translations
        var lang = localStorage.getItem('ketmon_lang') || 'uz';
        var dict = window.i18n && window.i18n[lang] || {};
        if (dict.destinations_title) {
            document.getElementById('allDestinationsModalTitle').textContent = dict.destinations_title;
        }

        // Apply translations to cloned cards
        if (window.applyTranslations) {
            window.applyTranslations(lang);
        }

        open(allDestinationsModal);
    };

    document.getElementById('allDestinationsModalClose').addEventListener('click', function () { close(allDestinationsModal); });
    allDestinationsModal.addEventListener('click', function (e) { if (e.target === allDestinationsModal) close(allDestinationsModal); });

    // All Agencies Modal
    var allAgenciesModal = document.getElementById('allAgenciesModal');
    var allAgenciesGrid = document.getElementById('allAgenciesGrid');

    window.showAllAgencies = function () {
        // Clear previous content
        allAgenciesGrid.innerHTML = '';

        // Get all agency cards from the page
        var agencyCards = document.querySelectorAll('.agency-card');

        // Clone and add each agency card to the modal
        agencyCards.forEach(function (card) {
            var clonedCard = card.cloneNode(true);
            allAgenciesGrid.appendChild(clonedCard);
        });

        // Apply translations
        var lang = localStorage.getItem('ketmon_lang') || 'uz';
        var dict = window.i18n && window.i18n[lang] || {};
        if (dict.agency_section_title) {
            document.getElementById('allAgenciesModalTitle').textContent = dict.agency_section_title;
        }

        // Apply translations to cloned cards
        if (window.applyTranslations) {
            window.applyTranslations(lang);
        }

        open(allAgenciesModal);
    };

    document.getElementById('allAgenciesModalClose').addEventListener('click', function () { close(allAgenciesModal); });
    allAgenciesModal.addEventListener('click', function (e) { if (e.target === allAgenciesModal) close(allAgenciesModal); });

    // Saved account functionality
    function loadSavedAccount() {
        var savedAccount = localStorage.getItem('ketmon_saved_account');
        var savedAccountDisplay = document.getElementById('savedAccountDisplay');
        var loginFormFields = document.getElementById('loginFormFields');
        var savedAccountEmail = document.getElementById('savedAccountEmail');

        if (savedAccount) {
            var accountData = JSON.parse(savedAccount);
            savedAccountEmail.textContent = accountData.email;
            savedAccountDisplay.style.display = 'block';
            loginFormFields.style.display = 'none';
        } else {
            savedAccountDisplay.style.display = 'none';
            loginFormFields.style.display = 'block';
        }
    }

    function useSavedAccount() {
        var savedAccount = localStorage.getItem('ketmon_saved_account');
        if (!savedAccount) return;

        var accountData = JSON.parse(savedAccount);

        // Auto-fill email only - user must still enter password
        document.getElementById('loginEmail').value = accountData.email;
        document.getElementById('loginPassword').focus();

        // Hide saved account display and show login form
        var savedAccountDisplay = document.getElementById('savedAccountDisplay');
        var loginFormFields = document.getElementById('loginFormFields');
        if (savedAccountDisplay) savedAccountDisplay.style.display = 'none';
        if (loginFormFields) loginFormFields.style.display = 'block';
    }

    function forgetSavedAccount() {
        if (confirm('Saqlangan akkauntni o\'chirishni xohlaysizmi?')) {
            localStorage.removeItem('ketmon_saved_account');
            loadSavedAccount();
        }
    }

    function enterNewAccount() {
        var savedAccountDisplay = document.getElementById('savedAccountDisplay');
        var loginFormFields = document.getElementById('loginFormFields');
        savedAccountDisplay.style.display = 'none';
        loginFormFields.style.display = 'block';
        document.getElementById('loginEmail').focus();
    }

    // Load saved account when login modal opens
    function originalOpenLogin() {
        open(loginModal);
        loadSavedAccount();
    }

    // Update login button handler to load saved account (replaces earlier handler)
    if (topBarLoginBtn) {
        // Clone node to remove all event listeners
        var newLoginBtn = topBarLoginBtn.cloneNode(true);
        topBarLoginBtn.parentNode.replaceChild(newLoginBtn, topBarLoginBtn);
        topBarLoginBtn = newLoginBtn;
        topBarLoginBtn.addEventListener('click', function (e) {
            e.preventDefault();
            originalOpenLogin();
        });
    }

    document.getElementById('loginToRegister').addEventListener('click', function () {
        close(loginModal);
        open(registerModal);
    });

    document.getElementById('registerToLogin').addEventListener('click', function () {
        close(registerModal);
        originalOpenLogin();
    });

    // Saved account button handlers
    document.getElementById('useSavedAccountBtn').addEventListener('click', useSavedAccount);
    document.getElementById('forgetAccountBtn').addEventListener('click', forgetSavedAccount);
    document.getElementById('enterNewAccountBtn').addEventListener('click', enterNewAccount);

    // Handle submit - Backend API
    document.getElementById('loginForm').addEventListener('submit', async function (e) {
        e.preventDefault();
        var email = document.getElementById('loginEmail').value.trim().toLowerCase();
        var password = document.getElementById('loginPassword').value || '';
        var rememberMe = document.getElementById('rememberMe').checked;

        // Validate inputs
        if (!email || !password) {
            showLocalAlert('alert_login_empty');
            return;
        }

        try {
            // Call backend API
            var response = await authAPI.login(email, password);

            if (response.success) {
                // Store token and user data
                setAuthToken(response.token);
                localStorage.setItem('ketmon_user', JSON.stringify(response.user));

                // Save account if "remember me" is checked
                if (rememberMe) {
                    localStorage.setItem('ketmon_saved_account', JSON.stringify({ email: email }));
                }

                close(loginModal);
                updateHeaderAuth();
                window.location.href = 'profile.html';
            }
        } catch (error) {
            showLocalAlert('alert_login_fail');
            document.getElementById('loginPassword').value = '';
        }
    });
    document.getElementById('registerForm').addEventListener('submit', async function (e) {
        e.preventDefault();
        var role = document.getElementById('regRole').value;

        try {
            var response;

            if (role === 'agency') {
                var aname = document.getElementById('regAgencyName').value.trim() || '';
                var lic = document.getElementById('regLicense').value.trim() || '';
                var email = document.getElementById('regAgencyEmail').value.trim().toLowerCase() || '';
                var phone = document.getElementById('regAgencyPhone').value.trim() || '';
                var password = document.getElementById('regAgencyPassword').value || '';

                // Validate required fields
                if (!aname || !email || !password) {
                    showLocalAlert('alert_fill_all');
                    return;
                }

                if (password.length < 6) {
                    showLocalAlert('alert_pass_length');
                    return;
                }

                // Call backend API
                response = await authAPI.registerAgency({
                    name: aname,
                    email: email,
                    password: password,
                    license: lic,
                    phone: phone
                });
            } else {
                var name = document.getElementById('regName').value.trim() || '';
                var email = document.getElementById('regEmail').value.trim().toLowerCase() || '';
                var password = document.getElementById('regPassword').value || '';

                // Validate required fields
                if (!name || !email || !password) {
                    showLocalAlert('alert_fill_all');
                    return;
                }

                if (password.length < 6) {
                    showLocalAlert('alert_pass_length');
                    return;
                }

                // Call backend API
                response = await authAPI.registerCustomer({
                    name: name,
                    email: email,
                    password: password
                });
            }

            if (response.success) {
                // Store token and user data
                setAuthToken(response.token);
                localStorage.setItem('ketmon_user', JSON.stringify(response.user));

                if (response.agency) {
                    localStorage.setItem('ketmon_agency', JSON.stringify(response.agency));
                }

                close(registerModal);
                updateHeaderAuth();
                window.location.href = 'profile.html';
            }
        } catch (error) {
            showLocalAlert('alert_error_general');
        }
    });

    // Esc key to close auth modals
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            if (loginModal.classList.contains('open')) close(loginModal);
            if (registerModal.classList.contains('open')) close(registerModal);
        }
    });

    // Register tabs toggle
    var regRoleInput = document.getElementById('regRole');
    var tabCustomer = document.getElementById('regTabCustomer');
    var tabAgency = document.getElementById('regTabAgency');
    var fieldsCustomer = document.getElementById('regFieldsCustomer');
    var fieldsAgency = document.getElementById('regFieldsAgency');
    function setRole(role) {
        regRoleInput.value = role;
        if (role === 'agency') {
            tabAgency.classList.add('active'); tabAgency.setAttribute('aria-selected', 'true');
            tabCustomer.classList.remove('active'); tabCustomer.setAttribute('aria-selected', 'false');
            fieldsAgency.classList.remove('hidden'); fieldsCustomer.classList.add('hidden');
            // Relax required on hidden fields
            document.getElementById('regName').required = false;
            document.getElementById('regEmail').required = false;
            document.getElementById('regPassword').required = false;
            // Agency fields not strictly required for demo
        } else {
            tabCustomer.classList.add('active'); tabCustomer.setAttribute('aria-selected', 'true');
            tabAgency.classList.remove('active'); tabAgency.setAttribute('aria-selected', 'false');
            fieldsCustomer.classList.remove('hidden'); fieldsAgency.classList.add('hidden');
            document.getElementById('regName').required = true;
            document.getElementById('regEmail').required = true;
            document.getElementById('regPassword').required = true;
        }
    }
    tabCustomer.addEventListener('click', function () { setRole('customer'); });
    tabAgency.addEventListener('click', function () { setRole('agency'); });
    // ensure default state
    setRole('customer');
})();
// Agency filter interactions
// Agency filter interactions (Legacy - Disabled to fix missing cards)
/*
(function () {
    var agencySelect = document.getElementById('agencyFilter');
    // ... logic removed ...
})();
*/

/* Infinite horizontal scroll for Agency grid (Hamkor Agentliklar) */
(function () {
    var grid = document.querySelector('.agency-section .agency-grid');
    if (!grid) return;
    var originals = Array.prototype.slice.call(grid.querySelectorAll('.agency-card'));
    if (!originals.length) return;

    function appendBatch() {
        var frag = document.createDocumentFragment();
        for (var i = 0; i < originals.length; i++) {
            frag.appendChild(originals[i].cloneNode(true));
        }
        grid.appendChild(frag);
    }

    function ensureLength() {
        var rounds = 0;
        while (grid.scrollWidth < grid.clientWidth * 3 && rounds < 4) {
            appendBatch();
            rounds++;
        }
    }

    function maybeExtend() {
        var remaining = grid.scrollWidth - (grid.scrollLeft + grid.clientWidth);
        if (remaining < 80) appendBatch();
    }

    function enable() {
        ensureLength();
        grid.addEventListener('scroll', maybeExtend, { passive: true });
    }

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        enable();
    } else {
        document.addEventListener('DOMContentLoaded', enable);
    }
    window.addEventListener('resize', ensureLength);
})();
// Trip category buttons (Legacy - Disabled)
/*
(function () {
    // ...
})();
*/
// AI Assistant functionality
var aiForm = document.getElementById('aiForm');
var aiResponse = document.getElementById('aiResponse');
var aiSeason = document.getElementById('aiSeason');
var aiMonthField = document.getElementById('aiMonthField');
var aiMonth = document.getElementById('aiMonth');

// Season to months mapping
var seasonMonths = {
    'summer': ['june', 'july', 'august'],      // Yoz: Iyun, Iyul, Avgust
    'autumn': ['september', 'october', 'november'], // Kuz: Sentabr, Oktabr, Noyabr
    'winter': ['december', 'january', 'february'],  // Qish: Dekabr, Yanvar, Fevral
    'spring': ['march', 'april', 'may']        // Bahor: Mart, Aprel, May
};

// Store all month options
var allMonthOptions = [];
if (aiMonth) {
    var options = aiMonth.querySelectorAll('option');
    options.forEach(function (opt) {
        allMonthOptions.push({
            value: opt.value,
            text: opt.textContent,
            dataText: opt.getAttribute('data-text'),
            element: opt.cloneNode(true)
        });
    });
}

function filterMonthsBySeason(season) {
    if (!aiMonth) return;

    // Clear current options except the first (default "Tanlang")
    aiMonth.innerHTML = '';

    // Add default option
    var defaultOption = allMonthOptions[0];
    if (defaultOption) {
        var opt = defaultOption.element.cloneNode(true);
        aiMonth.appendChild(opt);
    }

    // Filter and add months based on season
    if (seasonMonths[season]) {
        seasonMonths[season].forEach(function (val) {
            var found = allMonthOptions.find(function (o) { return o.value === val; });
            if (found) {
                aiMonth.appendChild(found.element.cloneNode(true));
            }
        });
    }
}

// Add event listener for season change
if (aiSeason) {
    aiSeason.addEventListener('change', function () {
        filterMonthsBySeason(this.value);
    });
}

// Smart Calculator Implementation (Updated for Tiers)
(function () {
    const tierBtns = document.querySelectorAll('.tier-btn');
    const recommendBtn = document.getElementById("calcRecommendBtn");
    // Default tier
    let currentTier = "medium";

    // Set initial active state if not set
    if (tierBtns.length > 0) {
        // Find if one is already active, if not activate medium
        let hasActive = false;
        tierBtns.forEach(btn => {
            if (btn.classList.contains('active')) hasActive = true;
        });
        if (!hasActive) {
            const mediumBtn = document.querySelector('.tier-btn[data-tier="medium"]');
            if (mediumBtn) mediumBtn.classList.add('active');
        }
    }

    tierBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            tierBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentTier = this.getAttribute('data-tier');
        });
    });

    if (recommendBtn) {
        recommendBtn.addEventListener('click', function () {
            var city = document.getElementById('heroCitySelect') ? document.getElementById('heroCitySelect').value : '';



            // Scroll to destinations
            const dest = document.getElementById('destinations');
            if (dest) {
                const header = document.querySelector('.main-header');
                const headerHeight = header ? header.offsetHeight : 80;
                // Assuming smoothScrollTo is defined globally as seen in file
                if (typeof smoothScrollTo === 'function') {
                    smoothScrollTo(dest, headerHeight, 600);
                } else {
                    dest.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    }
})();


// Password Toggle Functionality
function togglePasswordVisibility(inputId, button) {
    var input = document.getElementById(inputId);
    if (!input) return;

    var eyeOpen = button.querySelector('.eye-open');
    var eyeClosed = button.querySelector('.eye-closed');

    if (input.type === 'password') {
        input.type = 'text';
        if (eyeOpen) eyeOpen.style.display = 'none';
        if (eyeClosed) eyeClosed.style.display = 'block';
        button.setAttribute('aria-label', 'Hide password');
    } else {
        input.type = 'password';
        if (eyeOpen) eyeOpen.style.display = 'block';
        if (eyeClosed) eyeClosed.style.display = 'none';
        button.setAttribute('aria-label', 'Show password');
    }
}

// Make function globally accessible
window.togglePasswordVisibility = togglePasswordVisibility;

// Social Login Functions
// Configuration - Replace these with your actual credentials
// IMPORTANT: Use your CLIENT ID (looks like: 123456789-xxxxx.apps.googleusercontent.com)
// NOT the Client Secret (which starts with GOCSPX-)
var GOOGLE_CLIENT_ID = '735852390296-378bisf38fhib67o72rjmdm5spv945cs.apps.googleusercontent.com'; // Replace with your Google Client ID

// Helper function to handle successful social login - Backend API
async function handleSocialLoginSuccess(userData, provider) {
    // console.log('handleSocialLoginSuccess called with provider:', provider, 'userData:', userData);
    try {
        var response;

        if (provider === 'google') {
            // For Google, send the credential token to backend
            if (userData.credential) {
                // console.log('Calling authAPI.loginWithGoogle with credential...');
                response = await authAPI.loginWithGoogle(userData.credential);
                // console.log('Backend response:', response);
            } else {
                // Fallback: if we have user data but no credential, create user manually
                // This shouldn't happen, but handle it gracefully
                console.error('Google credential not found in userData');
                throw new Error('Google credential not found');
            }
        } else {
            console.error('Unknown provider:', provider);
            throw new Error('Unknown provider');
        }

        if (response && response.success) {
            // console.log('Login successful, updating UI...');
            // Store token and user data
            setAuthToken(response.token);
            localStorage.setItem('ketmon_user', JSON.stringify(response.user));

            // Update header
            if (typeof updateHeaderAuth === 'function') {
                updateHeaderAuth();
            }

            // Close login modal
            var loginModal = document.getElementById('loginModal');
            if (loginModal) {
                loginModal.classList.remove('open');
                document.body.style.overflow = '';
            }

            // Close user account dropdown
            if (typeof closeUserAccountDropdown === 'function') {
                closeUserAccountDropdown();
            }

            // Show success message
            showLocalAlert('alert_login_success');

            // Redirect to profile or refresh page
            if (window.location.pathname.includes('profile.html')) {
                window.location.reload();
            } else {
                window.location.href = 'profile.html';
            }
        }
    } catch (error) {
        console.error('Error handling social login:', error);
        var errorMsg = error.message || 'Xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.';

        // Provide more specific error messages
        if (error.message && error.message.includes('400')) {
            errorMsg = '400 xatolik: Google Client ID noto\'g\'ri yoki backend sozlamalari xato.\n\nIltimos, tekshiring:\n1. Google Client ID to\'g\'ri sozlanganligini\n2. Backend server ishlamoqda va GOOGLE_CLIENT_ID sozlanganligini\n3. Authorized JavaScript origins ga sahifangiz URL qo\'shilganligini';
        } else if (error.message && (error.message.includes('NetworkError') || error.message.includes('Failed to fetch'))) {
            errorMsg = 'Backend serverga ulanib bo\'lmadi.\n\nIltimos, tekshiring:\n1. Backend server ishlamoqda (http://localhost:3000)\n2. API_BASE_URL to\'g\'ri sozlanganligini';
        }

        alert(errorMsg);
    }
}

// Google Sign-In Function
function loginWithGoogle() {
    // console.log('Google login function called');

    // Check if Google Identity Services is loaded
    if (typeof google === 'undefined' || !google.accounts) {
        console.error('Google Identity Services not loaded');
        alert('Google Identity Services yuklanmagan. Iltimos, sahifani yangilang va qayta urinib ko\'ring.');
        return;
    }

    // console.log('Google Identity Services loaded, Client ID:', GOOGLE_CLIENT_ID);

    // Check if client ID is configured
    if (GOOGLE_CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID' || !GOOGLE_CLIENT_ID) {
        alert('Google Client ID sozlanmagan. Iltimos, script.js faylida GOOGLE_CLIENT_ID ni o\'rnating.\n\nGoogle Cloud Console dan Client ID olish:\n1. https://console.cloud.google.com ga kiring\n2. API & Services > Credentials\n3. Create Credentials > OAuth client ID\n4. Web application tanlang va Client ID ni oling\n\nMUHIM: Client ID (123456789-xxxxx.apps.googleusercontent.com) ishlatish kerak, Client Secret (GOCSPX-...) emas!');
        return;
    }

    // Validate Client ID format (should end with .apps.googleusercontent.com)
    // If it looks like a Client Secret (starts with GOCSPX-), show error
    if (GOOGLE_CLIENT_ID.startsWith('GOCSPX-')) {
        alert('XATO: Siz Client Secret ishlatyapsiz, Client ID emas!\n\nClient ID shunday ko\'rinadi: 123456789-xxxxx.apps.googleusercontent.com\nClient Secret esa shunday: GOCSPX-xxxxx\n\nIltimos, Google Cloud Console dan to\'g\'ri Client ID ni oling va qo\'ying.');
        return;
    }

    // Warn if Client ID doesn't look like a valid format
    if (!GOOGLE_CLIENT_ID.includes('.apps.googleusercontent.com')) {
        console.warn('Google Client ID format noto\'g\'ri ko\'rinadi. To\'g\'ri format: 123456789-xxxxx.apps.googleusercontent.com');
    }

    // Use Google Sign-In with proper ID token flow
    try {
        // Initialize Google Identity Services with callback
        google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: function (response) {
                // console.log('Google callback received:', response);
                // Handle the credential (ID token) response
                if (response.credential) {
                    // console.log('Google credential received, sending to backend...');
                    // Send credential to backend
                    handleSocialLoginSuccess({ credential: response.credential }, 'google');
                } else {
                    console.error('No credential in Google response:', response);
                    alert('Google kirish bekor qilindi yoki xatolik yuz berdi.');
                }
            },
            auto_select: false,
            cancel_on_tap_outside: true
        });

        // Find or create button container in the login modal
        var loginModal = document.getElementById('loginModal');
        var buttonContainer = null;

        if (loginModal) {
            // Check if container already exists
            buttonContainer = loginModal.querySelector('#google-signin-button-container');

            if (!buttonContainer) {
                // Find the existing Google button
                var existingGoogleBtn = loginModal.querySelector('.google-btn');
                if (existingGoogleBtn) {
                    // Create container next to existing button
                    buttonContainer = document.createElement('div');
                    buttonContainer.id = 'google-signin-button-container';
                    buttonContainer.style.display = 'inline-block';
                    buttonContainer.style.verticalAlign = 'middle';

                    // Insert before or replace the existing button
                    var parent = existingGoogleBtn.parentNode;
                    if (parent) {
                        parent.insertBefore(buttonContainer, existingGoogleBtn);
                        existingGoogleBtn.style.display = 'none'; // Hide the old button
                    }
                } else {
                    // Create new container in social login section
                    var socialSection = loginModal.querySelector('.social-login-section');
                    if (socialSection) {
                        buttonContainer = document.createElement('div');
                        buttonContainer.id = 'google-signin-button-container';
                        buttonContainer.style.textAlign = 'center';
                        buttonContainer.style.marginTop = '10px';
                        socialSection.appendChild(buttonContainer);
                    }
                }
            }
        }

        // If no modal or container found, create a temporary one
        if (!buttonContainer) {
            buttonContainer = document.createElement('div');
            buttonContainer.id = 'google-signin-button-container';
            buttonContainer.style.position = 'fixed';
            buttonContainer.style.left = '-9999px';
            buttonContainer.style.opacity = '0';
            document.body.appendChild(buttonContainer);
        }

        // Render Google Sign-In button
        google.accounts.id.renderButton(
            buttonContainer,
            {
                theme: 'outline',
                size: 'large',
                type: 'standard',
                text: 'signin_with',
                shape: 'rectangular',
                logo_alignment: 'left',
                width: '300'
            }
        );

        // If it's a hidden temporary container, try to trigger it
        if (buttonContainer.style.position === 'fixed') {
            setTimeout(function () {
                var googleButton = buttonContainer.querySelector('div[role="button"]');
                if (googleButton) {
                    // Try to trigger the button
                    try {
                        googleButton.click();
                    } catch (e) {
                        // If click doesn't work, show One Tap as fallback
                        google.accounts.id.prompt();
                    }

                    // Clean up after delay
                    setTimeout(function () {
                        if (buttonContainer.parentNode && buttonContainer.style.position === 'fixed') {
                            document.body.removeChild(buttonContainer);
                        }
                    }, 2000);
                } else {
                    // Button didn't render, try One Tap
                    google.accounts.id.prompt();
                }
            }, 300);
        } else {
            // For visible buttons, also try One Tap as a convenience
            google.accounts.id.prompt();
        }

    } catch (error) {
        console.error('Error initializing Google Sign-In:', error);
        alert('Google kirishni boshlashda xatolik yuz berdi: ' + error.message + '\n\nIltimos, sahifani yangilang va qayta urinib ko\'ring.');
    }
}

// Make functions globally accessible
window.loginWithGoogle = loginWithGoogle;
window.handleSocialLoginSuccess = handleSocialLoginSuccess;

// Forgot Password Modal Functions
function openForgotPasswordModal() {
    var modal = document.getElementById('forgotPasswordModal');
    if (modal) {
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
    }
}

function closeForgotPasswordModal() {
    var modal = document.getElementById('forgotPasswordModal');
    if (modal) {
        modal.classList.remove('open');
        document.body.style.overflow = '';
    }
}

// Reset Password Modal Functions
function openResetPasswordModal() {
    var modal = document.getElementById('resetPasswordModal');
    if (modal) {
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
    }
}

function closeResetPasswordModal() {
    var modal = document.getElementById('resetPasswordModal');
    if (modal) {
        modal.classList.remove('open');
        document.body.style.overflow = '';
    }
}

// Make functions globally accessible
window.openForgotPasswordModal = openForgotPasswordModal;
window.closeForgotPasswordModal = closeForgotPasswordModal;
window.openResetPasswordModal = openResetPasswordModal;
window.closeResetPasswordModal = closeResetPasswordModal;

// Forgot Password Form Handler
document.addEventListener('DOMContentLoaded', function () {
    var forgotPasswordForm = document.getElementById('forgotPasswordForm');
    var forgotPasswordModal = document.getElementById('forgotPasswordModal');
    var forgotPasswordModalClose = document.getElementById('forgotPasswordModalClose');
    var resetPasswordForm = document.getElementById('resetPasswordForm');
    var resetPasswordModal = document.getElementById('resetPasswordModal');
    var resetPasswordModalClose = document.getElementById('resetPasswordModalClose');

    // Forgot Password Form Submission - Backend API
    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            var email = document.getElementById('forgotPasswordEmail').value.trim().toLowerCase();

            if (!email) {
                showLocalAlert('alert_email_required');
                return;
            }

            try {
                var response = await passwordAPI.forgotPassword(email);
                alert(response.message || 'Parolni tiklash haqida xabar emailga yuborildi');
                closeForgotPasswordModal();
            } catch (error) {
                alert(error.message || 'Xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.');
            }
        });
    }

    // Close Forgot Password Modal
    if (forgotPasswordModalClose) {
        forgotPasswordModalClose.addEventListener('click', closeForgotPasswordModal);
    }

    if (forgotPasswordModal) {
        forgotPasswordModal.addEventListener('click', function (e) {
            if (e.target === forgotPasswordModal) {
                closeForgotPasswordModal();
            }
        });
    }

    // Reset Password Form Submission - Backend API
    if (resetPasswordForm) {
        resetPasswordForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            var newPassword = document.getElementById('resetPasswordNew').value;
            var confirmPassword = document.getElementById('resetPasswordConfirm').value;
            var token = new URLSearchParams(window.location.search).get('token') ||
                document.getElementById('resetPasswordToken')?.value || '';

            if (newPassword.length < 6) {
                showLocalAlert('alert_pass_length');
                return;
            }

            if (newPassword !== confirmPassword) {
                showLocalAlert('alert_pass_mismatch');
                return;
            }

            if (!token) {
                alert('Parolni tiklash tokeni topilmadi. Iltimos, emaildagi havolani ishlating.');
                return;
            }

            try {
                var response = await passwordAPI.resetPassword(token, newPassword);
                showLocalAlert('alert_pass_updated');
                closeResetPasswordModal();

                // Optionally redirect to login
                setTimeout(function () {
                    var loginModal = document.getElementById('loginModal');
                    if (loginModal) {
                        loginModal.classList.add('open');
                        document.body.style.overflow = 'hidden';
                    }
                }, 500);
            } catch (error) {
                alert(error.message || 'Xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.');
            }
        });
    }

    // Close Reset Password Modal
    if (resetPasswordModalClose) {
        resetPasswordModalClose.addEventListener('click', closeResetPasswordModal);
    }

    if (resetPasswordModal) {
        resetPasswordModal.addEventListener('click', function (e) {
            if (e.target === resetPasswordModal) {
                closeResetPasswordModal();
            }
        });
    }
});

// Voice Search Functionality
(function () {
    const voiceSearchBtn = document.getElementById('voiceSearchBtn');
    const voiceSearchInput = document.getElementById('voiceSearchInput');
    const voiceStatus = document.getElementById('voiceStatus');

    let recognition = null;
    let isRecording = false;

    // Check if browser supports Web Speech API
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();

        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'uz-UZ'; // Uzbek language, can be changed to 'en-US' or other languages

        recognition.onstart = function () {
            isRecording = true;
            voiceSearchBtn.classList.add('recording');
            voiceStatus.textContent = 'Listening...';
            voiceStatus.classList.add('recording');
            voiceStatus.style.display = 'block';
        };

        recognition.onresult = function (event) {
            const transcript = event.results[0][0].transcript;
            voiceSearchInput.value = transcript;
            voiceStatus.textContent = 'Voice input received';
            voiceStatus.classList.remove('recording');

            // Trigger search if needed
            setTimeout(() => {
                voiceStatus.style.display = 'none';
            }, 2000);
        };

        recognition.onerror = function (event) {
            console.error('Speech recognition error:', event.error);
            voiceStatus.textContent = 'Error: ' + event.error;
            voiceStatus.classList.remove('recording');
            voiceSearchBtn.classList.remove('recording');
            isRecording = false;

            setTimeout(() => {
                voiceStatus.style.display = 'none';
            }, 3000);
        };

        recognition.onend = function () {
            isRecording = false;
            voiceSearchBtn.classList.remove('recording');
            if (voiceStatus.textContent === 'Listening...') {
                voiceStatus.textContent = 'Recording stopped';
                voiceStatus.classList.remove('recording');
                setTimeout(() => {
                    voiceStatus.style.display = 'none';
                }, 2000);
            }
        };

        if (voiceSearchBtn) {
            voiceSearchBtn.addEventListener('click', function () {
                if (!isRecording) {
                    try {
                        recognition.start();
                    } catch (error) {
                        console.error('Error starting recognition:', error);
                        voiceStatus.textContent = 'Could not start voice recognition';
                        voiceStatus.style.display = 'block';
                        setTimeout(() => {
                            voiceStatus.style.display = 'none';
                        }, 3000);
                    }
                } else {
                    recognition.stop();
                }
            });
        }
    } else {
        // Browser doesn't support speech recognition
        if (voiceSearchBtn) {
            voiceSearchBtn.style.opacity = '0.5';
            voiceSearchBtn.style.cursor = 'not-allowed';
            voiceSearchBtn.title = 'Voice search not supported in this browser';
            voiceSearchBtn.addEventListener('click', function () {
                voiceStatus.textContent = 'Voice search is not supported in your browser';
                voiceStatus.style.display = 'block';
                setTimeout(() => {
                    voiceStatus.style.display = 'none';
                }, 3000);
            });
        }
    }

})();

// Detailed Search Section Toggle
(function () {
    const detailedSearchToggle = document.getElementById('detailedSearchToggle');
    const detailedSearchSection = document.getElementById('detailedSearchSection');

    if (detailedSearchToggle && detailedSearchSection) {
        detailedSearchToggle.addEventListener('click', function () {
            const isVisible = detailedSearchSection.style.display === 'block';

            if (isVisible) {
                detailedSearchSection.style.display = 'none';
                detailedSearchToggle.classList.remove('active');
            } else {
                detailedSearchSection.style.display = 'block';
                detailedSearchToggle.classList.add('active');
            }
        });
    }

    // Handle search button click
    const detailedSearchBtn = document.getElementById('detailedSearchBtn');
    if (detailedSearchBtn) {
        detailedSearchBtn.addEventListener('click', function () {
            const destination = document.getElementById('voiceSearchInput').value;
            const date = document.getElementById('searchDate').value;
            const duration = document.getElementById('searchDuration').value;
            const agency = document.getElementById('searchAgency').value;
            const guests = document.getElementById('searchGuests').value;

            // Perform destination search first
            performDestinationSearch(destination || '');

            // Additional filtering by agency if specified
            if (agency && agency !== 'all') {
                const destinationCards = document.querySelectorAll('.destination-card');
                destinationCards.forEach(card => {
                    // Only hide if it's currently visible (not already hidden by destination search)
                    if (card.style.display !== 'none') {
                        const cardAgency = card.getAttribute('data-agency');
                        if (cardAgency !== agency) {
                            card.style.display = 'none';
                        }
                    }
                });
            }

            // Scroll to destinations section
            const destinationsSection = document.getElementById('destinations');
            if (destinationsSection) {
                setTimeout(() => {
                    destinationsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 100);
            }

            console.log('Search parameters:', {
                destination,
                date,
                duration,
                agency,
                guests
            });
        });
    }
})();

// Advanced auto-correction with multiple algorithms
function autoCorrectSearch(searchTerm) {
    const originalTerm = searchTerm.toLowerCase().trim();

    // Comprehensive typo dictionary with all variations
    const corrections = {
        // Rome/Roma variations (Rim, Roma, Rome, Italy)
        'rom': 'roma', 'romaa': 'roma', 'romma': 'roma', 'romm': 'roma',
        'rome': 'roma', 'roam': 'roma', 'romi': 'roma', 'romu': 'roma',
        'rim': 'roma', 'rimm': 'roma', 'rym': 'roma', 'romy': 'roma',
        'romaa': 'roma', 'romma': 'roma', 'rommm': 'roma',
        'italiya': 'italiya', 'italy': 'italiya', 'itali': 'italiya',

        // Paris variations (Parij, Paris, France)
        'pariss': 'paris', 'parijs': 'paris', 'parisss': 'paris',
        'pari': 'paris', 'pariz': 'paris', 'parise': 'paris',
        'parys': 'paris', 'parijs': 'paris', 'pariss': 'paris',
        'parij': 'paris', 'pary': 'paris', 'pariss': 'paris',
        'fransiya': 'paris', 'france': 'paris', 'frans': 'paris',
        'fransiya': 'paris', 'frans': 'paris',

        // Dubai variations (Dubay, Dubai, UAE, BAA)
        'dubayy': 'dubai', 'dubaai': 'dubai', 'dubay': 'dubai',
        'dubaii': 'dubai', 'dubay': 'dubai', 'dubey': 'dubai',
        'dubay': 'dubai', 'dubai': 'dubai', 'dubayy': 'dubai',
        'baa': 'dubai', 'uae': 'dubai', 'emirates': 'dubai',

        // Tokyo variations (Tokio, Tokyo, Japan)
        'tokyoo': 'tokyo', 'tokyyo': 'tokyo', 'tokio': 'tokyo',
        'toky': 'tokyo', 'tokyo': 'tokyo', 'tokyyo': 'tokyo',
        'tokyoo': 'tokyo', 'tokyio': 'tokyo', 'tokyoo': 'tokyo',
        'yaponiya': 'tokyo', 'japan': 'tokyo', 'yapon': 'tokyo',

        // Istanbul variations (Istanbul, Turkey)
        'istambul': 'istanbul', 'istanbull': 'istanbul',
        'istanbul': 'istanbul', 'istambul': 'istanbul',
        'istanbul': 'istanbul', 'istambul': 'istanbul',
        'istanbol': 'istanbul', 'istambul': 'istanbul',
        'turkiya': 'istanbul', 'turkey': 'istanbul', 'turk': 'istanbul',

        // Bangkok variations (Bangkok, Thailand)
        'bangok': 'bangkok', 'bangkokk': 'bangkok',
        'bangkok': 'bangkok', 'bangok': 'bangkok',
        'bangkok': 'bangkok', 'bangok': 'bangkok',
        'tailand': 'bangkok', 'thailand': 'bangkok', 'tayland': 'bangkok',

        // London variations (London, UK, Britain)
        'londoon': 'london', 'londdon': 'london',
        'london': 'london', 'londoon': 'london',
        'londan': 'london', 'londin': 'london', 'londn': 'london',
        'uk': 'london', 'britain': 'london', 'britaniya': 'london',

        // Baku variations (Boku, Baku, Azerbaijan)
        'bakku': 'baku', 'bakoo': 'baku', 'boku': 'baku',
        'baku': 'baku', 'bakku': 'baku', 'bakoo': 'baku',
        'ozarbayjon': 'baku', 'azerbaijan': 'baku', 'azerbaycan': 'baku',

        // Switzerland variations (Shveysariya, Switzerland)
        'switzerland': 'switzerland', 'switz': 'switzerland',
        'shveysariya': 'switzerland', 'shveysariya': 'switzerland',
        'swiss': 'switzerland', 'shveysariya': 'switzerland'
    };

    // Direct dictionary lookup
    if (corrections[originalTerm]) {
        return corrections[originalTerm];
    }

    // Try normalized version
    const normalized = normalizeString(originalTerm);
    if (normalized !== originalTerm && corrections[normalized]) {
        return corrections[normalized];
    }

    return originalTerm;
}

// Calculate Levenshtein distance with character substitution weights
function levenshteinDistance(str1, str2) {
    const matrix = [];
    const len1 = str1.length;
    const len2 = str2.length;

    // Common keyboard layout for character substitution
    const keyboardNeighbors = {
        'q': ['w'], 'w': ['q', 'e'], 'e': ['w', 'r'], 'r': ['e', 't'],
        't': ['r', 'y'], 'y': ['t', 'u'], 'u': ['y', 'i'], 'i': ['u', 'o'],
        'o': ['i', 'p'], 'p': ['o'],
        'a': ['s'], 's': ['a', 'd'], 'd': ['s', 'f'], 'f': ['d', 'g'],
        'g': ['f', 'h'], 'h': ['g', 'j'], 'j': ['h', 'k'], 'k': ['j', 'l'],
        'l': ['k'],
        'z': ['x'], 'x': ['z', 'c'], 'c': ['x', 'v'], 'v': ['c', 'b'],
        'b': ['v', 'n'], 'n': ['b', 'm'], 'm': ['n']
    };

    function isKeyboardNeighbor(char1, char2) {
        return keyboardNeighbors[char1]?.includes(char2) ||
            keyboardNeighbors[char2]?.includes(char1);
    }

    for (let i = 0; i <= len2; i++) {
        matrix[i] = [i];
    }

    for (let j = 0; j <= len1; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= len2; i++) {
        for (let j = 1; j <= len1; j++) {
            if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                // Check for keyboard neighbor (lower cost)
                const substitutionCost = isKeyboardNeighbor(
                    str2.charAt(i - 1),
                    str1.charAt(j - 1)
                ) ? 0.5 : 1;

                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + substitutionCost,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }

    return matrix[len2][len1];
}

// Jaro-Winkler similarity for better string matching
function jaroWinklerSimilarity(str1, str2) {
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();

    if (s1 === s2) return 1.0;

    const matchWindow = Math.floor(Math.max(s1.length, s2.length) / 2) - 1;
    const s1Matches = new Array(s1.length).fill(false);
    const s2Matches = new Array(s2.length).fill(false);

    let matches = 0;
    let transpositions = 0;

    // Find matches
    for (let i = 0; i < s1.length; i++) {
        const start = Math.max(0, i - matchWindow);
        const end = Math.min(i + matchWindow + 1, s2.length);

        for (let j = start; j < end; j++) {
            if (s2Matches[j] || s1[i] !== s2[j]) continue;
            s1Matches[i] = true;
            s2Matches[j] = true;
            matches++;
            break;
        }
    }

    if (matches === 0) return 0.0;

    // Find transpositions
    let k = 0;
    for (let i = 0; i < s1.length; i++) {
        if (!s1Matches[i]) continue;
        while (!s2Matches[k]) k++;
        if (s1[i] !== s2[k]) transpositions++;
        k++;
    }

    const jaro = (
        matches / s1.length +
        matches / s2.length +
        (matches - transpositions / 2) / matches
    ) / 3.0;

    // Winkler modification
    let prefix = 0;
    for (let i = 0; i < Math.min(s1.length, s2.length, 4); i++) {
        if (s1[i] === s2[i]) prefix++;
        else break;
    }

    return jaro + (0.1 * prefix * (1 - jaro));
}

// Detect and fix common character transpositions and substitutions
function fixTranspositions(str) {
    // Common character substitutions (language variations)
    const substitutions = {
        'i': ['y', 'Ä±', 'Ñ–'],
        'y': ['i', 'Ä±', 'Ñ–'],
        'u': ['o', 'Ã¼', 'Ã¶'],
        'o': ['u', 'Ã¼', 'Ã¶'],
        'a': ['e', 'Ã¤', 'Ã¥'],
        'e': ['a', 'Ã¤', 'Ã¥']
    };

    // Common transposition patterns
    const transpositionPatterns = [
        // Double letter corrections
        { pattern: /([a-z])\1{2,}/g, replace: (match) => match[0] + match[0] }, // "parisss" -> "pariss" -> "paris"
        // Missing vowel patterns
        { pattern: /^rom([^a])/, replace: 'roma$1' },
        { pattern: /^paris([^s])/, replace: 'paris$1' },
        // Common typos
        { pattern: /^pariz/, replace: 'paris' },
        { pattern: /^parys/, replace: 'paris' },
        { pattern: /^romm/, replace: 'roma' },
        { pattern: /^dubayy/, replace: 'dubai' },
        { pattern: /^tokyoo/, replace: 'tokyo' }
    ];

    let fixed = str;

    // Apply transposition patterns
    for (const { pattern, replace } of transpositionPatterns) {
        if (typeof replace === 'function') {
            fixed = fixed.replace(pattern, replace);
        } else {
            fixed = fixed.replace(pattern, replace);
        }
    }

    return fixed;
}

// Normalize string for better matching (handles language variations)
function normalizeString(str) {
    return str.toLowerCase()
        .replace(/[Ã Ã¡Ã¢Ã£Ã¤Ã¥]/g, 'a')
        .replace(/[Ã¨Ã©ÃªÃ«]/g, 'e')
        .replace(/[Ã¬Ã­Ã®Ã¯]/g, 'i')
        .replace(/[Ã²Ã³Ã´ÃµÃ¶]/g, 'o')
        .replace(/[Ã¹ÃºÃ»Ã¼]/g, 'u')
        .replace(/[Ã½Ã¿]/g, 'y')
        .replace(/[Ã§]/g, 'c')
        .replace(/[Ã±]/g, 'n')
        .replace(/[ÅŸ]/g, 's')
        .replace(/[ÄŸ]/g, 'g')
        .replace(/[Ä±]/g, 'i')
        .trim();
}

// Advanced fuzzy matching with multiple algorithms
function findBestMatch(searchTerm, possibleMatches) {
    if (!searchTerm || searchTerm.length < 2) return null;

    const normalizedTerm = normalizeString(searchTerm);
    let bestMatch = null;
    let bestScore = 0;
    const minScore = 0.6; // Minimum similarity threshold

    for (const match of possibleMatches) {
        const normalizedMatch = normalizeString(match);

        // Exact match
        if (normalizedTerm === normalizedMatch) {
            return match;
        }

        // Calculate multiple similarity scores
        const levenshteinDist = levenshteinDistance(normalizedTerm, normalizedMatch);
        const maxLen = Math.max(normalizedTerm.length, normalizedMatch.length);
        const levenshteinScore = 1 - (levenshteinDist / maxLen);

        const jaroWinklerScore = jaroWinklerSimilarity(normalizedTerm, normalizedMatch);

        // Check if one string contains the other
        const containsScore = normalizedMatch.includes(normalizedTerm) ||
            normalizedTerm.includes(normalizedMatch) ? 0.8 : 0;

        // Check for common prefix
        let prefixLength = 0;
        const minLen = Math.min(normalizedTerm.length, normalizedMatch.length);
        for (let i = 0; i < minLen; i++) {
            if (normalizedTerm[i] === normalizedMatch[i]) {
                prefixLength++;
            } else {
                break;
            }
        }
        const prefixScore = prefixLength / Math.max(normalizedTerm.length, normalizedMatch.length);

        // Weighted combination of scores
        const combinedScore = (
            levenshteinScore * 0.3 +
            jaroWinklerScore * 0.4 +
            containsScore * 0.2 +
            prefixScore * 0.1
        );

        // Prefer shorter edit distance
        const lengthPenalty = Math.abs(normalizedTerm.length - normalizedMatch.length) > 3 ? 0.1 : 1;
        const finalScore = combinedScore * lengthPenalty;

        if (finalScore > bestScore && finalScore >= minScore) {
            bestScore = finalScore;
            bestMatch = match;
        }
    }

    return bestMatch;
}

// Search functionality for destinations
function performDestinationSearch(searchQuery) {
    const destinationCards = document.querySelectorAll('.destination-card');
    let searchTerm = searchQuery.toLowerCase().trim();

    // If search is empty, show all cards
    if (searchTerm === '') {
        destinationCards.forEach(card => {
            card.style.display = '';
        });
        // Hide no results message
        const noResultsMsg = document.querySelector('.no-results-message');
        if (noResultsMsg) {
            noResultsMsg.style.display = 'none';
        }
        return;
    }

    // Apply advanced auto-correction
    let correctedTerm = autoCorrectSearch(searchTerm);

    // Apply transposition fixes
    correctedTerm = fixTranspositions(correctedTerm);

    // If correction was made, update the input field
    if (correctedTerm !== searchTerm) {
        const voiceSearchInput = document.getElementById('voiceSearchInput');
        if (voiceSearchInput) {
            voiceSearchInput.value = correctedTerm;
        }
        searchTerm = correctedTerm.toLowerCase();
    }

    // Language mapping for common destinations - organized by destination
    const destinationMappings = {
        'paris': {
            keywords: ['parij', 'paris', 'fransiya', 'france'],
            matchText: ['parij', 'paris', 'fransiya', 'france']
        },
        'roma': {
            keywords: ['rim', 'roma', 'rome', 'italiya', 'italy'],
            matchText: ['rim', 'roma', 'rome', 'italiya', 'italy']
        },
        'dubai': {
            keywords: ['dubay', 'dubai', 'baa', 'uae'],
            matchText: ['dubay', 'dubai', 'baa', 'uae']
        },
        'istanbul': {
            keywords: ['istanbul', 'turkiya', 'turkey'],
            matchText: ['istanbul', 'turkiya', 'turkey']
        },
        'tokyo': {
            keywords: ['tokio', 'tokyo', 'yaponiya', 'japan'],
            matchText: ['tokio', 'tokyo', 'yaponiya', 'japan']
        },
        'bangkok': {
            keywords: ['bangkok', 'tailand', 'thailand'],
            matchText: ['bangkok', 'tailand', 'thailand']
        },
        'london': {
            keywords: ['london', 'buyuk britaniya', 'uk', 'britain'],
            matchText: ['london', 'buyuk britaniya', 'uk', 'britain']
        },
        'baku': {
            keywords: ['boku', 'baku', 'ozarbayjon', 'azerbaijan'],
            matchText: ['boku', 'baku', 'ozarbayjon', 'azerbaijan']
        },
        'switzerland': {
            keywords: ['shveysariya', 'switzerland'],
            matchText: ['shveysariya', 'switzerland']
        }
    };

    // Find which destination group the search term belongs to
    // Priority: exact match > starts with > contains
    let matchedDestination = null;
    let matchType = null; // 'exact', 'starts', 'contains'
    let matchedKeywords = []; // Track which keywords matched

    // First, check for exact match (highest priority) - case-insensitive
    // Special handling for "italiya" to ensure it only matches "roma" destination
    if (normalizeString(searchTerm) === 'italiya' || normalizeString(searchTerm) === 'italy' ||
        normalizeString(searchTerm) === 'itali') {
        matchedDestination = 'roma';
        matchType = 'exact';
        matchedKeywords = ['italiya'];
    } else {
        for (const [destKey, destData] of Object.entries(destinationMappings)) {
            const exactMatch = destData.keywords.find(keyword => {
                return keyword.toLowerCase() === searchTerm ||
                    normalizeString(keyword) === normalizeString(searchTerm);
            });
            if (exactMatch) {
                matchedDestination = destKey;
                matchType = 'exact';
                matchedKeywords = [exactMatch];
                break;
            }
        }
    }

    // If no exact match, check for "starts with" match (but only if search term is at least 3 chars)
    if (!matchedDestination && searchTerm.length >= 3) {
        for (const [destKey, destData] of Object.entries(destinationMappings)) {
            // Only check if keyword starts with search term (not the reverse, to avoid false matches)
            const startsMatch = destData.keywords.find(keyword => keyword.startsWith(searchTerm));
            if (startsMatch) {
                matchedDestination = destKey;
                matchType = 'starts';
                matchedKeywords = [startsMatch];
                break;
            }
        }
    }

    // If still no match, check for contains (but be very strict - minimum 4 chars for substring matching)
    // AND ensure the search term is not a substring of unrelated words
    if (!matchedDestination && searchTerm.length >= 4) {
        // First, check if search term matches any keyword exactly (case-insensitive)
        for (const [destKey, destData] of Object.entries(destinationMappings)) {
            const exactKeywordMatch = destData.keywords.find(keyword => {
                return normalizeString(keyword) === normalizeString(searchTerm);
            });
            if (exactKeywordMatch) {
                matchedDestination = destKey;
                matchType = 'contains';
                matchedKeywords = [exactKeywordMatch];
                break;
            }
        }

        // If no exact keyword match, check for contains (but be very strict)
        if (!matchedDestination) {
            for (const [destKey, destData] of Object.entries(destinationMappings)) {
                // Only match if keyword contains search term (not reverse, to be more precise)
                // Also check that search term is not just a common substring
                const containsMatch = destData.keywords.find(keyword => {
                    const normalizedKeyword = normalizeString(keyword);
                    const normalizedSearch = normalizeString(searchTerm);

                    // Only match if the keyword contains the full search term
                    // AND the search term is at least 4 characters
                    // AND it's not a common substring that appears in multiple destinations
                    if (normalizedKeyword.includes(normalizedSearch) && searchTerm.length >= 4) {
                        // Check if this search term appears in other destination mappings (avoid false positives)
                        const appearsInOtherDestinations = Object.entries(destinationMappings).some(([otherKey, otherData]) => {
                            if (otherKey === destKey) return false;
                            return otherData.keywords.some(otherKeyword => {
                                const normalizedOther = normalizeString(otherKeyword);
                                // Check if the search term appears in other keywords
                                // But exclude if it's just a common substring like "iya" in both "italiya" and "fransiya"
                                if (normalizedOther.includes(normalizedSearch)) {
                                    // If search term is less than 5 chars, be more strict
                                    if (normalizedSearch.length < 5) {
                                        // Only match if it's at the start or end of the word, not in the middle
                                        const startsWith = normalizedOther.startsWith(normalizedSearch);
                                        const endsWith = normalizedOther.endsWith(normalizedSearch);
                                        if (!startsWith && !endsWith) {
                                            return false; // It's in the middle, likely a false positive
                                        }
                                    }
                                    return normalizedOther !== normalizedKeyword;
                                }
                                return false;
                            });
                        });

                        // Only match if it's unique to this destination OR if it's an exact match
                        // OR if the search term is long enough (>= 5 chars) to avoid substring issues
                        return (!appearsInOtherDestinations || normalizedKeyword === normalizedSearch) &&
                            (normalizedSearch.length >= 5 || normalizedKeyword === normalizedSearch);
                    }
                    return false;
                });
                if (containsMatch) {
                    matchedDestination = destKey;
                    matchType = 'contains';
                    matchedKeywords = [containsMatch];
                    break;
                }
            }
        }
    }

    // If no match found, try fuzzy matching (but be more strict)
    if (!matchedDestination) {
        const allKeywords = Object.values(destinationMappings).flatMap(d => d.keywords);
        const bestMatch = findBestMatch(searchTerm, allKeywords);
        if (bestMatch) {
            // Verify the match is good enough and not a false positive
            const normalizedSearch = normalizeString(searchTerm);
            const normalizedMatch = normalizeString(bestMatch);

            // Only accept fuzzy match if similarity is high and it's not ambiguous
            const similarity = jaroWinklerSimilarity(normalizedSearch, normalizedMatch);
            if (similarity >= 0.75) { // Higher threshold for fuzzy matching
                for (const [destKey, destData] of Object.entries(destinationMappings)) {
                    if (destData.keywords.includes(bestMatch)) {
                        matchedDestination = destKey;
                        matchType = 'fuzzy';
                        matchedKeywords = [bestMatch];
                        // Update input with corrected term
                        const voiceSearchInput = document.getElementById('voiceSearchInput');
                        if (voiceSearchInput) {
                            voiceSearchInput.value = bestMatch;
                        }
                        searchTerm = bestMatch.toLowerCase();
                        break;
                    }
                }
            }
        }
    }

    let hasMatches = false;

    destinationCards.forEach(card => {
        const titleElement = card.querySelector('.destination-title');
        const descElement = card.querySelector('.destination-desc');

        if (!titleElement) return;

        const title = titleElement.textContent.toLowerCase();
        const description = descElement ? descElement.textContent.toLowerCase() : '';
        const searchText = title + ' ' + description;

        let isMatch = false;

        // If we found a matched destination group, only show cards that belong to it
        if (matchedDestination) {
            const destData = destinationMappings[matchedDestination];
            // Check if card's title/description contains any of the match text for this destination
            // Use word boundaries or exact matching to avoid false positives
            isMatch = destData.matchText.some(matchText => {
                const normalizedMatchText = normalizeString(matchText);
                const normalizedTitle = normalizeString(title);
                const normalizedSearchText = normalizeString(searchText);

                // Exact match in title (highest priority)
                if (normalizedTitle === normalizedMatchText ||
                    normalizedTitle.includes(' ' + normalizedMatchText + ',') ||
                    normalizedTitle.includes(', ' + normalizedMatchText) ||
                    normalizedTitle.endsWith(' ' + normalizedMatchText)) {
                    return true;
                }

                // Check if match text appears as a word in title or description (with word boundaries)
                // This prevents "italiya" from matching "fransiya"
                const escapedMatchText = normalizedMatchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const wordBoundaryRegex = new RegExp('\\b' + escapedMatchText + '\\b', 'i');
                if (wordBoundaryRegex.test(normalizedTitle) || wordBoundaryRegex.test(normalizedSearchText)) {
                    return true;
                }

                // Fallback: simple contains check (but only if match text is significant and unique)
                // Only use this if the match text is long enough and not a substring of other destinations
                // Special case: "italiya" should never match "fransiya"
                if (normalizedMatchText === 'italiya' || normalizedMatchText === 'italy' || normalizedMatchText === 'itali') {
                    // For Italy-related terms, only match if title contains "rim", "roma", "rome", "italiya", or "italy"
                    const italyKeywords = ['rim', 'roma', 'rome', 'italiya', 'italy', 'itali'];
                    const hasItalyKeyword = italyKeywords.some(keyword => {
                        const normalizedKeyword = normalizeString(keyword);
                        return normalizedTitle.includes(normalizedKeyword) || normalizedSearchText.includes(normalizedKeyword);
                    });
                    if (hasItalyKeyword) {
                        return true;
                    }
                    return false; // Don't match if it's not Italy-related
                }

                if (normalizedMatchText.length >= 5) {
                    // Check if this match text could match other destinations (avoid false positives)
                    const couldMatchOthers = Object.entries(destinationMappings).some(([otherKey, otherData]) => {
                        if (otherKey === matchedDestination) return false;
                        return otherData.matchText.some(otherMatchText => {
                            const normalizedOther = normalizeString(otherMatchText);
                            return normalizedOther.includes(normalizedMatchText) &&
                                normalizedOther !== normalizedMatchText;
                        });
                    });

                    // Only use contains if it won't cause false positives
                    if (!couldMatchOthers &&
                        (normalizedTitle.includes(normalizedMatchText) || normalizedSearchText.includes(normalizedMatchText))) {
                        return true;
                    }
                }

                return false;
            });
        } else {
            // If no destination group matched, do a simple text search
            isMatch = searchText.includes(searchTerm);
        }

        // Show or hide card
        if (isMatch) {
            card.style.display = '';
            hasMatches = true;
        } else {
            card.style.display = 'none';
        }
    });

    // Scroll to destinations section
    const destinationsSection = document.getElementById('destinations');
    if (destinationsSection && searchTerm) {
        const header = document.querySelector('.main-header') || document.querySelector('.navigation-section');
        const headerHeight = header ? header.offsetHeight : 80;

        // Smooth scroll to destinations
        setTimeout(() => {
            destinationsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }

    // Show message if no results
    if (searchTerm && !hasMatches) {
        const destinationGrid = document.querySelector('.destination-grid');
        let noResultsMsg = destinationGrid.querySelector('.no-results-message');

        if (!noResultsMsg) {
            noResultsMsg = document.createElement('div');
            noResultsMsg.className = 'no-results-message';
            noResultsMsg.style.cssText = 'grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-secondary); font-size: 18px;';
            noResultsMsg.textContent = 'Hech qanday natija topilmadi. Boshqa qidiruv so\'zini kiriting.';
            destinationGrid.appendChild(noResultsMsg);
        }
        noResultsMsg.style.display = 'block';
    } else {
        const noResultsMsg = document.querySelector('.no-results-message');
        if (noResultsMsg) {
            noResultsMsg.style.display = 'none';
        }
    }
}

// Search Icon Button Handler
(function () {
    const searchIconBtn = document.getElementById('searchIconBtn');
    const voiceSearchInput = document.getElementById('voiceSearchInput');

    if (searchIconBtn && voiceSearchInput) {
        searchIconBtn.addEventListener('click', function () {
            const searchQuery = voiceSearchInput.value.trim();

            if (searchQuery) {
                // Perform search action
                // console.log('Searching for:', searchQuery);
                performDestinationSearch(searchQuery);
            } else {
                // Show all destinations if search is empty
                performDestinationSearch('');
                // Focus the input if empty
                voiceSearchInput.focus();
            }
        });

        // Also trigger search on Enter key
        if (voiceSearchInput) {
            voiceSearchInput.addEventListener('keypress', function (e) {
                if (e.key === 'Enter') {
                    searchIconBtn.click();
                }
            });
        }
    }
})();

// Navigation Active State Management
(function () {
    const navLinks = document.querySelectorAll('.desktop-nav a');
    const sections = document.querySelectorAll('section[id]');

    function updateActiveNav() {
        let current = '';
        const scrollY = window.pageYOffset;

        sections.forEach(section => {
            const sectionTop = section.offsetTop - 100;
            const sectionHeight = section.offsetHeight;

            if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            const href = link.getAttribute('href');
            if (href === '#' + current || (current === 'home' && href === '#home')) {
                link.classList.add('active');
            }
        });
    }

    // Update on scroll
    window.addEventListener('scroll', updateActiveNav);

    // Update on page load
    document.addEventListener('DOMContentLoaded', function () {
        updateActiveNav();

        // Also update when clicking nav links
        navLinks.forEach(link => {
            link.addEventListener('click', function (e) {
                // Remove active from all
                navLinks.forEach(l => l.classList.remove('active'));
                // Add active to clicked
                this.classList.add('active');
            });
        });
    });
})();



// Chatbot Logic (moved from index.html and enhanced)
// Chatbot Logic
(function () {
    // Consolidated Chatbot functionality
    (function () {
        const chatbotContainer = document.getElementById('chatbotContainer');
        const chatbotWindow = document.getElementById('chatbotWindow');
        const chatbotToggle = document.getElementById('chatbotToggle');
        const chatbotClose = document.getElementById('chatbotClose');
        const chatbotInput = document.getElementById('chatbotInput');
        const chatbotSend = document.getElementById('chatbotSend');
        const chatbotMessages = document.getElementById('chatbotMessages');

        if (!chatbotContainer || !chatbotWindow || !chatbotToggle || !chatbotClose ||
            !chatbotInput || !chatbotSend || !chatbotMessages) return;

        let currentMode = 'ai';
        let currentContext = null;
        let isTyping = false;

        const chatbotResponses = {
            'loyiha': {
                keywords: ['loyiha', 'nima', 'qiladi', 'ketmon', 'platforma'],
                response: 'KETMON - Markaziy Osiyo turizm sohasini inqilob qiluvchi platforma. Biz sayyohlar va agentliklar uchun asosiy sayohat muammolarini hal qilamiz: shaffof narxlar, oson bron qilish va bo\'lib to\'lash (TNPL) imkoniyati.'
            },
            'bron': {
                keywords: ['bron', 'zakaz', 'qanday', 'olish', 'buyurtma'],
                response: 'Bron qilish juda oson! Turni tanlang va "Bron qilish" tugmasini bosing. To\'lovni karta orqali yoki bo\'lib to\'lash orqali amalga oshirishingiz mumkin.'
            },
            'agentlik': {
                keywords: ['agentlik', 'hamkor', 'kimlar', 'turizm', 'kompaniya'],
                response: 'Biz Atlas Travel, AziaLux va Samarqand Tours kabi 100 dan ortiq tasdiqlangan agentliklar bilan ishlaymiz. Ularning barchasi litsenziyalangan va xavfsiz.'
            },
            'aloqa': {
                keywords: ['aloqa', 'telefon', 'nomer', 'bog\'lanish', 'manzil'],
                response: 'Biz bilan +998 90 765 43 21 raqami yoki support@ketmon.uz email orqali bog\'lanishingiz mumkin.'
            },
            'ai': {
                keywords: ['ai', 'yordamchi', 'tavsiya', 'taklif'],
                response: 'Men sizning aqlli yordamchingizman. Sayohat budjetingiz va xohishingizga qarab eng yaxshi turlarni taklif qila olaman.'
            }
        };

        const defaultResponses = [
            'Tushunmadim, iltimos boshqacharoq tushuntiring.',
            'Bu haqda aniqroq ma\'lumot olish uchun operatorimiz bilan bog\'laning: +998 90 765 43 21',
            'Sakuya bera olaman? Turlar, narxlar yoki bron qilish haqida so\'rashingiz mumkin.'
        ];

        function openChatbot(tourName, tourPrice) {
            chatbotWindow.classList.add('active');
            chatbotInput.focus();

            if (tourName && tourPrice) {
                // Dynamic Currency Conversion for Chatbot
                var rawPrice = parseFloat(String(tourPrice).replace(/[^0-9.]/g, ''));
                var currentCurrency = localStorage.getItem('ketmon_currency') || 'sum';
                var displayPrice = tourPrice;

                if (!isNaN(rawPrice)) {
                    var converted = typeof window.convertPrice === 'function' ? window.convertPrice(rawPrice, 'usd', currentCurrency) : rawPrice;
                    displayPrice = typeof window.formatPrice === 'function' ? window.formatPrice(converted, currentCurrency) : displayPrice;
                }

                showTypingIndicator();
                setTimeout(() => {
                    hideTypingIndicator();
                    addMessage(`Siz "${tourName}" turi haqida so'radingiz. Narxi: ${displayPrice}. Savollaringiz bormi?`, false);
                }, 800);
            }
        }

        function closeChatbot() {
            chatbotWindow.classList.remove('active');
        }

        function toggleChatbot() {
            if (chatbotWindow.classList.contains('active')) {
                closeChatbot();
            } else {
                openChatbot();
            }
        }

        chatbotToggle.addEventListener('click', toggleChatbot);
        chatbotClose.addEventListener('click', closeChatbot);

        function findResponse(userMessage) {
            const lowerMessage = userMessage.toLowerCase();
            for (const key in chatbotResponses) {
                if (chatbotResponses[key].keywords.some(kw => lowerMessage.includes(kw))) {
                    return chatbotResponses[key].response;
                }
            }
            return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
        }

        function addMessage(text, isUser) {
            const messageDiv = document.createElement('div');
            messageDiv.className = `chatbot-message ${isUser ? 'user-message' : 'bot-message'}`;
            messageDiv.innerHTML = `<div class="message-content"><p>${escapeHtml(text)}</p></div>`;
            chatbotMessages.appendChild(messageDiv);
            chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
        }

        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        function showTypingIndicator() {
            if (isTyping) return;
            isTyping = true;
            const indicator = document.createElement('div');
            indicator.className = 'typing-indicator';
            indicator.id = 'chatbotTypingIndicator';
            indicator.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
            chatbotMessages.appendChild(indicator);
            chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
        }

        function hideTypingIndicator() {
            isTyping = false;
            const indicator = document.getElementById('chatbotTypingIndicator');
            if (indicator) indicator.remove();
        }

        function sendMessage() {
            const message = chatbotInput.value.trim();
            if (!message || isTyping) return;
            addMessage(message, true);
            chatbotInput.value = '';
            showTypingIndicator();
            setTimeout(() => {
                const response = findResponse(message);
                hideTypingIndicator();
                addMessage(response, false);
            }, 1000);
        }

        chatbotSend.addEventListener('click', sendMessage);
        chatbotInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });

        // Make functions globally available
        window.openChatbot = openChatbot;
        window.closeChatbot = closeChatbot;
    })();
})();

/* Main App Initialization */
document.addEventListener('DOMContentLoaded', function () {

    const tourPackages = [
        {
            city: 'istanbul',
            title: 'Istanbul Klassik',
            title_key: 'tour_istanbul_classic_title',
            days: 5,
            price: 5500000,
            includes: 'Mehmonxona, Nonushta, Transfer',
            includes_key: 'inc_hotel_bf_trans',
            note: 'Eng arzon variant',
            note_key: 'tour_note_cheapest',
            img: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=1200&q=80',
            agency: 'Samarqand Tours',
            badge: 'Hamyonbop',
            badge_key: 'badge_affordable',
            styles: ['culture', 'city'],
            duration: 5,
            rating: 4.5,
            reviews: 120
        },
        {
            city: 'istanbul',
            title: 'Istanbul Premium',
            title_key: 'tour_istanbul_premium_title',
            days: 7,
            price: 8200000,
            includes: '5* Mehmonxona, Barcha ovqatlar, Gid',
            includes_key: 'inc_5star_all_guide',
            note: 'Qulaylikni sevuvchilar uchun',
            note_key: 'tour_note_comfort',
            img: 'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?auto=format&fit=crop&w=1200&q=80',
            agency: 'Atlas Travel',
            badge: 'Premium',
            badge_key: 'badge_premium',
            styles: ['luxury', 'culture'],
            duration: 7,
            rating: 4.8,
            reviews: 85
        },
        {
            city: 'dubai',
            title: 'Dubay Sayyohati',
            title_key: 'tour_dubai_trip_title',
            days: 4,
            price: 6800000,
            includes: 'Mehmonxona, Viza, Transfer',
            includes_key: 'inc_hotel_visa_trans',
            note: 'Tezkor sayohat',
            note_key: 'tour_note_fast',
            img: 'https://images.unsplash.com/photo-1512453979798-5ea936a7d40c?auto=format&fit=crop&w=1200&q=80',
            agency: 'Nomad Explorer',
            badge: 'Tezkor',
            badge_key: 'badge_fast',
            styles: ['city', 'family'],
            duration: 4,
            rating: 4.6,
            reviews: 210
        },
        { city: 'dubai', title: 'Dubay Luks', title_key: 'tour_dubai_luxe_title', days: 6, price: 12500000, includes: 'Burj Khalifa, Safari, 5* Hotel', includes_key: 'inc_burj_safari_5star', note: 'Unutilmas taassurotlar', note_key: 'tour_note_unforgettable', img: 'https://images.unsplash.com/photo-1512453979798-5ea936a7d40c?auto=format&fit=crop&w=1200&q=80', agency: 'Global Voyage', badge: 'Luks', badge_key: 'badge_luxury', styles: ['luxury', 'adventure'], duration: 6, rating: 4.9, reviews: 156 },
        { city: 'sharm', title: 'Sharm Relax', title_key: 'tour_sharm_relax_title', days: 7, price: 7200000, includes: 'All Inclusive, Dengiz bo\'yi', includes_key: 'inc_all_sea', note: 'Dam olish uchun ideal', note_key: 'tour_note_ideal', img: 'https://images.unsplash.com/photo-1544185310-fa373268484e?auto=format&fit=crop&w=1200&q=80', agency: 'Samarqand Tours', badge: 'Dengiz', badge_key: 'badge_sea', styles: ['beach', 'nature'], duration: 7, rating: 4.7, reviews: 340 },
        { city: 'paris', title: 'Parij Romantikasi', title_key: 'tour_paris_romantic_title', days: 5, price: 10500000, includes: 'Mehmonxona, Transfer, Eiffel', includes_key: 'inc_hotel_trans_eiffel', note: 'Juftliklar uchun', note_key: 'tour_note_couples', img: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80', agency: 'Atlas Travel', badge: 'Romantik', badge_key: 'badge_romantic', styles: ['romantic', 'culture'], duration: 5, rating: 4.8, reviews: 275 },
        { city: 'london', title: 'London Ekskursiyasi', title_key: 'tour_london_excursion_title', days: 6, price: 11200000, includes: 'Mehmonxona, Gid, Muzeylar', includes_key: 'inc_hotel_guide_museums', note: 'Tarix ixlosmandlari uchun', note_key: 'tour_note_history', img: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1200&q=80', agency: 'Global Voyage', badge: 'Tarix', badge_key: 'badge_history', styles: ['culture', 'city'], duration: 6, rating: 4.5, reviews: 190 },
        { city: 'tashkent', title: 'Toshkent Bo\'ylab', title_key: 'tour_tashkent_trip_title', days: 2, price: 1500000, includes: 'Mehmonxona, Gid, Ovqatlanish', includes_key: 'inc_hotel_guide_food', note: 'Poytaxt mehmonlari uchun', note_key: 'tour_note_guests', img: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1200&q=80', agency: 'ClubTravel', badge: 'Mahalliy', badge_key: 'badge_local', styles: ['city', 'culture'], duration: 2, rating: 4.4, reviews: 112 },
        { city: 'baku', title: 'Boku Shamoli', title_key: 'tour_baku_wind_title', days: 4, price: 4500000, includes: 'Mehmonxona, Transfer, Eski shahar', includes_key: 'inc_hotel_trans_oldcity', note: 'Hamyonbop sayohat', note_key: 'tour_note_budget', img: 'https://images.unsplash.com/photo-1518903337854-3c6628b05615?auto=format&fit=crop&w=1200&q=80', agency: 'ClubTravel', badge: 'Arzon', badge_key: 'badge_budget', styles: ['city', 'culture'], duration: 4, rating: 4.3, reviews: 88 },
        { city: 'antalya', title: 'Antalya Plyajlari', title_key: 'tour_antalya_beach_title', days: 7, price: 8500000, includes: 'All Inclusive, Avia', includes_key: 'inc_all_avia', note: 'Yozgi ta\'til uchun', note_key: 'tour_note_summer', img: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=1200&q=80', agency: 'AziaLux', badge: 'Yozgi', badge_key: 'badge_summer', styles: ['beach', 'nature'], duration: 7, rating: 4.8, reviews: 520 },
        { city: 'tokyo', title: 'Tokio Kelajagi', title_key: 'tour_tokyo_future_title', days: 7, price: 18000000, includes: 'Mehmonxona, Metro kartasi, Gid', includes_key: 'inc_hotel_metro_guide', note: 'Texnologiya va madaniyat', note_key: 'tour_note_tech', img: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1200&q=80', agency: 'Nomad', badge: 'Texno', badge_key: 'badge_tech', styles: ['culture', 'city'], duration: 7, rating: 4.9, reviews: 145 },
        { city: 'seoul', title: 'Seul Madaniyati', title_key: 'tour_seoul_culture_title', days: 6, price: 14000000, includes: 'Mehmonxona, Saroylar, Transfer', includes_key: 'inc_hotel_palace_trans', note: 'K-Pop va tarix', note_key: 'tour_note_kpop', img: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1200&q=80', agency: 'Nomad', badge: 'Madaniyat', badge_key: 'badge_culture', styles: ['culture', 'city'], duration: 6, rating: 4.7, reviews: 230 },
        { city: 'kuala-lumpur', title: 'Malayziya Tropiklari', title_key: 'tour_kl_tropics_title', days: 8, price: 9200000, includes: 'Mehmonxona, Transfer, Ekskursiya', includes_key: 'inc_hotel_trans_excur', note: 'Tabiat va shahar', note_key: 'tour_note_nature', img: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1200&q=80', agency: 'AziaLux', badge: 'Tabiat', badge_key: 'badge_nature', styles: ['nature', 'city'], duration: 8, rating: 4.6, reviews: 165 },
        { city: 'moscow', title: 'Moskva Klassik', title_key: 'tour_moscow_classic_title', days: 4, price: 3500000, includes: 'Mehmonxona, Ekskursiya, Transfer', includes_key: 'inc_hotel_excur_trans', note: 'Poytaxt yuragi', note_key: 'tour_note_heart', img: 'https://images.unsplash.com/photo-1512495039889-52a3b799c9bc?auto=format&fit=crop&w=1200&q=80', agency: 'ClubTravel', badge: 'Klassik', badge_key: 'badge_classic', styles: ['culture', 'city'], duration: 4, rating: 4.5, reviews: 310 },
        { city: 'kazan', title: 'Qozon Sayohati', title_key: 'tour_kazan_trip_title', days: 3, price: 2800000, includes: 'Mehmonxona, Gid, Ovqatlanish', includes_key: 'inc_hotel_guide_meal', note: 'Madaniy meros', note_key: 'tour_note_culture', img: 'https://images.unsplash.com/photo-1590079019111-ad01176f94d4?auto=format&fit=crop&w=1200&q=80', agency: 'Samarqand Tours', badge: 'Madaniy', badge_key: 'badge_culture', styles: ['culture', 'city'], duration: 3, rating: 4.4, reviews: 145 },
        { city: 'sochi', title: 'Sochi Relax', title_key: 'tour_sochi_relax_title', days: 5, price: 4200000, includes: 'All Inclusive, Dengiz', includes_key: 'inc_all_sea', note: 'Hordiq va tabiat', note_key: 'tour_note_relax', img: 'https://images.unsplash.com/photo-1563911302283-d2bc129e7570?auto=format&fit=crop&w=1200&q=80', agency: 'AziaLux', badge: 'Hordiq', badge_key: 'badge_relax', styles: ['beach', 'nature'], duration: 5, rating: 4.7, reviews: 198 }
    ];

    const budgetRanges = [
        { id: '100-500', label: '$100 - $500', min: 100 * 12600, max: 500 * 12600 },
        { id: '500-1000', label: '$500 - $1,000', min: 500 * 12600, max: 1000 * 12600 },
        { id: '1000-2000', label: '$1,000 - $2,000', min: 1000 * 12600, max: 2000 * 12600 },
        { id: '2000-5000', label: '$2,000 - $5,000', min: 2000 * 12600, max: 5000 * 12600 },
        { id: '5000-10000', label: '$5,000 - $10,000', min: 5000 * 12600, max: 10000 * 12600 },
        { id: '10000+', label: '$10,000+', min: 10000 * 12600, max: 9999999 * 12600 }
    ];

    const travelStyles = [
        { id: 'adventure', label: 'Adventure', icon: '🧗', textKey: 'cat_adventure' },
        { id: 'luxury', label: 'Luxury', icon: '💎', textKey: 'cat_luxury' },
        { id: 'family', label: 'Family', icon: '👨‍👩‍👧‍👦', textKey: 'cat_family' },
        { id: 'beach', label: 'Beach', icon: '🏖', textKey: 'cat_beach' },
        { id: 'culture', label: 'Culture', icon: '🏛', textKey: 'cat_culture' },
        { id: 'nature', label: 'Nature', icon: '🌿', textKey: 'cat_nature' },
        { id: 'city', label: 'City Break', icon: '🌆', textKey: 'cat_city' },
        { id: 'romantic', label: 'Romantic', icon: '💑', textKey: 'cat_romantic' }
    ];

    let calcState = {
        step: 1,
        budget: null,
        travelers: 2,
        duration: null,
        preferences: []
    };

    function updateCalculatorUI() {
        // Update Indicators
        for (let i = 1; i <= 3; i++) {
            const ind = document.getElementById(`step${i}Indicator`);
            if (ind) {
                ind.classList.toggle('active', calcState.step === i);
                ind.classList.toggle('completed', calcState.step > i);
            }
        }

        // Update Steps
        for (let i = 1; i <= 3; i++) {
            const step = document.getElementById(`step${i}`);
            if (step) {
                step.classList.toggle('active', calcState.step === i);
            }
        }

        // Specific render for step 1
        if (calcState.step === 1) {
            const grid = document.getElementById('budgetGrid');
            if (grid && !grid.children.length) {
                grid.innerHTML = budgetRanges.map(range => `
                    <div class="budget-option ${calcState.budget === range.id ? 'active' : ''}" onclick="selectBudget('${range.id}')">
                        <span class="range-label">${range.label}</span>
                        <div class="radio-indicator"></div>
                    </div>
                `).join('');
            } else if (grid) {
                Array.from(grid.children).forEach((child, idx) => {
                    child.classList.toggle('active', calcState.budget === budgetRanges[idx].id);
                });
            }
            document.getElementById('travelersCount').textContent = calcState.travelers;
            document.getElementById('gotoStep2').disabled = !calcState.budget;
        }

        // Specific render for step 2
        if (calcState.step === 2) {
            const grid = document.getElementById('preferenceGrid');
            const lang = localStorage.getItem('ketmon_lang') || 'uz';
            const dict = (window.ketmonI18n || {})[lang] || {};

            if (grid && !grid.children.length) {
                grid.innerHTML = travelStyles.map(style => {
                    const label = dict[style.textKey] || style.label;
                    return `
                        <div class="preference-card ${calcState.preferences.includes(style.id) ? 'active' : ''}" onclick="toggleCalcPreference('${style.id}')">
                            <span class="icon">${style.icon}</span>
                            <span class="label">${label}</span>
                        </div>
                    `;
                }).join('');
            } else if (grid) {
                Array.from(grid.children).forEach((child, idx) => {
                    child.classList.toggle('active', calcState.preferences.includes(travelStyles[idx].id));
                });
            }
        }

        // Results step is handled by showResults()
    }

    window.selectBudget = function (id) {
        calcState.budget = id;
        updateCalculatorUI();
    };

    window.toggleCalcPreference = function (id) {
        const idx = calcState.preferences.indexOf(id);
        if (idx > -1) calcState.preferences.splice(idx, 1);
        else calcState.preferences.push(id);
        updateCalculatorUI();
    };

    document.getElementById('incTravelers')?.addEventListener('click', () => {
        calcState.travelers++;
        updateCalculatorUI();
    });

    document.getElementById('decTravelers')?.addEventListener('click', () => {
        if (calcState.travelers > 1) {
            calcState.travelers--;
            updateCalculatorUI();
        }
    });

    document.getElementById('gotoStep2')?.addEventListener('click', () => {
        const durInput = document.getElementById('tripDuration');
        calcState.duration = durInput ? parseInt(durInput.value) || null : null;
        calcState.step = 2;
        updateCalculatorUI();
    });

    document.getElementById('backToStep1')?.addEventListener('click', () => {
        calcState.step = 1;
        updateCalculatorUI();
    });

    document.getElementById('findTripBtn')?.addEventListener('click', () => {
        calcState.step = 3;
        updateCalculatorUI();
        showResults();
    });

    document.getElementById('resetCalcBtn')?.addEventListener('click', () => {
        window.resetCalculator();
    });

    window.resetCalculator = function () {
        calcState = { step: 1, budget: null, travelers: 2, duration: null, preferences: [] };
        const budgetGrid = document.getElementById('budgetGrid');
        const prefGrid = document.getElementById('preferenceGrid');
        if (budgetGrid) budgetGrid.innerHTML = '';
        if (prefGrid) prefGrid.innerHTML = '';
        const durInput = document.getElementById('tripDuration');
        if (durInput) durInput.value = '';
        updateCalculatorUI();
    };

    function showResults() {
        const loading = document.getElementById('calcLoading');
        const container = document.getElementById('resultsContainer');
        const noResults = document.getElementById('noResults');
        const grid = document.getElementById('calcResultsGrid');

        loading.style.display = 'block';
        container.style.display = 'none';
        noResults.style.display = 'none';

        setTimeout(() => {
            const range = budgetRanges.find(r => r.id === calcState.budget);
            let filtered = tourPackages.filter(tour => {
                const total = tour.price * calcState.travelers;
                const inBudget = total >= range.min && total <= range.max;

                let styleMatch = true;
                if (calcState.preferences.length > 0) {
                    styleMatch = tour.styles.some(s => calcState.preferences.includes(s));
                }

                let durMatch = true;
                if (calcState.duration) {
                    durMatch = Math.abs(tour.duration - calcState.duration) <= 2;
                }

                return inBudget && styleMatch && durMatch;
            });

            // Sort by total price
            filtered.sort((a, b) => (a.price * calcState.travelers) - (b.price * calcState.travelers));

            loading.style.display = 'none';
            if (filtered.length === 0) {
                noResults.style.display = 'block';
            } else {
                container.style.display = 'block';
                const lang = localStorage.getItem('ketmon_lang') || 'uz';
                const dict = (window.ketmonI18n || {})[lang] || {};

                let subtitle = dict['calc_results_subtitle'] || 'Found {count} tours • Sorted by price';
                subtitle = subtitle.replace('{count}', filtered.length);
                document.getElementById('resultsSubtitle').textContent = subtitle;

                grid.innerHTML = filtered.map(tour => renderCalcResultCard(tour)).join('');
            }
        }, 1200);
    }

    function renderCalcResultCard(tour) {
        const lang = localStorage.getItem('ketmon_lang') || 'uz';
        const dict = (window.ketmonI18n || {})[lang] || {};

        const title = dict[tour.title_key] || tour.title;
        const totalPrice = (tour.price * calcState.travelers).toLocaleString();

        let totalForText = dict['calc_total_for'] || 'Total for {count} travelers';
        totalForText = totalForText.replace('{count}', calcState.travelers);

        const bookBtn = dict['calc_book_btn'] || 'Book Now';
        const askBtn = dict['btn_ask'] || 'Ask';

        return `
            <div class="tour-card-horizontal" style="margin-bottom: 0;">
                <div class="tour-card-image">
                    <img src="${tour.img}" alt="${title}">
                    <span class="tour-badge">${tour.badge}</span>
                </div>
                <div class="tour-card-content">
                    <h3 class="tour-card-title">${title}</h3>
                    <p class="tour-card-description">${tour.includes}</p>
                    <div style="display: flex; gap: 10px; margin-top: 5px; font-size: 13px; color: var(--calc-text-muted);">
                        <span>⭐ ${tour.rating} (${tour.reviews})</span>
                        <span>⏱️ ${tour.duration} ${dict['calc_days'] || 'days'}</span>
                    </div>
                    <div class="tour-card-footer">
                        <div>
                            <span class="tour-price">${totalPrice} so'm</span>
                            <div style="font-size: 12px; color: var(--calc-text-muted);">${totalForText}</div>
                        </div>
                        <div class="tour-card-actions">
                            <a href="#" class="tour-action-btn tour-btn-consult" onclick="event.preventDefault(); openChatbot('${title}', '${totalPrice}');">${askBtn}</a>
                            <a href="#" class="tour-action-btn tour-btn-book" onclick="event.preventDefault(); openPaymentModal('${title}', '${totalPrice}');">${bookBtn}</a>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Initialize on load
    updateCalculatorUI();

    // Function to create standard card HTML
    function createDestinationCardHTML(pkg) {
        var lang = localStorage.getItem('ketmon_lang') || 'uz';
        var i18n = window.ketmonI18n || {};
        var dict = i18n[lang] || i18n.uz || {};

        var title = pkg.title_key && dict[pkg.title_key] ? dict[pkg.title_key] : pkg.title;
        var includes = pkg.includes_key && dict[pkg.includes_key] ? dict[pkg.includes_key] : pkg.includes;
        var note = pkg.note_key && dict[pkg.note_key] ? dict[pkg.note_key] : pkg.note;
        var badge = pkg.badge_key && dict[pkg.badge_key] ? dict[pkg.badge_key] : (pkg.badge || 'Taklif');
        var perPerson = dict['price_per_person'] || 'kishi uchun';
        var bookBtn = dict['calc_book_btn'] || 'Bron qilish';

        return `
            <div class="destination-card" data-agency="${(pkg.agency || '').toLowerCase().replace(/\s/g, '')}">
                <div class="destination-img">
                    <img src="${pkg.img}" alt="${title}">
                    <div class="destination-badge">${badge}</div>
                </div>
                <div class="destination-info">
                    <h3 class="destination-title">${title}</h3>
                    <p class="destination-desc">${includes}. ${note}</p>
                    <div class="destination-footer">
                        <div>
                            <div class="price">${pkg.price.toLocaleString()} so'm</div>
                            <div class="price-label">${perPerson}</div>
                        </div>
                        <span class="agency-tag">${pkg.agency}</span>
                    </div>
                    <a href="#paymentModal" onclick="openPaymentModal()" class="destination-book-btn">${bookBtn}</a>
                </div>
            </div>
        `;
    }

    if (recommendBtn) {
        recommendBtn.addEventListener('click', function () {
            const city = citySelect.value;
            const budget = parseInt(maxInput.value) || 0;
            const resultsContainer = document.getElementById('calcResults');

            if (!resultsContainer) return;

            if (!city) {
                showLocalAlert('alert_select_city');
                return;
            }

            // Filter
            const filtered = tourPackages.filter(pkg =>
                pkg.city === city && pkg.price <= budget
            );

            // Sort (Cheapest first)
            filtered.sort((a, b) => a.price - b.price);

            // Display
            resultsContainer.style.display = 'grid';
            resultsContainer.style.gridTemplateColumns = 'repeat(auto-fill, minmax(300px, 1fr))';
            resultsContainer.style.gap = '20px';
            resultsContainer.innerHTML = '';

            if (filtered.length === 0) {
                resultsContainer.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: #666; padding: 20px;">
                    Ushbu narxda (${budget.toLocaleString()} so'm) turlar topilmadi. Iltimos, byudjetni oshiring.
                </div>`;
            } else {
                filtered.forEach(pkg => {
                    resultsContainer.innerHTML += createDestinationCardHTML(pkg);
                });
            }

            // Scroll to results
            resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });
    }

    // 2. Hero Search Button Logic
    const searchBtn = document.getElementById('heroSearchBtn');
    const heroCitySelect = document.getElementById('heroCitySelect');

    if (searchBtn) {
        searchBtn.addEventListener('click', function () {
            const city = heroCitySelect ? heroCitySelect.value : '';
            if (city) {
                showLocalAlert('alert_searching', { city: city });
                const destSection = document.getElementById('destinations');
                if (destSection) destSection.scrollIntoView({ behavior: 'smooth' });
            } else {
                showLocalAlert('alert_select_city');
                if (heroCitySelect) heroCitySelect.focus();
            }
        });
    }

    // 3. Category Dropdown Toggle
    const catBtn = document.getElementById('categoryMainBtn');
    const catMenu = document.getElementById('categoryDropdown');

    if (catBtn && catMenu) {
        catBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            catMenu.classList.toggle('hidden');
        });
        document.addEventListener('click', function (e) {
            if (!catBtn.contains(e.target) && !catMenu.contains(e.target)) {
                catMenu.classList.add('hidden');
            }
        });
        catMenu.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                catMenu.classList.add('hidden');
                // Simulate category loading
                showLocalAlert('alert_cat_selected', { cat: btn.textContent.trim() });
            });
        });
    }

    // 4. Infinite Scroll for Destinations
    const grid = document.querySelector('.destination-grid');
    let isLoading = false;

    function loadMoreDestinations() {
        if (isLoading || !grid) return;
        isLoading = true;

        // Show loading indicator
        const loader = document.createElement('div');
        const lang = localStorage.getItem('ketmon_lang') || 'uz';
        const dict = (window.ketmonI18n || i18n)[lang] || {};
        loader.textContent = dict.loader_loading || "Yuklanmoqda...";
        loader.style.gridColumn = "1 / -1";
        loader.style.textAlign = "center";
        loader.style.padding = "20px";
        loader.style.color = "var(--text-secondary)";
        grid.appendChild(loader);

        setTimeout(() => {
            grid.removeChild(loader);

            // Generate some random cards from our data to simulate new content
            const randomTours = [];
            for (let i = 0; i < 4; i++) {
                // Pick random from tourPackages
                const randomPkg = tourPackages[Math.floor(Math.random() * tourPackages.length)];
                randomTours.push(randomPkg);
            }

            if (randomTours.length > 0) {
                randomTours.forEach(pkg => {
                    grid.innerHTML += createDestinationCardHTML(pkg);
                });
            }
            isLoading = false;
        }, 800);
    }

    // 5. Booking Buttons (Global Delegation)
    document.addEventListener('click', function (e) {
        if (e.target.classList.contains('destination-book-btn') || e.target.closest('.destination-book-btn')) {
            e.preventDefault();
            const card = e.target.closest('.destination-card');
            const title = card ? card.querySelector('.destination-title').innerText : 'Tur';
            showLocalAlert('alert_booking_open', { title: title });
        }
    });

    // Scroll Listener
    window.addEventListener('scroll', function () {
        if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 500) {
            loadMoreDestinations();
        }
    });

    // 6. Initialize Tours
    loadMoreDestinations();

    // 7. Login Modal Handlers
    const loginModal = document.getElementById('loginModal');
    const loginBtn = document.getElementById('topBarLoginBtn');
    const mobileLoginBtn = document.getElementById('mobileLoginBtn');
    const loginClose = document.getElementById('loginModalClose');

    function openLogin() {
        if (loginModal) loginModal.classList.add('active');
    }
    function closeLogin() {
        if (loginModal) loginModal.classList.remove('active');
    }

    if (loginBtn) loginBtn.addEventListener('click', (e) => { e.preventDefault(); openLogin(); });
    if (mobileLoginBtn) mobileLoginBtn.addEventListener('click', (e) => { e.preventDefault(); openLogin(); });
    if (loginClose) loginClose.addEventListener('click', closeLogin);

    // Close on backdrop click
    if (loginModal) {
        loginModal.addEventListener('click', (e) => {
            if (e.target === loginModal) closeLogin();
        });
    }

});

// Tour List Infinite Scroll (Mock)
(function () {
    let isLoadingTours = false;

    function checkScroll() {
        const grid = document.querySelector('.destination-grid');
        if (!grid) return;

        // Simple check: if user scrolled near bottom of page
        if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 500) {
            if (!isLoadingTours) {
                loadMoreTours();
            }
        }
    }

    function loadMoreTours() {
        isLoadingTours = true;
        const grid = document.querySelector('.destination-grid');

        // Visual indicator
        const loader = document.createElement('div');
        loader.className = 'scroll-loader';
        const lang = localStorage.getItem('ketmon_lang') || 'uz';
        const dict = (window.i18n || {})[lang] || {};
        loader.textContent = dict.loader_loading || 'Yuklanmoqda...';
        loader.style.width = '100%';
        loader.style.textAlign = 'center';
        loader.style.padding = '20px';
        loader.style.color = 'var(--text-secondary)';
        loader.style.gridColumn = '1 / -1';
        grid.appendChild(loader);

        // Simulate API delay
        setTimeout(() => {
            loader.remove();

            // Create new mock cards with EXACT reference structure
            for (let i = 0; i < 3; i++) {
                const card = document.createElement('div');
                card.className = 'destination-card';
                const id = `dynamic-tour-${Date.now()}-${i}`;
                const title = `${dict.tour_new_adventure || 'Yangi Sarguzasht'} ${i + 1}`;
                const img = "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=800&q=80";
                const price = 750;
                const desc = dict.tour_new_desc || 'Ajoyib sayohatlar va unutilmas xotiralar.';
                const consultTxt = dict.btn_consult || 'Maslahat';
                const bookTxt = dict.btn_book_short || 'Bron';

                card.innerHTML = `
                    <div class="destination-img">
                         <img src="${img}" alt="New Tour">
                         <button class="btn-like" onclick="toggleWishlist('${id}', '${title}', '${img}', ${price}); this.classList.toggle('active')">
                            <svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                         </button>
                         <span class="destination-badge">${dict.badge_popular || 'Popular'}</span>
                    </div>
                    <div class="destination-info">
                        <h3 class="destination-title">${title}</h3>
                        <p class="destination-desc">${desc}</p>
                        <div class="destination-footer">
                            <div class="price-block">
                                <div class="price">$${price}</div>
                            </div>
                            <div class="card-buttons">
                                <a href="#" class="btn-consult" onclick="event.preventDefault(); openChatbot('${title}', '$${price}');">${consultTxt}</a>
                                <a href="#paymentModal" class="btn-book" onclick="event.preventDefault(); addToCart('${id}', '${title}', '${img}', ${price}); openPaymentModal('${title}', '$${price}');">${bookTxt}</a>
                            </div>
                        </div>
                        <div class="card-actions-row">
                            <button class="wishlist-btn ${wishlistManager.items.some(i => i.id === id) ? 'active' : ''}" onclick="toggleWishlist(event, '${id}', '${title}', '${img}', ${price})">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="${wishlistManager.items.some(i => i.id === id) ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.84-8.84 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                            </button>
                            <button class="compare-toggle-btn" onclick="toggleComparison(event, '${id}')">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"></path></svg>
                                <span>${dict.compare_similar || 'Compare similar'}</span>
                            </button>
                        </div>
                    </div>
                    <div class="comparison-panel">
                        <div class="comparison-title">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4M12 8h.01"></path></svg>
                            <span>Similar Tours Found</span>
                        </div>
                        <div class="comparison-grid">
                            <div class="mini-tour-card" onclick="openPaymentModal('${title} Alternative', '$${price - 50}')">
                                <img src="${img}" class="mini-tour-img">
                                <div class="mini-tour-info">
                                    <div class="mini-tour-title">${title} Lite</div>
                                    <div class="mini-tour-price">$${price - 50}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                 `;
                grid.appendChild(card);
            }
            isLoadingTours = false;
        }, 1200);
    }

    // Throttle scroll event
    let timer;
    window.addEventListener('scroll', function () {
        if (timer) clearTimeout(timer);
        timer = setTimeout(checkScroll, 100);
    });
})();

// ---------------------------------------------------------
// Phase 2: Cart & Wishlist System
// ---------------------------------------------------------

(function () {
    // 1. Storage Managers
    const StorageManager = {
        save: (key, data) => localStorage.setItem(`ketmon_${key}`, JSON.stringify(data)),
        load: (key) => JSON.parse(localStorage.getItem(`ketmon_${key}`) || '[]')
    };

    const CartManager = {
        items: StorageManager.load('cart'),
        add: function (tour) {
            // Check if already in cart
            if (this.items.some(item => item.id === tour.id)) return false;
            this.items.push({ ...tour, addedAt: Date.now() });
            this.save();
            this.updateUI();
            return true;
        },
        remove: function (id) {
            this.items = this.items.filter(item => item.id !== id);
            this.save();
            this.updateUI();
        },
        clear: function () {
            this.items = [];
            this.save();
            this.updateUI();
        },
        save: function () {
            StorageManager.save('cart', this.items);
        },
        updateUI: function () {
            const badge = document.getElementById('cartBadge');
            const list = document.getElementById('cartItemsList');
            const footer = document.getElementById('cartFooter');
            const totalEl = document.getElementById('cartTotalAmount');

            if (badge) {
                badge.textContent = this.items.length;
                badge.style.display = this.items.length > 0 ? 'flex' : 'none';
            }

            if (list) {
                if (this.items.length === 0) {
                    list.classList.add('empty');
                    const lang = localStorage.getItem('ketmon_lang') || 'uz';
                    const dict = (window.i18n || {})[lang] || {};
                    list.innerHTML = `<div class="empty-state"><span data-text="cart_empty">${dict.cart_empty || 'Empty'}</span></div>`;
                    if (footer) footer.style.display = 'none';
                } else {
                    list.classList.remove('empty');
                    let html = '';
                    let total = 0;
                    const currency = localStorage.getItem('ketmon_currency') || 'usd';

                    this.items.forEach(item => {
                        const convertedPrice = window.convertPrice ? window.convertPrice(item.price, 'usd', currency) : item.price;
                        const formattedPrice = window.formatPrice ? window.formatPrice(convertedPrice, currency) : `$${item.price}`;

                        html += `
                            <div class="cart-item">
                                <img src="${item.img}" class="cart-item-img" alt="${item.title}">
                                <div class="cart-item-info">
                                    <div class="cart-item-title">${item.title}</div>
                                    <div class="cart-item-meta">
                                        <span>${formattedPrice}</span>
                                        <span class="cart-item-cancel-policy" data-text="cart_cancel_24h">${dict.cart_cancel_24h || '24h free cancellation'}</span>
                                        <span class="cart-item-remove" onclick="cartManager.remove('${item.id}')">✕</span>
                                    </div>
                                </div>
                            </div>
                        `;
                        total += item.price;
                    });
                    list.innerHTML = html;
                    if (footer) {
                        footer.style.display = 'block';
                        if (totalEl) {
                            const convertedTotal = window.convertPrice ? window.convertPrice(total, 'usd', currency) : total;
                            totalEl.textContent = window.formatPrice ? window.formatPrice(convertedTotal, currency) : `$${total}`;
                        }
                    }
                }
            }
        }
    };

    const WishlistManager = {
        items: StorageManager.load('wishlist'),
        toggle: function (tour) {
            const index = this.items.findIndex(item => item.id === tour.id);
            if (index > -1) {
                this.items.splice(index, 1);
            } else {
                this.items.push({ ...tour, addedAt: Date.now() });
            }
            this.save();
            this.updateUI();
        },
        clear: function () {
            this.items = [];
            this.save();
            this.updateUI();
        },
        save: function () {
            StorageManager.save('wishlist', this.items);
        },
        updateUI: function () {
            const badge = document.getElementById('favBadge');
            const list = document.getElementById('favItemsList');

            if (badge) {
                badge.textContent = this.items.length;
                badge.style.display = this.items.length > 0 ? 'flex' : 'none';
            }

            if (list) {
                if (this.items.length === 0) {
                    list.classList.add('empty');
                    const lang = localStorage.getItem('ketmon_lang') || 'uz';
                    const dict = (window.i18n || {})[lang] || {};
                    list.innerHTML = `<div class="empty-state"><span data-text="fav_empty">${dict.fav_empty || 'Empty'}</span></div>`;
                } else {
                    list.classList.remove('empty');
                    let html = '';
                    const currency = localStorage.getItem('ketmon_currency') || 'usd';

                    this.items.forEach(item => {
                        const convertedPrice = window.convertPrice ? window.convertPrice(item.price, 'usd', currency) : item.price;
                        const formattedPrice = window.formatPrice ? window.formatPrice(convertedPrice, currency) : `$${item.price}`;

                        html += `
                            <div class="cart-item">
                                <img src="${item.img}" class="cart-item-img" alt="${item.title}">
                                <div class="cart-item-info">
                                    <div class="cart-item-title">${item.title}</div>
                                    <div class="cart-item-meta">
                                        <span>${formattedPrice}</span>
                                        <span class="cart-item-remove" onclick="wishlistManager.toggle({id: '${item.id}'})">✕</span>
                                    </div>
                                </div>
                            </div>
                        `;
                    });
                    list.innerHTML = html;
                }
            }
        }
    };

    // 2. UI Interactions
    window.toggleFavoritesDropdown = function (e) {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        const dropdown = document.getElementById('favoritesDropdown');
        const cartDropdown = document.getElementById('cartDropdown');
        if (cartDropdown) cartDropdown.classList.remove('show');
        if (dropdown) dropdown.classList.toggle('show');
    };

    window.toggleCartDropdown = function (e) {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        const dropdown = document.getElementById('cartDropdown');
        const favDropdown = document.getElementById('favoritesDropdown');
        if (favDropdown) favDropdown.classList.remove('show');
        if (dropdown) dropdown.classList.toggle('show');
    };

    window.clearFavorites = () => WishlistManager.clear();
    window.clearCart = () => CartManager.clear();
    window.proceedToCheckout = () => {
        alert('Proceeding to checkout with ' + CartManager.items.length + ' items.');
        // In real app, redirect to checkout page
    };

    // 3. Initialize
    document.addEventListener('DOMContentLoaded', () => {
        CartManager.updateUI();
        WishlistManager.updateUI();

        // Close dropdowns on outside click
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.header-dropdown-wrapper')) {
                const fav = document.getElementById('favoritesDropdown');
                const cart = document.getElementById('cartDropdown');
                if (fav) fav.classList.remove('show');
                if (cart) cart.classList.remove('show');
            }
        });
    });

    // Universal Add functions for buttons
    window.addToCart = (id, title, img, price) => {
        CartManager.add({ id, title, img, price });
        // Show dropdown feedback
        const dropdown = document.getElementById('cartDropdown');
        if (dropdown) {
            dropdown.classList.add('show');
            setTimeout(() => dropdown.classList.remove('show'), 2000);
        }
    };

    window.toggleWishlist = (id, title, img, price) => {
        WishlistManager.toggle({ id, title, img, price });
    };

    window.toggleComparison = function (e, cardId) {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        const card = e.target.closest('.tour-card-horizontal') || e.target.closest('.destination-card');
        if (card) {
            card.classList.toggle('expanded');
        }
    };

    // Global expose
    window.cartManager = CartManager;
    window.wishlistManager = WishlistManager;

})();

// --- Smart Calculator Logic ---
// Note: Core calculator logic is defined globally below.
// This section previously contained legacy IIFE which has been removed to prevent conflicts.


// --- Categories Modal & Selection Logic ---
(function () {
    const categories = [
        { id: 'all', label: 'Hot', icon: '🔥', textKey: 'cat_all' },
        { id: 'solo', label: 'Solo', icon: '👤', textKey: 'cat_solo' },
        { id: 'eco', label: 'Eco', icon: '🌿', textKey: 'cat_eco' },
        { id: 'family', label: 'Family', icon: '👨‍👩‍👧‍👦', textKey: 'cat_family' },
        { id: 'adventure', label: 'Adventure', icon: '🧗', textKey: 'cat_adventure' },
        { id: 'exotic', label: 'Exotic', icon: '🏝', textKey: 'cat_exotic' },
        { id: 'honeymoon', label: 'Honeymoon', icon: '💍', textKey: 'cat_honeymoon' },
        { id: 'football', label: 'Football', icon: '⚽', textKey: 'cat_football' },
        { id: 'luxury', label: 'Luxury', icon: '💎', textKey: 'cat_luxury' },
        { id: 'cultural', label: 'Cultural', icon: '🏛', textKey: 'cat_cultural' },
        { id: 'wellness', label: 'Wellness', icon: '🧘', textKey: 'cat_wellness' },
        { id: 'winter', label: 'Winter', icon: '❄️', textKey: 'cat_winter' }
    ];

    window.openCategoriesModal = function () {
        const modal = document.getElementById('categoriesModal');
        if (!modal) return;
        const grid = modal.querySelector('.categories-grid-premium');

        // Populate grid
        grid.innerHTML = categories.map(cat => `
            <div class="modal-cat-item" onclick="selectCategory('${cat.id}')">
                <span class="modal-cat-icon">${cat.icon}</span>
                <span class="modal-cat-label" data-text="${cat.textKey}">${cat.label}</span>
            </div>
        `).join('');

        // Update labels in modal
        if (window.i18n && window.i18n[localStorage.getItem('ketmon_lang') || 'uz']) {
            const dict = window.i18n[localStorage.getItem('ketmon_lang') || 'uz'];
            grid.querySelectorAll('[data-text]').forEach(el => {
                const key = el.getAttribute('data-text');
                if (dict[key]) el.textContent = dict[key];
            });
        }

        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    };

    window.closeCategoriesModal = function () {
        const modal = document.getElementById('categoriesModal');
        if (modal) modal.classList.remove('show');
        document.body.style.overflow = '';
    };

    window.selectCategory = function (catId) {
        console.log('Selected category:', catId);

        // Update Pills
        document.querySelectorAll('.cat-pill').forEach(pill => {
            pill.classList.toggle('active', pill.getAttribute('data-cat') === catId);
        });

        closeCategoriesModal();

        // Scroll to destinations
        const dest = document.getElementById('destinations');
        if (dest) {
            window.scrollTo({
                top: dest.offsetTop - 80,
                behavior: 'smooth'
            });
        }
    };

    // Attach pill listeners
    document.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('.cat-pill').forEach(pill => {
            pill.addEventListener('click', () => {
                const catId = pill.getAttribute('data-cat');
                selectCategory(catId);
            });
        });
    });
})();

// ===================================
// SMART BUDGET CALCULATOR
// ===================================

// Calculator State
const calculatorState = {
    currentStep: 1,
    selectedBudget: null,
    travelers: 2,
    duration: null,
    preferences: [],
    results: []
};

// Budget Ranges Configuration
const budgetRanges = {
    '100-500': { min: 100, max: 500 },
    '500-1000': { min: 500, max: 1000 },
    '1000-2000': { min: 1000, max: 2000 },
    '2000-5000': { min: 2000, max: 5000 },
    '5000-10000': { min: 5000, max: 10000 },
    '10000-plus': { min: 10000, max: 999999 }
};

// Sample Tour Data (this will be replaced with actual tour data from your database)
const sampleTours = [
    { id: 1, title: 'Istanbul Classic', destination: 'Istanbul, Turkey', price: 699, duration: 5, image: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=400', styles: ['culture', 'city'], rating: 4.7, reviews: 234 },
    { id: 2, title: 'Dubai Luxury', destination: 'Dubai, UAE', price: 1299, duration: 7, image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400', styles: ['luxury', 'city'], rating: 4.9, reviews: 567 },
    { id: 3, title: 'Bali Beach Paradise', destination: 'Bali, Indonesia', price: 899, duration: 7, image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400', styles: ['beach', 'nature', 'romantic'], rating: 4.8, reviews: 432 },
    { id: 4, title: 'Paris Romantic', destination: 'Paris, France', price: 1499, duration: 5, image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400', styles: ['romantic', 'culture', 'city'], rating: 4.9, reviews: 789 },
    { id: 5, title: 'Tokyo Adventure', destination: 'Tokyo, Japan', price: 1899, duration: 8, image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400', styles: ['adventure', 'culture', 'city'], rating: 4.8, reviews: 654 },
    { id: 6, title: 'Maldives Luxury', destination: 'Maldives', price: 2999, duration: 6, image: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=400', styles: ['luxury', 'beach', 'romantic'], rating: 5.0, reviews: 321 },
    { id: 7, title: 'Santorini Escape', destination: 'Santorini, Greece', price: 1799, duration: 6, image: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=400', styles: ['romantic', 'beach', 'culture'], rating: 4.9, reviews: 543 },
    { id: 8, title: 'Swiss Alps Adventure', destination: 'Switzerland', price: 2499, duration: 9, image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400', styles: ['adventure', 'nature'], rating: 4.8, reviews: 432 },
    { id: 9, title: 'Thailand Family Fun', destination: 'Phuket, Thailand', price: 799, duration: 7, image: 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=400', styles: ['family', 'beach', 'nature'], rating: 4.7, reviews: 567 },
    { id: 10, title: 'Rome Cultural Tour', destination: 'Rome, Italy', price: 1350, duration: 6, image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=400', styles: ['culture', 'city'], rating: 4.8, reviews: 678 },
    { id: 11, title: 'Iceland Nature', destination: 'Reykjavik, Iceland', price: 2199, duration: 8, image: 'https://images.unsplash.com/photo-1504829857797-ddff29c27927?w=400', styles: ['nature', 'adventure'], rating: 4.9, reviews: 345 },
    { id: 12, title: 'Barcelona City Break', destination: 'Barcelona, Spain', price: 1199, duration: 5, image: 'https://images.unsplash.com/photo-1562883676-8c7feb83f09b?w=400', styles: ['city', 'culture', 'beach'], rating: 4.7, reviews: 456 },
    { id: 13, title: 'New York Experience', destination: 'New York, USA', price: 1599, duration: 6, image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400', styles: ['city', 'culture'], rating: 4.8, reviews: 789 },
    { id: 14, title: 'Baku Weekend', destination: 'Baku, Azerbaijan', price: 550, duration: 4, image: 'https://images.unsplash.com/photo-1527838832700-5059252407fa?w=400', styles: ['city', 'culture'], rating: 4.6, reviews: 234 },
    { id: 15, title: 'Antalya Beach', destination: 'Antalya, Turkey', price: 650, duration: 7, image: 'https://images.unsplash.com/photo-1527838832700-5059252407fa?w=400', styles: ['beach', 'family'], rating: 4.7, reviews: 543 }
];

// Select Budget Range
function selectBudgetRange(rangeId) {
    // Remove active class from all options
    document.querySelectorAll('.budget-option').forEach(opt => {
        opt.classList.remove('active');
    });

    // Add active class to selected option
    const selected = document.querySelector(`[data-budget="${rangeId}"]`);
    if (selected) {
        selected.classList.add('active');
        calculatorState.selectedBudget = rangeId;

        // Enable continue button
        document.getElementById('step1-next').disabled = false;
    }
}

// Set Traveler Count
function setTravelers(count) {
    console.log('Setting travelers:', count);
    calculatorState.travelers = count;
    const travelerCountEl = document.getElementById('traveler-count');
    if (travelerCountEl) travelerCountEl.textContent = count;

    // UI update
    const buttons = document.querySelectorAll('#traveler-selection .selection-btn');
    buttons.forEach(btn => {
        btn.classList.remove('active');
        // Use trim() to avoid whitespace issues
        if (btn.textContent.trim() === count.toString() || (count === 5 && btn.textContent.trim() === '5+')) {
            btn.classList.add('active');
        }
    });
}

// Set Trip Duration
function setDuration(range, element) {
    console.log('Setting duration:', range);
    calculatorState.duration = range;

    // UI update
    const buttons = document.querySelectorAll('#duration-selection .selection-btn');
    buttons.forEach(btn => btn.classList.remove('active'));

    // If element is passed (clicked), use it directly
    if (element) {
        element.classList.add('active');
    } else {
        // Fallback: find by text content if programmatically set
        buttons.forEach(btn => {
            if (btn.textContent.includes(range) || (range === '15-plus' && btn.textContent.includes('15+'))) {
                btn.classList.add('active');
            }
        });
    }
}

// Toggle Preference
function togglePreference(styleId) {
    const card = document.querySelector(`[data-style="${styleId}"]`);
    if (!card) return;

    const index = calculatorState.preferences.indexOf(styleId);
    if (index > -1) {
        // Remove preference
        calculatorState.preferences.splice(index, 1);
        card.classList.remove('active');
    } else {
        // Add preference
        calculatorState.preferences.push(styleId);
        card.classList.add('active');
    }
}

// Next Step
function nextCalcStep() {
    if (calculatorState.currentStep === 1 && !calculatorState.selectedBudget) {
        alert('Please select a budget range');
        return;
    }

    // Hide current step
    document.getElementById(`calc-step-${calculatorState.currentStep}`).classList.remove('active');
    document.getElementById(`step-ind-${calculatorState.currentStep}`).classList.remove('active');
    document.getElementById(`step-ind-${calculatorState.currentStep}`).classList.add('completed');

    // Show next step
    calculatorState.currentStep++;
    document.getElementById(`calc-step-${calculatorState.currentStep}`).classList.add('active');
    document.getElementById(`step-ind-${calculatorState.currentStep}`).classList.add('active');
}

// Previous Step
function prevCalcStep() {
    // Hide current step
    document.getElementById(`calc-step-${calculatorState.currentStep}`).classList.remove('active');
    document.getElementById(`step-ind-${calculatorState.currentStep}`).classList.remove('active');

    // Show previous step
    calculatorState.currentStep--;
    document.getElementById(`calc-step-${calculatorState.currentStep}`).classList.add('active');
    document.getElementById(`step-ind-${calculatorState.currentStep - 1}`).classList.remove('completed');
}

// Calculate Recommendations
function calculateRecommendations() {
    // Show loading
    document.getElementById(`calc-step-2`).classList.remove('active');
    document.getElementById(`step-ind-2`).classList.remove('active');
    document.getElementById(`step-ind-2`).classList.add('completed');

    calculatorState.currentStep = 3;
    document.getElementById(`calc-step-3`).classList.add('active');
    document.getElementById(`step-ind-3`).classList.add('active');

    const loader = document.getElementById('calc-loader');
    if (loader) loader.style.display = 'block';
    const noResults = document.getElementById('no-results');
    if (noResults) noResults.style.display = 'none';
    const grid = document.getElementById('calc-results-grid');
    if (grid) grid.innerHTML = '';

    // Fetch from real backend API
    (async () => {
        try {
            const budgetRange = budgetRanges[calculatorState.selectedBudget];
            if (!budgetRange) return;

            // Calculate price per person for the API
            const minPrice = budgetRange.min / calculatorState.travelers;
            const maxPrice = budgetRange.max / calculatorState.travelers;

            const response = await window.ketmonApi.tours.getAll({
                minPrice,
                maxPrice,
                category: calculatorState.preferences.length > 0 ? calculatorState.preferences[0] : undefined,
                limit: 12
            });

            // Map API response to UI model
            const lang = localStorage.getItem('ketmon_lang') || 'uz';
            const mappedResults = response.tours.map(t => ({
                id: t.id,
                title: lang === 'uz' ? t.titleUz : (lang === 'ru' ? t.titleRu : t.titleEn) || t.titleUz,
                destination: lang === 'uz' ? t.destinationCity : t.destinationCity, // Add more lang logic if needed
                price: parseFloat(t.pricePerPerson),
                image: t.images && t.images.length > 0 ? t.images[0].imageUrl : 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800',
                rating: t.rating || 4.5,
                duration: t.durationDays,
                styles: [t.category]
            }));

            calculatorState.results = mappedResults;

            // Hide loading
            if (loader) loader.style.display = 'none';

            // Display results
            displayResults(mappedResults);
        } catch (error) {
            console.error('Calculator API Error:', error);
            if (loader) loader.style.display = 'none';
            // Fallback to sample data if API fails or is not available
            console.log('Falling back to sample data');
            // Filter sample tours based on budget
            const budget = budgetRanges[calculatorState.selectedBudget];
            const filtered = sampleTours.filter(t => {
                const totalCost = t.price * calculatorState.travelers;
                return totalCost >= budget.min && totalCost <= budget.max;
            });
            displayResults(filtered);
        }
    })();
}

// Display Results
function displayResults(results) {
    const grid = document.getElementById('calc-results-grid');
    const noResults = document.getElementById('no-results');
    const resultsCount = document.getElementById('results-count');

    if (results.length === 0) {
        if (noResults) noResults.style.display = 'block';
        if (grid) grid.innerHTML = '';
        if (resultsCount) resultsCount.textContent = `Found 0 tours`;
        return;
    }

    if (noResults) noResults.style.display = 'none';
    if (resultsCount) resultsCount.textContent = `Found ${results.length} tours • Sorted by price`;

    if (grid) {
        grid.innerHTML = results.map(tour => {
            const totalPrice = tour.price * calculatorState.travelers;
            return `
                <div class="tour-card-horizontal" style="max-width: 100%; cursor: pointer;" onclick="window.location.href='tour-detail.html?id=${tour.id}'">
                    <div class="tour-card-image">
                        <img src="${tour.image}" alt="${tour.destination}" loading="lazy">
                        <span class="tour-badge">⭐ ${tour.rating}</span>
                    </div>
                    <div class="tour-card-content">
                        <h3 class="tour-card-title">${tour.title}</h3>
                        <p class="tour-card-description">${tour.destination} • ${tour.duration} days</p>
                        <div class="tour-card-footer">
                            <div>
                                <span class="tour-price">$${totalPrice.toLocaleString()}</span>
                                <small style="display: block; color: #718096; font-size: 12px;">
                                    for ${calculatorState.travelers} ${calculatorState.travelers === 1 ? 'person' : 'people'}
                                </small>
                            </div>
                            <div class="tour-card-actions">
                                <a href="#" class="tour-action-btn tour-btn-consult" data-text="btn_ask"
                                    onclick="event.stopPropagation(); event.preventDefault(); openChatbot('${tour.title}', '$${totalPrice}');">Ask</a>
                                <a href="tour-detail.html?id=${tour.id}" class="tour-action-btn tour-btn-book" data-text="btn_details"
                                    onclick="event.stopPropagation();">Details</a>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
}

// Reset Calculator
function resetCalculator() {
    console.log('Resetting calculator');
    // Reset state
    calculatorState.currentStep = 1;
    calculatorState.selectedBudget = null;
    calculatorState.travelers = 2;
    calculatorState.duration = null;
    calculatorState.preferences = [];
    calculatorState.results = [];

    // Reset UI
    document.querySelectorAll('.calc-step').forEach(step => step.classList.remove('active'));
    document.querySelectorAll('.step-indicator').forEach(ind => {
        ind.classList.remove('active', 'completed');
    });

    const step1 = document.getElementById('calc-step-1');
    if (step1) step1.classList.add('active');
    const ind1 = document.getElementById('step-ind-1');
    if (ind1) ind1.classList.add('active');

    document.querySelectorAll('.budget-option').forEach(opt => opt.classList.remove('active'));
    document.querySelectorAll('.preference-card').forEach(card => card.classList.remove('active'));

    const travelerCountEl = document.getElementById('traveler-count');
    if (travelerCountEl) travelerCountEl.textContent = '2';

    // Reset selection grids
    document.querySelectorAll('#traveler-selection .selection-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent.trim() === '2') btn.classList.add('active');
    });

    document.querySelectorAll('#duration-selection .selection-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    const nextBtn = document.getElementById('step1-next');
    if (nextBtn) nextBtn.disabled = true;

    // Scroll to calculator
    const calc = document.getElementById('smart-calculator');
    if (calc) {
        calc.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Initialize calculator on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log('Smart Budget Calculator initialized');
});
