// Hardcoded accounts (fallback). Firestore accounts are checked if no match is found here.
const validCredentials = {
    "b233": { passkey: "fg8890", role: "Beta User", type: "Student", redirect: "../TestAccount/Test1.html" },
    "user2": { passkey: "m2234", role: "Beta User", type: "Teacher", redirect: "../TestAccountTeacher/Test1.html" },
    "admin": { passkey: "adminpass99", role: "Developer", type: "Handlers", redirect: "admin.html" },
    "cotcots": { passkey: "devpass2026", role: "Developer", type: "Developers", redirect: "developer.html" },
    "alpha": { passkey: "keyalpha11", role: "Early User", type: "Test Account", redirect: "alpha.html" },
    "beta": { passkey: "keybeta22", role: "Super VIP", type: "Super Account", redirect: "beta.html" }
};

// Default & type-based redirects for Firestore accounts after User ID + Passkey login
const DEFAULT_ACCOUNT_REDIRECT = "../TestAccount/Test1.html";
const ACCOUNT_TYPE_REDIRECTS = {
    "Student": "../TestAccount/Test1.html",
    "Teacher": "../TestAccountTeacher/Test1.html",
    "Test Account": "../TestAccount/Test1.html",
    "Super Account": "../TestAccount/Test1.html",
    "Handlers": "../TestAccount/Test1.html",
    "Developers": "../TestAccount/Test1.html"
};

function getRedirectForAccount(account) {
    if (account && account.redirect) return account.redirect;
    if (account && account.type && ACCOUNT_TYPE_REDIRECTS[account.type]) {
        return ACCOUNT_TYPE_REDIRECTS[account.type];
    }
    return DEFAULT_ACCOUNT_REDIRECT;
}

function saveSessionUser(sessionData) {
    try {
        sessionStorage.setItem("passkeyUser", JSON.stringify(sessionData));
    } catch (e) {
        // Ignore storage restrictions in private/sandboxed contexts
    }
}

function togglePasswordVisibility() {
    const passInput = document.getElementById('passkeyInput');
    const eyeSlash = document.getElementById('eyeSlash');

    if (passInput.type === 'password') {
        passInput.type = 'text';
        eyeSlash.classList.add('active');
    } else {
        passInput.type = 'password';
        eyeSlash.classList.remove('active');
    }
}

function showLoading(text) {
    const modal = document.getElementById('loadingModal');
    document.getElementById('loadingText').textContent = text;
    modal.classList.remove('hidden');
    setTimeout(() => modal.classList.remove('opacity-0'), 10);
}

function hideLoading() {
    const modal = document.getElementById('loadingModal');
    modal.classList.add('opacity-0');
    setTimeout(() => modal.classList.add('hidden'), 300);
}

function showError(message) {
    const errorText = document.getElementById('errorText');
    errorText.textContent = message;
    errorText.classList.remove('hidden');
    shakeForm();
}

// Looks up any account in Firestore by User ID (document ID) and verifies its Passkey.
async function checkFirebaseAccount(userId, passkey) {
    const normalizedId = userId.trim().toUpperCase();
    const normalizedPasskey = passkey.trim().toUpperCase();

    if (!normalizedId || !normalizedPasskey) return null;

    const snap = await accountsRef.doc(normalizedId).get();
    if (!snap.exists) return null;

    const data = snap.data();
    if (!data.passkey || String(data.passkey).trim().toUpperCase() !== normalizedPasskey) {
        return null;
    }

    return Object.assign({}, data, {
        userId: data.userId || normalizedId
    });
}

async function handleLogin(event) {
    event.preventDefault();

    const rawUserId = document.getElementById('userIdInput').value.trim();
    const rawPasskey = document.getElementById('passkeyInput').value.trim();
    const errorText = document.getElementById('errorText');

    errorText.classList.add('hidden');

    if (!rawUserId || !rawPasskey) {
        showError("Enter your User ID and Passkeys Code");
        return;
    }

    // 1) Hardcoded accounts (case-insensitive User ID, exact or uppercase-matched Passkey)
    const lowerId = rawUserId.toLowerCase();
    const hardcoded = validCredentials[lowerId];
    if (
        hardcoded &&
        (hardcoded.passkey === rawPasskey || hardcoded.passkey.toUpperCase() === rawPasskey.toUpperCase())
    ) {
        showLoading("Logging in...");
        saveSessionUser({
            userId: lowerId,
            role: hardcoded.role || "Beta User",
            type: hardcoded.type || "Account",
            source: "local"
        });
        setTimeout(() => {
            window.location.href = getRedirectForAccount(hardcoded);
        }, 1400);
        return;
    }

    // 2) All Firestore accounts (any account type/role)
    showLoading("Checking account...");
    try {
        const account = await checkFirebaseAccount(rawUserId, rawPasskey);
        if (account) {
            saveSessionUser({
                userId: account.userId,
                role: account.role || "Beta User",
                type: account.type || "Account",
                source: "firestore"
            });
            document.getElementById('loadingText').textContent = "Logging in...";
            setTimeout(() => {
                window.location.href = getRedirectForAccount(account);
            }, 1000);
        } else {
            hideLoading();
            showError("Invalid User ID or Passkeys Code");
        }
    } catch (err) {
        console.error(err);
        hideLoading();
        showError("Could not reach the server. Check your connection and try again.");
    }
}

function shakeForm() {
    const form = document.getElementById('loginForm');
    form.classList.add('animate-pulse');
    setTimeout(() => form.classList.remove('animate-pulse'), 400);
}

function handleBack() {
    document.getElementById('loginForm').reset();
    document.getElementById('errorText').classList.add('hidden');

    if (window.history.length > 1) {
        window.history.back();
    } else {
        const backBtn = document.querySelector('.desktop-back-wrapper button');
        backBtn.style.transform = 'scale(0.95)';
        setTimeout(() => backBtn.style.transform = 'scale(1)', 150);
    }
}

// Verifies any Firestore account using User ID + Passkey.
async function verifyAccountPasskey(userId, passkey) {
  const cleanId = String(userId || "").trim().toUpperCase();
  const cleanKey = String(passkey || "").trim().toUpperCase();
  if (!cleanId || !cleanKey) return null;

  const snap = await accountsRef.doc(cleanId).get();
  if (!snap.exists) return null;

  const data = snap.data();
  if (!data.passkey || String(data.passkey).trim().toUpperCase() !== cleanKey) {
    return null;
  }

  return Object.assign({}, data, { userId: data.userId || cleanId });
}