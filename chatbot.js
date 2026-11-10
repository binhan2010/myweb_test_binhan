function toggleChatbox() {
    document.getElementById('chatbot-window').classList.toggle('hidden');
}

const chatHistory = [{
    role: "system",
    content: "Bạn là trợ lý AWAREAI, tư vấn thân thiện bằng tiếng Việt về AI safety, prompt và cách sử dụng AI có trách nhiệm.Hãy dựa trên lịch sử trò chuyện để trả lời liên tục, hỏi lại khi thiếu bối cảnh và không bịa nguồn.Tối đa 150 từ "
}];

function cleanChatbotReply(text) {
    return String(text || "")
        .replace(/^\s{0,3}#{1,6}\s*/gm, '')
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*([^*\n]+)\*/g, '$1')
        .replace(/^\s*[-*+]\s+/gm, '• ')
        .replace(/`{1,3}/g, '')
        .trim();
}

async function sendChatMessage() {
    const input = document.getElementById('chatbot-input');
    const val = input.value.trim();
    if (!val) return;

    const msgContainer = document.getElementById('chatbot-messages');

    const userRow = document.createElement('div');
    userRow.className = 'flex justify-end';

    const userBubble = document.createElement('div');
    userBubble.className =
        'max-w-[82%] px-4 py-3 rounded-2xl rounded-tr-md bg-violet-600 text-white shadow-sm whitespace-pre-wrap break-words';
    userBubble.textContent = val;

    userRow.appendChild(userBubble);
    msgContainer.appendChild(userRow);

    input.value = '';
    msgContainer.scrollTop = msgContainer.scrollHeight;

    try {
        chatHistory.push({ role: "user", content: val });

        const reply = await callGroqAI([
            chatHistory[0],
            ...chatHistory.slice(-12)
        ]);

        chatHistory.push({ role: "assistant", content: reply });

        const botRow = document.createElement('div');
        botRow.className = 'flex items-start gap-2.5';

        const botBubble = document.createElement('div');
        botBubble.className =
            'max-w-[82%] px-4 py-3 rounded-2xl rounded-tl-md bg-white border border-slate-200 text-slate-700 shadow-sm leading-relaxed whitespace-pre-wrap break-words';

        // Hiển thị câu trả lời của AI
        botBubble.textContent = cleanChatbotReply(reply);

        botRow.appendChild(botBubble);
        msgContainer.appendChild(botRow);
    } catch (err) {
        const errorBubble = document.createElement('div');
        errorBubble.className = 'text-rose-500 text-xs p-2';
        errorBubble.textContent = err.message || 'Lỗi gọi API AI. Hãy kiểm tra API Key.';
        msgContainer.appendChild(errorBubble);
    }

    msgContainer.scrollTop = msgContainer.scrollHeight;
}