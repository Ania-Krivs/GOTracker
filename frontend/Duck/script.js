const quickReplyOptions = [
    { label: 'Да', value: 'Да' },
    { label: 'Нет', value: 'Нет' },
    { label: 'Нужен созвон', value: 'Нужен созвон' },
    { label: 'Свой вариант', value: 'custom' }
];

let gooseInstance = null;
let gooseHideTimer = null;

function createGoose() {
    if (gooseInstance || !document.body) return;

    const container = document.createElement('div');
    container.className = 'goose-companion-container';
    console.log(container)

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

function sendReply(replyText) {
    const text = (replyText || '').trim();
    if (!text) return;

    if (gooseInstance?.controls) {
        gooseInstance.controls.classList.add('is-sent');
        gooseInstance.controls.querySelectorAll('button').forEach(btn => btn.disabled = true);
    }

    chrome.runtime.sendMessage({ action: 'SEND_REPLY_TO_ADMIN', text: text }, (response) => {
        if (response && response.success) {
            if (gooseHideTimer) clearTimeout(gooseHideTimer);
            gooseHideTimer = setTimeout(() => {
                if (gooseInstance?.container) {
                    gooseInstance.container.classList.remove('goose-active');
                }
            }, 2000);
        }
    });
}

function buildReplyControls() {
    if (!gooseInstance) return;
    const { controls } = gooseInstance;
    controls.innerHTML = '';
    controls.classList.remove('is-sent');

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
    customInput.placeholder = 'Ваш вариант';

    const customSendBtn = document.createElement('button');
    customSendBtn.className = 'goose-custom-send';
    customSendBtn.textContent = 'Отправить';
    customSendBtn.addEventListener('click', () => {
        const value = customInput.value.trim();
        if (!value) return;
        sendReply(value);
        customReplyRow.classList.add('hidden');
    });

    customReplyRow.appendChild(customInput);
    customReplyRow.appendChild(customSendBtn);
    controls.appendChild(buttonsRow);
    controls.appendChild(customReplyRow);
}

function extractDuckMessage(payload) {
    const readFromValue = (value) => {
        if (!value) return null;

        if (typeof value === 'string') {
            const trimmed = value.trim();
            if (!trimmed) return null;

            try {
                const parsed = JSON.parse(trimmed);
                if (parsed && typeof parsed === 'object') {
                    const nested = readFromValue(parsed);
                    if (nested) return nested;
                }
            } catch (_) {
                // Если это не JSON, показываем как есть
            }

            return trimmed;
        }

        if (typeof value === 'object') {
            if (typeof value.message === 'string' && value.message.trim()) {
                return value.message;
            }
            if (typeof value.text === 'string' && value.text.trim()) {
                return value.text;
            }
            if (typeof value.payload === 'string' && value.payload.trim()) {
                return value.payload;
            }
        }

        return null;
    };

    const extracted = readFromValue(payload);
    if (extracted) {
        if (typeof extracted === 'string') {
            const nested = readFromValue(extracted);
            return nested || extracted;
        }
        return String(extracted);
    }

    return 'Хонк!';
}

function showGoose(message) {
    if (!gooseInstance) createGoose();
    if (!gooseInstance) return;

    const { container, bubble, quackAudio } = gooseInstance;
    bubble.textContent = extractDuckMessage(message);
    buildReplyControls();
    container.classList.add('goose-active');

    if (quackAudio) {
        quackAudio.currentTime = 0;
        quackAudio.play().catch(() => {});
    }

    if (gooseHideTimer) clearTimeout(gooseHideTimer);
    gooseHideTimer = setTimeout(() => {
        container.classList.remove('goose-active');
    }, 12000); // Утка видна 12 секунд, ожидая клика
}

// Регистрируем единственный слушатель событий от background.js
if (chrome.runtime?.onMessage) {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message && message.action === 'SHOW_DUCK') {
            showGoose(message);
            sendResponse({ ok: true });
            return true;
        }
        return false;
    });
}