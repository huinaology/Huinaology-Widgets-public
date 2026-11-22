# 🧩 Huinaology Widgets

Huinaology 노션 템플릿용 **위젯 모음**입니다. 한 번만 설치하면 아래 위젯 2개를 모두 쓸 수 있습니다.

| 위젯 | 주소 | 하는 일 | 필요한 연결 |
|---|---|---|---|
| 📅 캘린더 | `/` | Personal / Media / Finance Master DB와 Daily의 일정을 달력으로 보고, 간단한 일정 추가와 Daily 메모 입력 | Notion |
| 🍅 뽀모도로 | `/pomodoro.html` | 집중·휴식 타이머. Notion Pomodoro DB에 작업 시간이 자동 기록됨 (타이머만 쓰면 연결 불필요) | Notion (선택) |

쓰지 않는 위젯의 연결 값은 비워두셔도 됩니다. 그 위젯만 사용할 수 없을 뿐, 나머지는 정상 동작합니다. 설치가 끝나면 위젯 설정의 **일괄 연결 테스트**로 입력한 값이 모두 잘 연결됐는지 한 번에 확인할 수 있습니다.

프로그래밍 지식이 전혀 없어도, 아래 순서를 그대로 따라오시면 설치할 수 있습니다.

## 🚀 준비물
1. Github 계정 (https://github.com/) — 없으면 이메일로 무료 가입
2. Vercel 계정 (https://vercel.com/) — **Github 계정으로 바로 가입 가능**
3. 노션 개발자 센터에서 노션 API 발급 (캘린더·뽀모도로용)

## 🛠️ 설치 가이드 (No-Code)

### STEP 1. 노션 API 토큰 만들기 (캘린더·뽀모도로)
1. https://app.notion.com/developers/connections 접속 → **[새 API 통합]**
2. 이름(예: `Huinaology Widgets`)을 입력하고 템플릿이 있는 워크스페이스를 선택 → 저장
3. 표시되는 **내부 통합 시크릿**(`ntn_`으로 시작)을 복사해둡니다. 이게 `NOTION_TOKEN`입니다.

### STEP 2. 템플릿에 API 연결하고 DB ID 복사하기
1. Huinaology 템플릿의 **최상위 페이지** 우측 상단 **[···] → [연결] → STEP 1에서 만든 통합** 선택

    > ⚠️ DB를 하나씩 연결하면 안 됩니다. 캘린더는 일정에 연결된 **라벨 DB와 진행 상태 DB**도 함께 읽어서 탭 구분, 아이콘 색, 진행 상태를 표시합니다. 최상위 페이지에 연결하면 그 아래 DB가 모두 함께 연결됩니다.
    > DB를 하나씩 연결하셨다면 라벨 DB, 진행 상태 DB, Pomodoro DB, Action DB에도 같은 통합을 연결해주세요.

2. 아래 DB의 ID를 복사해둡니다. DB를 전체 페이지로 열었을 때 주소의 `notion.so/` 뒤, `?v=` 앞의 32자리가 DB ID입니다.

    | DB | 환경 변수 | 쓰는 위젯 |
    |---|---|---|
    | Personal Master DB | `PERSONAL_MASTER_DB_ID` | 캘린더 |
    | Media Master DB | `MEDIA_MASTER_DB_ID` | 캘린더 |
    | Finance Master DB | `FINANCE_MASTER_DB_ID` | 캘린더 |
    | Daily Archive | `DAILY_DB_ID` | 캘린더, 뽀모도로 (오늘 Daily 페이지 자동 연결) |
    | Pomodoro DB | `POMODORO_DB_ID` | 뽀모도로 |

    > 사용하지 않는 DB는 비워두셔도 됩니다. (캘린더는 해당 탭만 비어 있게 표시됩니다)

### STEP 3. Vercel로 1초 배포하기
아래 버튼을 누르면 Vercel이 자동으로 **① 이 저장소를 여러분의 Github 계정으로 복사하고 → ② 필요한 값을 입력하는 화면을 띄운 뒤 → ③ 자동으로 배포**까지 해줍니다.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/huinaology/Huinaology-Widgets-public&env=WIDGET_SECRET,NOTION_TOKEN,PERSONAL_MASTER_DB_ID,MEDIA_MASTER_DB_ID,FINANCE_MASTER_DB_ID,DAILY_DB_ID,POMODORO_DB_ID)

1. **Github 로그인/연결** → 저장소 이름을 정하고 다음으로 넘어갑니다.
2. **환경 변수 입력 화면**에서 아래 값을 입력합니다. 쓰지 않는 위젯의 값은 비워두세요.

    | 환경 변수 | 설명 |
    |---|---|
    | `WIDGET_SECRET` | **필수.** 위젯 접근 비밀번호. 아무 문자열이나 직접 정해서 입력 (예: `mywidget123`). 2개 위젯이 함께 씁니다 |
    | `NOTION_TOKEN` | STEP 1의 내부 통합 시크릿 (캘린더·뽀모도로) |
    | `PERSONAL_MASTER_DB_ID` | STEP 2의 Personal Master DB ID (캘린더) |
    | `MEDIA_MASTER_DB_ID` | STEP 2의 Media Master DB ID (캘린더) |
    | `FINANCE_MASTER_DB_ID` | STEP 2의 Finance Master DB ID (캘린더) |
    | `DAILY_DB_ID` | STEP 2의 Daily Archive DB ID (캘린더, 뽀모도로) |
    | `POMODORO_DB_ID` | STEP 2의 Pomodoro DB ID (뽀모도로) |

3. **Deploy** 버튼을 누르면 1분 이내로 배포가 끝나고, 발급된 주소(`https://내프로젝트이름.vercel.app`)가 나옵니다.

### STEP 4. 연결 확인하기 (일괄 연결 테스트)
입력한 값이 맞는지 노션에 붙이기 전에 한 번에 확인합니다. 읽기만 하므로 노션의 내용은 바뀌지 않습니다.

1. 발급된 주소 뒤에 `?key=STEP 3에서 정한 WIDGET_SECRET값` 을 붙여 브라우저로 엽니다. (캘린더 위젯 화면)
2. 위젯 상단의 톱니 아이콘(설정) → **연결 테스트** → **[일괄 연결 테스트 실행]** 을 누릅니다. (몇 초 걸립니다)
3. 쓰는 항목이 모두 초록색이면 완료입니다. 빨간색이나 주황색 항목은 아래에 원인이 표시됩니다. 고친 뒤에는 Vercel에서 **[Redeploy]** 하고 다시 실행해 주세요. (비워 둔 항목은 "미사용"으로 건너뜁니다)

> 값을 비워 둔 것과 틀린 값을 넣은 것은 다르게 표시됩니다. 쓰는 위젯의 값이 "미사용"으로 나오면 입력이 빠진 것입니다.

### STEP 5. 노션에 임베드하기
발급받은 주소 뒤에 위젯 이름과 `?key=STEP 3에서 정한 WIDGET_SECRET값` 을 붙여서 노션 페이지에 **임베드(Embed) 블록**으로 붙여넣으면 끝입니다.

```
캘린더   https://내프로젝트이름.vercel.app/?key=mywidget123
뽀모도로 https://내프로젝트이름.vercel.app/pomodoro.html?key=mywidget123
```

> ⚠️ 임베드 화면에 **"vercel.com이(가) 차단되었습니다"** 가 뜬다면, Vercel 프로젝트의 **Settings → Deployment Protection**에서 **Vercel Authentication**을 끄고 저장해주세요. 주소도 Domains에 표시된 `프로젝트이름.vercel.app` 형태를 사용해야 합니다.

## 🎛️ 위젯별 주소 옵션

### 📅 캘린더
위젯 상단의 톱니 아이콘(설정)에서 바꾸거나, 주소에 아래 값을 덧붙여 고정할 수 있습니다.

```
https://내프로젝트이름.vercel.app/?key=mywidget123&view=horizontal&color=lavender
```

| 값 | 선택지 |
|---|---|
| `view` | `popup` (기본, 달력만) / `horizontal` (가로) / `vertical` (세로) |
| `filter` | 처음 열릴 탭: `all`(전체) / `Daily`(데일리) / `General`(일반일정) / `Work`(커리어) / `Media`(문화생활) / `Finance`(가계부) / `Local`(내 캘린더) |
| `border` | `plain` (기본) / `stamp` (우표) / `none` (테두리 없음) |
| `color` | `tab` (기본, 탭별 색상) / `lavender` / `rose` / `peach` / `lemon` / `mint` / `aqua` / `powder` / `sage` / `creme` / `slate` |
| `label` | `Work` (기본) / `School` |

### 🍅 뽀모도로
> 💡 **Notion 연동 없이 타이머만** 쓰실 거라면 `?key=` 대신 주소 끝에 `?timer=1`을 붙여주세요. 안내 문구 없이 타이머만 깔끔하게 보입니다. (예: `https://내프로젝트이름.vercel.app/pomodoro.html?timer=1`)

## 🛠️ 업데이트 방법
캘린더 위젯 설정(톱니 아이콘)에서 새로운 버전 알림이 뜰 경우, 아래 순서대로 업데이트하실 수 있습니다.

1. 이 저장소에서 변경된 파일을 열어 전체 코드를 복사합니다.
2. STEP 3에서 만들어진 내 Github 저장소로 이동해 동일한 파일을 열고, 우측 상단 연필 아이콘(Edit this file)으로 기존 코드를 지운 뒤 새 코드를 붙여넣습니다.
3. 페이지 하단 **[Commit changes...]** 로 저장합니다.
4. [Vercel 대시보드](https://vercel.com/dashboard)에서 해당 프로젝트의 **[Deployments] → [...] → [Redeploy]** 를 누르면 끝입니다.

## ❓문제가 생겼을 때

**공통**
- **"인증 오류" / "⛔ 접근 권한이 없습니다"**: 임베드 주소의 `?key=` 값이 `WIDGET_SECRET`과 같은지 확인해주세요.
- 환경 변수를 고친 뒤에는 Vercel에서 **[Redeploy]** 를 해야 반영됩니다.
- **연결 테스트에서 빨간색 항목**: 항목 아래에 원인이 쉬운 말로 표시됩니다. "DB ID가 틀렸거나 노션 연결이 빠졌습니다"는 STEP 2의 ID와 **[연결]** 을, "토큰이 잘못되었습니다"는 STEP 1의 값을 다시 확인해주세요.
- **"노션 속성 이름이나 형식이 템플릿과 다릅니다" 문구**: 템플릿의 속성 이름·종류를 바꾸면 나옵니다. 어느 항목인지는 **구버전 사용자 가이드의 별첨 파일(속성명 점검)** 로 확인할 수 있습니다.
- **"연결 테스트를 실행하지 못했습니다" / 응답이 없음**: 잠시 뒤 다시 실행해주세요. 계속되면 Vercel의 **[Logs]** 에서 오류를 확인할 수 있습니다.
- **일정 추가·메모 저장·작업 시작 중 오류 문구**: 노션 원문 대신 "노션 토큰이 올바르지 않습니다", "DB를 찾을 수 없습니다" 같은 안내가 나옵니다. 문구대로 확인하고, 자세한 원인은 Vercel의 **[Logs]** 에서 볼 수 있습니다.

**📅 캘린더**
- **달력이 비어 있음**: STEP 2-1의 **[연결]** 을 했는지, DB ID가 올바른지 확인해주세요. 위젯 설정의 **연결 테스트**(STEP 4)에서 어느 DB가 문제인지 알 수 있습니다.
- **모든 일정이 일반일정으로만 보이고 진행 상태 아이콘이 없음**: 라벨 DB나 진행 상태 DB에 통합이 연결되지 않은 경우입니다. 최상위 페이지에 연결하거나, 두 DB에도 같은 통합을 연결해주세요. 연결 후 위젯을 새로고침하면 바로 반영되고, 따로 Redeploy 할 필요는 없습니다.

**🍅 뽀모도로**
- **"⚠️ Notion 연결 중 오류"**: 가장 먼저 **Pomodoro DB · Daily DB · Action DB 각각에 통합(Integration) 연결이 되어 있는지** 확인해주세요. (우측 상단 [...] → 연결(Connections)) 자세한 원인은 Vercel 프로젝트의 Logs에서 확인할 수 있습니다.
- **"🔌 Notion 연동이 설정되지 않아..." 안내만 계속 보임**: `NOTION_TOKEN`/`POMODORO_DB_ID` 값이나 DB의 연결 설정을 다시 확인해주세요.
- **Action 체크박스가 나타나지 않음**: ① 템플릿의 기본 속성 구성을 바꾸지 않았는지, ② Action DB에 통합 연결을 했는지 확인해주세요. 체크박스는 보이는데 연결이 안 되면 Action DB 항목 이름이 템플릿 기본 설정과 같은지 확인해주세요.
- **새 작업을 추가했는데 Daily 페이지가 안 붙음**: `DAILY_DB_ID`가 비어있거나, Daily DB의 기본 속성 구성을 바꾸셨거나, 오늘 날짜의 Daily 페이지가 아직 생성되어 있지 않은 경우입니다.

---
© 2026 Huinaology. 사용 조건은 [LICENSE](LICENSE) 파일을 확인하세요. 소스·문서·템플릿 구조의 재배포·재판매·유사 제품 제작 금지.
