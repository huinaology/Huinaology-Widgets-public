// lib/check/pomodoro.js
// [뽀모도로 위젯] 연결 테스트 구역. 읽기 전용 — 값이 입력됐는지, ID 형식이 맞는지, DB가 열리는지만 본다.
// 속성 이름·종류는 보지 않는다(그건 별도 "속성명 점검" 애드온의 몫).
const { readEnvId } = require('./notion');

const DBS = [
    { env: 'POMODORO_DB_ID', label: 'Pomodoro', emptyMsg: '미사용 (타이머만 사용)' },
    { env: 'DAILY_DB_ID', label: 'Daily (선택)', emptyMsg: '미사용' }
];

module.exports = async function checkPomodoro(ctx) {
    const items = [];
    for (const d of DBS) {
        const base = { key: d.env, label: d.label };
        const env = readEnvId(d.env);
        if (env.state === 'empty') { items.push({ ...base, status: 'skip', message: d.emptyMsg }); continue; }
        if (env.state === 'invalid') { items.push({ ...base, status: 'fail', message: 'ID 형식이 올바르지 않습니다. DB 주소의 32자리만 넣었는지, 앞뒤 공백·따옴표가 없는지 확인해 주세요.' }); continue; }

        const r = await ctx.notion.retrieveDb(env.id);   // 캘린더 구역에서 이미 읽은 DB는 캐시를 쓴다
        items.push(r.ok ? { ...base, status: 'ok', message: '연결됨' } : { ...base, status: 'fail', message: r.msg });
    }
    return { id: 'pomodoro', title: '뽀모도로', items };
};
