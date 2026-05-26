// 현재 페이지가 교수용인지 판단 (home_pro.html 이면 교수)
const IS_PROFESSOR = window.location.pathname.includes('home_pro');

// 페이지 로드 시 목록 불러오기
window.addEventListener('DOMContentLoaded', loadQuestions);

// 화면 전환 함수
function toggleWriteForm(showWrite) {
    const boardView = document.getElementById('boardView');
    const writeView = document.getElementById('writeView');

    if (showWrite) {
        boardView.style.display = 'none';
        writeView.style.display = 'block';
    } else {
        boardView.style.display = 'block';
        writeView.style.display = 'none';
        document.getElementById('title').value = '';
        document.getElementById('content').value = '';
    }
}

// 질문 등록
document.getElementById('questionForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const title   = document.getElementById('title').value;
    const content = document.getElementById('content').value;

    try {
        const response = await fetch('http://localhost:3000/api/questions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, content })
        });
        if (response.ok) {
            loadQuestions();
            toggleWriteForm(false);
        }
    } catch (error) {
        console.error('질문 등록 에러:', error);
    }
});

// 질문 목록 불러오기
async function loadQuestions() {
    try {
        const response  = await fetch('http://localhost:3000/api/questions');
        const questions = await response.json();
        const listDiv   = document.getElementById('questionList');
        listDiv.innerHTML = '';

        if (questions.length === 0) {
            listDiv.innerHTML = '<p style="text-align:center;color:#94a3b8;padding:30px 0;">아직 등록된 질문이 없습니다.</p>';
            return;
        }

        questions.forEach(q => {
            const deleteBtn = IS_PROFESSOR
                ? `<button class="btn-delete-q" onclick="deleteQuestion('${q._id}', this)">🗑️ 삭제</button>`
                : '';

            const div = document.createElement('div');
            div.className = 'q-item';
            div.dataset.id = q._id;
            div.innerHTML = `
                <div class="q-title">${q.title}</div>
                <div class="q-content">${q.content}</div>
                <div class="q-footer">
                    <span class="q-date">${new Date(q.createdAt).toLocaleDateString('ko-KR')}</span>
                    <div style="display:flex;gap:6px;align-items:center;">
                        ${deleteBtn}
                        <button class="btn-like" onclick="likeQuestion('${q._id}')">
                            ❤️ <span id="like-count-${q._id}">${q.likes}</span>
                        </button>
                    </div>
                </div>
            `;
            listDiv.appendChild(div);
        });
    } catch (error) {
        console.error('목록 불러오기 에러:', error);
    }
}

// 좋아요
async function likeQuestion(questionId) {
    try {
        const response = await fetch(`http://localhost:3000/api/questions/${questionId}/like`, {
            method: 'PUT'
        });
        if (response.ok) {
            const updated = await response.json();
            document.getElementById(`like-count-${questionId}`).innerText = updated.likes;
        }
    } catch (error) {
        console.error('좋아요 에러:', error);
    }
}

// Q&A 삭제 (교수용)
async function deleteQuestion(questionId, btn) {
    if (!confirm('이 질문을 삭제하시겠습니까?')) return;
    try {
        const response = await fetch(`http://localhost:3000/api/questions/${questionId}`, {
            method: 'DELETE'
        });
        if (response.ok) {
            btn.closest('.q-item').remove();
        } else {
            alert('삭제에 실패했습니다.');
        }
    } catch (error) {
        console.error('삭제 에러:', error);
    }
}
