let communityPosts = [];
let activeCommunityFilter = 'all';
let unsubscribeCommunityPosts = null;
const communityCommentListeners = new Map();
const communityCommentsByPost = Object.create(null);

let currentUser = null;
let isLoginMode = true;
const firebaseConfigForAuth = window.firebaseConfig || null;
if (firebaseConfigForAuth && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfigForAuth);
}
const firebaseAuth = firebase.apps.length ? firebase.auth() : null;
const firebaseDb = firebase.apps.length ? firebase.firestore() : null;

async function saveFirebaseUserProfile(user, provider, displayName) {
    if (!firebaseDb || !user) return;
    const profile = {
        uid: user.uid,
        email: user.email || '',
        displayName: displayName || user.displayName || user.email?.split('@')[0] || 'Người dùng',
        provider: provider,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    await firebaseDb.collection('users').doc(user.uid).set(profile, { merge: true });
}

function toggleAuthMode() {
    isLoginMode = !isLoginMode;

    const title = document.getElementById('auth-form-title');
    const submitBtn = document.getElementById('auth-submit-btn');
    const toggleBtn = document.getElementById('auth-toggle-mode-btn');
    const usernameContainer = document.getElementById('field-username-container');

    if (isLoginMode) {
        title.textContent = 'Đăng nhập tài khoản';
        submitBtn.textContent = 'Đăng nhập';
        toggleBtn.textContent = 'Đăng ký ngay';
        usernameContainer.classList.add('hidden');
    } else {
        title.textContent = 'Đăng ký tài khoản mới';
        submitBtn.textContent = 'Đăng ký';
        toggleBtn.textContent = 'Đã có tài khoản? Đăng nhập';
        usernameContainer.classList.remove('hidden');
    }
}

function showFirebaseAuthError(error) {
    const messages = {
        'auth/email-already-in-use': 'Email này đã được đăng ký.',
        'auth/invalid-email': 'Địa chỉ email không hợp lệ.',
        'auth/weak-password': 'Mật khẩu cần có ít nhất 6 ký tự.',
        'auth/invalid-credential': 'Email hoặc mật khẩu chưa đúng.',
        'auth/user-disabled': 'Tài khoản này đã bị vô hiệu hóa.',
        'auth/popup-closed-by-user': 'Bạn đã đóng cửa sổ đăng nhập Google.',
        'auth/popup-blocked': 'Trình duyệt đã chặn cửa sổ đăng nhập. Hãy cho phép popup rồi thử lại.',
        'auth/unauthorized-domain': 'Tên miền hiện tại chưa được cho phép trong Firebase Authentication.'
    };
    alert(messages[error.code] || `Lỗi Firebase: ${error.message || error.code || 'Không xác định'}`);
}



// Xử lý đăng nhập hoặc đăng ký bằng email và mật khẩu.
async function handleLocalAuth() {
    if (!firebaseAuth) {
        alert('Chưa cấu hình Firebase. Thêm window.firebaseConfig vào config.js.');
        return;
    }

    const email = document.getElementById('auth-email-input').value.trim();
    const password = document.getElementById('auth-pass-input').value;
    const username = document.getElementById('auth-username-input').value.trim();
    if (!email || !password) {
        alert('Vui lòng điền email và mật khẩu!');
        return;
    }
    if (!isLoginMode && !username) {
        alert('Vui lòng nhập tên tài khoản!');
        return;
    }

    const submitButton = document.getElementById('auth-submit-btn');
    submitButton.disabled = true;
    try {
        if (isLoginMode) {
            await firebaseAuth.signInWithEmailAndPassword(email, password);
            alert('Đăng nhập thành công!');
        } else {
            const credential = await firebaseAuth.createUserWithEmailAndPassword(email, password);
            await credential.user.updateProfile({ displayName: username });
            await saveFirebaseUserProfile(credential.user, 'password', username);
            await firebaseAuth.signOut();
            isLoginMode = false;
            toggleAuthMode();
            alert('Đăng ký tài khoản thành công. Vui lòng đăng nhập để tiếp tục.');
        }
    } catch (error) {
        if (!isLoginMode && firebaseAuth.currentUser) {
            await firebaseAuth.signOut().catch(() => {});
        }
        showFirebaseAuthError(error);
    } finally {
        submitButton.disabled = false;
    }
}




//Xác thực qua gg
async function handleGoogleAuth() {
    if (!firebaseAuth) {
        alert('Chưa cấu hình Firebase. Thêm window.firebaseConfig vào config.js.');
        return;
    }
    try {
        const result = await firebaseAuth.signInWithPopup(
            new firebase.auth.GoogleAuthProvider()
        );
        await saveFirebaseUserProfile(result.user, 'google');
    } catch (error) {
        showFirebaseAuthError(error);
    }
}


//logout
async function handleLogout() {
    if (!firebaseAuth) return;
    try {
        await firebaseAuth.signOut();
        alert('Đã đăng xuất!');
    } catch (error) {
        showFirebaseAuthError(error);
    }
}


// cập nhật lại giao diện

function updateAuthUI() {
    const headerSection = document.getElementById('auth-header-section');
    const profileLoggedOut = document.getElementById('profile-logged-out');
    const profileLoggedIn = document.getElementById('profile-logged-in');

    if (currentUser) {
        const displayName = currentUser.name || currentUser.email?.split('@')[0] || 'Người dùng';
        const initial = displayName.charAt(0).toUpperCase();
        headerSection.innerHTML = `
            <button onclick="switchTab('profile')" class="flex items-center space-x-2.5 px-4 py-2 rounded-2xl bg-purple-50 border border-purple-200">
                <div class="w-8 h-8 rounded-xl bg-purple-600 text-white font-extrabold flex items-center justify-center text-xs">${initial}</div>
                <span class="text-xs font-extrabold text-purple-900"></span>
            </button>`;
        headerSection.querySelector('span').textContent = displayName;
        if (profileLoggedOut) profileLoggedOut.classList.add('hidden');
        if (profileLoggedIn) profileLoggedIn.classList.remove('hidden');
        document.getElementById('profile-display-name').innerText = displayName;
        document.getElementById('profile-display-email').innerText = currentUser.email || '';
        document.getElementById('profile-avatar-initials').innerText = initial;
    } else {
        headerSection.innerHTML = `
            <button onclick="switchTab('profile')" class="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-extrabold rounded-2xl text-xs">
                Đăng nhập / Đăng ký
            </button>`;
        if (profileLoggedOut) profileLoggedOut.classList.remove('hidden');
        if (profileLoggedIn) profileLoggedIn.classList.add('hidden');
    }
}