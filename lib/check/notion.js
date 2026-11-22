// lib/check/notion.js
// 연결 테스트(api/check.js) 공통 도우미. 읽기 전용 — 노션에 아무것도 만들거나 고치거나 지우지 않는다.
//  - 속성 이름·종류는 다루지 않는다(별도 "속성명 점검" 애드온의 몫).
//  - 값(토큰·DB ID)은 결과에 절대 싣지 않는다. 변수 이름과 성공/실패만 돌려준다.
//  - 노션 호출은 한 줄로 세워 0.35초 간격으로 보낸다(노션 제한: 초당 약 3건).
const { Client } = require('@notionhq/client');
const { withRetry, logError } = require('../common');

const PACE_MS = 350;          // 호출 사이 최소 간격
const CALL_TIMEOUT_MS = 5000; // 한 번의 노션 호출 제한 시간

const DB_ID_RE = /^([0-9a-f]{32}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;
const normId = id => String(id || '').replace(/-/g, '').toLowerCase();
const sleep = ms => new Promise(r => setTimeout(r, ms));

// 환경변수의 DB ID 상태: empty(비어 있음=미사용) / invalid(형식이 틀림) / ok
function readEnvId(name) {
    const raw = process.env[name];
    if (raw === undefined || raw === null || raw === '') return { state: 'empty' };
    if (!DB_ID_RE.test(raw)) return { state: 'invalid' };
    return { state: 'ok', id: raw };
}

// 노션 오류 → { kind, msg } (원인별 쉬운 문구). 자세한 내용은 서버 로그에만 남긴다.
function classifyNotionError(e) {
    const code = e && e.code, status = e && e.status;
    logError('[check] notion', e);   // 토큰·ID는 가려서 기록
    if (code === 'unauthorized' || status === 401) return { kind: 'token', msg: '노션 토큰(NOTION_TOKEN)이 잘못되었습니다.' };
    if (code === 'object_not_found' || status === 404) return { kind: 'notfound', msg: 'DB ID가 틀렸거나 노션 연결(Connections)이 빠졌습니다.' };
    if (code === 'restricted_resource' || status === 403) return { kind: 'forbidden', msg: '이 노션 연결에 해당 DB를 읽을 권한이 없습니다. 연결(Connections)을 확인해 주세요.' };
    if (code === 'validation_error' || status === 400) return { kind: 'format', msg: 'DB가 아닌 페이지 ID이거나 ID 형식이 올바르지 않습니다.' };
    if (code === 'rate_limited' || status === 429) return { kind: 'rate', msg: '노션 요청이 몰렸습니다. 잠시 뒤 다시 실행해 주세요.' };
    if (code === 'notionhq_client_request_timeout') return { kind: 'timeout', msg: '노션 응답이 늦습니다. 잠시 뒤 다시 실행해 주세요.' };
    return { kind: 'other', msg: '노션에 접속하지 못했습니다. 잠시 뒤 다시 실행해 주세요.' };
}

// 한 번 실행 동안 쓰는 노션 연결. deadlineAt(ms) 이후에는 새 호출을 하지 않는다.
function createNotionProbe(deadlineAt) {
    const token = process.env.NOTION_TOKEN;
    const client = token ? new Client({ auth: token, timeoutMs: CALL_TIMEOUT_MS, notionVersion: '2022-06-28' }) : null;
    const cache = new Map();   // 정규화 ID → 결과 (같은 DB는 한 번만 읽음)
    let nextAt = 0;
    const probe = { hasToken: !!token, tokenBad: false, calls: 0 };

    probe.retrieveDb = (id) => {
        const key = normId(id);
        if (cache.has(key)) return cache.get(key);
        const p = (async () => {
            if (!client) return { ok: false, kind: 'notoken', msg: '노션 토큰(NOTION_TOKEN)이 없어 점검하지 못했습니다.' };
            if (probe.tokenBad) return { ok: false, kind: 'skipped', msg: '노션 토큰 오류로 점검하지 못했습니다.' };
            if (Date.now() > deadlineAt) return { ok: false, kind: 'deadline', msg: '시간이 부족해 점검하지 못했습니다. 다시 실행해 주세요.' };
            const now = Date.now(), at = Math.max(now, nextAt);
            nextAt = at + PACE_MS;
            if (at > now) await sleep(at - now);
            try {
                probe.calls++;
                const db = await withRetry(() => client.databases.retrieve({ database_id: id }), 2);
                return { ok: true, db };
            } catch (e) {
                const r = classifyNotionError(e);
                if (r.kind === 'token') probe.tokenBad = true;
                return { ok: false, ...r };
            }
        })();
        cache.set(key, p);
        return p;
    };
    return probe;
}

module.exports = { createNotionProbe, readEnvId, classifyNotionError, normId };
