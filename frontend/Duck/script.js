const quickReplyOptions = [
    { label: 'Да', value: 'Да' },
    { label: 'Нет', value: 'Нет' },
    { label: 'Нужен созвон', value: 'Нужен созвон' },
    { label: 'Свой вариант', value: 'custom' }
];

let gooseInstance = null;
let gooseHideTimer = null;
let replySocket = null;
let currentUserId = null;

function createGoose() {
    if (gooseInstance || !document.body) {
        return;
    }

    const container = document.createElement('div');
    container.className = 'goose-companion-container';

    const goose = document.createElement('div');
    goose.className = 'goose-character';

    const bubble = document.createElement('div');
    bubble.className = 'goose-speech-bubble';
    bubble.textContent = '...';
    goose.appendChild(bubble);

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

    const controls = document.createElement('div');
    controls.className = 'goose-reply-controls';
    container.appendChild(controls);

    document.body.appendChild(container);

    const audioUrl = chrome.runtime.getURL('quack.mp3');
    const quackAudio = new Audio(audioUrl);

    gooseInstance = { container, bubble, quackAudio, controls };
}

function connectReplySocket(userId) {
    if (!userId) {
        return;
    }

    if (replySocket && (replySocket.readyState === WebSocket.OPEN || replySocket.readyState === WebSocket.CONNECTING)) {
        return;
    }

    const wsUrl = `ws://localhost:8080/ws/user?user_id=${userId}`;
    replySocket = new WebSocket(wsUrl);

    replySocket.onopen = () => {
        console.log('Duck reply socket connected');
    };

    replySocket.onerror = () => {
        console.warn('Duck reply socket error');
    };

    replySocket.onclose = () => {
        setTimeout(() => {
            if (currentUserId) {
                connectReplySocket(currentUserId);
            }
        }, 5000);
    };
}

function initUserSession() {
    if (currentUserId) {
        connectReplySocket(currentUserId);
        return;
    }

    chrome.storage.local.get(['userId'], (data) => {
        const userId = data.userId;
        if (userId) {
            currentUserId = String(userId);
            connectReplySocket(currentUserId);
        }
    });
}

function sendReply(replyText) {
    const text = (replyText || '').trim();
    if (!text) {
        return;
    }

    if (gooseInstance?.controls) {
        gooseInstance.controls.classList.add('is-sent');
        gooseInstance.controls.querySelectorAll('button').forEach((btn) => {
            btn.disabled = true;
        });
    }

    const trySend = () => {
        if (replySocket && replySocket.readyState === WebSocket.OPEN) {
            replySocket.send(text);
            return true;
        }
        return false;
    };

    if (!currentUserId) {
        chrome.storage.local.get(['userId'], (data) => {
            const userId = data.userId;
            if (userId) {
                currentUserId = String(userId);
                connectReplySocket(currentUserId);
                setTimeout(() => {
                    trySend();
                }, 250);
            }
        });
        return;
    }

    if (!replySocket || replySocket.readyState !== WebSocket.OPEN) {
        connectReplySocket(currentUserId);
        setTimeout(() => {
            trySend();
        }, 250);
        return;
    }

    trySend();
}

function buildReplyControls() {
    if (!gooseInstance) {
        return;
    }

    const { controls } = gooseInstance;
    controls.innerHTML = '';

    const buttonsRow = document.createElement('div');
    buttonsRow.className = 'goose-reply-buttons';

    quickReplyOptions.forEach((option) => {
        const button = document.createElement('button');
        button.className = 'goose-reply-btn';
        button.textContent = option.label;

        button.addEventListener('click', () => {
            if (option.value === 'custom') {
                customReplyRow.classList.remove('hidden');
                customInput.focus();
                return;
            }

            sendReply(option.value);
        });

        buttonsRow.appendChild(button);
    });

    const customReplyRow = document.createElement('div');
    customReplyRow.className = 'goose-custom-reply hidden';

    const customInput = document.createElement('input');
    customInput.className = 'goose-custom-input';
    customInput.type = 'text';
    customInput.placeholder = 'Ваш вариант ответа';

    const customSendBtn = document.createElement('button');
    customSendBtn.className = 'goose-custom-send';
    customSendBtn.textContent = 'Отправить';

    customSendBtn.addEventListener('click', () => {
        const value = customInput.value.trim();
        if (!value) {
            return;
        }
        sendReply(value);
        customReplyRow.classList.add('hidden');
        controls.classList.add('is-sent');
    });

    customReplyRow.appendChild(customInput);
    customReplyRow.appendChild(customSendBtn);

    controls.appendChild(buttonsRow);
    controls.appendChild(customReplyRow);
}

function showGoose(message) {
    if (!gooseInstance) {
        createGoose();
    }

    if (!gooseInstance) {
        return;
    }

    const { container, bubble, quackAudio } = gooseInstance;
    bubble.textContent = message || 'Хонк!';
    buildReplyControls();
    container.classList.add('goose-active');

    if (quackAudio) {
        quackAudio.currentTime = 0;
        quackAudio.play().catch(() => {});
    }

    if (gooseHideTimer) {
        clearTimeout(gooseHideTimer);
    }

    gooseHideTimer = setTimeout(() => {
        container.classList.remove('goose-active');
    }, 7000);
}

function registerDuckTriggers() {
    initUserSession();

    window.addEventListener('duck:show', (event) => {
        showGoose(event.detail?.message || '');
    });

    if (chrome.runtime?.onMessage) {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message?.action === 'SHOW_DUCK') {
                showGoose(message.message || '');
                sendResponse({ ok: true });
                return true;
            }
            return false;
        });
    }
}

if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', registerDuckTriggers);
} else {
    registerDuckTriggers();
}