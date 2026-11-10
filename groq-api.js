// async function callGroqAI(messagesArray, isJsonResponse = false) {
//     const apiKey = typeof GROQ_API_KEY !== "undefined"
//         ? GROQ_API_KEY
//         : window.GROQ_API_KEY;

//     if (!apiKey || typeof apiKey !== "string") {
//         throw new Error("Không tìm thấy GROQ_API_KEY trong file config.js.");
//     }

//     const payload = {
//         model: "openai/gpt-oss-120b",
//         messages: messagesArray,
//         temperature: 0.7,
//         max_completion_tokens: 2048
//     };
//     let response;
//     try {
//         response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
//             method: "POST",
//             headers: {
//                 "Authorization": `Bearer ${apiKey}`,
//                 "Content-Type": "application/json"
//             },
//             body: JSON.stringify(payload)
//         });
//     } catch (error) {
//         throw new Error("Không kết nối được Groq API. Hãy kiểm tra mạng và chạy trang qua máy chủ web (localhost), không mở trực tiếp bằng file://.");
//     }

//     const data = await response.json().catch(() => ({}));
//     if (!response.ok) {
//         const detail = data.error?.message || data.message || "Không có mô tả lỗi từ Groq.";
//         if (response.status === 401) throw new Error("GROQ_API_KEY không hợp lệ hoặc đã bị thu hồi.");
//         if (response.status === 403 || response.status === 404) throw new Error(`Groq từ chối model openai/gpt-oss-120b (HTTP ${response.status}): ${detail}`);
//         if (response.status === 429) throw new Error("Groq đang giới hạn số lượt gọi hoặc hạn mức đã hết. Hãy thử lại sau.");
//         throw new Error(`Groq API gặp lỗi HTTP ${response.status}: ${detail}`);
//     }

//     const content = data.choices?.[0]?.message?.content;
//     if (!content) throw new Error("Không nhận được phản hồi từ Groq API.");
//     return content;
// }





// // Làm sạch nội dung JSON do AI trả về rồi chuyển thành object JavaScript.
// function cleanAndParseJSON(rawContent) {
//     let cleaned = String(rawContent || "").trim();

//     cleaned = cleaned
//         .replace(/^```(?:json)?\s*/i, "")
//         .replace(/\s*```$/, "")
//         .trim();

//     const jsonStart = cleaned.indexOf("{");
//     const jsonEnd = cleaned.lastIndexOf("}");

//     if (jsonStart < 0 || jsonEnd <= jsonStart) {
//         throw new Error("AI không trả về JSON hợp lệ. Vui lòng thử lại.");
//     }

//     return JSON.parse(cleaned.slice(jsonStart, jsonEnd + 1));
// }



async function callGroqAI(messagesArray, isJsonResponse = false) {
    let response;

    try {
        response = await fetch("/api/groq", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                messages: messagesArray
            })
        });
    } catch (error) {
        throw new Error(
            "Không kết nối được API. Hãy kiểm tra mạng và chạy trang qua máy chủ web, không mở trực tiếp bằng file://."
        );
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        const detail =
            data.error?.message ||
            data.error ||
            data.message ||
            "Không có mô tả lỗi từ máy chủ.";

        if (response.status === 401) {
            throw new Error(`Yêu cầu bị từ chối: ${detail}`);
        }

        if (response.status === 403 || response.status === 404) {
            throw new Error(
                `API hoặc model không khả dụng (HTTP ${response.status}): ${detail}`
            );
        }

        if (response.status === 429) {
            throw new Error(
                "Groq đang giới hạn số lượt gọi hoặc hạn mức đã hết. Hãy thử lại sau."
            );
        }

        throw new Error(`API gặp lỗi HTTP ${response.status}: ${detail}`);
    }

    const content = data.choices?.[0]?.message?.content;

    if (!content) {
        throw new Error("Không nhận được phản hồi từ Groq.");
    }

    return content;
}


// Làm sạch nội dung JSON do AI trả về rồi chuyển thành object JavaScript.
function cleanAndParseJSON(rawContent) {
    let cleaned = String(rawContent || "").trim();

    cleaned = cleaned
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/, "")
        .trim();

    const jsonStart = cleaned.indexOf("{");
    const jsonEnd = cleaned.lastIndexOf("}");

    if (jsonStart < 0 || jsonEnd <= jsonStart) {
        throw new Error("AI không trả về JSON hợp lệ. Vui lòng thử lại.");
    }

    return JSON.parse(cleaned.slice(jsonStart, jsonEnd + 1));
}