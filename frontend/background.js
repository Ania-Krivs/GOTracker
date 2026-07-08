let socket = null;
let currentUserId = null;

chrome.storage.local.get(['userId'], (data) => {
    if (data.userId && data.userId !== "undefined" && data.userId !== "null") {
        currentUserId = String(data.userId);
        connectWebSocket(currentUserId);
    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "CONNECT_USER_WS") {
        currentUserId = String(request.userId);
        connectWebSocket(currentUserId);
        sendResponse({ success: true, status: "connecting" });
    }
    
    if (request.action === "SEND_REPLY_TO_ADMIN") {
        const success = sendReplyToAdmin(request.text);
        sendResponse({ success: success });
    }

    if (request.action === "GET_WS_STATUS") {
        let statusText = "Отключено";
        if (socket) {
            if (socket.readyState === WebSocket.OPEN) statusText = "В сети";
            else if (socket.readyState === WebSocket.CONNECTING) statusText = "Подключение...";
        }
        sendResponse({ status: statusText });
    }
    return true;
});

function connectWebSocket(id) {
    if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
        console.log("=== BACKGROUND === Соединение уже активно или в процессе сборки.");
        return;
    }

    const wsUrl = `ws://localhost:8080/ws/user?user_id=${id}`;
    console.log(`=== BACKGROUND === Запуск WebSocket для пользователя: ${id}`);
    socket = new WebSocket(wsUrl);

    socket.onopen = () => {
        console.log("=== BACKGROUND === WebSocket успешно подключен к серверу.");
        chrome.runtime.sendMessage({ action: "WS_STATUS_CHANGED", status: "В сети" }).catch(() => {});
    };

    socket.onmessage = (event) => {
        console.log("=== BACKGROUND === Получено сообщение от админа:", event.data);
        broadcastMessageToExtension(event.data);
    };

    socket.onclose = () => {
        console.log("=== BACKGROUND === Соединение закрыто. Переподключение через 5 секунд...");
        chrome.runtime.sendMessage({ action: "WS_STATUS_CHANGED", status: "Отключено" }).catch(() => {});
        
        setTimeout(() => {
            if (currentUserId) connectWebSocket(currentUserId);
        }, 5000);
    };

    socket.onerror = (err) => {
        console.error("=== BACKGROUND === Ошибка сокета:", err);
    };
}

function sendReplyToAdmin(text) {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(text); 
        console.log("=== BACKGROUND === Ответ отправлен в WebSocket:", text);
        return true;
    }
    console.error("=== BACKGROUND === Ошибка отправки: сокет не готов.");
    return false;
}

function broadcastMessageToExtension(text) {
    chrome.runtime.sendMessage({ action: "DISPLAY_INCOMING_MSG", text: text }).catch(() => {
    });

    chrome.tabs.query({}, (tabs) => {
        if (!tabs) return;
        
        tabs.forEach((tab) => {
            if (tab && tab.id !== undefined && tab.url && tab.url.startsWith('http')) {
                
                if (tab.status === 'complete') {
                    chrome.tabs.sendMessage(tab.id, { action: "SHOW_DUCK", message: text })
                        .then(() => {
                            console.log(`=== BACKGROUND === Гусь успешно отправлен на вкладку: ${tab.url}`);
                        })
                        .catch((err) => {
                            console.warn(`=== BACKGROUND === Не удалось отправить Гуся на ${tab.url}. Возможно, скрипт еще не внедрился.`, err);
                        });
                }
            }
        });
    });
}