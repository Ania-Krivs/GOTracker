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

    let isUserAuthenticated = false;
    let popupGooseTimer = null;
    

    function createPopupGoose() {
        if (document.querySelector('.goose-companion-container')) return;


        const container = document.createElement('div');
        container.className = 'goose-companion-container';
        console.log(container)

        // const bubble = document.createElement('div');
        // bubble.className = 'goose-speech-bubble';
        // bubble.textContent = 'Ожидаю сообщений...';
        // container.appendChild(bubble);

        const goose = document.createElement('div');
        goose.className = 'goose-character';

        const body = document.createElement('div');
        body.className = 'goose-body';
        const neck = document.createElement('div');
        neck.className = 'goose-neck';
        const head = document.createElement('div');
        head.className = 'goose-head';
        const eye = document.createElement('div');
        eye.className = 'goose-eye';
        const beak = document.createElement('div');
        beak.className = 'goose-beak';

        head.appendChild(eye);
        head.appendChild(beak);
        goose.appendChild(body);
        goose.appendChild(neck);
        goose.appendChild(head);
        container.appendChild(goose);

        chatBox.parentNode.insertBefore(container, chatBox);
    }

    chrome.storage.local.get(['userId'], (data) => {
        const storedId = data.userId;
        if (storedId && storedId !== "undefined" && storedId !== "null" && storedId !== "") {
            isUserAuthenticated = true;
            authSection.classList.add("hidden");
            workspaceSection.classList.remove("hidden");
            
            // createPopupGoose();

            chrome.runtime.sendMessage({ action: "GET_WS_STATUS" }, (response) => {
                if (response && response.status) updateStatusUI(response.status);
            });
        } else {
            isUserAuthenticated = false;
            authSection.classList.remove("hidden");
            workspaceSection.classList.add("hidden");
        }
    });

    replyInput.addEventListener("input", () => {
        charCounter.textContent = `${replyInput.value.length} / 150`;
    });

    loginBtn.onclick = async () => {
        errorBlock.classList.add("hidden");
        const codeStr = codeInput.value.trim();
        if (!codeStr) return showError("Пожалуйста, введите код");
        
        const codeNum = Number(codeStr);
        if (isNaN(codeNum)) return showError("Код должен быть числом");

        try {
            loginBtn.disabled = true;
            loginBtn.textContent = "Подключение...";

            const response = await fetch("http://localhost:8080/users/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code: codeNum })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Не удалось войти");

            const userId = data.id || data.ID || data.uid;
            if (!userId) throw new Error("Пользователь не найден");

            chrome.storage.local.set({ userId: String(userId) }, () => {
                isUserAuthenticated = true;
                authSection.classList.add("hidden");
                workspaceSection.classList.remove("hidden");
                
                // createPopupGoose();

                chrome.runtime.sendMessage({ action: "CONNECT_USER_WS", userId: String(userId) });
            });
        } catch (err) {

    let message = err.message;

    if (message === "Failed to fetch") {
        message = "Не удалось подключиться";
    }

    showError(message);

    loginBtn.disabled = false;
    loginBtn.textContent = "Продолжить";
}
    };

    chrome.runtime.onMessage.addListener((message) => {
        if (!isUserAuthenticated) return;

        if (message.action === "WS_STATUS_CHANGED") {
            updateStatusUI(message.status);
        }
        
        if (message.action === "DISPLAY_INCOMING_MSG") {
            // displayIncomingMessage(message.text);
            showDuckOnTabs(message.text);
        }
    });

    function updateStatusUI(status) {
        statusIndicator.textContent = status;
        statusIndicator.className = status === "В сети" ? "connected" : "disconnected";
        
        if (status === "Отключено") {
            replyContainer.classList.add("hidden");
            chatBox.className = "chat-placeholder";
            chatBox.textContent = "Соединение разорвано. Ожидание переподключения...";
            
            const container = document.querySelector('.goose-companion-container');
            if (container) container.classList.remove('goose-active');
        }
    }

    function displayIncomingMessage(text) {
        chatBox.className = "chat-placeholder incoming-msg";
        chatBox.innerHTML = `<strong>Администратор:</strong><br>${text}`;
        replyContainer.classList.remove("hidden");
        replyInput.value = "";
        charCounter.textContent = "0 / 150";
        replyInput.focus();

        const container = document.querySelector('.goose-companion-container');
        const bubble = document.querySelector('.goose-speech-bubble');
        
        if (container && bubble) {
            bubble.textContent = text || 'Хонк!';
            container.classList.add('goose-active');

            if (popupGooseTimer) clearTimeout(popupGooseTimer);
            popupGooseTimer = setTimeout(() => {
                container.classList.remove('goose-active');
            }, 12000); 
        }
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
                if (!tabs || tabs.length === 0) return;
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

    function showDuckOnTabs(text) {
        showDuck(text);
    }

    sendReplyBtn.onclick = () => {
        const replyText = replyInput.value.trim();
        if (!replyText) return;

        sendReplyBtn.disabled = true;
        chrome.runtime.sendMessage({ action: "SEND_REPLY_TO_ADMIN", text: replyText }, (response) => {
            sendReplyBtn.disabled = false;
            if (response && response.success) {
                replyContainer.classList.add("hidden");
                chatBox.className = "chat-placeholder";
                chatBox.style.borderColor = "#2ee67e";
                chatBox.textContent = "✓ Ответ отправлен администратору!";

                const container = document.querySelector('.goose-companion-container');
                if (container) container.classList.remove('goose-active');

                setTimeout(() => {
                    chatBox.style.borderColor = "";
                    chatBox.textContent = "Ожидание новых сообщений от администратора...";
                }, 3000);
            } else {
                alert("Не удалось доставить сообщение. Сокет закрыт.");
            }
        });
    };

    function showError(msg) {
        errorBlock.textContent = msg;
        errorBlock.classList.remove("hidden");
    }
});