document.getElementById('signupForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const username        = document.getElementById('username').value;
    const email           = document.getElementById('email').value;
    const password        = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const role            = document.querySelector('input[name="role"]:checked').value; // 'student' or 'professor'
    const errorMessage    = document.getElementById('errorMessage');

    errorMessage.textContent = '';

    // 비밀번호 확인
    if (password !== confirmPassword) {
        errorMessage.textContent = '비밀번호가 일치하지 않습니다.';
        errorMessage.style.color = 'red';
        return;
    }

    // 역할에 따라 다른 엔드포인트 사용
    const endpoint = role === 'professor'
        ? '${API_BASE}/signup/professor'
        : '${API_BASE}/signup/student';

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();

        if (response.ok) {
            const roleLabel = role === 'professor' ? '교수' : '학생';
            alert(`${roleLabel} 회원가입이 완료되었습니다! 로그인 페이지로 이동합니다.`);
            window.location.href = 'login.html';
        } else {
            errorMessage.textContent = data.message;
            errorMessage.style.color = 'red';
        }
    } catch (error) {
        console.error('Error:', error);
        errorMessage.textContent = '서버와 연결할 수 없습니다. 터미널에서 node server.js 가 켜져있는지 확인하세요.';
        errorMessage.style.color = 'red';
    }
});
