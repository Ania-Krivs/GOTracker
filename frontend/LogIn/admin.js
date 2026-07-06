document.addEventListener('DOMContentLoaded', () => {
    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');
    const slider = document.querySelector('.slider');
    const titleA = document.getElementById('title_A');
    const fieldName = document.getElementById('field-name');
    const fieldEmail = document.getElementById('field-email');
    const fieldPassword = document.getElementById('field-password');
    const submitBtn = document.getElementById('submit-btn');
    
    const errorBlock = document.getElementById('error-message');

    if (tabLogin && tabRegister && slider && titleA && fieldName && submitBtn && errorBlock) {
        
        const clearError = () => {
            errorBlock.textContent = '';
            errorBlock.classList.add('hidden');
        };

        tabLogin.addEventListener('click', () => {
            tabLogin.classList.add('active');
            tabRegister.classList.remove('active');
            slider.style.transform = 'translateX(0)';
            titleA.textContent = 'Admin LogIn';
            fieldName.classList.add('hidden');
            submitBtn.textContent = 'Confirm';
            clearError();
        });

        tabRegister.addEventListener('click', () => {
            tabRegister.classList.add('active');
            tabLogin.classList.remove('active');
            slider.style.transform = 'translateX(100%)';
            titleA.textContent = 'Admin Register';
            fieldName.classList.remove('hidden');
            submitBtn.textContent = 'Continue';
            clearError();
        });

        submitBtn.addEventListener('click', async () => {
            clearError();

            const isRegisterMode = tabRegister.classList.contains('active');
            const email = fieldEmail.value.trim();
            const password = fieldPassword.value;
            const name = isRegisterMode ? fieldName.value.trim() : "";

            if (!email || !password) {
                errorBlock.textContent = 'Пожалуйста, заполните Email и Пароль';
                errorBlock.classList.remove('hidden');
                return;
            }
            if (isRegisterMode && !name) {
                errorBlock.textContent = 'Пожалуйста, введите ваше Имя для регистрации';
                errorBlock.classList.remove('hidden');
                return;
            }

            const payload = {
                name: name,
                email: email,
                password: password
            };

            try {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Sending...';

                const response = await fetch('http://localhost:8080/admin', { 
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data || 'Что-то пошло не так');
                }

                if (response.status === 201 || response.status === 200) {
                    console.log('Успешно:', response.status === 201 ? 'Создан' : 'Вошел');
                    localStorage.setItem('ID', data.id); 

                    const pageUrl = chrome.runtime.getURL('AdminPanel/Admin.html');
                    chrome.tabs.create({ url: pageUrl }, () => {
                        window.close();
                    });
                }
                console.log('Данные админа:', data);

            } catch (error) {
                console.error('Ошибка:', error);
                
                errorBlock.textContent = `Ошибка: ${error.message}`;
                errorBlock.classList.remove('hidden');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = isRegisterMode ? 'Register' : 'Confirm';
            }
        });
    }
});

document.getElementById("back-btn").onclick = () => {

    window.location.href = "popup.html";

};


const password =
document.getElementById("field-password");

const eye =
document.getElementById("togglePassword");

eye.addEventListener("click", ()=>{

    if(password.type==="password"){

        password.type="text";

        eye.textContent="visibility_off";

    }
    else{

        password.type="password";

        eye.textContent="visibility";

    }

});