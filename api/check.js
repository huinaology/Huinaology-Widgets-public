// api/check.js
// 일괄 연결 테스트 (읽기 전용): 환경변수·노션 DB 가 위젯에서 쓸 수 있게 연결됐는지 한 번에 점검한다.
//  - 노션에 아무것도 만들거나 고치거나 지우지 않는다.
//  - 결과에는 변수 이름과 성공/실패만 싣는다. 토큰·DB ID·시크릿 값은 절대 싣지 않는다.
//  - 위젯별 구역은 lib/check/ 아래 파일로 나뉘어 있다 (calendar / pomodoro, 공통 도우미 notion).
//  - 보는 것: 값이 입력됐는지 · ID 형식 · 토큰이 받아들여지는지 · DB가 열리는지.
//    노션 속성의 이름·종류는 보지 않는다(별도 "속성명 점검" 애드온의 몫).
//  - 소요 시간: 노션 호출은 한 줄로 0.35초 간격(초당 약 3건)이라 DB 최대 5개 → 보통 2~3초.
//    Vercel 제한(vercel.json 의 30초) 안에서 끝나도록 18초가 지나면 남은 노션 점검을 건너뛴다.
const { checkKey } = require('../lib/common');
const { createNotionProbe, readEnvId } = require('../lib/check/notion');
const checkCalendar = require('../lib/check/calendar');
const checkPomodoro = require('../lib/check/pomodoro');

const DEADLINE_MS = 18000;
const DB_ENVS = ['PERSONAL_MASTER_DB_ID', 'MEDIA_MASTER_DB_ID', 'FINANCE_MASTER_DB_ID', 'DAILY_DB_ID', 'POMODORO_DB_ID'];

// 공통: 접근 비밀번호·노션 토큰 (값은 보여 주지 않고 있음/없음·형식만)
function checkCommon(probe) {
    const items = [{ key: 'WIDGET_SECRET', label: '접근 비밀번호', status: 'ok', message: '입력됨' }]; // 이 요청이 통과했으므로 값이 맞다
    const usesNotion = DB_ENVS.some(n => readEnvId(n).state !== 'empty');
    const base = { key: 'NOTION_TOKEN', label: '노션 토큰' };
    const token = process.env.NOTION_TOKEN;
    if (!token) {
        items.push(usesNotion
            ? { ...base, status: 'fail', message: '노션 토큰이 비어 있습니다. 노션 DB를 쓰려면 입력해 주세요.' }
            : { ...base, status: 'skip', message: '미사용' });
    } else if (probe.tokenBad) {
        items.push({ ...base, status: 'fail', message: '노션이 토큰을 거절했습니다. 값이 잘못되었거나 다른 연결의 토큰일 수 있습니다.' });
    } else if (!/^(ntn_|secret_)/.test(token)) {
        items.push({ ...base, status: 'warn', message: '노션 토큰 모양이 아닙니다. 노션 연결(통합)의 내부 통합 시크릿을 복사했는지 확인해 주세요.' });
    } else {
        items.push({ ...base, status: 'ok', message: '입력됨' });
    }
    return { id: 'common', title: '공통', items };
}

module.exports = async (req, res) => {
    if (req.method !== 'GET') return res.status(405).json({ error: '허용되지 않는 요청입니다.' });
    if (!checkKey(req, res, { needNotion: false })) return;
    res.setHeader('Cache-Control', 'no-store');

    const startedAt = Date.now();
    try {
        const probe = createNotionProbe(startedAt + DEADLINE_MS);
        const ctx = { notion: probe };

        // 캘린더 → 뽀모도로 순서로 점검 (같은 DB 는 한 번만 읽음)
        const cal = await checkCalendar(ctx);
        const pomo = await checkPomodoro(ctx);

        const groups = [checkCommon(probe), cal, pomo].map(g => ({
            ...g,
            status: g.items.every(i => i.status === 'skip') ? 'skip'
                : g.items.some(i => i.status === 'fail') ? 'fail'
                : g.items.some(i => i.status === 'warn') ? 'warn' : 'ok'
        }));

        const summary = { ok: 0, warn: 0, fail: 0, skip: 0 };
        groups.forEach(g => g.items.forEach(i => { summary[i.status]++; }));

        return res.status(200).json({
            success: summary.fail === 0,
            checked: summary.ok + summary.warn + summary.fail,
            summary, groups, elapsedMs: Date.now() - startedAt
        });
    } catch (e) {
        console.error('[check] 실행 오류', e && e.name, String((e && e.message) || e).slice(0, 160));
        return res.status(500).json({ error: '연결 테스트를 실행하지 못했습니다. 잠시 뒤 다시 시도해 주세요.' });
    }
};
