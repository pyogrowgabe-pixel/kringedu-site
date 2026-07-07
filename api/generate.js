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

const buildPrompt = (type, payload) => {
  if (type === "content") {
    return `크잉에듀 원장님이 지역 홍보에 바로 쓸 수 있는 콘텐츠를 작성해줘.

입력값
- 지역 키워드: ${compact(payload.region)}
- 채널: ${compact(payload.channel)}
- 주제: ${compact(payload.topic)}
- 목적성: ${compact(payload.goal)}
- 톤: ${compact(payload.tone)}

작성 조건
- 한국어로 작성
- 과장 광고처럼 보이지 않게 자연스럽고 신뢰감 있게 작성
- 영어 교구 수업의 장점이 드러나게 작성
- 학부모가 상담을 문의하고 싶어지도록 마무리
- 아래 형식을 반드시 지켜줘

형식
1. 블로그 제목 5개
2. 블로그 본문 초안
3. 인스타그램 캡션
4. 추천 해시태그 12개
5. 상담 유도 CTA 3개`;
  }

  if (type === "reels") {
    return `크잉에듀 원장님이 인스타그램 릴스를 바로 촬영할 수 있도록 기획안을 작성해줘.

입력값
- 릴스 소재: ${compact(payload.subject)}
- 타깃: ${compact(payload.target)}
- 영상 길이: ${compact(payload.duration)}

작성 조건
- 한국어로 작성
- 촬영자가 그대로 따라 할 수 있게 구체적으로 작성
- 교구 영어 수업의 장면이 잘 보이게 구성
- 학부모 상담 문의로 자연스럽게 이어지게 작성
- 아래 형식을 반드시 지켜줘

형식
1. 후킹 문장 5개
2. 초 단위 장면 구성
3. 선생님 대본
4. 화면 자막
5. 인스타그램 캡션
6. 추천 해시태그
7. 상담 유도 CTA`;
  }

  throw new Error("지원하지 않는 생성 유형입니다.");
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

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    json(res, 500, { error: "Vercel 환경변수 OPENAI_API_KEY가 아직 설정되지 않았습니다." });
    return;
  }

  try {
    const { type, payload = {} } = req.body || {};
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
              "너는 크잉에듀 Creative English의 마케팅 콘텐츠 전문가다. 원장님이 복사해서 바로 쓸 수 있는 자연스러운 한국어 홍보 콘텐츠를 만든다."
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
