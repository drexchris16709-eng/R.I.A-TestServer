function toggleAdvancedMenu() {
    const menu = document.getElementById('advMenu');
    const overlay = document.getElementById('advOverlay');
    const open = !menu.classList.contains('active');

    menu.classList.toggle('active', open);
    overlay.classList.toggle('active', open);
    document.body.classList.toggle('adv-open', open);
}

function redirectTo(url) {
    if (document.body.classList.contains('adv-open')) toggleAdvancedMenu();
    location.href = url;
}

function selectAdvanced(name) {
    toggleAdvancedMenu();
    if (name === 'Users List') {
        openUsersList();
    } else if (name === 'Fast Login') {
        openFastLogin();
    } else if (name === 'Handlers Section') {
        redirectTo(HANDLERS_PAGE);
    } else {
        openFeatureModal(name);
    }
}

let unavailableToast = null;
let unavailableDim = null;
let unavailableTimer = null;
const UNAVAILABLE_DURATION = 4000;

function showUnavailable(message) {
    if (!unavailableToast) {
        unavailableDim = document.createElement('div');
        unavailableDim.id = 'unavailableDim';
        unavailableDim.onclick = hideUnavailable;
        document.body.appendChild(unavailableDim);

        unavailableToast = document.createElement('div');
        unavailableToast.id = 'unavailableToast';
        unavailableToast.setAttribute('role', 'alert');
        unavailableToast.onclick = hideUnavailable;
        document.body.appendChild(unavailableToast);
    }

    unavailableToast.textContent = message || 'This feature is not available right now.';

    clearTimeout(unavailableTimer);
    unavailableToast.classList.remove('show');
    void unavailableToast.offsetWidth;
    unavailableToast.classList.add('show');
    unavailableDim.classList.add('show');

    unavailableTimer = setTimeout(hideUnavailable, UNAVAILABLE_DURATION);
}

function hideUnavailable() {
    clearTimeout(unavailableTimer);
    if (unavailableToast) unavailableToast.classList.remove('show');
    if (unavailableDim) unavailableDim.classList.remove('show');
}

function openFeatureModal(title) {
    showUnavailable();
}

const featureModal = document.getElementById('featureModal');
const closeFeatureModalBtn = document.getElementById('closeFeatureModal');
if (closeFeatureModalBtn) {
    closeFeatureModalBtn.onclick = () => featureModal.classList.remove('show');
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
}

function selectOption(menuName) {
    toggleSidebar();
    if (menuName === 'Information') {
        infoModal.classList.add("show");
    } else if (menuName === 'System Notice') {
        systemNoticeModal.classList.add("show");
    } else if (menuName === 'Social Media\'s') {
        socialModal.classList.add("show");
    } else if (menuName === 'Other Apps') {
        otherAppsModal.classList.add("show");
    } else {
        showUnavailable();
    }
}

const infoModal = document.getElementById("infoModal");
const closeModalBtn = document.getElementById("closeModal");

if (closeModalBtn) {
    closeModalBtn.onclick = () => {
        infoModal.classList.remove("show");
    };
}

const systemNoticeModal = document.getElementById("systemNoticeModal");
const closeSystemNoticeBtn = document.getElementById("closeSystemNotice");

if (closeSystemNoticeBtn) {
    closeSystemNoticeBtn.onclick = () => {
        systemNoticeModal.classList.remove("show");
    };
}

const socialModal = document.getElementById("socialModal");
const closeSocialModalBtn = document.getElementById("closeSocialModal");

if (closeSocialModalBtn) {
    closeSocialModalBtn.onclick = () => {
        socialModal.classList.remove("show");
    };
}

const otherAppsModal = document.getElementById("otherAppsModal");
const closeOtherAppsBtn = document.getElementById("closeOtherApps");

if (closeOtherAppsBtn) {
    closeOtherAppsBtn.onclick = () => {
        otherAppsModal.classList.remove("show");
    };
}

const noticeDetailModal = document.getElementById("noticeDetailModal");
const closeNoticeDetailBtn = document.getElementById("closeNoticeDetail");
const noticeDetailTitle = document.getElementById("noticeDetailTitle");
const noticeDetailText = document.getElementById("noticeDetailText");

const partnershipVideosModal = document.getElementById("partnershipVideosModal");
const closePartnershipVideosBtn = document.getElementById("closePartnershipVideos");

if (closePartnershipVideosBtn) {
    closePartnershipVideosBtn.onclick = () => {
        partnershipVideosModal.classList.remove("show");
        noticeDetailModal.classList.add("show");
    };
}

function openPartnershipVideosModal() {
    if (noticeDetailModal) noticeDetailModal.classList.remove("show");
    if (!partnershipVideosModal) return;
    partnershipVideosModal.classList.add("show");

    const items = partnershipVideosModal.querySelectorAll('.partnership-video-item');
    items.forEach(item => {
        const video = item.querySelector('video');
        if (!video) return;
        item.style.cursor = "pointer";
        video.style.cursor = "pointer";
        item.onclick = (e) => {
            e.preventDefault();
            openMediaLightbox(video);
        };
    });
}

const lightbox = document.getElementById("mediaLightbox");
const lightboxContainer = document.getElementById("lightboxContainer");
const closeLightboxBtn = document.getElementById("closeLightbox");

function closeMediaLightbox() {
    const activeVideo = lightboxContainer.querySelector('video');
    if (activeVideo) {
        activeVideo.pause();
        activeVideo.muted = true;
    }
    lightboxContainer.innerHTML = '';
    lightbox.classList.remove("show");
}

if (closeLightboxBtn) {
    closeLightboxBtn.onclick = closeMediaLightbox;
}

function openMediaLightbox(sourceVideo) {
    lightboxContainer.innerHTML = '';
    const activeVideo = document.createElement('video');
    const source = sourceVideo.querySelector('source');
    activeVideo.src = source ? source.src : sourceVideo.src;
    activeVideo.controls = true;
    activeVideo.autoplay = true;
    activeVideo.muted = false;
    activeVideo.style.maxWidth = '100%';
    activeVideo.style.maxHeight = '80vh';
    activeVideo.style.display = 'block';
    activeVideo.style.margin = 'auto';

    lightboxContainer.appendChild(activeVideo);
    lightbox.classList.add("show");
}

function openImageLightbox(sourceImg) {
    lightboxContainer.innerHTML = '';
    const activeImg = document.createElement('img');
    activeImg.src = sourceImg.src;
    activeImg.style.maxWidth = '100%';
    activeImg.style.maxHeight = '80vh';
    activeImg.style.display = 'block';
    activeImg.style.margin = 'auto';

    lightboxContainer.appendChild(activeImg);
    lightbox.classList.add("show");
}

const manualPicturesModal = document.getElementById("manualPicturesModal");
const closeManualPicturesBtn = document.getElementById("closeManualPictures");

if (closeManualPicturesBtn) {
    closeManualPicturesBtn.onclick = () => {
        manualPicturesModal.classList.remove("show");
        noticeDetailModal.classList.add("show");
    };
}

function openManualPicturesModal() {
    noticeDetailModal.classList.remove("show");
    manualPicturesModal.classList.add("show");

    const manualPictures = manualPicturesModal.querySelectorAll(".manual-picture");
    manualPictures.forEach(img => {
        img.style.cursor = "pointer";
        img.onclick = () => {
            openImageLightbox(img);
        };
    });
}

const noticeContentData = {
    'From The Developers': [
        'Welcome to R.I.A: Recording Information Application! R.I.A organizes and manages school-related information — records, announcements, schedules, activities, and events — combining information management, communication, and interactive tools into one convenient platform for students and teachers.',
        'Get ready for the next generation of R.I.A! We\'re officially launching our first-ever website integration — a major step toward a seamless interface across every platform we support. This is just the beginning: our roadmap is packed with new features, UX enhancements, and adaptive modules coming soon to boost your productivity.',
        'Behind the scenes, our specialized system framework, Super AI George, now manages real-time optimization, rendering, and interface adaptability to keep performance smooth and stable. Future improvements will continue to roll out automatically through this framework — refining the system without requiring hard reboots.'
    ],
    'System Warning': [
        'Security notice: Please ensure your login credentials are kept confidential. Unauthorized attempts to bypass access levels or tamper with system logs will trigger safety blocks.',
        'All logs, user data records, configurations, and cryptographic parameters handled in this system are strictly confidential. Sharing, exporting, or disclosing internal system data to outside parties is prohibited — always lock your session when leaving your device unattended.',
        'Extended use of this system increases background processing load and may cause your device to run warmer than usual. Take periodic breaks, avoid running other heavy processes at the same time, and close the session if your device becomes uncomfortably warm or starts to stutter.',
        'Some sections contain advanced technical or mature-audience content intended for users aged 18 and older. By accessing these sections, you confirm you meet the age requirement — parental guidance is advised for unsupervised minors.'
    ],
    'Account Termination': 'Accounts found in violation of platform policies, or those flagged for suspicious data entries, are subject to permanent deactivation. Reach out to administration if you have questions.',
    'New Features': 'Check out our latest upgrades! We have optimized dashboard responsiveness, integrated cleaner minimalist design aesthetics, and improved overall navigation speed.',
    'Manual & Guidelines': 'Follow the step-by-step guidelines provided here to properly navigate user portals, submit records, and utilize application functions efficiently.',
    'Partnership': 'Interested in collaborating or integrating with R.I.A? Reach out through our official channels to explore institutional partnerships, sponsorships, and joint technological ventures.'
};

function openNoticeDetail(title) {
    if (noticeDetailTitle) noticeDetailTitle.innerText = title;

    const container = document.querySelector("#noticeDetailModal .infoCardsContainer");
    const content = noticeContentData[title];

    const cardsHTML = Array.isArray(content)
        ? content.map(text => `<div class="infoCard"><p>${text}</p></div>`).join("")
        : `<div class="infoCard"><p>${content || 'No specific details available.'}</p></div>`;

    container.innerHTML = cardsHTML;

    if (title === 'Partnership') {
        container.insertAdjacentHTML("beforeend", `
            <button class="notice-card-btn" onclick="openPartnershipVideosModal()">
                <span>Partnership Videos</span>
                <span class="arrow">&gt;</span>
            </button>
        `);
    } else if (title === 'Manual & Guidelines') {
        container.insertAdjacentHTML("beforeend", `
            <button class="notice-card-btn" onclick="openManualPicturesModal()">
                <span>Manual & Guidelines Pictures</span>
                <span class="arrow">&gt;</span>
            </button>
        `);
    }

    if (systemNoticeModal) systemNoticeModal.classList.remove("show");
    if (noticeDetailModal) noticeDetailModal.classList.add("show");
}

if (closeNoticeDetailBtn) {
    closeNoticeDetailBtn.onclick = () => {
        if (noticeDetailModal) noticeDetailModal.classList.remove("show");
        if (systemNoticeModal) systemNoticeModal.classList.add("show");
    };
}

const createAccountModal = document.getElementById("createAccountModal");
const closeCreateAccountBtn = document.getElementById("closeCreateAccount");
const createAccountView1 = document.getElementById("createAccountView1");
const createAccountViewRole = document.getElementById("createAccountViewRole");
const createAccountViewStudent = document.getElementById("createAccountViewStudent");
const createAccountViewTeacher = document.getElementById("createAccountViewTeacher");
const createAccountViewSpecial = document.getElementById("createAccountViewSpecial");
const specialsMenu = document.getElementById("specialsMenu");
const specialsToggle = document.getElementById("specialsToggle");
let currentSpecialType = '';
const successModal = document.getElementById("successModal");

function openCreateAccountModal() {
    if (createAccountModal) {
        switchCreateAccountView('initial');
        updateCooldownUI();
        createAccountModal.classList.add("show");
    }
}

function switchCreateAccountView(viewName, clickedBtn = null) {
    if (clickedBtn) {
        clickedBtn.classList.add("loading");
        setTimeout(() => {
            clickedBtn.classList.remove("loading");
            executeViewSwitch(viewName);
        }, 400);
    } else {
        executeViewSwitch(viewName);
    }
}

function setSpecialsMenu(open) {
    if (!specialsMenu || !specialsToggle) return;
    specialsMenu.classList.toggle("show", open);
    specialsToggle.setAttribute("aria-expanded", open ? "true" : "false");
}

// Center the Specials icon directly under the X (close) button
function alignSpecialsToggle() {
    if (!specialsToggle || !closeCreateAccountBtn || !createAccountViewRole) return;
    const x = closeCreateAccountBtn.getBoundingClientRect();
    const body = createAccountViewRole.getBoundingClientRect();
    if (!x.width || !body.width) return;
    specialsToggle.style.width = x.width + "px";
    specialsToggle.style.right = Math.max(body.right - x.right, 0) + "px";
    if (specialsMenu) specialsMenu.style.right = specialsToggle.style.right;
}
window.addEventListener("resize", alignSpecialsToggle);

/* ---------- Student form: 2 steps (credentials -> details) ---------- */
function setStudentStep(form, step) {
    if (!form) return;
    form.dataset.step = String(step);
    form.querySelectorAll('.student-step').forEach(el => {
        el.style.display = el.dataset.step === String(step) ? '' : 'none';
    });
}

const NEXT_STEP_DELAY_MS = 2000;

function studentNextStep(form, btn) {
    if (!form) return;
    const step1 = form.querySelector('.student-step[data-step="1"]');
    btn = btn || step1.querySelector('.request-btn');
    if (btn && btn.classList.contains('loading')) return;

    const fields = step1.querySelectorAll('input');
    for (const f of fields) {
        if (!f.checkValidity()) { f.reportValidity(); return; }
    }

    // 2-second loading on the Next button before showing step 2
    if (btn) btn.classList.add('loading');
    setTimeout(() => {
        if (btn) btn.classList.remove('loading');
        setStudentStep(form, 2);
        const first = form.querySelector('.student-step[data-step="2"] input');
        if (first) first.focus();
    }, NEXT_STEP_DELAY_MS);
}

function resetStudentForm() {
    const f = document.querySelector('#createAccountViewStudent form');
    if (f) { f.reset(); setStudentStep(f, 1); }
}

function toggleSpecialsMenu(event) {
    if (event) event.stopPropagation();
    setSpecialsMenu(!specialsMenu.classList.contains("show"));
}

/* ---------- Specials: fields for each account type ---------- */
const SPECIAL_FORMS = {
    'Test Account': [
        { name: 'handlersId', label: 'Handlers ID:', ph: 'Type your Handlers ID here...', numeric: true, length: 12 },
        { name: 'password',   label: 'Password:',    ph: 'Type your Password here...', secret: true },
        { name: 'username',   label: 'User Name:',   ph: 'Type your User Name here...' },
        { name: 'purpose',    label: 'Purpose:',     ph: 'Type your Purpose here...' },
        { name: 'school',     label: 'School:',      ph: 'Type your School here...' },
        { name: 'idNumber',   label: 'LRN / Contact No:', ph: 'Type your LRN or Contact No. here...' }
    ],
    'Super Account': [
        { name: 'handlersId', label: 'Handlers ID:', ph: 'Type your Handlers ID here...', numeric: true, length: 12 },
        { name: 'password',   label: 'Password:',    ph: 'Type your Password here...', secret: true },
        { name: 'username',   label: 'User Name:',   ph: 'Type your User Name here...' },
        { name: 'purpose',    label: 'Purpose:',     ph: 'Type your Purpose here...' },
        { name: 'developerId', label: 'Developer ID:', ph: 'Type your Developer ID here...', numeric: true, length: 12 },
        { name: 'idNumber',   label: 'LRN / Contact No:', ph: 'Type your LRN or Contact No. here...' }
    ],
    'Handlers': [
        { name: 'developerId', label: 'Developer ID:', ph: 'Type your Developer ID here...', numeric: true, length: 12 },
        { name: 'username',   label: 'User Name:',   ph: 'Type your User Name here...' },
        { name: 'pin',        label: '12 PIN:',      ph: 'Type your 12-digit PIN here...', numeric: true, secret: true, length: 12 },
        { name: 'purpose',    label: 'Purpose:',     ph: 'Type your Purpose here...' },
        { name: 'age',        label: 'Age:',         ph: 'Type your Age here...', numeric: true, maxLength: 3 },
        { name: 'school',     label: 'School:',      ph: 'Type your School here...' }
    ],
    'Developers': [
        { name: 'purpose',    label: 'Purpose:',     ph: 'Type your Purpose here...' },
        { name: 'age',        label: 'Age:',         ph: 'Type your Age here...', numeric: true, maxLength: 3 },
        { name: 'username',   label: 'User Name:',   ph: 'Type your User Name here...' },
        { name: 'industry',   label: 'Developer Industry:', ph: 'Type your Developer Industry here...' },
        { name: 'pin',        label: '12 PIN:',      ph: 'Type your 12-digit PIN here...', numeric: true, secret: true, length: 12 },
        { name: 'country',    label: 'Country:',     ph: 'Type your Country here...' }
    ]
};

function renderSpecialFields(type) {
    const box = document.getElementById('specialFields');
    if (!box) return;
    box.innerHTML = '';

    // Two steps: fields 1-3 (Next) and fields 4-6 (Request)
    const makeStep = (n) => {
        const s = document.createElement('div');
        s.className = 'student-step';
        s.dataset.step = String(n);
        if (n === 2) s.style.display = 'none';
        box.appendChild(s);
        return s;
    };
    const step1 = makeStep(1);
    const step2 = makeStep(2);

    (SPECIAL_FORMS[type] || []).forEach((f, i) => {
        const group = document.createElement('div');
        group.className = 'input-group';

        const label = document.createElement('label');
        label.textContent = f.label;

        const input = document.createElement('input');
        input.type = f.secret ? 'password' : 'text';
        input.name = f.name;
        input.placeholder = f.ph;
        input.required = true;
        input.autocomplete = 'off';
        if (f.numeric) {
            input.inputMode = 'numeric';
            input.pattern = '[0-9]*';
            input.dataset.numeric = '1';
        }
        if (f.length) {
            input.minLength = f.length;
            input.maxLength = f.length;
            input.pattern = '[0-9]{' + f.length + '}';
            input.title = 'Enter exactly ' + f.length + ' digits.';
        } else if (f.maxLength) {
            input.maxLength = f.maxLength;
        }

        group.appendChild(label);
        group.appendChild(input);
        (i < 3 ? step1 : step2).appendChild(group);
    });

    const nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'request-btn';
    nextBtn.textContent = 'Next';
    nextBtn.onclick = () => studentNextStep(nextBtn.form, nextBtn);
    step1.appendChild(nextBtn);

    const reqBtn = document.createElement('button');
    reqBtn.type = 'submit';
    reqBtn.className = 'request-btn';
    reqBtn.textContent = 'Request';
    step2.appendChild(reqBtn);

    const form = box.closest('form');
    if (form) setStudentStep(form, 1);
}

// Numbers-only fields: strip anything that isn't a digit as the user types or pastes
document.addEventListener('input', (e) => {
    const t = e.target;
    if (t && t.dataset && t.dataset.numeric === '1') {
        const clean = t.value.replace(/\D/g, '');
        if (clean !== t.value) t.value = clean;
    }
});

function openSpecialForm(type) {
    currentSpecialType = type;
    renderSpecialFields(type);
    const title = document.getElementById("specialRoleTitle");
    if (title) title.textContent = type;
    setSpecialsMenu(false);
    switchCreateAccountView('special-form');
}

// Close the Specials popup when tapping anywhere outside of it
document.addEventListener("click", (e) => {
    if (!specialsMenu || !specialsMenu.classList.contains("show")) return;
    if (specialsMenu.contains(e.target) || specialsToggle.contains(e.target)) return;
    setSpecialsMenu(false);
});

function executeViewSwitch(viewName) {
    setSpecialsMenu(false);
    if (viewName === 'student-form' || viewName === 'teacher-form') {
        const sel = viewName === 'student-form' ? '#createAccountViewStudent form' : '#createAccountViewTeacher form';
        const sf = document.querySelector(sel);
        if (sf) setStudentStep(sf, 1);
    }
    if (createAccountViewSpecial) createAccountViewSpecial.style.display = "none";
    if (createAccountView1) createAccountView1.style.display = "none";
    if (createAccountViewRole) createAccountViewRole.style.display = "none";
    if (createAccountViewStudent) createAccountViewStudent.style.display = "none";
    if (createAccountViewTeacher) createAccountViewTeacher.style.display = "none";

    if (viewName === 'initial') {
        createAccountView1.style.display = "flex";
    } else if (viewName === 'role-select') {
        createAccountViewRole.style.display = "flex";
        alignSpecialsToggle();
    } else if (viewName === 'student-form') {
        createAccountViewStudent.style.display = "flex";
    } else if (viewName === 'teacher-form') {
        createAccountViewTeacher.style.display = "flex";
    } else if (viewName === 'special-form') {
        createAccountViewSpecial.style.display = "flex";
    }
}

if (closeCreateAccountBtn) {
    closeCreateAccountBtn.onclick = () => {
        if (createAccountModal) createAccountModal.classList.remove("show");
    };
}

/* ---------- Create Account cooldown (2 minutes) ---------- */
const ACCOUNT_COOLDOWN_MS = 2 * 60 * 1000;
const ACCOUNT_COOLDOWN_KEY = 'ria_last_account_request';
let cooldownTimer = null;

function getCooldownLeft() {
    let last = 0;
    try { last = Number(localStorage.getItem(ACCOUNT_COOLDOWN_KEY)) || 0; } catch (e) {}
    const left = last + ACCOUNT_COOLDOWN_MS - Date.now();
    return Math.min(Math.max(left, 0), ACCOUNT_COOLDOWN_MS);
}

function startAccountCooldown() {
    try { localStorage.setItem(ACCOUNT_COOLDOWN_KEY, String(Date.now())); } catch (e) {}
}

function formatCooldown(ms) {
    const s = Math.ceil(ms / 1000);
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
}

function updateCooldownUI() {
    const btn = createAccountView1 && createAccountView1.querySelector('.register-btn');
    if (!btn) return;
    let note = document.getElementById('cooldownNote');
    const left = getCooldownLeft();

    if (left > 0) {
        if (!note) {
            note = document.createElement('p');
            note.id = 'cooldownNote';
            note.className = 'create-account-note';
            createAccountView1.appendChild(note);
        }
        btn.disabled = true;
        note.textContent = 'You can create another account in ' + formatCooldown(left) + '.';
        if (!cooldownTimer) cooldownTimer = setInterval(updateCooldownUI, 1000);
    } else {
        btn.disabled = false;
        if (note) note.remove();
        clearInterval(cooldownTimer);
        cooldownTimer = null;
    }
}

(function () {
    const style = document.createElement('style');
    style.textContent = '.register-btn:disabled { opacity: 0.45; cursor: not-allowed; box-shadow: none; }';
    document.head.appendChild(style);
})();

/* ---------- Handlers page ---------- */
const HANDLERS_PAGE = '../HandlersSection/H.html';

function animateCount(el, target, duration = 800) {
    const token = String(Date.now() + Math.random());
    el.dataset.token = token;
    const from = Number(el.textContent) || 0;
    const start = performance.now();
    function frame(now) {
        if (el.dataset.token !== token) return;
        const p = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(from + (target - from) * eased);
        if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
}

const usersListModal = document.getElementById("usersListModal");
const closeUsersListBtn = document.getElementById("closeUsersList");
const usersCards = document.getElementById("usersCards");
const usersSpecialsToggle = document.getElementById("usersSpecialsToggle");
const usersSpecialsMenu = document.getElementById("usersSpecialsMenu");

let usersAll = [];
let usersCategory = 'Student';

/* First match among several possible field names (Firebase documents may use any of them) */
function pickField(acc, keys) {
    for (const k of keys) {
        const v = acc[k];
        if (v !== undefined && v !== null && v !== '') return v;
    }
    return '';
}

/*
  Card format for each Specials group.
  right: [label, [possible Firebase field names]] rows for the right-hand column
*/
const USER_CARD_LAYOUT = {
    'Test Account': {
        right: [
            ['User ID', ['userId']],
            ['Test Account ID', ['testAccountId']],
            ['School', ['school']],
            ['SSID', ['ssid', 'SSID', 'ssId']]
        ]
    },
    'Super Account': {
        right: [
            ['User ID', ['userId']],
            ['Super Account ID', ['superAccountId']],
            ['Bundle ID', ['bundleId']],
            ['SSID', ['ssid', 'SSID', 'ssId']]
        ]
    },
    'Developers': {
        right: [
            ['Developer Industry', ['industry']],
            ['Super Account ID', ['superAccountId']],
            ['SSID', ['ssid', 'SSID', 'ssId']]
        ]
    },
    'Handlers': {
        right: [
            ['Super Account ID', ['superAccountId']],
            ['Age', ['age']],
            ['School', ['school']],
            ['SSID', ['ssid', 'SSID', 'ssId']]
        ]
    },
    'Student': {
        right: [
            ['User ID', ['userId']],
            ['Adviser', ['adviser']],
            ['School', ['school']],
            ['Gr & Sec', ['gradeSection']]
        ]
    },
    'Teacher': {
        right: [
            ['User ID', ['userId']],
            ['Depart', ['department']],
            ['School', ['school']],
            ['Gr & Sec', ['gradeSection']]
        ]
    }
};

// Which Specials group an account belongs to (from the type saved with the account)
function userCategory(acc) {
    const t = String(acc.type || '').toLowerCase();
    if (t.includes('test')) return 'Test Account';
    if (t.includes('super')) return 'Super Account';
    if (t.includes('handler')) return 'Handlers';
    if (t.includes('developer')) return 'Developers';
    if (t.includes('teacher')) return 'Teacher';
    return 'Student';
}

function openUsersList() {
    if (!usersListModal) return;
    stopUsersList();
    usersCategory = 'ALL';
    syncUsersCategoryMenu();
    renderUsersMessage('Loading users...');
    usersListModal.classList.add('show');
    setUsersSpecialsMenu(false);
}

function formatUserDate(v) {
    if (!v) return '';
    let d = null;
    if (typeof v.toDate === 'function') d = v.toDate();
    else if (typeof v === 'number') d = new Date(v);
    else if (typeof v === 'string') {
        const t = Date.parse(v);
        if (isNaN(t)) return v;
        d = new Date(t);
    } else if (v.seconds) d = new Date(v.seconds * 1000);
    if (!d || isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function setUsersSpecialsMenu(open) {
    if (!usersSpecialsMenu || !usersSpecialsToggle) return;
    usersSpecialsMenu.classList.toggle('show', open);
    usersSpecialsToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    const box = usersListModal && usersListModal.querySelector('.users-list-content');
    if (box) box.classList.toggle('menu-open', open);
}

function renderUsersMessage(text) {
    if (!usersCards) return;
    usersCards.innerHTML = '';
    const p = document.createElement('p');
    p.className = 'users-msg';
    p.textContent = text;
    usersCards.appendChild(p);
}

const USER_AVATAR_SVG = '<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="18" r="14"/><path d="M4 62c0-14 5-22 12-22h32c7 0 12 8 12 22z"/></svg>';

// Shows the profile picture saved in Firebase (accounts/{userId}.profilePhoto, set in the Handlers menu).
// No photo, or a photo that fails to load -> the default black person icon.
function setUserAvatar(av, photo) {
    av.innerHTML = USER_AVATAR_SVG;
    if (typeof photo !== 'string' || !/^data:image\/(jpeg|png|webp);base64,/.test(photo)) return;
    const img = document.createElement('img');
    img.className = 'uc-avatar-img';
    img.alt = '';
    img.onload = () => { av.innerHTML = ''; av.appendChild(img); };
    img.onerror = () => { av.innerHTML = USER_AVATAR_SVG; };
    img.src = photo;
}

// Banner saved in Firebase (accounts/{userId}.bannerPhoto, set in the Handlers menu).
// No banner, or one that fails to load -> the dark default banner.
function setUserBanner(el, banner) {
    el.innerHTML = '';
    if (typeof banner !== 'string' || !/^data:image\/(jpeg|png|webp);base64,/.test(banner)) return;
    const img = document.createElement('img');
    img.className = 'uc-banner-img';
    img.alt = '';
    img.onload = () => { el.innerHTML = ''; el.appendChild(img); };
    img.src = banner;
}

function addCardList(ul, rows) {
    rows.forEach(([label, value]) => {
        const li = document.createElement('li');
        const l = document.createElement('span');
        l.className = 'uc-l';
        l.textContent = label;
        const v = document.createElement('span');
        v.className = 'uc-v';
        v.textContent = (value !== undefined && value !== null && value !== '') ? value : '-';
        li.appendChild(l);
        li.appendChild(v);
        ul.appendChild(li);
    });
}

function syncUsersCategoryMenu() {
    if (!usersSpecialsMenu) return;
    usersSpecialsMenu.querySelectorAll('.users-specials-item').forEach(b => {
        b.classList.toggle('active', usersCategory !== 'ALL' && b.dataset.cat === usersCategory);
    });
}

function openUsersList() {
    if (!usersListModal) return;
    stopUsersList();
    usersCategory = 'ALL';
    syncUsersCategoryMenu();
    renderUsersMessage('Loading users...');
    usersListModal.classList.add('show');
    setUsersSpecialsMenu(false);
}

function renderUsersList(users, animate = true) {
    if (Array.isArray(users)) usersAll = users;
    if (!usersCards) return;
    usersCards.innerHTML = '';
    usersCards.scrollTop = 0;

    const showAll = usersCategory === 'ALL';
    const list = showAll ? usersAll : usersAll.filter(u => u.category === usersCategory);
    if (!list.length) {
        renderUsersMessage('No users found');
        return;
    }

    const fallbackLayout = USER_CARD_LAYOUT[usersCategory] || USER_CARD_LAYOUT.Student;
    list.forEach((u, i) => {
        const acc = u.acc;
        const cardCat = showAll ? (u.category || userCategory(acc)) : usersCategory;
        const layout = USER_CARD_LAYOUT[cardCat] || fallbackLayout;

        const card = document.createElement('div');
        card.className = animate ? 'user-card user-row' : 'user-card';
        if (animate) card.style.animationDelay = (0.1 + Math.min(i, 12) * 0.07) + 's';

        const banner = document.createElement('div');
        banner.className = 'uc-banner';
        setUserBanner(banner, acc.bannerPhoto);

        const top = document.createElement('div');
        top.className = 'uc-top';
        const av = document.createElement('div');
        av.className = 'uc-avatar';
        setUserAvatar(av, acc.profilePhoto);
        if (typeof isAccountOnline === 'function' && isAccountOnline(acc)) av.classList.add('is-online');
        const who = document.createElement('div');
        who.className = 'uc-who';
        const nm = document.createElement('div');
        nm.className = 'uc-name';
        nm.textContent = pickField(acc, ['username', 'userName', 'idValue']) || '-';
        const ty = document.createElement('div');
        ty.className = 'uc-type';
        ty.textContent = acc.type || cardCat;
        who.appendChild(nm);
        who.appendChild(ty);
        top.appendChild(av);
        top.appendChild(who);

        const cols = document.createElement('div');
        cols.className = 'uc-cols';
        const left = document.createElement('ul');
        const right = document.createElement('ul');
        addCardList(left, [
            ['Position', acc.type],
            ['Role', acc.role],
            ['Date', u.date],
            ['Acc Status', u.status]
        ]);
        addCardList(right, layout.right.map(([label, keys]) => [label, pickField(acc, keys)]));
        cols.appendChild(left);
        cols.appendChild(right);

        card.appendChild(banner);
        card.appendChild(top);
        card.appendChild(cols);
        usersCards.appendChild(card);
    });
}

if (usersSpecialsToggle) {
    usersSpecialsToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        setUsersSpecialsMenu(!usersSpecialsMenu.classList.contains('show'));
    });
}

if (usersSpecialsMenu) {
    usersSpecialsMenu.querySelectorAll('.users-specials-item').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const clickedCat = btn.dataset.cat;
            usersCategory = (usersCategory === clickedCat) ? 'ALL' : clickedCat;
            syncUsersCategoryMenu();
            setUsersSpecialsMenu(false);
            renderUsersList();
        });
    });
}

// Close the Specials popup when tapping anywhere outside of it
document.addEventListener('click', (e) => {
    if (!usersSpecialsMenu || !usersSpecialsMenu.classList.contains('show')) return;
    if (usersSpecialsMenu.contains(e.target) || usersSpecialsToggle.contains(e.target)) return;
    setUsersSpecialsMenu(false);
});

let usersUnsub = null;
let usersOnlineTimer = null;

// Online count = accounts with a fresh presence heartbeat. Re-checked every 10 s so stale ones drop off.
function refreshOnlineCount(rerender) {
    const el = document.getElementById('usersOnlineCount');
    if (!el || typeof isAccountOnline !== 'function') return;
    const n = usersAll.filter(u => isAccountOnline(u.acc)).length;
    const changed = el.textContent !== String(n);
    el.textContent = String(n);
    if (rerender && changed && usersCards) {
        const keep = usersCards.scrollTop;
        renderUsersList(undefined, false);
        usersCards.scrollTop = keep;
    }
}

function toUsersRows(accounts) {
    return accounts
        .filter(a => a && (a.idValue || a.username))
        .map(a => ({
            acc: a,
            category: userCategory(a),
            date: a.date || formatUserDate(a.createdAt),
            status: a.status || 'Done Created'
        }))
        .reverse();                              // newest account first
}

function stopUsersList() {
    if (usersUnsub) { usersUnsub(); usersUnsub = null; }
    if (usersOnlineTimer) { clearInterval(usersOnlineTimer); usersOnlineTimer = null; }
}

// Live from Firebase: every account made with "Create Account" on any device appears here.
function openUsersList() {
    if (!usersListModal) return;
    stopUsersList();
    usersCategory = 'ALL';
    syncUsersCategoryMenu();
    renderUsersMessage('Loading users...');
    usersListModal.classList.add('show');
    setUsersSpecialsMenu(false);

    const totalEl = document.getElementById('usersTotalCount');
    document.getElementById('usersOnlineCount').textContent = '0';
    animateCount(totalEl, 0);

    let firstLoad = true;
    usersUnsub = listenAccounts(accounts => {
        const rows = toUsersRows(accounts);
        const keep = usersCards ? usersCards.scrollTop : 0;
        renderUsersList(rows, firstLoad);
        if (!firstLoad && usersCards) usersCards.scrollTop = keep;
        firstLoad = false;
        animateCount(totalEl, rows.length);
        refreshOnlineCount(false);
    }, err => {
        console.error('Could not load users from Firebase:', err);
        renderUsersMessage('Could not load users. Please check your connection.');
        animateCount(totalEl, 0);
    });
    usersOnlineTimer = setInterval(() => refreshOnlineCount(true), 10000);

}

function closeUsersList() {
    stopUsersList();
    setUsersSpecialsMenu(false);
    if (usersListModal) usersListModal.classList.remove("show");
}

if (closeUsersListBtn) {
    closeUsersListBtn.onclick = closeUsersList;
}

// Firebase accounts go to these pages after a correct LRN / Contact No.
const FL_REDIRECTS = {
    Student: '../TestAccount/Test1.html',
    Teacher: '../TestAccountTeacher/Test1.html'
};

// Only accounts from Firebase (created through "Create Account") are listed. Nothing is hard-coded.
let FAST_LOGIN_USERS = [];

// Black person icon for Firebase users (no photo, no badge)
const FL_PERSON_ICON =
    '<svg viewBox="0 0 24 24" aria-hidden="true">' +
    '<circle cx="12" cy="9.4" r="4" fill="#0b0b0b"/>' +
    '<path d="M3.4 24C3.4 18.7 7.2 15.5 12 15.5s8.6 3.2 8.6 8.5z" fill="#0b0b0b"/></svg>';

const FL_LOGIN_ICON =
    '<svg viewBox="0 0 33 31" aria-hidden="true"><path d="M13 11V2h17v27H13v-9M1 15.5h21M15 8.5l7 7-7 7" ' +
    'fill="none" stroke="#fff" stroke-width="3.2" stroke-linejoin="miter" stroke-linecap="butt"/></svg>';

const flPanel  = document.getElementById('flPanel');
const flList   = document.getElementById('flList');
const flReload = document.getElementById('flReload');
let flBusy = false;
let flReloadTimer = null;
let flLoadToken = 0;

function flMessage(text) {
    flList.innerHTML = '';
    const p = document.createElement('p');
    p.className = 'fl-msg';
    p.textContent = text;
    flList.appendChild(p);
}

// Profile picture saved in Firebase (accounts/{userId}.profilePhoto).
function flValidPhoto(photo) {
    return typeof photo === 'string' && /^data:image\/(jpeg|png|webp);base64,/.test(photo);
}

function renderFastLoginUsers() {
    flList.innerHTML = '';
    if (!FAST_LOGIN_USERS.length) { flMessage('No users found'); return; }
    FAST_LOGIN_USERS.forEach((u, i) => {
        const row = document.createElement('div');
        row.className = 'fl-row';
        row.style.animationDelay = (0.18 + i * 0.045) + 's';

        const img = document.createElement('div');
        img.className = 'fl-avatar';
        if (flValidPhoto(u.photo)) {
            img.style.backgroundImage = 'url("' + u.photo + '")';
        } else {
            img.classList.add('fl-person');
            img.innerHTML = FL_PERSON_ICON;
        }

        const info = document.createElement('div');
        info.className = 'fl-info';
        const top = document.createElement('div');
        top.className = 'fl-top';
        const n = document.createElement('span');
        n.className = 'fl-name';
        n.textContent = u.name;
        top.appendChild(n);

        const r = document.createElement('span');
        r.className = 'fl-role';
        r.textContent = u.role;
        info.append(top, r);

        const go = document.createElement('button');
        go.className = 'fl-go';
        go.setAttribute('aria-label', 'Log in as ' + u.name);
        go.innerHTML = FL_LOGIN_ICON;
        go.onclick = () => fastLoginAs(u);

        row.append(img, info, go);
        flList.appendChild(row);
    });
}

// What each account type types in the User Identity box (all of it is saved in Firebase on the account).
//   Student        -> LRN                    (idValue)
//   Teacher        -> Contact No.            (idValue)
//   Developers     -> Developer ID           (developerId, 12 digits, issued by the system)
//   Handlers       -> Handlers ID            (handlersId, 12 digits, issued by the system)
//   Test / Super   -> LRN or Contact No.     (idNumber)
const FL_LOGIN_KEY = {
    'Student':       { field: 'idValue',     label: 'LRN',                numeric: false },
    'Teacher':       { field: 'idValue',     label: 'Contact No.',        numeric: false },
    'Developers':    { field: 'developerId', label: 'Developer ID',       numeric: true  },
    'Handlers':      { field: 'handlersId',  label: 'Handlers ID',        numeric: true  },
    'Test Account':  { field: 'idNumber',    label: 'LRN or Contact No.', numeric: false },
    'Super Account': { field: 'idNumber',    label: 'LRN or Contact No.', numeric: false }
};

function flFromAccount(a) {
    const key = FL_LOGIN_KEY[a.type];
    const code = key ? String(a[key.field] || '').trim() : '';
    return {
        name: a.username || code,                // User Name shown in the list
        role: a.type,
        photo: a.profilePhoto || null,           // profile picture from Firebase
        code: code,                              // the value that must be typed to log in
        idLabel: key ? key.label : 'ID',
        idNumeric: key ? key.numeric : false,
        url: FL_REDIRECTS[a.type] || FL_REDIRECTS.Student,
        userId: a.userId,
        accountRole: a.role
    };
}

async function loadFastLoginUsers(minDelay) {
    const token = ++flLoadToken;
    flBusy = true;
    flReload.classList.add('spinning');
    flList.classList.add('fl-loading');

    let accounts = [];
    let failed = false;
    try {
        const results = await Promise.all([
            getAllAccounts(),
            new Promise(resolve => { flReloadTimer = setTimeout(resolve, minDelay || 0); })
        ]);
        accounts = results[0];
    } catch (e) {
        console.error('Could not load Fast Login users from Firebase:', e);
        failed = true;
    }

    if (token !== flLoadToken) return;           // panel closed or reloaded meanwhile

    FAST_LOGIN_USERS = accounts.map(flFromAccount).filter(u => u.code);   // an account with nothing to type can't log in
    if (failed) flMessage('Could not load users. Please check your connection.');
    else renderFastLoginUsers();
    flList.scrollTop = 0;
    flList.classList.remove('fl-loading');
    flReload.classList.remove('spinning');
    flBusy = false;
}

let flPendingUser = null;
const flDim   = document.getElementById('flDim');
const flId    = document.getElementById('flId');
const flInput = document.getElementById('flIdInput');
const flErr   = document.getElementById('flIdError');
const flField = document.getElementById('flIdField');

function fastLoginAs(user) {
    flPendingUser = user;
    flInput.value = '';
    flInput.placeholder = 'Type your ' + user.idLabel + ' here...';
    flInput.inputMode = user.idNumeric ? 'numeric' : 'text';
    flInput.type = 'password';
    flId.classList.remove('revealed');
    clearIdentityError();
    flDim.classList.add('show');
    flId.classList.add('show');
    flId.setAttribute('aria-hidden', 'false');
    setTimeout(() => flInput.focus(), 350);
}

function closeIdentity() {
    flPendingUser = null;
    flInput.blur();
    flInput.value = '';
    clearIdentityError();
    flDim.classList.remove('show');
    flId.classList.remove('show');
    flId.setAttribute('aria-hidden', 'true');
}

function toggleIdentityEye() {
    const show = flInput.type === 'password';
    flInput.type = show ? 'text' : 'password';
    flId.classList.toggle('revealed', show);
    flInput.focus();
}

function clearIdentityError() {
    flErr.textContent = '';
    flErr.classList.remove('show');
}

function showIdentityError() {
    flErr.textContent = 'Wrong ' + (flPendingUser ? flPendingUser.idLabel : 'ID') + ' please try again.';
    flErr.classList.add('show');
    flField.classList.remove('shake');
    void flField.offsetWidth;
    flField.classList.add('shake');
    flInput.value = '';
    flInput.focus();
}

function submitIdentity() {
    if (!flPendingUser) return;
    const typed = flInput.value.trim();
    if (typed !== '' && typed === String(flPendingUser.code)) {
        clearIdentityError();
        if (flPendingUser.userId) {
            try {
                sessionStorage.setItem('passkeyUser', JSON.stringify({
                    userId: flPendingUser.userId,
                    role: flPendingUser.accountRole,
                    type: flPendingUser.role
                }));
            } catch (e) {}
        }
        const url = flPendingUser.url;
        if (url) location.href = url;
    } else {
        showIdentityError();
    }
}

flInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); submitIdentity(); }
});
flInput.addEventListener('input', clearIdentityError);

function openFastLogin() {
    if (!flPanel) return;
    FAST_LOGIN_USERS = [];
    flMessage('Loading users...');
    flList.scrollTop = 0;
    document.body.classList.add('fl-open');
    flPanel.setAttribute('aria-hidden', 'false');
    loadFastLoginUsers(0);                                // users come from Firebase
}

function closeFastLogin() {
    if (!flPanel) return;
    closeIdentity();
    clearTimeout(flReloadTimer);
    flLoadToken++;
    flBusy = false;
    flReload.classList.remove('spinning');
    flList.classList.remove('fl-loading');
    document.body.classList.remove('fl-open');
    flPanel.setAttribute('aria-hidden', 'true');
}

function reloadFastLogin() {
    if (flBusy) return;
    loadFastLoginUsers(900);
}

document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (usersListModal && usersListModal.classList.contains('show')) {
        if (usersSpecialsMenu && usersSpecialsMenu.classList.contains('show')) setUsersSpecialsMenu(false);
        else closeUsersList();
    }
    else if (flId.classList.contains('show')) closeIdentity();
    else if (document.body.classList.contains('fl-open')) closeFastLogin();
});

async function handleAccountRequest(event) {
    event.preventDefault();

    // Student/Teacher forms: pressing Enter on step 1 should go to step 2, not submit
    const isTwoStep = event.target.classList.contains('student-form') || event.target.classList.contains('teacher-form') || event.target.classList.contains('special-form');
    if (isTwoStep && event.target.dataset.step === '1') {
        studentNextStep(event.target);
        return;
    }

    const cooldownLeft = getCooldownLeft();
    if (cooldownLeft > 0) {
        showUnavailable('Please wait ' + formatCooldown(cooldownLeft) + ' before creating another account.');
        return;
    }

    const form = event.target;
    const submitBtn = form.querySelector('button[type="submit"]');   // the Request button (not the Next button)
    if (submitBtn && submitBtn.classList.contains("loading")) return;

    const val = (n) => { const el = form.querySelector('[name="' + n + '"]'); return el ? el.value.trim() : ''; };
    const isStudent = !!form.closest('#createAccountViewStudent');
    const isSpecial = !!form.closest('#createAccountViewSpecial');

    if (submitBtn) submitBtn.classList.add("loading");

    try {
        let payload;
        if (isSpecial) {
            const cfg = SPECIAL_FORMS[currentSpecialType] || [];
            const data = {};
            cfg.forEach(f => {
                const el = form.querySelector('[name="' + f.name + '"]');
                data[f.name] = el ? (f.secret ? el.value : el.value.trim()) : '';
            });
            payload = {
                type: currentSpecialType,
                idLabel: cfg.length ? cfg[0].label.replace(/:$/, '') : '',
                idValue: cfg.length ? data[cfg[0].name] : '',
                password: data.password || data.pin || '',
                school: data.school || '',
                ...data
            };
        } else {
            payload = {
                type: isStudent ? 'Student' : 'Teacher',
                idLabel: isStudent ? 'LRN' : 'Contact No',
                idValue: val(isStudent ? 'lrn' : 'contact'),
                password: form.querySelector('[name="password"]').value,
                school: val('school'),
                ...(isStudent ? {
                    username: val('username'),
                    gradeSection: val('gradeSection'),
                    adviser: val('adviser')
                } : {
                    username: val('username'),
                    gradeSection: val('gradeSection'),
                    department: val('department')
                })
            };
        }
        // keep the loading spinner visible for at least 1 second
        await Promise.all([createAccountRequest(payload), new Promise(r => setTimeout(r, 1000))]);
        startAccountCooldown();

        if (createAccountModal) createAccountModal.classList.remove("show");
        if (successModal) successModal.classList.add("show");
        form.reset();
        setStudentStep(form, 1);
    } catch (e) {
        console.error('Account request failed:', e);
        if (e && (e.code === 'ID_NOT_APPROVED' || e.code === 'ID_GENERATION_FAILED')) {
            showUnavailable(e.message);
        } else {
            showUnavailable('Could not send your request. Please check your connection and try again.');
        }
    } finally {
        if (submitBtn) submitBtn.classList.remove("loading");
    }
}

function closeSuccessModal() {
    if (successModal) {
        successModal.classList.remove("show");
    }
}

window.onclick = (e) => {
    if (e.target == infoModal) infoModal.classList.remove("show");
    if (e.target == systemNoticeModal) systemNoticeModal.classList.remove("show");
    if (e.target == noticeDetailModal) {
        noticeDetailModal.classList.remove("show");
        if (systemNoticeModal) systemNoticeModal.classList.add("show");
    }
    if (e.target == partnershipVideosModal) {
        partnershipVideosModal.classList.remove("show");
        noticeDetailModal.classList.add("show");
    }
    if (e.target == socialModal) socialModal.classList.remove("show");
    if (e.target == otherAppsModal) otherAppsModal.classList.remove("show");
    if (e.target == createAccountModal) createAccountModal.classList.remove("show");
    if (e.target == successModal) successModal.classList.remove("show");
    if (e.target == usersListModal) closeUsersList();
    if (e.target == manualPicturesModal) {
        manualPicturesModal.classList.remove("show");
        noticeDetailModal.classList.add("show");
    }
    if (e.target == lightbox) closeMediaLightbox();
    if (e.target == featureModal) featureModal.classList.remove("show");
};

(function() {
    const style = document.createElement('style');
    style.innerHTML = `
        .small-social-icons {
            transform: none;
            margin-top: -12px;
            margin-bottom: 2px;
        }

        button.loading {
            color: transparent !important;
            pointer-events: none !important;
            position: relative !important;
        }

        button.loading::after {
            content: "" !important;
            position: absolute !important;
            width: 20px !important;
            height: 20px !important;
            top: 50% !important;
            left: 50% !important;
            margin-left: -10px !important;
            margin-top: -10px !important;
            border: 3px solid rgba(0, 0, 0, 0) !important;
            border-radius: 50% !important;
            border-top-color: #000000 !important;
            animation: button-loading-spinner 0.6s linear infinite !important;
        }

        @keyframes button-loading-spinner {
            to {
                transform: rotate(360deg);
            }
        }
    `;
    document.head.appendChild(style);
})();

(function () {
    const style = document.createElement('style');
    style.innerHTML = `

        body.net-offline > :not(#netDim):not(#netBanner) img,
        body.net-offline > :not(#netDim):not(#netBanner) picture,
        body.net-offline > :not(#netDim):not(#netBanner) video,
        body.net-offline > :not(#netDim):not(#netBanner) audio,
        body.net-offline > :not(#netDim):not(#netBanner) canvas,
        body.net-offline > :not(#netDim):not(#netBanner) iframe,
        body.net-offline > :not(#netDim):not(#netBanner) svg {
            visibility: hidden !important;
        }
        body.net-offline,
        body.net-offline > :not(#netDim):not(#netBanner),
        body.net-offline > :not(#netDim):not(#netBanner) * {
            background-image: none !important;
        }
        body.net-offline > :not(#netDim):not(#netBanner),
        body.net-offline > :not(#netDim):not(#netBanner) *,
        body.net-offline > :not(#netDim):not(#netBanner) *::before,
        body.net-offline > :not(#netDim):not(#netBanner) *::after {
            animation-play-state: paused !important;
            transition: none !important;
        }
        #netDim {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.66);
            -webkit-backdrop-filter: blur(10px) saturate(140%);
            backdrop-filter: blur(10px) saturate(140%);
            z-index: 2147483646;
            opacity: 0;
            visibility: hidden;
            pointer-events: none;
            transition: opacity .4s ease, visibility 0s linear .4s;
        }
        #netDim.show {
            opacity: 1;
            visibility: visible;
            pointer-events: auto;
            transition: opacity .4s ease;
        }

        #netLoader {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 18px;
            opacity: 0;
            transition: opacity .3s ease;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }
        #netLoader.show { opacity: 1; }
        #netLoader .net-ring {
            width: 64px;
            height: 64px;
            border: 7px solid rgba(255, 255, 255, 0.25);
            border-top-color: #ffffff;
            border-radius: 50%;
            animation: netSpin .9s linear infinite;
        }
        #netLoader p {
            margin: 0;
            color: #ffffff;
            font-size: 16px;
            letter-spacing: .3px;
        }
        @keyframes netSpin { to { transform: rotate(360deg); } }

        #netBanner {
            --w: min(86.6vw, 640px);
            position: fixed;
            top: max(2vw, env(safe-area-inset-top));
            left: 50%;
            width: var(--w);
            aspect-ratio: 1375 / 325;
            z-index: 2147483647;
            container-type: inline-size;
            display: flex;
            align-items: center;
            padding-left: calc(var(--w) * 0.063);
            box-sizing: border-box;
            background: #000000;
            border-radius: calc(var(--w) * 0.058);
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.9);
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            transform: translate(-50%, calc(-100% - 30vh));
            transition: transform .7s cubic-bezier(.22, 1, .36, 1);
            pointer-events: none;
        }
        #netBanner.show { transform: translate(-50%, 0); }
        #netBanner::before {
            content: "";
            position: absolute;
            inset: -5% -4% -25% -4%;
            background: #000000;
            border-radius: inherit;
            filter: blur(32px);
            opacity: .85;
            z-index: -1;
        }
        #netBanner .net-icon {
            width: 16cqw;
            height: 16cqw;
            flex-shrink: 0;
            margin-right: 5.2cqw;
            display: none;
        }
        #netBanner.is-offline .icon-off { display: block; }
        #netBanner.is-online  .icon-on  { display: block; }
        #netBanner .net-title {
            margin: 0;
            color: #ffffff;
            font-size: 8.1cqw;
            font-weight: 300;
            line-height: 1;
        }
        #netBanner .net-sub {
            margin: .6cqw 0 0 0;
            color: #70736d;
            font-size: 1.85cqw;
            line-height: 1.2;
            white-space: nowrap;
        }
    `;
    document.head.appendChild(style);

    const wrap = document.createElement('div');
    wrap.innerHTML = `
        <div id="netDim">
            <div id="netLoader">
                <div class="net-ring"></div>
                <p>Loading Connection...</p>
            </div>
        </div>
        <div id="netBanner" class="is-offline">
            <svg class="net-icon icon-off" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <circle cx="50" cy="50" r="44" stroke="#ff000f" stroke-width="7"/>
                <g stroke="#ff000f" stroke-width="6" stroke-linecap="round">
                    <path d="M22 44 A40 40 0 0 1 78 44"/>
                    <path d="M33 55 A25 25 0 0 1 67 55"/>
                    <path d="M42 65 A11 11 0 0 1 58 65"/>
                </g>
                <circle cx="50" cy="75" r="5" fill="#ff000f"/>
                <line x1="29" y1="25" x2="73" y2="75" stroke="#000000" stroke-width="13" stroke-linecap="round"/>
                <line x1="29" y1="25" x2="73" y2="75" stroke="#ff000f" stroke-width="6" stroke-linecap="round"/>
            </svg>
            <svg class="net-icon icon-on" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <circle cx="50" cy="50" r="44" stroke="#00ff19" stroke-width="7"/>
                <g stroke="#00ff19" stroke-width="6" stroke-linecap="round">
                    <path d="M22 44 A40 40 0 0 1 78 44"/>
                    <path d="M33 55 A25 25 0 0 1 67 55"/>
                    <path d="M42 65 A11 11 0 0 1 58 65"/>
                </g>
                <circle cx="50" cy="75" r="5" fill="#00ff19"/>
            </svg>
            <div>
                <h1 class="net-title">No Internet</h1>
                <p class="net-sub">Please connect to the internet and try again.</p>
            </div>
        </div>
    `;

    let dim, loader, banner, title, sub;
    function mount() {
        if (dim) return;
        while (wrap.firstElementChild) document.body.appendChild(wrap.firstElementChild);
        dim = document.getElementById('netDim');
        loader = document.getElementById('netLoader');
        banner = document.getElementById('netBanner');
        title = banner.querySelector('.net-title');
        sub = banner.querySelector('.net-sub');
    }


    let pausedMedia = [];
    let pausedAnims = [];
    const isOurs = (el) => el && el.closest && el.closest('#netDim, #netBanner');

    function freezePage(on) {
        mount();
        if (on && window.__netFrozen) return;
        window.__netFrozen = on;
        document.body.classList.toggle('net-offline', on);
        if (on) {
            pausedMedia = [];
            document.querySelectorAll('video, audio').forEach(m => {
                try { if (!m.paused) { pausedMedia.push(m); m.pause(); } } catch (e) {}
            });
            pausedAnims = [];
            if (document.getAnimations) {
                document.getAnimations().forEach(a => {
                    const t = a.effect && a.effect.target;
                    if (a.playState === 'running' && !isOurs(t)) { pausedAnims.push(a); a.pause(); }
                });
            }
        } else {
            pausedMedia.forEach(m => { try { m.play(); } catch (e) {} });
            pausedAnims.forEach(a => { try { a.play(); } catch (e) {} });
            pausedMedia = [];
            pausedAnims = [];
        }
    }

    ['click', 'dblclick', 'mousedown', 'mouseup', 'pointerdown', 'pointerup',
     'touchstart', 'touchend', 'keydown', 'keypress', 'keyup', 'input',
     'change', 'submit', 'contextmenu'].forEach(type => {
        document.addEventListener(type, (e) => {
            if (!window.__netFrozen) return;
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
        }, { capture: true, passive: false });
    });

    let timers = [];
    const later = (fn, ms) => timers.push(setTimeout(fn, ms));
    const clearTimers = () => { timers.forEach(clearTimeout); timers = []; };

    function runSequence(kind) {
        mount();
        clearTimers();
        window.__netBusy = true;
        if (kind === 'offline') freezePage(true);

        banner.classList.remove('show');
        dim.classList.add('show');
        loader.classList.add('show');

        later(() => {
            loader.classList.remove('show');
            if (kind === 'offline') {
                banner.className = 'is-offline';
                title.textContent = 'No Internet';
                sub.textContent = 'Please connect to the internet and try again.';
            } else {
                banner.className = 'is-online';
                title.textContent = 'Internet Found';
                sub.textContent = 'You are back to online.';
            }
            void banner.offsetWidth;
            banner.classList.add('show');
        }, 2000);

        if (kind === 'online') {
            later(() => banner.classList.remove('show'), 4500);
            later(() => { dim.classList.remove('show'); freezePage(false); }, 5000);
            later(() => { window.__netBusy = false; }, 5500);
        }
    }

    let isOnline = true;
    let uiUsed = false;

    function applyStatus(nowOnline) {
        if (nowOnline === isOnline) return;
        isOnline = nowOnline;
        if (!nowOnline) {
            uiUsed = true;
            runSequence('offline');
        } else if (uiUsed) {
            runSequence('online');
        }
    }

    const isLocalHost = /^(localhost|127\.|10\.|192\.168\.|0\.0\.0\.0|\[::1\])/.test(location.hostname) || location.protocol === 'file:';

    function ping(url, ms) {
        return new Promise(resolve => {
            const ctrl = new AbortController();
            const t = setTimeout(() => { ctrl.abort(); resolve(false); }, ms);
            fetch(url, { method: 'GET', mode: 'no-cors', cache: 'no-store', signal: ctrl.signal })
                .then(() => { clearTimeout(t); resolve(true); })
                .catch(() => { clearTimeout(t); resolve(false); });
        });
    }

    async function hasInternet() {
        if (!navigator.onLine) return false;
        const stamp = Date.now();
        const tests = [ping('https://www.gstatic.com/generate_204?_=' + stamp, 4000)];
        if (!isLocalHost) tests.push(ping(location.pathname + '?ping=' + stamp, 4000));
        const results = await Promise.all(tests);
        return results.some(Boolean);
    }

    let failCount = 0;
    let checking = false;

    async function check() {
        if (checking) return;
        checking = true;
        try {
            const ok = await hasInternet();
            if (ok) {
                failCount = 0;
                applyStatus(true);
            } else {
                failCount++;
                if (failCount >= 2 || !navigator.onLine) applyStatus(false);
            }
        } finally {
            checking = false;
        }
    }

    window.addEventListener('offline', () => { failCount = 2; applyStatus(false); });
    window.addEventListener('online', check);
    if (navigator.connection && navigator.connection.addEventListener) {
        navigator.connection.addEventListener('change', check);
    }
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') check();
    });

    (function loop() {
        check().finally(() => setTimeout(loop, isOnline ? 2500 : 1500));
    })();

    const start = () => { mount(); if (!navigator.onLine) applyStatus(false); };
    if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
})();

// Fill in Developer ID / Handlers ID for older accounts that do not have one yet.
backfillSystemIds().catch(e => console.warn("ID backfill skipped:", e));

let flUnsub = null;
let flOnlineTimer = null;

function stopFastLoginLive() {
    if (flUnsub) { flUnsub(); flUnsub = null; }
    if (flOnlineTimer) { clearInterval(flOnlineTimer); flOnlineTimer = null; }
}

function refreshFastLoginOnlineStatus() {
    if (!flList || !FAST_LOGIN_USERS.length) return;
    const rows = flList.querySelectorAll('.fl-row');
    FAST_LOGIN_USERS.forEach((u, idx) => {
        const isOnline = typeof isAccountOnline === 'function' && isAccountOnline(u.rawAccount);
        u.online = isOnline;
        const avatar = rows[idx] && rows[idx].querySelector('.fl-avatar');
        if (avatar) avatar.classList.toggle('is-online', isOnline);
    });
}

function renderFastLoginUsers() {
    flList.innerHTML = '';
    if (!FAST_LOGIN_USERS.length) { flMessage('No users found'); return; }
    FAST_LOGIN_USERS.forEach((u, i) => {
        const row = document.createElement('div');
        row.className = 'fl-row';
        row.style.animationDelay = (0.18 + i * 0.045) + 's';

        const img = document.createElement('div');
        img.className = 'fl-avatar';
        if (flValidPhoto(u.photo)) {
            img.style.backgroundImage = 'url("' + u.photo + '")';
        } else {
            img.classList.add('fl-person');
            img.innerHTML = FL_PERSON_ICON;
        }
        if (u.online || (typeof isAccountOnline === 'function' && isAccountOnline(u.rawAccount))) {
            img.classList.add('is-online');
        }

        const info = document.createElement('div');
        info.className = 'fl-info';
        const top = document.createElement('div');
        top.className = 'fl-top';
        const n = document.createElement('span');
        n.className = 'fl-name';
        n.textContent = u.name;
        top.appendChild(n);

        const r = document.createElement('span');
        r.className = 'fl-role';
        r.textContent = u.role;
        info.append(top, r);

        const go = document.createElement('button');
        go.className = 'fl-go';
        go.setAttribute('aria-label', 'Log in as ' + u.name);
        go.innerHTML = FL_LOGIN_ICON;
        go.onclick = () => fastLoginAs(u);

        row.append(img, info, go);
        flList.appendChild(row);
    });
}

function flFromAccount(a) {
    const key = FL_LOGIN_KEY[a.type];
    const code = key ? String(a[key.field] || '').trim() : '';
    return {
        name: a.username || code,
        role: a.type,
        photo: a.profilePhoto || null,
        code: code,
        idLabel: key ? key.label : 'ID',
        idNumeric: key ? key.numeric : false,
        url: FL_REDIRECTS[a.type] || FL_REDIRECTS.Student,
        userId: a.userId,
        accountRole: a.role,
        online: typeof isAccountOnline === 'function' && isAccountOnline(a),
        rawAccount: a
    };
}

function applyFastLoginAccounts(accounts, animate = false) {
    FAST_LOGIN_USERS = accounts.map(flFromAccount).filter(u => u.code);
    const keepScroll = flList ? flList.scrollTop : 0;
    renderFastLoginUsers();
    if (!animate && flList) {
        flList.querySelectorAll('.fl-row').forEach(r => {
            r.style.animation = 'none';
            r.style.opacity = '1';
            r.style.transform = 'none';
        });
    }
    if (flList) flList.scrollTop = keepScroll;
}

async function loadFastLoginUsers(minDelay) {
    const token = ++flLoadToken;
    flBusy = true;
    flReload.classList.add('spinning');
    flList.classList.add('fl-loading');
    stopFastLoginLive();

    let failed = false;
    let initialAccounts = null;

    const minWait = minDelay ? new Promise(resolve => { flReloadTimer = setTimeout(resolve, minDelay); }) : Promise.resolve();

    if (typeof listenAccounts === 'function') {
        await new Promise(resolve => {
            let settled = false;
            const finishOnce = () => {
                if (!settled) { settled = true; resolve(); }
            };
            flUnsub = listenAccounts(accounts => {
                if (token !== flLoadToken) return;
                initialAccounts = accounts;
                applyFastLoginAccounts(accounts, !flList.dataset.hasRendered);
                flList.dataset.hasRendered = '1';
                finishOnce();
            }, err => {
                console.error('Could not stream Fast Login users from Firebase:', err);
                failed = true;
                finishOnce();
            });
            setTimeout(finishOnce, 4000);
        });
    } else {
        try {
            initialAccounts = await getAllAccounts();
        } catch (e) {
            console.error('Could not load Fast Login users from Firebase:', e);
            failed = true;
        }
    }

    await minWait;
    if (token !== flLoadToken) return;

    if (failed && !initialAccounts) {
        flMessage('Could not load users. Please check your connection.');
    } else if (initialAccounts && typeof listenAccounts !== 'function') {
        applyFastLoginAccounts(initialAccounts, true);
    }

    flList.classList.remove('fl-loading');
    flReload.classList.remove('spinning');
    flBusy = false;

    if (!flOnlineTimer) {
        flOnlineTimer = setInterval(refreshFastLoginOnlineStatus, 10000);
    }
}

function closeFastLogin() {
    if (!flPanel) return;
    closeIdentity();
    stopFastLoginLive();
    clearTimeout(flReloadTimer);
    flLoadToken++;
    flBusy = false;
    delete flList.dataset.hasRendered;
    flReload.classList.remove('spinning');
    flList.classList.remove('fl-loading');
    document.body.classList.remove('fl-open');
    flPanel.setAttribute('aria-hidden', 'true');
}

/* ================= Developer Passkeys lock ================= */
// The passkey is checked in Firebase (verifyDeveloperPasskey in accounts-db.js):
// it must be the Passkey of a "Developers" account.
const DEV_PASSKEY_COOLDOWN_MS = 5 * 60 * 1000;   // 1 try only every 5 minutes
const DEV_PASSKEY_NEXT_KEY = 'ria_devPasskeyNextTry';
const DEV_PASSKEY_OK_KEY = 'ria_devPasskeyUnlocked';

const devPkModal = document.getElementById('devPasskeyModal');
const devPkDim = document.getElementById('devPasskeyDim');
const devPkInput = document.getElementById('devPkInput');
const devPkEnter = document.getElementById('devPkEnter');
const devPkError = document.getElementById('devPkError');
const devPkSub = document.getElementById('devPkSub');
let devPkCallback = null;
let devPkTimer = null;

function devSafeGet(store, key) { try { return store.getItem(key); } catch (e) { return null; } }
function devSafeSet(store, key, val) { try { store.setItem(key, val); } catch (e) {} }
function devSafeDel(store, key) { try { store.removeItem(key); } catch (e) {} }

function isDeveloperUnlocked() { return devSafeGet(sessionStorage, DEV_PASSKEY_OK_KEY) === '1'; }

function devPkWaitMs() {
    const next = parseInt(devSafeGet(localStorage, DEV_PASSKEY_NEXT_KEY) || '0', 10);
    return Math.max(0, next - Date.now());
}

function devPkFormat(ms) {
    const t = Math.ceil(ms / 1000);
    return Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0');
}

function devPkRefreshLock() {
    const wait = devPkWaitMs();
    const locked = wait > 0;
    devPkEnter.disabled = locked;
    devPkInput.disabled = locked;
    devPkModal.classList.toggle('is-locked', locked);
    if (locked) {
        devPkError.textContent = 'Too many tries. Try again in ' + devPkFormat(wait) + '.';
        if (!devPkTimer) devPkTimer = setInterval(devPkRefreshLock, 500);
    } else {
        if (devPkTimer) { clearInterval(devPkTimer); devPkTimer = null; }
        if (devPkError.dataset.lockMsg === '1') devPkError.textContent = '';
    }
    devPkError.dataset.lockMsg = locked ? '1' : '';
}

function setDevPkOpen(open) {
    devPkModal.classList.toggle('show', open);
    devPkDim.classList.toggle('show', open);
    devPkModal.setAttribute('aria-hidden', open ? 'false' : 'true');
}

function requestDeveloperAccess(onSuccess) {
    if (isDeveloperUnlocked()) { if (onSuccess) onSuccess(); return; }
    devPkCallback = onSuccess || null;
    devPkInput.value = '';
    devPkError.textContent = '';
    setDevPkOpen(true);
    devPkRefreshLock();
    if (!devPkInput.disabled) setTimeout(() => devPkInput.focus(), 350);
}

function closeDeveloperPasskey() {
    setDevPkOpen(false);
    devPkInput.value = '';
    devPkInput.blur();
    devPkCallback = null;
}

async function submitDeveloperPasskey() {
    if (devPkWaitMs() > 0) { devPkRefreshLock(); return; }
    const value = devPkInput.value;
    if (!value.trim()) { devPkError.textContent = 'Please type your Developer Passkeys.'; return; }
    if (typeof verifyDeveloperPasskey !== 'function') { devPkError.textContent = 'Database not loaded. Please reload.'; return; }

    // Spend the try first so reloading the page cannot dodge the cooldown.
    devSafeSet(localStorage, DEV_PASSKEY_NEXT_KEY, String(Date.now() + DEV_PASSKEY_COOLDOWN_MS));
    devPkEnter.disabled = true;
    devPkError.dataset.lockMsg = '';
    devPkError.textContent = 'Checking...';
    let account = null, failed = false;
    try { account = await verifyDeveloperPasskey(value); } catch (e) { failed = true; console.warn('Passkey check:', e); }

    if (failed) {
        // Connection / database problem: do not charge the try.
        devSafeDel(localStorage, DEV_PASSKEY_NEXT_KEY);
        devPkError.textContent = 'Could not reach the database. Check your connection and try again.';
        devPkRefreshLock();
        return;
    }

    if (account) {
        devSafeDel(localStorage, DEV_PASSKEY_NEXT_KEY);
        devSafeSet(sessionStorage, DEV_PASSKEY_OK_KEY, '1');
        document.querySelectorAll('.dev-locked').forEach(b => b.classList.add('unlocked'));
        const cb = devPkCallback;
        closeDeveloperPasskey();
        if (cb) cb();
    } else {
        devPkInput.value = '';
        devPkRefreshLock();   // starts the 5 minute countdown
    }
}

devPkEnter.addEventListener('click', submitDeveloperPasskey);
devPkInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); submitDeveloperPasskey(); } });
document.getElementById('devPkClose').addEventListener('click', closeDeveloperPasskey);
devPkDim.addEventListener('click', closeDeveloperPasskey);
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && devPkModal.classList.contains('show')) { e.stopImmediatePropagation(); closeDeveloperPasskey(); }
}, true);
if (isDeveloperUnlocked()) document.querySelectorAll('.dev-locked').forEach(b => b.classList.add('unlocked'));