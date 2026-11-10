function switchTab(tabId) {
    const tabs = ['home', 'community', 'simulator',"privacy-filter",'prompt-doctor', 'profile'];
    tabs.forEach(t => {
        const el = document.getElementById(`tab-${t}`);
        if (el) el.classList.add('hidden');
        const navBtn = document.getElementById(`nav-${t}`);
        if (navBtn) {
            navBtn.className = "px-4 py-2 rounded-xl text-sm font-semibold transition-all text-slate-600 hover:text-purple-600";
        }
    });

    const activeEl = document.getElementById(`tab-${tabId}`);
    if (activeEl) activeEl.classList.remove('hidden');

    const activeNav = document.getElementById(`nav-${tabId}`);
    if (activeNav) {
        activeNav.className = "px-4 py-2 rounded-xl text-sm font-semibold transition-all text-purple-700 bg-white shadow-sm";
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (window.lucide) window.lucide.createIcons();
}