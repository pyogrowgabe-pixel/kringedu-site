const { isAuthorized, isConfigured } = require("./_auth");

const OPENAI_API_URL = "https://api.openai.com/v1/responses";
const DEFAULT_MODEL = "gpt-5.4-mini";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

const json = (res, status, body) => {
  res.status(status);
  Object.entries({ "Content-Type": "application/json; charset=utf-8", ...corsHeaders }).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
  res.end(JSON.stringify(body));
};

const compact = (value) => String(value || "").trim();

const limitText = (value, max = 8000) => {
  const text = compact(value);
  return text.length > max ? `${text.slice(0, max)}\n\n[템플릿이 길어 앞부분만 분석했습니다.]` : text;
};

const buildContentPrompt = (payload) => {
  const region = compact(payload.region);
  const templateText = limitText(payload.templateText);

  return `크잉에듀 원장님이 네이버 블로그에 바로 올릴 수 있는 블로그 포스팅을 작성해줘.
인스타그램 캡션, 사진별 캡션, 이미지 설명 항목은 쓰지 마. 블로그 글만 작성해.

입력값
- 지역 키워드: ${region}
- 주제: ${compact(payload.topic)}
- 목적성: ${compact(payload.goal)}
- 문체: ${compact(payload.tone)}
- 내 학원 상황: ${compact(payload.context) || "구체 정보 없음"}

업로드된 블로그 템플릿
${templateText || "템플릿 없음. 기본 네이버 블로그 최적화 구조로 작성."}

템플릿 활용 규칙
- 템플릿이 있으면 제목 흐름, 도입부 방식, 소제목 구조, 설득 순서, 상담 연결 위치를 분석해서 비슷한 골격으로 재작성해.
- 단, 템플릿 문장을 그대로 복사하지 마. 8어절 이상 연속으로 같은 표현을 쓰지 말고 새 문장으로 작성해.
- 템플릿의 좋은 장점은 살리되, 입력된 지역 키워드와 학원 상황에 맞게 완전히 새 글처럼 바꿔.
- 템플릿이 없으면 학부모 고민 공감형 도입부, 수업 차별점, 자연스러운 상담 연결 구조로 작성해.

네이버 블로그 최적화 규칙
- 제목 후보는 반드시 "${region}"로 시작해.
- 본문 첫 문장도 반드시 "${region}"로 시작해.
- 본문 안에 "${region}"를 자연스럽게 정확히 5번 정도 포함해.
- 본문은 공백 제외 약 1500자 분량으로 작성해.
- 읽기 쉬운 소제목을 3~4개 넣어.
- 소제목에는 #, ## 같은 마크다운 기호를 쓰지 마.
- 해시태그는 정확히 5개만 보여줘.
- 해시태그는 한 줄에 모아서 써.
- 사진별 캡션, 이미지별 문구, 썸네일 문구 추천은 출력하지 마.
- 상담 유도 CTA를 별도 후보나 선택지로 분리하지 말고 본문 마지막 문단에 자연스럽게 녹여 써.

도입부 강화 규칙
- 첫 3~4문장은 설명보다 학부모의 실제 고민으로 시작해.
- "아이가 영어를 외우기만 하고 말하지 못한다", "파닉스를 배워도 읽기로 이어지지 않는다", "수업은 다니는데 흥미가 오래가지 않는다" 같은 문제를 자연스럽게 건드려.
- 첫 문단 끝에는 글을 계속 읽고 싶게 만드는 문장을 넣어.

출력 형식
1. 네이버 블로그 제목 후보 5개
2. 본문 초안
3. 추천 해시태그 5개`;
};

const buildReelsPrompt = (payload) => {
  return `크잉에듀 원장님이 인스타그램 릴스를 바로 촬영하고 올릴 수 있도록 기획안과 캡션을 작성해줘.

입력값
- 릴스 소재: ${compact(payload.subject)}
- 타깃: ${compact(payload.target)}
- 영상 길이: ${compact(payload.duration)}

작성 조건
- 한국어로 작성
- 촬영자가 그대로 따라 할 수 있게 구체적으로 작성
- 교구 영어 수업의 장면이 눈에 보이게 구성
- 인스타그램 캡션은 릴스 영상과 자연스럽게 이어지게 작성
- 학부모 상담 문의로 자연스럽게 이어지게 작성

형식
1. 후킹 문장 5개
2. 초 단위 화면 구성
3. 선생님 대본
4. 화면 자막
5. 인스타그램 릴스 캡션
6. 추천 해시태그
7. 상담 유도 CTA`;
};

const buildPrompt = (type, payload) => {
  if (type === "content") return buildContentPrompt(payload);
  if (type === "reels") return buildReelsPrompt(payload);
  throw new Error("지원하지 않는 생성 유형입니다.");
};

const readBody = async (req) => {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") return JSON.parse(req.body || "{}");
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
};

const extractText = (data) => {
  if (typeof data.output_text === "string" && data.output_text.trim()) {
    return data.output_text.trim();
  }

  const chunks = [];
  for (const item of data.output || []) {
    for (const content of item.content || []) {
      if (content.type === "output_text" && content.text) {
        chunks.push(content.text);
      }
    }
  }
  return chunks.join("\n").trim();
};

module.exports = async (req, res) => {
  if (req.method === "OPTIONS") {
    Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));
    res.status(204).end();
    return;
  }

  if (req.method !== "POST") {
    json(res, 405, { error: "POST 요청만 지원합니다." });
    return;
  }

  if (!isConfigured()) {
    json(res, 500, { error: "앱 비밀번호가 아직 설정되지 않았습니다." });
    return;
  }

  if (!isAuthorized(req)) {
    json(res, 401, { error: "로그인 후 AI 생성 기능을 사용할 수 있습니다." });
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    json(res, 500, { error: "Vercel 환경변수 OPENAI_API_KEY가 아직 설정되지 않았습니다." });
    return;
  }

  try {
    const { type, payload = {} } = await readBody(req);
    const prompt = buildPrompt(type, payload);

    const openaiResponse = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || DEFAULT_MODEL,
        input: [
          {
            role: "system",
            content:
              "너는 크잉에듀 Creative English의 네이버 블로그 SEO와 지역 학원 마케팅 콘텐츠 전문가다. 블로그와 릴스 목적을 분리해서 원장님이 복사해 바로 쓸 수 있는 한국어 콘텐츠를 만든다."
          },
          {
            role: "user",
            content: prompt
          }
        ]
      })
    });

    const data = await openaiResponse.json();

    if (!openaiResponse.ok) {
      json(res, openaiResponse.status, {
        error: data?.error?.message || "OpenAI API 요청에 실패했습니다."
      });
      return;
    }

    const text = extractText(data);
    json(res, 200, { text: text || "생성된 문장이 비어 있습니다. 입력값을 조금 더 구체적으로 적어주세요." });
  } catch (error) {
    json(res, 500, { error: error.message || "AI 생성 중 오류가 발생했습니다." });
  }
};
