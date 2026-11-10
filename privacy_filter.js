function redactMatches(text, pattern, label) {
    let count = 0;

    const redactedText = text.replace(pattern, () => {
        count += 1;
        return `[${label} ĐÃ ẨN]`;
    });

    return { text: redactedText, count };
}

function scanPrivateText() {
    const input = document.getElementById("privacy-input");
    const result = document.getElementById("privacy-result");
    const resultContainer = document.getElementById("privacy-result-container");
    const status = document.getElementById("privacy-status");

    if (!input || !result || !resultContainer || !status) return;

    const originalText = input.value;

    if (!originalText.trim()) {
        status.textContent = "Bạn hãy nhập văn bản cần kiểm tra.";
        resultContainer.classList.add("hidden");
        return;
    }

    let cleanedText = originalText;
    const totals = {
        email: 0,
        phone: 0,
        citizenId: 0,
        apiKey: 0
    };

    const patterns = [
        {
            key: "email",
            regex: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
            label: "EMAIL"
        },
        {
            key: "apiKey",
            regex: /\b(?:sk-[A-Za-z0-9_-]{20,}|gsk_[A-Za-z0-9_-]{20,}|AIza[A-Za-z0-9_-]{30,})\b/g,
            label: "KHÓA API"
        },
        {
            key: "citizenId",
            regex: /(?<!\d)\d{12}(?!\d)/g,
            label: "SỐ CĂN CƯỚC"
        },
        {
            key: "phone",
            regex: /(?<!\d)(?:\+?84|0)(?:[\s.-]?\d){8,9}(?!\d)/g,
            label: "SỐ ĐIỆN THOẠI"
        }
    ];

    for (const item of patterns) {
        const scan = redactMatches(cleanedText, item.regex, item.label);
        cleanedText = scan.text;
        totals[item.key] = scan.count;
    }

    const totalFound = Object.values(totals).reduce((sum, count) => sum + count, 0);

    result.value = cleanedText;
    resultContainer.classList.remove("hidden");

    if (totalFound === 0) {
        status.textContent = "Chưa phát hiện email, số điện thoại, số căn cước hoặc khóa API theo các mẫu nhận diện.";
    } else {
        const details = [];

        if (totals.email) details.push(`${totals.email} email`);
        if (totals.phone) details.push(`${totals.phone} số điện thoại`);
        if (totals.citizenId) details.push(`${totals.citizenId} số căn cước`);
        if (totals.apiKey) details.push(`${totals.apiKey} khóa API`);

        status.textContent = `Đã che ${totalFound} mục: ${details.join(", ")}.`;
    }
}

async function copyPrivacyResult() {
    const result = document.getElementById("privacy-result");
    const status = document.getElementById("privacy-status");

    if (!result || !status || !result.value) {
        if (status) status.textContent = "Chưa có bản đã che để sao chép.";
        return;
    }

    try {
        await navigator.clipboard.writeText(result.value);
        status.textContent = "Đã sao chép bản đã che.";
    } catch (error) {
        result.focus();
        result.select();
        const copied = document.execCommand("copy");
        status.textContent = copied
            ? "Đã sao chép bản đã che."
            : "Không thể sao chép tự động. Hãy chọn và sao chép văn bản trong ô kết quả.";
    }
}

function clearPrivacyFilter() {
    const input = document.getElementById("privacy-input");
    const result = document.getElementById("privacy-result");
    const resultContainer = document.getElementById("privacy-result-container");
    const status = document.getElementById("privacy-status");

    if (input) input.value = "";
    if (result) result.value = "";
    if (resultContainer) resultContainer.classList.add("hidden");
    if (status) status.textContent = "";
}