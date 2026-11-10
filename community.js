async function runCommunityAssistant() {
    const box = document.getElementById('ai-assistant-summary-box');
    const content = document.getElementById('ai-summary-content');
    box.classList.remove('hidden');
    content.innerText = "AI đang tóm tắt các bài viết trong cộng đồng...";

    const postsText = communityPosts.map(p => `- ${p.title}: ${p.content}`).join("\n");
    try {
        const summary = await callGroqAI([
            { role: "system", content: "Tóm tắt các chủ đề ngắn gọn trong 2 câu tiếng Việt." },
            { role: "user", content: postsText }
        ]);
        content.innerText = summary;
    } catch (e) {
        content.innerText = "Cộng đồng đang thảo luận nổi bật về việc rà soát lỗi mã nguồn và sử dụng AI an toàn.";
    }
}

function formatCommunityTimestamp(value) {
    if (value && typeof value.toDate === 'function') {
        return value.toDate().toLocaleString('vi-VN');
    }
    return value || 'Vừa đăng';
}

function renderCommunityFeed(filter = activeCommunityFilter) {
    const listEl = document.getElementById('community-feed-list');
    if (!listEl) return;

    activeCommunityFilter = filter;
    const filteredPosts = filter === 'all'
        ? communityPosts
        : communityPosts.filter(post => post.category === filter);

    listEl.replaceChildren();
    if (!filteredPosts.length) {
        const emptyState = document.createElement('div');
        emptyState.className = 'bg-white p-8 rounded-3xl border border-slate-100 text-center text-sm text-slate-500';
        emptyState.textContent = 'Chưa có bài viết trong mục này.';
        listEl.appendChild(emptyState);
        return;
    }

    filteredPosts.forEach(post => {
        const card = document.createElement('article');
        card.className = 'bg-white p-6 rounded-3xl border border-slate-100 shadow-xl space-y-4';

        const authorRow = document.createElement('div');
        authorRow.className = 'flex items-center space-x-3';
        const avatar = document.createElement('div');
        avatar.className = 'w-10 h-10 rounded-2xl bg-purple-600 text-white font-bold flex items-center justify-center text-xs';
        avatar.textContent = (post.author || 'U').charAt(0).toUpperCase();
        const authorInfo = document.createElement('div');
        const authorName = document.createElement('h4');
        authorName.className = 'font-extrabold text-slate-900 text-sm';
        authorName.textContent = post.author || 'Người dùng';
        const postMeta = document.createElement('span');
        postMeta.className = 'text-xs text-slate-400';
        postMeta.textContent = `${formatCommunityTimestamp(post.createdAt)} • ${post.categoryName || ''}`;
        authorInfo.append(authorName, postMeta);
        authorRow.append(avatar, authorInfo);

        const body = document.createElement('div');
        body.className = 'space-y-2';
        const title = document.createElement('h3');
        title.className = 'font-extrabold text-slate-900 text-base';
        title.textContent = post.title || '';
        const content = document.createElement('p');
        content.className = 'text-slate-600 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap';
        content.textContent = post.content || '';
        body.append(title, content);

        const commentsSection = document.createElement('section');
        commentsSection.className = 'border-t border-slate-100 pt-4 space-y-3';
        const comments = communityCommentsByPost[post.id] || [];
        const commentsHeading = document.createElement('h4');
        commentsHeading.className = 'font-bold text-slate-800 text-sm';
        commentsHeading.textContent = `Bình luận (${comments.length})`;
        commentsSection.appendChild(commentsHeading);

        comments.forEach(comment => {
            const commentCard = document.createElement('div');
            commentCard.className = 'rounded-xl bg-slate-50 p-3';
            const commentAuthor = document.createElement('p');
            commentAuthor.className = 'text-xs font-bold text-purple-700';
            commentAuthor.textContent = comment.author || 'Người dùng';
            const commentText = document.createElement('p');
            commentText.className = 'mt-1 text-xs text-slate-700 whitespace-pre-wrap';
            commentText.textContent = comment.text || '';
            commentCard.append(commentAuthor, commentText);
            commentsSection.appendChild(commentCard);
        });

        if (currentUser) {
            const commentForm = document.createElement('div');
            commentForm.className = 'flex gap-2';
            const commentInput = document.createElement('input');
            commentInput.type = 'text';
            commentInput.maxLength = 1000;
            commentInput.placeholder = 'Viết bình luận...';
            commentInput.className = 'min-w-0 flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-purple-500';
            commentInput.dataset.postId = post.id;
            commentInput.addEventListener('keydown', event => {
                if (event.key === 'Enter') addCommunityComment(post.id);
            });
            const commentButton = document.createElement('button');
            commentButton.type = 'button';
            commentButton.className = 'px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold';
            commentButton.textContent = 'Gửi';
            commentButton.addEventListener('click', () => addCommunityComment(post.id));
            commentForm.append(commentInput, commentButton);
            commentsSection.appendChild(commentForm);
        } else {
            const hint = document.createElement('p');
            hint.className = 'text-xs text-slate-500';
            hint.textContent = 'Đăng nhập để bình luận.';
            commentsSection.appendChild(hint);
        }

        card.append(authorRow, body, commentsSection);
        listEl.appendChild(card);
    });
}

function filterFeed(category) {
    activeCommunityFilter = category;
    renderCommunityFeed(category);
}

function subscribeToCommunityPosts() {
    const listEl = document.getElementById('community-feed-list');
    if (!firebaseDb) {
        if (listEl) listEl.textContent = 'Chưa kết nối Firestore. Hãy kiểm tra cấu hình Firebase.';
        return;
    }

    if (unsubscribeCommunityPosts) unsubscribeCommunityPosts();
    unsubscribeCommunityPosts = firebaseDb.collection('communityPosts')
        .orderBy('createdAt', 'desc')
        .onSnapshot(snapshot => {
            const nextPosts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const livePostIds = new Set(nextPosts.map(post => post.id));

            for (const [postId, unsubscribe] of communityCommentListeners.entries()) {
                if (!livePostIds.has(postId)) {
                    unsubscribe();
                    communityCommentListeners.delete(postId);
                    delete communityCommentsByPost[postId];
                }
            }

            communityPosts = nextPosts;
            nextPosts.forEach(post => {
                if (communityCommentListeners.has(post.id)) return;
                const unsubscribe = firebaseDb.collection('communityPosts')
                    .doc(post.id)
                    .collection('comments')
                    .orderBy('createdAt', 'asc')
                    .onSnapshot(commentSnapshot => {
                        communityCommentsByPost[post.id] = commentSnapshot.docs.map(commentDoc => ({
                            id: commentDoc.id,
                            ...commentDoc.data()
                        }));
                        renderCommunityFeed();
                    }, error => {
                        console.error('Không tải được bình luận:', error);
                    });
                communityCommentListeners.set(post.id, unsubscribe);
            });

            renderCommunityFeed();
        }, error => {
            console.error('Không tải được bài viết cộng đồng:', error);
            if (listEl) listEl.textContent = 'Không tải được bài viết. Hãy kiểm tra quyền truy cập Firestore.';
        });
}



// Mở biểu mẫu tạo bài viết sau khi kiểm tra đăng nhập.
async function addCommunityComment(postId) {
    if (!currentUser) {
        alert('Vui lòng đăng nhập trước khi bình luận!');
        switchTab('profile');
        return;
    }

    const input = document.querySelector(`[data-post-id="${postId}"]`);
    const text = input ? input.value.trim() : '';
    if (!text) return;
    if (!firebaseDb) {
        alert('Firestore chưa được cấu hình.');
        return;
    }

    const button = input.parentElement.querySelector('button');
    if (button) button.disabled = true;
    try {
        await firebaseDb.collection('communityPosts')
            .doc(postId)
            .collection('comments')
            .add({
                uid: currentUser.uid,
                author: currentUser.name,
                text,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        input.value = '';
    } catch (error) {
        console.error('Lỗi đăng bình luận:', error);
        alert('Không gửi được bình luận. Hãy kiểm tra Firestore Rules rồi thử lại.');
    } finally {
        if (button) button.disabled = false;
    }
}

function openCreatePostModal() {
    if (!currentUser) {
        alert("Vui lòng đăng nhập trước khi đăng bài!");
        switchTab('profile');
        return;
    }
    document.getElementById('create-post-modal').classList.remove('hidden');
}

function closeCreatePostModal() {
    document.getElementById('create-post-modal').classList.add('hidden');
}

async function submitNewPost() {
    if (!currentUser) {
        alert("Vui lòng đăng nhập trước khi đăng bài!");
        switchTab('profile');
        return;
    }

    const category = document.getElementById('new-post-category').value;
    const title = document.getElementById('new-post-title').value.trim();
    const content = document.getElementById('new-post-content').value.trim();
    if (!title || !content) {
        alert("Vui lòng nhập đầy đủ thông tin!");
        return;
    }
    if (!firebaseDb) {
        alert('Firestore chưa được cấu hình.');
        return;
    }

    const categoryNames = {
        experience: 'Trải nghiệm AI',
        question: 'Đặt câu hỏi',
        safety: 'Mẹo an toàn'
    };
    const submitButton = document.querySelector('#create-post-modal button[onclick="submitNewPost()"]');
    if (submitButton) submitButton.disabled = true;

    try {
        await firebaseDb.collection('communityPosts').add({
            uid: currentUser.uid,
            author: currentUser.name,
            category,
            categoryName: categoryNames[category] || 'Cộng đồng',
            title,
            content,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        document.getElementById('new-post-title').value = '';
        document.getElementById('new-post-content').value = '';
        closeCreatePostModal();
    } catch (error) {
        console.error('Lỗi đăng bài:', error);
        alert('Không đăng được bài. Hãy kiểm tra Firestore Rules rồi thử lại.');
    } finally {
        if (submitButton) submitButton.disabled = false;
    }
}