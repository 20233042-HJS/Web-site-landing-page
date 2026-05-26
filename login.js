const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:3000' : '';

document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const email        = document.getElementById('email').value;
    const password     = document.getElementById('password').value;
    const role         = document.querySelector('input[name="role"]:checked').value;
    const errorMessage = document.getElementById('errorMessage');

    errorMessage.textContent = '';

    const endpoint = role === 'professor'
        ? `${API_BASE}/login/professor`
        : `${API_BASE}/login/student`;

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            if (data.role === 'professor') {
                window.location.href = 'home_pro.html';
            } else {
                window.location.href = 'home_stu.html';
            }
        } else {
            errorMessage.textContent = data.message;
            errorMessage.style.color = 'red';
        }
    } catch (error) {
        console.error('Error:', error);
        errorMessage.textContent = '서버와 연결할 수 없습니다.';
        errorMessage.style.color = 'red';
    }
});
