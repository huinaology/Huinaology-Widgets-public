// lib/common.js
// API 공통: 접근 키 확인 + Notion 클라이언트 + 속성 읽기 도우미
const { Client } = require('@notionhq/client');
const Config = require('./config');

// 위젯 접근 비밀번호 확인. 실패 시 응답을 보내고 false 반환.
// opts.needNotion=false: 노션 토큰이 없어도 통과(연결 테스트가 "토큰 없음"을 직접 알려줘야 하므로)
function checkKey(req, res, opts = {}) {
    const clientKey = req.headers['x-widget-key'] || req.query.key;
    if (!Config.ENV.WIDGET_SECRET || clientKey !== Config.ENV.WIDGET_SECRET) {
        res.status(401).json({ error: "접근 권한이 없습니다. (임베드 주소의 ?key= 값을 확인해주세요)" });
        return false;
    }
    if (opts.needNotion !== false && !Config.ENV.NOTION_TOKEN) {
        res.status(500).json({ error: "NOTION_TOKEN 환경변수가 설정되지 않았습니다." });
        return false;
    }
    return true;
}

function getNotion() {
    return new Client({ auth: Config.ENV.NOTION_TOKEN, timeoutMs: 60000 });
}

// Notion API 는 초당 약 3회 요청 제한이 있어, 여러 DB를 한꺼번에 읽으면 일부 요청이 거절(429)될 수 있다.
// 요청 제한·일시 오류일 때만 잠시 기다렸다가 최대 4번까지 다시 시도한다.
const RETRYABLE = new Set(['rate_limited', 'service_unavailable', 'internal_server_error', 'conflict_error', 'notionhq_client_request_timeout']);
async function withRetry(fn, tries = 4) {
    for (let i = 0; ; i++) {
        try {
            return await fn();
        } catch (e) {
            const retryable = RETRYABLE.has(e.code) || e.status === 429 || e.status >= 500;
            if (!retryable || i >= tries - 1) throw e;
            const after = Number(e.headers?.get?.('retry-after')) || 0;
            await new Promise(r => setTimeout(r, after ? after * 1000 : 400 * Math.pow(2, i)));
        }
    }
}

// ── 화면으로 보내는 오류 문구 (원본은 여기 하나) ──────────────────────────
// 노션이 돌려준 원문(message)은 화면·응답에 싣지 않는다(DB ID·토큰 노출 방지). 종류별 고정 문구만 보낸다.
// ⚠️ 같은 표를 쓰는 곳: Huinaology-Mini-Calendar-public · Huinaology-Pomodoro-public · Auto-Backup. 고치면 함께 확인.
const NOTION_ERROR_TEXT = {
    unauthorized: "노션 토큰이 올바르지 않습니다. Vercel의 NOTION_TOKEN을 확인해 주세요.",
    object_not_found: "DB를 찾을 수 없습니다. DB ID와 노션 연결(Connections)을 확인해 주세요.",
    rate_limited: "노션 요청이 많아 잠시 제한됐습니다. 잠시 후 다시 시도해 주세요.",
    validation_error: "노션 속성 이름이나 형식이 템플릿과 다릅니다. 노션 템플릿의 속성 이름·종류를 확인해 주세요.",
    other: "요청을 처리하지 못했습니다. 잠시 후 다시 시도하고, 계속되면 Vercel 로그를 확인해 주세요."
};
function notionErrorText(e) {
    const code = e && e.code, status = e && e.status;
    if (code === 'unauthorized' || status === 401) return NOTION_ERROR_TEXT.unauthorized;
    if (code === 'object_not_found' || status === 404) return NOTION_ERROR_TEXT.object_not_found;
    if (code === 'rate_limited' || status === 429) return NOTION_ERROR_TEXT.rate_limited;
    if (code === 'validation_error' || status === 400) return NOTION_ERROR_TEXT.validation_error;
    return NOTION_ERROR_TEXT.other;
}

// 로그에는 상세를 남기되 토큰·ID는 가리고 길이를 제한한다.
function logError(tag, e) {
    const msg = String((e && e.message) || e || '')
        .replace(/\b(ntn_|secret_)[A-Za-z0-9_]+/g, '[token]')
        .replace(/[0-9a-fA-F]{8}-?[0-9a-fA-F]{4}-?[0-9a-fA-F]{4}-?[0-9a-fA-F]{4}-?[0-9a-fA-F]{12}/g, '[id]')
        .slice(0, 200);
    console.error(tag, e && e.code ? `[${e.code}]` : '', e && e.status ? `(${e.status})` : '', msg);
}

// Formula / rich_text / rollup 어디에 있든 문자열 값을 뽑아낸다
function readPropText(prop) {
    if (!prop) return "";
    const f = prop.formula;
    if (f) {
        if (typeof f.string === 'string') return f.string;
        if (typeof f.number === 'number') return String(f.number);
        if (typeof f.boolean === 'boolean') return String(f.boolean);
        if (f.date && f.date.start) return f.date.start;
    }
    if (Array.isArray(prop.rich_text)) return prop.rich_text.map(t => t.plain_text).join('');
    if (Array.isArray(prop.title)) return prop.title.map(t => t.plain_text).join('');
    if (prop.select) return prop.select.name || "";
    if (prop.rollup && Array.isArray(prop.rollup.array)) {
        return prop.rollup.array.map(x => readPropText(x)).join('');
    }
    if (typeof prop.number === 'number') return String(prop.number);
    return "";
}

// Date / Formula / Rollup 어디에 있든 날짜 객체({start, end})를 찾아낸다
function extractDateFromProp(prop) {
    if (!prop) return null;
    if (prop.date) return prop.date;
    if (prop.formula?.date) return prop.formula.date;
    if (prop.rollup?.array?.[0]?.date) return prop.rollup.array[0].date;
    if (prop.rollup?.array?.[0]?.formula?.date) return prop.rollup.array[0].formula.date;
    return null;
}

function pageTitle(props) {
    let titleProp = props[Config.SCHEMA.TITLE];
    if (!titleProp || titleProp.type !== 'title') titleProp = Object.values(props).find(p => p && p.type === 'title');
    return (titleProp?.title || []).map(t => t.plain_text).join('') || "제목 없음";
}

module.exports = { checkKey, getNotion, withRetry, notionErrorText, logError, readPropText, extractDateFromProp, pageTitle };
