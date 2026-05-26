const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:3000' : '';

const urlParams = new URLSearchParams(window.location.search);
const currentTeam = urlParams.get('team') || '1';

const TARGET_GOAL = 100;
let globalOpinionCount = 0;

function toggleTask(header) {
    header.parentElement.classList.toggle('active');
}

function updateProgressUI(totalCount, shouldSaveToDB = false) {
    const percentSpan    = document.querySelector('.team-percent');
    const progressCircle = document.querySelector('.progress-circle');
    if (!percentSpan || !progressCircle) return;

    const percent = Math.min(Math.round((totalCount / TARGET_GOAL) * 100), 100);
    percentSpan.innerText = `${percent}%`;
    progressCircle.style.background = `conic-gradient(#424242 0% ${percent}%, #d1d5da ${percent}% 100%)`;

    if (shouldSaveToDB) {
        fetch(`${API_BASE}/api/progress`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ percent, totalCount, team: currentTeam })
        }).catch(err => console.error('진행도 저장 에러:', err));
    }
}

async function loadInitialData() {
    try {
        const taskRes = await fetch(`${API_BASE}/api/tasks?team=${currentTeam}`);
        if (taskRes.ok) {
            const taskData = await taskRes.json();
            globalOpinionCount = 0;

            document.querySelectorAll('.task-item').forEach(item => {
                const titleEl = item.querySelector('.task-title');
                const board   = item.querySelector('.excuse-board');
                if (!titleEl || !board) return;

                const title = titleEl.innerText.replace('▶', '').trim();
                board.innerHTML = '';

                const matched = taskData.find(t => t.taskTitle === title);
                if (matched && Array.isArray(matched.excuses)) {
                    globalOpinionCount += matched.excuses.length;
                    matched.excuses.forEach(excuse => {
                        if (excuse.text) {
                            const div = document.createElement('div');
                            div.className = 'excuse-item';
                            div.innerHTML = `<span class="excuse-author">${excuse.author || '익명'}</span> : <span>${excuse.text}</span>`;
                            board.appendChild(div);
                        }
                    });
                    board.scrollTop = board.scrollHeight;
                }
            });
        }

        const progRes = await fetch(`${API_BASE}/api/progress?team=${currentTeam}`);
        if (progRes.ok) {
            const progData = await progRes.json();
            const count = progData?.data?.totalCount ?? globalOpinionCount;
            updateProgressUI(count, false);
        } else {
            updateProgressUI(globalOpinionCount, false);
        }
    } catch (err) { console.error('초기 데이터 로드 실패:', err); }
}

async function loadSavedLinks() {
    try {
        const res = await fetch(`${API_BASE}/api/links?team=${currentTeam}`);
        if (!res.ok) return;
        const linkData = await res.json();
        const links = Array.isArray(linkData) ? linkData : (linkData.data || []);
        links.forEach(link => {
            document.querySelectorAll('.link-card').forEach(card => {
                const cardName = card.querySelector('.tool-name')?.innerText.trim();
                if (cardName === link.toolName) {
                    card.querySelector('.link-action').innerHTML =
                        `<a href="${link.url}" target="_blank" style="color:#007bff;text-decoration:underline;">바로가기</a>`;
                }
            });
        });
    } catch (err) { console.error('링크 로드 실패:', err); }
}

document.addEventListener('DOMContentLoaded', () => {
    const pageTitle = document.querySelector('.page-header h1');
    if (pageTitle) pageTitle.innerText = `${currentTeam}조 페이지 입니다`;

    const teamNameSpan = document.querySelector('.progress-inner .team-name');
    if (teamNameSpan) teamNameSpan.innerText = `${currentTeam}조`;

    loadInitialData();
    loadSavedLinks();

    document.querySelectorAll('.btn-submit').forEach(button => {
        button.addEventListener('click', async (e) => {
            const taskBody  = e.target.closest('.task-body');
            const taskItem  = e.target.closest('.task-item');
            if (!taskBody || !taskItem) return;

            const titleEl     = taskItem.querySelector('.task-title');
            const authorInput = taskBody.querySelector('.input-author');
            const textarea    = taskBody.querySelector('textarea');
            const board       = taskBody.querySelector('.excuse-board');

            const taskTitle = titleEl.innerText.replace('▶', '').trim();
            const author    = authorInput?.value.trim() || '익명';
            const content   = textarea?.value.trim();

            if (!content) return alert('내용을 입력해주세요!');

            try {
                const response = await fetch(`${API_BASE}/api/tasks`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ taskTitle, author, content, team: currentTeam })
                });

                if (response.ok) {
                    const div = document.createElement('div');
                    div.className = 'excuse-item';
                    div.innerHTML = `<span class="excuse-author">${author}</span> : <span>${content}</span>`;
                    board.appendChild(div);
                    board.scrollTop = board.scrollHeight;

                    globalOpinionCount++;
                    updateProgressUI(globalOpinionCount, true);
                    textarea.value = '';
                    if (authorInput) authorInput.value = '';
                } else {
                    const err = await response.json();
                    alert(`저장 실패: ${err.message}`);
                }
            } catch (error) {
                console.error('저장 오류:', error);
                alert('서버와 연결할 수 없습니다.');
            }
        });
    });
});
