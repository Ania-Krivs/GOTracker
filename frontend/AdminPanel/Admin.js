document.addEventListener('DOMContentLoaded', () => {
    const elementsList = document.getElementById("Elements-list");
    const addButton = document.getElementById("Add");
    const modalOverlay = document.getElementById("modal-overlay");
    const modalTitle = document.getElementById("modal-title");
    const modalBodyContent = document.getElementById("modal-body-content");
    const globalErrorBlock = document.getElementById("error-message");
    const toastContainer = document.getElementById("toast-container");

    let adminSocket = null;

    const getStoredAdminId = () => {
        const stored = localStorage.getItem('admin_id')
            || localStorage.getItem('adminId')
            || localStorage.getItem('id')
            || localStorage.getItem('ID');

        if (!stored || stored === 'undefined' || stored === 'null') {
            return "";
        }

        return String(stored);
    };

    const currentAdminId = getStoredAdminId();
    const lastAdminMessageByUserId = new Map();

    // ПОДКЛЮЧЕНИЕ К WEBSOCKET ДЛЯ АДМИНИСТРАТОРА
    const initAdminWebSocket = () => {
        if (!currentAdminId) return;

        // Формируем адрес ws-соединения (подставьте ваш точный эндпоинт, если он отличается)
        const wsUrl = `ws://localhost:8080/ws/admin?admin_id=${currentAdminId}`;
        adminSocket = new WebSocket(wsUrl);

        adminSocket.onopen = () => {
            console.log("WebSocket соединение админа успешно установлено.");
        };

        adminSocket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                const userId = data.user_id || data.userId || data.id || '';
                const senderName = data.user_name || data.name || "Участник";
                const userReply = data.message || data.text || data.payload || "Отправил ответ";
                const adminMessage = userId ? (lastAdminMessageByUserId.get(String(userId)) || 'Сообщение администратора не найдено') : 'Сообщение администратора не найдено';

                showResponseToast({ userId, userName: senderName, adminMessage, userReply });
            } catch (err) {
                console.warn("Получены нетекстовые или некорректные данные по WS:", event.data);
            }
        };

        adminSocket.onclose = () => {
            console.log("WebSocket соединение закрыто. Попытка переподключения через 5 секунд...");
            setTimeout(initAdminWebSocket, 5000);
        };

        adminSocket.onerror = (err) => {
            console.error("Ошибка WebSocket:", err);
        };
    };

    const showNotificationToast = (user, message) => {
        const toast = document.createElement("div");
        toast.className = "toast";
        toast.innerHTML = `<strong>${user}:</strong> <span>${message}</span>`;
        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = "slideIn 0.3s ease reverse forwards";
            setTimeout(() => toast.remove(), 300);
        }, 6000);
    };

    const showResponseToast = ({ userId, userName, adminMessage, userReply }) => {
        const toast = document.createElement("div");
        toast.className = "toast response-toast";
        toast.innerHTML = `
            <div class="toast-header">
                <strong>Ответ от ${escapeHtml(userName)}</strong>
                <button type="button" class="toast-close" aria-label="Закрыть">×</button>
            </div>
            <div class="toast-section">
                <div class="toast-section-label">Первоначальное сообщение</div>
                <div class="toast-section-text admin-message">${escapeHtml(adminMessage)}</div>
            </div>
            <div class="toast-section">
                <div class="toast-section-label">Ответ</div>
                <div class="toast-section-text user-reply">${escapeHtml(userReply)}</div>
            </div>
        `;

        const closeBtn = toast.querySelector('.toast-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => toast.remove());
        }

        toastContainer.appendChild(toast);
    };

    const escapeHtml = (text) => {
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    };

    const normalizeUser = (user) => {
        if (!user || typeof user !== 'object') {
            return { id: '', name: '', code: '', admin_id: null };
        }

        const normalized = Object.entries(user).reduce((acc, [key, value]) => {
            acc[key.toLowerCase()] = value;
            return acc;
        }, {});

        const id = normalized.id ?? normalized._id ?? normalized.uid ?? '';
        const name = normalized.name ?? normalized.username ?? normalized.first_name ?? '';
        const code = normalized.code ?? normalized.Code ?? normalized['user_code'] ?? '';
        const adminId = normalized.admin_id ?? normalized.adminid ?? normalized['admin-id'] ?? '';

        return {
            id: String(id || ''),
            name: String(name || ''),
            code: code === null || code === undefined ? '' : String(code),
            admin_id: adminId === null || adminId === undefined ? null : String(adminId),
        };
    };

    const showGlobalError = (msg) => {
        globalErrorBlock.textContent = msg;
        globalErrorBlock.classList.remove('hidden');
    };

    const clearGlobalError = () => {
        globalErrorBlock.textContent = '';
        globalErrorBlock.classList.add('hidden');
    };

    const closeModal = () => {
        modalOverlay.classList.add('hidden');
        modalBodyContent.innerHTML = '';
    };

    const fetchUsers = async () => {
        clearGlobalError();
        try {
            const response = await fetch('http://localhost:8080/users', { method: 'GET' });
            if (!response.ok) {
                const errData = await response.json().catch(() => null);
                throw new Error(errData?.error || 'Не удалось загрузить пользователей');
            }
            const data = await response.json();
            const users = Array.isArray(data) ? data : (data?.users || []);
            renderUsers(users);
        } catch (err) {
            console.error(err);
            showGlobalError(`Ошибка загрузки: ${err.message}`);
            elementsList.innerHTML = '<div class="empty-state">Ошибка при получении данных с сервера</div>';
        }
    };

    const renderUsers = (users) => {
        elementsList.innerHTML = '';

        const normalizedUsers = users.map(normalizeUser);
        const myUsers = normalizedUsers.filter(user => String(user.admin_id || "") === currentAdminId);

        if (myUsers.length === 0) {
            elementsList.innerHTML = '<div class="empty-state">У вас пока нет участников</div>';
            return;
        }

        myUsers.forEach(user => {
            const box = document.createElement('div');
            box.className = 'box';
            box.dataset.userId = user.id;
            
            box.innerHTML = `
                <div class="user-info">
                    <span class="User_name">${user.name}</span>
                </div>
                <div class="action-buttons">
                    <button class="msg-btn" data-user-id="${user.id}" data-name="${user.name}">Отправить сообщение</button>
                    <button id="Duck" data-code="${user.code}" data-name="${user.name}">Показать код</button>
                    <button id="Min" title="Удалить"></button>
                </div>
            `;
            elementsList.appendChild(box);
        });
    };

    addButton.addEventListener('click', () => {
        modalTitle.textContent = 'Новый участник';
        modalBodyContent.innerHTML = `
            <form id="add-user-form" class="modal-form-group" onsubmit="event.preventDefault();">
                <label class="modal-input-label" for="new-user-name-input">Введите имя нового пользователя:</label>
                <input type="text" class="User_names" id="new-user-name-input" placeholder="Например, Иван Иванов" autocomplete="off">
                <div id="modal-error" class="error-text hidden"></div>
                <div class="modal-actions">
                    <button type="button" id="Close_error">Отмена</button>
                    <button type="submit" id="Create_user">Добавить</button>
                </div>
            </form>
        `;
        modalOverlay.classList.remove('hidden');
        setTimeout(() => document.getElementById('new-user-name-input')?.focus(), 40);
    });

    // ОБРАБОТЧИК ДЛЯ КНОПКИ «ОТПРАВИТЬ СООБЩЕНИЕ» В СПИСКЕ
    elementsList.addEventListener('click', (e) => {
        if (e.target && e.target.classList.contains('msg-btn')) {
            const userId = e.target.dataset.userId;
            const name = e.target.dataset.name;

            modalTitle.textContent = `Сообщение для ${name}`;
            modalBodyContent.innerHTML = `
                <form id="send-msg-form" class="modal-form-group" onsubmit="event.preventDefault();">
                    <label class="modal-input-label" for="admin-message-input">Текст сообщения:</label>
                    <textarea class="modal-textarea" id="admin-message-input" placeholder="Введите ваше сообщение участнику..." maxlength="150"></textarea>
                    <div id="char-count" class="char-counter">0 / 150</div>
                    <div id="modal-error" class="error-text hidden"></div>
                    <div class="modal-actions">
                        <button type="button" id="Close_error">Отмена</button>
                        <button type="submit" id="Send_msg_btn" data-user-id="${userId}">Отправить</button>
                    </div>
                </form>
            `;

            const textarea = document.getElementById('admin-message-input');
            const charCount = document.getElementById('char-count');

            textarea.addEventListener('input', () => {
                charCount.textContent = `${textarea.value.length} / 150`;
            });

            modalOverlay.classList.remove('hidden');
            setTimeout(() => textarea.focus(), 40);
        }
    });

    modalOverlay.addEventListener('click', (e) => {
        if (e.target && e.target.id === 'Close_error') {
            closeModal();
        }
    });

    // ОТПРАВКА СООБЩЕНИЯ НА БЭКЕНД С ВАЛИДАЦИЕЙ СИМВОЛОВ
    modalOverlay.addEventListener('click', async (e) => {
        if (e.target && e.target.id === 'Send_msg_btn') {
            const userId = e.target.dataset.userId;
            const textarea = document.getElementById('admin-message-input');
            const modalError = document.getElementById('modal-error');
            const messageText = textarea ? textarea.value.trim() : "";

            if (modalError) modalError.classList.add('hidden');

            if (messageText.length === 0) {
                modalError.textContent = 'Вы не ввели текст сообщения';
                modalError.classList.remove('hidden');
                return;
            }

            try {
                e.target.disabled = true;
                const response = await fetch('http://localhost:8080/admin/message', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        admin_id: currentAdminId,
                        user_id: userId,
                        message: messageText
                    })
                });

                const data = await response.json().catch(() => null);
                if (!response.ok) {
                    throw new Error(data?.error || 'Не удалось отправить сообщение');
                }

                lastAdminMessageByUserId.set(String(userId), messageText);
                closeModal();
            } catch (err) {
                if (modalError) {
                    modalError.textContent = err.message;
                    modalError.classList.remove('hidden');
                }
                e.target.disabled = false;
            }
        }
    });

    modalOverlay.addEventListener('click', async (e) => {
        if (e.target && e.target.id === 'Create_user') {
            const inputField = document.getElementById('new-user-name-input');
            const modalError = document.getElementById('modal-error');
            const userName = inputField ? inputField.value.trim() : "";

            if (modalError) modalError.classList.add('hidden');

            if (userName.length === 0) {
                modalError.textContent = 'Вы не ввели имя';
                modalError.classList.remove('hidden');
                return;
            }
            if (userName.length > 25) {
                modalError.textContent = 'Имя слишком длинное (макс. 25 символов)';
                modalError.classList.remove('hidden');
                return;
            }

            try {
                e.target.disabled = true;
                const response = await fetch('http://localhost:8080/users', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: userName,
                        admin_id: currentAdminId
                    })
                });

                const data = await response.json().catch(() => null);
                if (!response.ok) {
                    throw new Error(data?.error || 'Ошибка при создании пользователя');
                }

                closeModal();
                await fetchUsers();
            } catch (err) {
                if (modalError) {
                    modalError.textContent = err.message;
                    modalError.classList.remove('hidden');
                }
                e.target.disabled = false;
            }
        }
    });

    elementsList.addEventListener('click', async (e) => {
        if (e.target && e.target.id === 'Min') {
            const boxToRemove = e.target.closest('.box');
            if (!boxToRemove) return;
            const userId = boxToRemove.dataset.userId;

            if (confirm('Вы уверены, что хотите удалить этого участника?')) {
                try {
                    const response = await fetch(`http://localhost:8080/users?id=${userId}`, {
                        method: 'DELETE'
                    });

                    if (!response.ok) {
                        const errData = await response.json().catch(() => null);
                        throw new Error(errData?.error || 'Не удалось удалить пользователя');
                    }

                    fetchUsers();
                } catch (err) {
                    showGlobalError(`Ошибка при удалении: ${err.message}`);
                }
            }
        }
    });

    elementsList.addEventListener('click', (e) => {
        if (e.target && e.target.id === 'Duck') {
            const code = e.target.dataset.code;
            const name = e.target.dataset.name;

            modalTitle.textContent = 'Код Доступа';
            modalBodyContent.innerHTML = `
                <div class="share-code-container">
                    <p style="font-size: 14px; color: #a29db8; margin-bottom: 12px;">Передайте этот код пользователю <strong>${name}</strong> для авторизации:</p>
                    <div id="User_code">${code}</div>
                    <div class="modal-actions" style="margin-top: 20px;">
                        <button id="Close_error" style="width:100%; background: #1a1530; border: 1px solid #2d2452;">Понятно</button>
                    </div>
                </div>
            `;
            modalOverlay.classList.remove('hidden');
        }
    });

    // Запуск процессов
    fetchUsers();
    initAdminWebSocket();
});