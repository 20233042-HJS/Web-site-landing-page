// API 베이스 URL - 로컬이면 localhost:3000, 배포 환경이면 같은 origin 사용
const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000'
    : '';  // Render 배포 시 같은 서버에서 서빙되므로 빈 문자열
