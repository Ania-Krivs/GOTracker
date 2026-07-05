document.addEventListener('DOMContentLoaded', () => {
    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');
    const slider = document.querySelector('.slider');
    const titleA = document.getElementById('title_A');
    const fieldName = document.getElementById('field-name');
    const submitBtn = document.getElementById('submit-btn');

    if (tabLogin && tabRegister && slider && titleA && fieldName && submitBtn) {
        tabLogin.addEventListener('click', () => {
            tabLogin.classList.add('active');
            tabRegister.classList.remove('active');
            slider.style.transform = 'translateX(0)';
            titleA.textContent = 'Admin LogIn';
            fieldName.classList.add('hidden');
            submitBtn.textContent = 'Confirm';
        });

        tabRegister.addEventListener('click', () => {
            tabRegister.classList.add('active');
            tabLogin.classList.remove('active');
            slider.style.transform = 'translateX(100%)';
            titleA.textContent = 'Admin Register';
            fieldName.classList.remove('hidden');
            submitBtn.textContent = 'Register';
        });
    }
});