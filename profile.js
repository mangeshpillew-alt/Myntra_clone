document.addEventListener('DOMContentLoaded', () => {
    function readStorage(key, fallback) {
        try {
            const storedValue = localStorage.getItem(key);
            return storedValue ? JSON.parse(storedValue) : fallback;
        } catch (error) {
            return fallback;
        }
    }

    // Storage keys
    const USERS_STORAGE_KEY = 'myntra_registered_users';
    const ACTIVE_USER_KEY = 'myntra_active_user';
    const BAG_STORAGE_KEY = 'myntra_bag_items';

    // UI elements
    const authSection = document.getElementById('authSection');
    const dashboardSection = document.getElementById('dashboardSection');
    
    const tabLogin = document.getElementById('tabLogin');
    const tabSignup = document.getElementById('tabSignup');
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');

    const loginError = document.getElementById('loginError');
    const signupError = document.getElementById('signupError');

    const userNameDisplay = document.getElementById('userNameDisplay');
    const userEmailDisplay = document.getElementById('userEmailDisplay');
    const userMobileDisplay = document.getElementById('userMobileDisplay');
    const userAvatarImg = document.getElementById('userAvatarImg');
    const defaultAvatarIcon = document.getElementById('defaultAvatarIcon');
    const logoutBtn = document.getElementById('logoutBtn');
    const headerBagCount = document.getElementById('headerBagCount');

    function updateHeaderBag() {
        if (!headerBagCount) return;
        const bagItems = JSON.parse(localStorage.getItem(BAG_STORAGE_KEY) || '[]');
        const total = bagItems.reduce((acc, item) => acc + (item.quantity || 1), 0);
        headerBagCount.textContent = total;
        headerBagCount.style.display = total > 0 ? 'inline-block' : 'none';
    }

    function getUsers() {
        return readStorage(USERS_STORAGE_KEY, []);
    }

    function saveUsers(users) {
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    }

    function getActiveUser() {
        return readStorage(ACTIVE_USER_KEY, null);
    }

    tabLogin?.addEventListener('click', () => {
        tabLogin.classList.add('active');
        tabSignup?.classList.remove('active');
        loginForm?.classList.remove('hidden');
        signupForm?.classList.add('hidden');
        if (loginError) loginError.innerText = '';
    });

    tabSignup?.addEventListener('click', () => {
        tabSignup.classList.add('active');
        tabLogin?.classList.remove('active');
        signupForm?.classList.remove('hidden');
        loginForm?.classList.add('hidden');
        if (signupError) signupError.innerText = '';
    });

    // Email/Mobile Registration
    signupForm?.addEventListener('submit', (e) => {
        e.preventDefault();

        const name = document.getElementById('signupName')?.value.trim() || '';
        const email = document.getElementById('signupEmail')?.value.trim().toLowerCase() || '';
        const mobile = document.getElementById('signupMobile')?.value.replace(/\D/g, '') || '';
        const password = document.getElementById('signupPassword')?.value || '';

        if (!/^\d{10}$/.test(mobile)) {
            if (signupError) signupError.textContent = 'Enter a valid 10-digit mobile number.';
            return;
        }

        const users = getUsers();
        const exists = users.some(u => u.email === email || u.mobile === mobile);

        if (exists) {
            if (signupError) signupError.textContent = 'Account with this email or mobile already exists.';
            return;
        }

        const newUser = { name, email, mobile, password, picture: '' };
        users.push(newUser);
        saveUsers(users);

        localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(newUser));
        signupForm.reset();
        checkAuthStatus();
    });

    // Standard Login
    loginForm?.addEventListener('submit', (e) => {
        e.preventDefault();

        const rawIdentifier = document.getElementById('loginEmail')?.value.trim().toLowerCase() || '';
        const identifier = /^\d[\d\s+-]*$/.test(rawIdentifier)
            ? rawIdentifier.replace(/\D/g, '')
            : rawIdentifier;
        const password = document.getElementById('loginPassword')?.value || '';

        const users = getUsers();
        const matchedUser = users.find(u => 
            (u.email === identifier || u.mobile === identifier) && u.password === password
        );

        if (!matchedUser) {
            if (loginError) loginError.textContent = 'Invalid email/mobile or password.';
            return;
        }

        localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(matchedUser));
        loginForm.reset();
        checkAuthStatus();
    });

    // Logout
    logoutBtn?.addEventListener('click', () => {
        localStorage.removeItem(ACTIVE_USER_KEY);
        checkAuthStatus();
    });

    function checkAuthStatus() {
        const user = getActiveUser();

        if (user) {
            if (authSection) authSection.classList.add('hidden');
            if (dashboardSection) dashboardSection.classList.remove('hidden');
            if (userNameDisplay) userNameDisplay.textContent = user.name || 'User';
            if (userEmailDisplay) userEmailDisplay.textContent = user.email || '';
            if (userMobileDisplay) userMobileDisplay.textContent = user.mobile ? `+91 ${user.mobile}` : '';

            // Display an optional locally stored profile image.
            if (user.picture) {
                if (userAvatarImg) {
                    userAvatarImg.src = user.picture;
                    userAvatarImg.classList.remove('hidden');
                }
                if (defaultAvatarIcon) defaultAvatarIcon.classList.add('hidden');
            } else {
                if (userAvatarImg) userAvatarImg.classList.add('hidden');
                if (defaultAvatarIcon) defaultAvatarIcon.classList.remove('hidden');
            }
        } else {
            if (dashboardSection) dashboardSection.classList.add('hidden');
            if (authSection) authSection.classList.remove('hidden');
        }
    }

    window.addEventListener('storage', event => {
        if (event.key === BAG_STORAGE_KEY) updateHeaderBag();
        if (event.key === ACTIVE_USER_KEY) checkAuthStatus();
    });

    updateHeaderBag();
    checkAuthStatus();
});