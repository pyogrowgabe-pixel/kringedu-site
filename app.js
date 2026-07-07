const feedKey = "kringedu.activityFeed";

const starterFeed = [
  {
    school: "수원 광교 크잉영어",
    theme: "색깔 카드로 감정 표현하기",
    age: "유치부",
    visibility: "원장님 커뮤니티",
    response: "아이들이 I feel happy 문장을 카드와 연결해서 자연스럽게 말했습니다.",
    date: "오늘"
  },
  {
    school: "대전 둔산 크잉영어",
    theme: "스토리 큐브로 문장 만들기",
    age: "초등 저학년",
    visibility: "원장님 커뮤니티",
    response: "문장을 어려워하던 아이도 큐브 순서를 바꾸며 스스로 문장을 완성했습니다.",
    date: "어제"
  }
];

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

const toast = (message) => {
  const el = $("#toast");
  el.textContent = message;
  el.classList.add("show");
  window.clearTimeout(toast.timer);
  toast.timer = window.setTimeout(() => el.classList.remove("show"), 1800);
};

const setLoading = (form, isLoading) => {
  const button = form.querySelector("button[type='submit']");
  if (!button) return;
  button.disabled = isLoading;
  button.dataset.originalText = button.dataset.originalText || button.textContent;
  button.textContent = isLoading ? "AI가 작성 중..." : button.dataset.originalText;
};

const getFeed = () => {
  try {
    return JSON.parse(localStorage.getItem(feedKey)) || starterFeed;
  } catch {
    return starterFeed;
  }
};

const setFeed = (items) => {
  localStorage.setItem(feedKey, JSON.stringify(items));
};

const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const renderFeed = () => {
  const feed = $("#activityFeed");
  const items = getFeed();
  feed.innerHTML = items
    .map(
      (item) => `
        <article class="feed-item">
          <strong>${escapeHtml(item.school)} · ${escapeHtml(item.theme)}</strong>
          <span>${escapeHtml(item.age)} / ${escapeHtml(item.visibility)} / ${escapeHtml(item.date)}</span>
          <p>${escapeHtml(item.response)}</p>
        </article>
      `
    )
    .join("");
};

const requestAiDraft = async (type, payload) => {
  const response = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, payload })
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    throw new Error("AI 응답을 읽지 못했습니다.");
  }

  if (!response.ok) {
    throw new Error(data?.error || "AI 생성에 실패했습니다.");
  }

  return data.text;
};

$("#activityForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.currentTarget));
  const newItem = {
    school: data.school,
    theme: data.theme,
    age: data.age,
    visibility: data.visibility,
    response: data.response,
    date: "방금"
  };
  setFeed([newItem, ...getFeed()].slice(0, 12));
  event.currentTarget.reset();
  renderFeed();
  toast("활동이 등록되었습니다.");
});

$("#clearFeed").addEventListener("click", () => {
  setFeed(starterFeed);
  renderFeed();
  toast("활동 피드를 초기화했습니다.");
});

$("#contentForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const data = Object.fromEntries(new FormData(form));
  setLoading(form, true);
  $("#contentOutput").textContent = "ChatGPT가 네이버 블로그 포스팅을 작성하고 있습니다...";

  try {
    $("#contentOutput").textContent = await requestAiDraft("content", data);
    toast("AI 블로그 포스팅을 생성했습니다.");
  } catch (error) {
    $("#contentOutput").textContent = `${createContentDraft(data)}

---
AI 연결 안내: ${error.message}
Vercel 환경변수 OPENAI_API_KEY를 설정하면 이 영역에 실제 ChatGPT 결과가 표시됩니다.`;
    toast("로컬 샘플 블로그를 표시했습니다.");
  } finally {
    setLoading(form, false);
  }
});

$("#reelsForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const data = Object.fromEntries(new FormData(form));
  setLoading(form, true);
  $("#reelsOutput").textContent = "ChatGPT가 릴스 구성안과 캡션을 작성하고 있습니다...";

  try {
    $("#reelsOutput").textContent = await requestAiDraft("reels", data);
    toast("AI 릴스 구성안을 생성했습니다.");
  } catch (error) {
    $("#reelsOutput").textContent = `${createReelsDraft(data)}

---
AI 연결 안내: ${error.message}
Vercel 환경변수 OPENAI_API_KEY를 설정하면 이 영역에 실제 ChatGPT 결과가 표시됩니다.`;
    toast("로컬 샘플 릴스안을 표시했습니다.");
  } finally {
    setLoading(form, false);
  }
});

$$("[data-copy]").forEach((button) => {
  button.addEventListener("click", async () => {
    const target = $(button.dataset.copy);
    try {
      await navigator.clipboard.writeText(target.textContent);
      toast("복사되었습니다.");
    } catch {
      const range = document.createRange();
      range.selectNodeContents(target);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      toast("내용을 선택했습니다.");
    }
  });
});

$$("[data-scroll]").forEach((button) => {
  button.addEventListener("click", () => {
    const target = $(button.dataset.scroll);
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

$$(".nav a").forEach((link) => {
  link.addEventListener("click", () => {
    $$(".nav a").forEach((item) => item.classList.remove("active"));
    link.classList.add("active");
  });
});

$$("[data-fill]").forEach((button) => {
  button.addEventListener("click", () => {
    $("#kitOutput").textContent = kitSamples[button.dataset.fill];
    toast("홍보 키트 샘플을 열었습니다.");
  });
});

const createContentDraft = ({ region, topic, goal, tone }) => {
  const title = `[${region}] 아이가 먼저 말하는 ${topic}`;
  return `${title}

목적: ${goal}
톤: ${tone}

도입
${region}을 알아보는 학부모님들 중에는 아이가 영어를 외우기는 하지만 막상 말로 꺼내지 못해 고민하는 경우가 많습니다. 파닉스를 배워도 읽기로 자연스럽게 이어지지 않거나, 수업에 흥미가 오래가지 않는 모습도 자주 보입니다. 그래서 ${topic}은 단순한 암기보다 아이가 직접 보고, 만지고, 말하는 경험으로 시작하는 것이 중요합니다.

소제목 1. 교구로 시작하면 영어가 더 쉬워집니다
교구를 활용한 수업은 아이가 소리와 글자를 눈으로 확인하고 손으로 움직이며 이해하도록 돕습니다. 선생님의 설명을 듣기만 하는 방식보다 아이가 직접 참여하기 때문에 집중도와 기억력이 높아집니다.

소제목 2. 파닉스는 말하기와 연결되어야 합니다
파닉스는 글자를 읽는 기술에서 끝나는 것이 아니라, 아이가 단어를 말하고 문장으로 확장하는 과정까지 이어져야 합니다. 크잉에듀 수업은 교구 활동을 통해 아이가 자연스럽게 영어 표현을 꺼내도록 설계합니다.

소제목 3. 상담에서 아이에게 맞는 시작점을 찾습니다
아이마다 영어 경험과 흥미가 다르기 때문에 같은 수업도 출발점이 달라야 합니다. 체험 수업과 상담을 통해 우리 아이에게 맞는 교구 영어 수업 방향을 안내드립니다.

추천 해시태그
#${region.replaceAll(" ", "")} #크잉에듀 #교구영어 #파닉스수업 #영어학원상담

CTA
체험 수업과 상담 가능 시간을 댓글 또는 메시지로 남겨주세요.`;
};

const createReelsDraft = ({ subject, target, duration }) => {
  return `릴스 소재: ${subject}
타깃: ${target}
길이: ${duration}

후킹 문장
"영어를 외우기 싫어하는 아이도 이렇게 말문이 열립니다."

장면 구성
0-3초: 교구가 책상에 놓이고 아이 손이 움직이는 장면
4-8초: 아이가 단어를 고르고 짧은 문장을 말하는 장면
9-13초: 선생님이 칭찬하며 문장을 확장해주는 장면
마무리: 완성된 활동 결과물과 상담 안내 문구

대본
"오늘은 ${subject}로 영어를 배웠어요. 아이가 직접 고르고 움직이니까 단어가 암기가 아니라 표현이 됩니다. 크잉에듀는 교구 활동으로 말하는 힘을 키웁니다."

화면 자막
교구로 시작하는 영어 / 아이가 먼저 말하는 수업 / 체험 상담 가능

인스타그램 릴스 캡션
${target}에게 필요한 건 더 많은 문제집이 아니라, 영어를 말해도 되는 편안한 경험일 수 있습니다. 오늘 수업에서는 ${subject}로 아이가 직접 고르고 말하는 시간을 만들었습니다.

CTA
우리 아이에게 맞는 교구 영어 수업이 궁금하다면 상담 문의를 남겨주세요.`;
};

const kitSamples = {
  keyword: `지역 키워드 조합
- 분당 유아영어 + 놀이식 영어
- 분당 초등영어 + 말하기 수업
- 정자동 영어학원 + 파닉스
- 예비초 영어 + 교구 수업
- 영어 거부감 아이 + 소규모 영어`,
  message: `학부모 상담 문구
안녕하세요. 크잉에듀입니다.
이번 주에는 교구를 활용해 아이가 직접 문장을 만들어보는 체험 수업이 진행됩니다.
영어를 어려워하는 아이도 부담 없이 참여할 수 있도록 소수로 운영됩니다.
가능한 시간대를 알려주시면 상담 일정을 안내드리겠습니다.`,
  calendar: `월간 콘텐츠 캘린더
1주차: 새 학기 영어 적응 콘텐츠 / 교구 수업 사진
2주차: 파닉스 활동 릴스 / 학부모 상담 후기
3주차: 지역 키워드 블로그 / 아이 발화 변화 사례
4주차: 오픈 클래스 모집 / 재등록 안내 메시지`,
  report: `성과 리포트 항목
- 활동 업로드 수
- 블로그 초안 생성 수
- 인스타그램 캡션 생성 수
- 릴스 기획 수
- 상담 문의 메모
- 체험 수업 전환 기록`
};

renderFeed();
