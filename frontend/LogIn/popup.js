document.getElementById('myBtn').addEventListener('click', () => {
window.location.href = chrome.runtime.getURL('admin.html')
});
document.getElementById('Ubtn').addEventListener('click', () => {
window.location.href = chrome.runtime.getURL('user.html')
});