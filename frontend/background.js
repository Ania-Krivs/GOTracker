let socket = null;
let currentUserId = null;

// Попытка восстановить сокет при старте браузера/воркера, если ID уже сохранен
chrome.storage.local.get(['userId'], (data) => {
    if (data.userId && data.userId !== "undefined" && data.userId !== "null") {
        currentUserId = String(data.userId);
        connectWebSocket(currentUserId);
    }
});

// Единый диспетчер сообщений внутри расширения
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // 1. Команда на подключение после POST /users/login
    if (request.action === "CONNECT_USER_WS") {
        currentUserId = String(request.userId);
        connectWebSocket(currentUserId);
        sendResponse({ success: true, status: "connecting" });
    }
    
    // 2. Команда на отправку ответа админу (приходит как из попапа, так и от утки с сайта)
    if (request.action === "SEND_REPLY_TO_ADMIN") {
        const success = sendReplyToAdmin(request.text);
        sendResponse({ success: success });
    }

    // 3. Запрос текущего статуса сокета (для UI попапа)
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

// Функция создания ЕДИНСТВЕННОГО WebSocket-соединения
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
        // Пересылаем текст админа во все инстанции
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

// Отправка ответа в сокет
function sendReplyToAdmin(text) {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(text); // Отправляем чистую строку, как ожидает Go-бэкенд
        console.log("=== BACKGROUND === Ответ отправлен в WebSocket:", text);
        return true;
    }
    console.error("=== BACKGROUND === Ошибка отправки: сокет не готов.");
    return false;
}

// Рассылка входящего сообщения админа на открытые вкладки (уткам) и в попап
function broadcastMessageToExtension(text) {
    // 1. Отправляем в user.js (попап), если он открыт в этот момент
    chrome.runtime.sendMessage({ action: "DISPLAY_INCOMING_MSG", text: text }).catch(() => {
        // Попап закрыт — это нормально, игнорируем ошибку
    });

    // 2. Отправляем в Duck/script.js (на веб-страницы)
    chrome.tabs.query({}, (tabs) => {
        if (!tabs) return;
        
        tabs.forEach((tab) => {
            // Проверяем, что у вкладки есть ID и это обычная веб-страница (не системная chrome://)
            if (tab && tab.id !== undefined && tab.url && tab.url.startsWith('http')) {
                
                // Проверяем, загрузилась ли страница полностью, чтобы контент-скрипт точно работал
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