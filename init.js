document.addEventListener('DOMContentLoaded', () => {
    if (window.lucide) window.lucide.createIcons();
    if (firebaseAuth) {
        firebaseAuth.onAuthStateChanged(user => {
            currentUser = user ? {
                name: user.displayName || user.email?.split('@')[0] || 'Người dùng',
                email: user.email || '',
                uid: user.uid
            } : null;
            updateAuthUI();
            renderCommunityFeed();
        });
    } else {
        updateAuthUI();
    }
    subscribeToCommunityPosts();
});