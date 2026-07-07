document.getElementById("back-btn").onclick = () => {
    window.location.href = "popup.html";
};

document.addEventListener("DOMContentLoaded", () => {
    const authSection = document.getElementById("auth-section");
    const workspaceSection = document.getElementById("workspace-section");
    const codeInput = document.getElementById("code-input");
    const loginBtn = document.getElementById("login-btn");
    const errorBlock = document.getElementById("error-block");
    
    const statusIndicator = document.getElementById("status-indicator");
    const chatBox = document.getElementById("chat-box");
    const replyContainer = document.getElementById("reply-container");
    const replyInput = document.getElementById("reply-input");
    const sendReplyBtn = document.getElementById("send-reply-btn");
    const charCounter = document.getElementById("char-counter");

    let socket = null;
    let userId = null;

    replyInput.addEventListener("input", () => {
        charCounter.textContent = `${replyInput.value.length} / 150`;
    });

    loginBtn.onclick = async () => {
        errorBlock.classList.add("hidden");
        const codeStr = codeInput.value.trim();

        if (!codeStr) {
            showError("Please enter a code");
            return;
        }

        const codeNum = Number(codeStr);
        if (isNaN(codeNum)) {
            showError("Code must be a valid number");
            return;
        }

        try {
            loginBtn.disabled = true;
            loginBtn.textContent = "Connecting...";

            const response = await fetch("http://localhost:8080/users/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                // Отправляем code как число, чтобы Go-декодер json.NewDecoder успешно распарсил в uint
                body: JSON.stringify({ code: codeNum })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(typeof data === "string" ? data : (data.error || "Login failed"));
            }

            // Получаем ID пользователя из структуры ответа бэкенда
            userId = data.id || data.ID || data.uid;
            if (!userId) {
                throw new Error("User ID not found in server response");
            }

            chrome.storage.local.set({ userId: String(userId) });

            // Переключаем экраны интерфейса
            authSection.classList.add("hidden");
            workspaceSection.classList.remove("hidden");

            // МГНОВЕННО ОТКРЫВАЕМ WEBSOCKET ПОСЛЕ ВХОДА
            connectWebSocket(userId);

        } catch (err) {
            showError(err.message);
            loginBtn.disabled = false;
            loginBtn.textContent = "Continue";
        }
    };

    function connectWebSocket(id) {
        const wsUrl = `ws://localhost:8080/ws/user?user_id=${id}`;
        socket = new WebSocket(wsUrl);

        socket.onopen = () => {
            statusIndicator.textContent = "В сети";
            statusIndicator.className = "connected";
            console.log("WebSocket connection established successfully.");
        };

        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                    if (data && data.action === "SHOW_DUCK") {
                        showDuck(data.message || "Хонк!");
                        return;
                    }
                    displayIncomingMessage(data.message || data.text || JSON.stringify(data));
            } catch (e) {
                displayIncomingMessage(event.data);
            }
        };

        socket.onclose = () => {
            statusIndicator.textContent = "Отключено";
            statusIndicator.className = "disconnected";
            replyContainer.classList.add("hidden");
            chatBox.className = "chat-placeholder";
            chatBox.textContent = "Соединение разорвано. Ожидание переподключения...";
            
            setTimeout(() => {
                if (userId) connectWebSocket(userId);
            }, 5000);
        };

        socket.onerror = (error) => {
            console.error("WebSocket error:", error);
        };
    }

    function displayIncomingMessage(text) {
        chatBox.className = "chat-placeholder incoming-msg";
        chatBox.innerHTML = `<strong>Администратор:</strong><br>${text}`;
        
        replyContainer.classList.remove("hidden");
        replyInput.value = "";
        charCounter.textContent = "0 / 150";
        replyInput.focus();
    }

    sendReplyBtn.onclick = () => {
        const replyText = replyInput.value.trim();
        if (!replyText) return;

        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(replyText);

            replyContainer.classList.add("hidden");
            chatBox.className = "chat-placeholder";
            chatBox.style.borderColor = "#2ee67e";
            chatBox.textContent = "✓ Ответ отправлен администратору!";

            setTimeout(() => {
                chatBox.style.borderColor = "";
                chatBox.textContent = "Ожидание новых сообщений от администратора...";
            }, 3000);
        } else {
            alert("Ошибка сети. Не удалось отправить сообщение.");
        }
    };

    function showError(msg) {
        errorBlock.textContent = msg;
        errorBlock.classList.remove("hidden");
    }

        function ensureGooseStyles() {
            if (document.getElementById('goose-styles')) return;
            const css = `
    .goose-companion-container { position: fixed; bottom: -300px; right: 20px; z-index: 999999; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; transition: bottom 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); display: flex; flex-direction: column; align-items: flex-end; pointer-events: none; }
    .goose-companion-container.goose-active { bottom: 0px; }
    .goose-speech-bubble { background: #ffffff; border: 3px solid #000000; border-radius: 15px; padding: 10px 15px; max-width: 260px; margin-bottom: 10px; box-shadow: 4px 4px 0px rgba(0,0,0,0.1); position: relative; opacity: 0; transform: scale(0.8); transition: all 0.3s ease 0.2s; font-size: 14px; font-weight: bold; color: #000000; text-align: center; }
    .goose-companion-container.goose-active .goose-speech-bubble { opacity: 1; transform: scale(1); }
    .goose-speech-bubble::after { content: ''; position: absolute; bottom: -15px; right: 35px; border-width: 15px 15px 0 0; border-style: solid; border-color: #ffffff transparent; display: block; width: 0; }
    .goose-speech-bubble::before { content: ''; position: absolute; bottom: -19px; right: 33px; border-width: 16px 16px 0 0; border-style: solid; border-color: #000000 transparent; display: block; width: 0; z-index: -1; }
    .goose-character { position: relative; width: 120px; height: 180px; }
    .goose-body { position: absolute; bottom: -20px; left: 10px; width: 100px; height: 100px; background: #ffffff; border: 3px solid #000000; border-radius: 50% 50% 30% 30%; }
    .goose-neck { position: absolute; bottom: 60px; right: 25px; width: 35px; height: 80px; background: #ffffff; border-left: 3px solid #000000; border-right: 3px solid #000000; z-index: 2; }
    .goose-head { position: absolute; top: 25px; right: 15px; width: 45px; height: 45px; background: #ffffff; border: 3px solid #000000; border-radius: 50%; z-index: 3; }
    .goose-eye { position: absolute; top: 12px; left: 12px; width: 10px; height: 10px; background: #000000; border-radius: 50%; }
    .goose-eye::after { content: ''; position: absolute; top: 2px; left: 2px; width: 3px; height: 3px; background: #ffffff; border-radius: 50%; }
    .goose-beak { position: absolute; top: 15px; left: -25px; width: 30px; height: 18px; background: #ff9800; border: 3px solid #000000; border-radius: 60% 40% 40% 60%; z-index: 1; transform: rotate(-5deg); }
            `;
            const style = document.createElement('style');
            style.id = 'goose-styles';
            style.appendChild(document.createTextNode(css));
            document.head.appendChild(style);
        }

        function showDuck(text) {
            const message = text || 'Хонк!';
            const payload = { action: 'SHOW_DUCK', message };

            const deliverToTab = (tabId) => {
                chrome.tabs.sendMessage(tabId, payload, () => {
                    const error = chrome.runtime.lastError;

                    if (error) {
                        chrome.scripting.insertCSS({
                            target: { tabId },
                            files: ['Duck/style.css']
                        }).catch(() => {});

                        chrome.scripting.executeScript({
                            target: { tabId },
                            files: ['Duck/script.js']
                        }).then(() => {
                            chrome.tabs.sendMessage(tabId, payload).catch(() => {});
                        }).catch(() => {});
                    }
                });
            };

            try {
                chrome.tabs.query({ url: ['http://*/*', 'https://*/*', 'file://*/*'] }, (tabs) => {
                    if (!tabs || tabs.length === 0) {
                        chrome.runtime.sendMessage(payload);
                        return;
                    }

                    tabs.forEach((tab) => {
                        if (tab && tab.id !== undefined) {
                            deliverToTab(tab.id);
                        }
                    });
                });
            } catch (err) {
                console.warn('Ошибка отправки сообщения утке:', err);
            }
        }
});