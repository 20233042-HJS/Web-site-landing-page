document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const email        = document.getElementById('email').value;
    const password     = document.getElementById('password').value;
    const role         = document.querySelector('input[name="role"]:checked').value; // 'student' or 'professor'
    const errorMessage = document.getElementById('errorMessage');

    errorMessage.textContent = '';

    // 역할에 따라 다른 엔드포인트 사용
    const endpoint = role === 'professor'
        ? 'http://localhost:3000/login/professor'
        : 'http://localhost:3000/login/student';

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            // 로그인 성공 시 역할에 따라 다른 페이지로 이동
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
