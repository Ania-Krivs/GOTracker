document.addEventListener('DOMContentLoaded', () => {
    const elementsList = document.getElementById("Elements-list");
    const addButton = document.getElementById("Add");
    const modalOverlay = document.getElementById("modal-overlay");
    const modalTitle = document.getElementById("modal-title");
    const modalBodyContent = document.getElementById("modal-body-content");
    const globalErrorBlock = document.getElementById("error-message");

    const getStoredAdminId = () => {
        const stored = localStorage.getItem('admin_id')
            || localStorage.getItem('id')
            || localStorage.getItem('ID')
            || localStorage.getItem('adminId');
        return stored ? String(stored) : "";
    };

    const currentAdminId = getStoredAdminId();

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
                    <span class="user-meta-code">Код доступа: #${user.code}</span>
                </div>
                <div class="action-buttons">
                    <button id="Duck" data-code="${user.code}" data-name="${user.name}">Показать код</button>
                    <button id="Min">&times;</button>
                </div>
            `;
            elementsList.appendChild(box);
        });
    };

    addButton.addEventListener('click', () => {
        modalTitle.textContent = 'Добавить Участника';
        modalBodyContent.innerHTML = `
            <div class="modal-form-group">
                <p>Введите имя нового пользователя:</p>
                <input type="text" class="User_names" id="new-user-name-input" placeholder="Например, Иван Иванов">
                <div id="modal-error" class="error-text hidden"></div>
                <div class="modal-actions">
                    <button id="Close_error">Отмена</button>
                    <button id="Create_user">Добавить</button>
                </div>
            </div>
        `;
        modalOverlay.classList.remove('hidden');
    });

    modalOverlay.addEventListener('click', (e) => {
        if (e.target && e.target.id === 'Close_error') {
            closeModal();
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
                    <p>Передайте этот код пользователю <strong>${name}</strong> для авторизации:</p>
                    <div id="User_code">${code}</div>
                    <div class="modal-actions">
                        <button id="Close_error" style="width:100%">Понятно</button>
                    </div>
                </div>
            `;
            modalOverlay.classList.remove('hidden');
        }
    });

    fetchUsers();
});