document.getElementById('myBtn').addEventListener('click', () => {
    chrome.storage.local.set({ userRole: 'admin', isLoggedIn: true }, () => {
        window.location.href = chrome.runtime.getURL('LogIn/admin.html');
    });
});

document.getElementById('Ubtn').addEventListener('click', () => {
    chrome.storage.local.set({ userRole: 'user', isLoggedIn: true }, () => {
        window.location.href = chrome.runtime.getURL('LogIn/user.html');
    });
});