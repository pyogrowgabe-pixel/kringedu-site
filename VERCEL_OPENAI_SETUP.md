# Vercel + OpenAI 연결 안내

## 필요한 환경변수

Vercel 프로젝트의 Environment Variables에 아래 값을 추가합니다.

- `OPENAI_API_KEY`: OpenAI API 키
- `OPENAI_MODEL`: 사용할 모델 이름, 선택값. 기본값은 `gpt-5.4-mini`

API 키는 절대 `index.html`이나 `app.js`에 넣지 않습니다. 프론트 화면은 `/api/generate`만 호출하고, 실제 OpenAI 호출은 Vercel Function인 `api/generate.js`에서 처리합니다.

## Vercel 연결 순서

1. Vercel에서 GitHub 계정으로 로그인합니다.
2. `pyogrowgabe-pixel/kringedu-site` 저장소를 Import합니다.
3. Framework Preset은 `Other` 또는 자동 감지 그대로 둡니다.
4. Build Command는 비워두거나 기본값을 사용합니다.
5. Output Directory는 비워둡니다.
6. Environment Variables에 `OPENAI_API_KEY`를 추가합니다.
7. Deploy를 누릅니다.

## 동작 방식

- 블로그/인스타그램 생성 폼은 `type: "content"`로 `/api/generate`에 요청합니다.
- 릴스 생성 폼은 `type: "reels"`로 `/api/generate`에 요청합니다.
- API 키가 없거나 Vercel이 아닌 GitHub Pages에서 열면 로컬 샘플 초안과 안내 문구가 표시됩니다.
