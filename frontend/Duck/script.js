const goosePhrases = [
    "Хонк! Ты опять листаешь мемы?",
    "А дедлайн-то близко...",
    "Я слежу за твоим кодом. Всё переписывай.",
    "Хонк! Дай хлеба.",
    "Работаешь? Ну-ну.",
    "Я здесь главный архитектор!",
    "CSS — это моя страсть. Видишь, как я хорош?"
];

let gooseInstance = null;
let gooseHideTimer = null;

function createGoose() {
    if (gooseInstance || !document.body) {
        return;
    }

    const container = document.createElement('div');
    container.className = 'goose-companion-container';

    const bubble = document.createElement('div');
    bubble.className = 'goose-speech-bubble';
    bubble.innerText = '...';
    container.appendChild(bubble);

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

    document.body.appendChild(container);

    const audioUrl = chrome.runtime.getURL('quack.mp3');
    const quackAudio = new Audio(audioUrl);

    gooseInstance = { container, bubble, quackAudio };
}

function showGoose(message) {
    if (!gooseInstance) {
        createGoose();
    }

    if (!gooseInstance) {
        return;
    }

    const { container, bubble, quackAudio } = gooseInstance;
    bubble.innerText = message || goosePhrases[Math.floor(Math.random() * goosePhrases.length)];
    container.classList.add('goose-active');

    quackAudio.currentTime = 0;
    quackAudio.play().catch(() => {
        console.log('Звук заблокирован браузером до первого взаимодействия с страницей.');
    });

    if (gooseHideTimer) {
        clearTimeout(gooseHideTimer);
    }

    gooseHideTimer = setTimeout(() => {
        container.classList.remove('goose-active');
    }, 5000);
}

function registerDuckTriggers() {
    window.addEventListener('duck:show', (event) => {
        showGoose(event.detail?.message || '');
    });

    if (chrome.runtime?.onMessage) {
        chrome.runtime.onMessage.addListener((message) => {
            if (message?.action === 'SHOW_DUCK') {
                showGoose(message.message || '');
            }
        });
    }
}

if (document.readyState === 'complete') {
    registerDuckTriggers();
} else {
    window.addEventListener('load', registerDuckTriggers);
}