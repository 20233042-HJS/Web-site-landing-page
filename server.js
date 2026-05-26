const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');

const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());

// HTML/CSS/JS 정적 파일 서빙 (Render 배포용)
app.use(express.static(path.join(__dirname)));


// ──────────────────────────────────────────
//  DB 연결 (교수용 / 학생용 분리)
// ──────────────────────────────────────────
const professorDB = mongoose.createConnection(process.env.PROFESSOR_DB_URI || 'mongodb://127.0.0.1:27017/professor_db');
const studentDB   = mongoose.createConnection(process.env.STUDENT_DB_URI  || 'mongodb://127.0.0.1:27017/student_db');

professorDB.on('connected', () => console.log('✅ 교수용 DB(professor_db) 연결 성공!'));
professorDB.on('error',     (err) => console.log('❌ 교수용 DB 연결 실패:', err));
professorDB.on('disconnected', () => console.log('⚠️ 교수용 DB 연결 끊김'));

studentDB.on('connected', () => console.log('✅ 학생용 DB(student_db) 연결 성공!'));
studentDB.on('error',     (err) => console.log('❌ 학생용 DB 연결 실패:', err));
studentDB.on('disconnected', () => console.log('⚠️ 학생용 DB 연결 끊김'));

// DB 연결 실패해도 서버가 죽지 않도록 처리
process.on('unhandledRejection', (err) => {
    console.log('⚠️ unhandledRejection:', err.message);
});


// ──────────────────────────────────────────
//  User 스키마 & 모델 (각 DB에 등록)
// ──────────────────────────────────────────
const userSchema = new mongoose.Schema({
    username:  { type: String, required: true },
    email:     { type: String, required: true, unique: true },
    password:  { type: String, required: true },
    role:      { type: String, enum: ['professor', 'student'], required: true },
    createdAt: { type: Date, default: Date.now }
});

const ProfessorUser = professorDB.model('User', userSchema);
const StudentUser   = studentDB.model('User', userSchema);


// ──────────────────────────────────────────
//  회원가입 API
// ──────────────────────────────────────────

// 교수 회원가입
app.post('/signup/professor', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        const isExist = await ProfessorUser.findOne({ email });
        if (isExist) {
            return res.status(400).json({ message: '이미 사용 중인 이메일입니다.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new ProfessorUser({ username, email, password: hashedPassword, role: 'professor' });
        await newUser.save();

        res.status(201).json({ message: '교수 회원가입이 완료되었습니다!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: '회원가입 처리 중 서버 에러 발생' });
    }
});

// 학생 회원가입
app.post('/signup/student', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        const isExist = await StudentUser.findOne({ email });
        if (isExist) {
            return res.status(400).json({ message: '이미 사용 중인 이메일입니다.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new StudentUser({ username, email, password: hashedPassword, role: 'student' });
        await newUser.save();

        res.status(201).json({ message: '학생 회원가입이 완료되었습니다!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: '회원가입 처리 중 서버 에러 발생' });
    }
});


// ──────────────────────────────────────────
//  로그인 API
// ──────────────────────────────────────────

// 교수 로그인
app.post('/login/professor', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await ProfessorUser.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: '존재하지 않는 이메일입니다.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: '비밀번호가 일치하지 않습니다.' });
        }

        res.status(200).json({ message: '로그인 성공!', role: 'professor', username: user.username });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: '로그인 처리 중 서버 에러 발생' });
    }
});

// 학생 로그인
app.post('/login/student', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await StudentUser.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: '존재하지 않는 이메일입니다.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: '비밀번호가 일치하지 않습니다.' });
        }

        res.status(200).json({ message: '로그인 성공!', role: 'student', username: user.username });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: '로그인 처리 중 서버 에러 발생' });
    }
});


// ──────────────────────────────────────────
//  Q&A 게시판 API (기존 유지, student_db 사용)
// ──────────────────────────────────────────
const questionSchema = new mongoose.Schema({
    title:     { type: String, required: true },
    content:   { type: String, required: true },
    likes:     { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

const Question = studentDB.model('Question', questionSchema);

app.post('/api/questions', async (req, res) => {
    try {
        const { title, content } = req.body;
        const newQuestion = new Question({ title, content });
        await newQuestion.save();
        res.status(201).json({ message: '질문이 등록되었습니다.', question: newQuestion });
    } catch (error) {
        res.status(500).json({ message: '질문 등록 중 에러 발생' });
    }
});

app.get('/api/questions', async (req, res) => {
    try {
        const questions = await Question.find().sort({ createdAt: -1 });
        res.status(200).json(questions);
    } catch (error) {
        res.status(500).json({ message: '질문 목록을 불러오는 중 에러 발생' });
    }
});

app.put('/api/questions/:id/like', async (req, res) => {
    try {
        const questionId = req.params.id;
        const updatedQuestion = await Question.findByIdAndUpdate(
            questionId,
            { $inc: { likes: 1 } },
            { new: true }
        );
        res.status(200).json(updatedQuestion);
    } catch (error) {
        res.status(500).json({ message: '좋아요 처리 중 에러 발생' });
    }
});


// ──────────────────────────────────────────
//  팀 태스크 API (team.js 연동)
// ──────────────────────────────────────────
const excuseSchema = new mongoose.Schema({
    author:    { type: String, default: '익명' },
    text:      { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const taskSchema = new mongoose.Schema({
    teamNumber: { type: String, required: true },   // 몇 조인지 구분
    taskTitle:  { type: String, required: true },
    excuses:    [excuseSchema]
});

// taskTitle + teamNumber 조합이 같은 건 하나만 존재
taskSchema.index({ teamNumber: 1, taskTitle: 1 }, { unique: true });

const Task = studentDB.model('Task', taskSchema);

// 태스크 목록 불러오기
app.get('/api/tasks', async (req, res) => {
    try {
        const teamNumber = req.query.team || '1';
        const tasks = await Task.find({ teamNumber });
        res.status(200).json(tasks);
    } catch (error) {
        res.status(500).json({ message: '태스크 목록 로드 실패' });
    }
});

// 변명(코멘트) 저장
app.post('/api/tasks', async (req, res) => {
    try {
        const { taskTitle, author, content, team } = req.body;
        const teamNumber = team || '1';

        // 해당 조+태스크 문서가 있으면 excuses 배열에 추가, 없으면 새로 생성
        const updatedTask = await Task.findOneAndUpdate(
            { teamNumber, taskTitle },
            { $push: { excuses: { author: author || '익명', text: content } } },
            { upsert: true, new: true }
        );

        res.status(201).json({ message: '저장 완료', task: updatedTask });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: '태스크 저장 실패' });
    }
});


// ──────────────────────────────────────────
//  진행도 API (team.js 연동)
// ──────────────────────────────────────────
const progressSchema = new mongoose.Schema({
    teamNumber:  { type: String, required: true, unique: true },
    percent:     { type: Number, default: 0 },
    totalCount:  { type: Number, default: 0 },
    updatedAt:   { type: Date, default: Date.now }
});

const Progress = studentDB.model('Progress', progressSchema);

// 진행도 불러오기
app.get('/api/progress', async (req, res) => {
    try {
        const teamNumber = req.query.team || '1';
        const progress = await Progress.findOne({ teamNumber });
        res.status(200).json({ data: progress || { percent: 0, totalCount: 0 } });
    } catch (error) {
        res.status(500).json({ message: '진행도 로드 실패' });
    }
});

// 진행도 저장
app.post('/api/progress', async (req, res) => {
    try {
        const { percent, totalCount, team } = req.body;
        const teamNumber = team || '1';

        const updated = await Progress.findOneAndUpdate(
            { teamNumber },
            { percent, totalCount, updatedAt: new Date() },
            { upsert: true, new: true }
        );

        res.status(200).json({ message: '진행도 저장 완료', data: updated });
    } catch (error) {
        res.status(500).json({ message: '진행도 저장 실패' });
    }
});


// ──────────────────────────────────────────
//  링크 API (team.js 연동)
// ──────────────────────────────────────────
const linkSchema = new mongoose.Schema({
    teamNumber: { type: String, required: true },
    toolName:   { type: String, required: true },  // 'github' | 'figma' | 'notion'
    url:        { type: String, required: true },
    updatedAt:  { type: Date, default: Date.now }
});

linkSchema.index({ teamNumber: 1, toolName: 1 }, { unique: true });

const Link = studentDB.model('Link', linkSchema);

// 링크 불러오기
app.get('/api/links', async (req, res) => {
    try {
        const teamNumber = req.query.team || '1';
        const links = await Link.find({ teamNumber });
        res.status(200).json(links);
    } catch (error) {
        res.status(500).json({ message: '링크 로드 실패' });
    }
});

// 링크 저장/수정
app.post('/api/links', async (req, res) => {
    try {
        const { toolName, url, team } = req.body;
        const teamNumber = team || '1';

        const updated = await Link.findOneAndUpdate(
            { teamNumber, toolName },
            { url, updatedAt: new Date() },
            { upsert: true, new: true }
        );

        res.status(200).json({ message: '링크 저장 완료', data: updated });
    } catch (error) {
        res.status(500).json({ message: '링크 저장 실패' });
    }
});


// Q&A 삭제 (교수용)
app.delete('/api/questions/:id', async (req, res) => {
    try {
        await Question.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: '질문이 삭제되었습니다.' });
    } catch (error) {
        res.status(500).json({ message: '삭제 실패' });
    }
});

// 팀 변명(excuse) 삭제 (교수용)
app.delete('/api/tasks/:taskId/excuses/:excuseId', async (req, res) => {
    try {
        const { taskId, excuseId } = req.params;
        await Task.findByIdAndUpdate(
            taskId,
            { $pull: { excuses: { _id: excuseId } } }
        );
        res.status(200).json({ message: '삭제되었습니다.' });
    } catch (error) {
        res.status(500).json({ message: '삭제 실패' });
    }
});

// 모든 팀 진행도 한번에 불러오기 (홈 대시보드용)
app.get('/api/progress/all', async (req, res) => {
    try {
        const allProgress = await Progress.find();
        // { '1': 2, '2': 8, '3': 8, '4': 8 } 형태로 반환
        const result = {};
        allProgress.forEach(p => {
            result[p.teamNumber] = p.percent;
        });
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: '전체 진행도 로드 실패' });
    }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
});
