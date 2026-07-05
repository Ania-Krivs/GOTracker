const goosePhrases = [
    "Хонк! Ты опять листаешь мемы?",
    "А дедлайн-то близко...",
    "Я слежу за твоим кодом. Всё переписывай.",
    "Хонк! Дай хлеба.",
    "Работаешь? Ну-ну.",
    "Я здесь главный архитектор!",
    "CSS — это моя страсть. Видишь, как я хорош?"
];

function createGoose(userRole) {

    const container = document.createElement('div');
    container.className = 'goose-companion-container';

    const bubble = document.createElement('div');
    bubble.className = 'goose-speech-bubble';
    bubble.innerText = "...";
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

    function triggerGoose() {
        const randomPhrase = goosePhrases[Math.floor(Math.random() * goosePhrases.length)];
        bubble.innerText = randomPhrase;

        container.classList.add('goose-active');

        quackAudio.currentTime = 0;
        quackAudio.play().catch(err => {
            console.log("Браузер заблокировал звук. Нужно кликнуть по странице хотя бы раз, чтобы звук активировался.", err);
        });

        setTimeout(() => {
            container.classList.remove('goose-active');
        }, 5000);
    }

    setTimeout(triggerGoose, 3000);
    setInterval(triggerGoose, 20000);
}

function checkAuthAndRun() {
    chrome.storage.local.get(['isLoggedIn', 'userRole'], (data) => {
        if (data.isLoggedIn) {
            createGoose(data.userRole);
        }
    });
}

if (document.readyState === 'complete') {
    checkAuthAndRun();
} else {
    window.addEventListener('load', checkAuthAndRun);
}