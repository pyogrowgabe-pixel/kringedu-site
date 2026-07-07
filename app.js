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

const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

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

$("#contentForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.currentTarget));
  $("#contentOutput").textContent = createContentDraft(data);
  toast("포스팅 초안을 생성했습니다.");
});

$("#reelsForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.currentTarget));
  $("#reelsOutput").textContent = createReelsDraft(data);
  toast("릴스 구성안을 생성했습니다.");
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

const createContentDraft = ({ region, channel, topic, goal, tone }) => {
  const title = `[${region}] 아이가 먼저 말하는 ${topic}`;
  return `${title}

채널: ${channel}
목적: ${goal}
톤: ${tone}

도입
영어를 잘하게 만드는 첫 단계는 긴 설명보다 아이가 직접 만지고, 고르고, 말해보는 경험입니다. ${region}에서 크잉에듀 수업을 찾는 학부모님께 ${topic} 활동을 소개합니다.

본문 구성
1. 문제 공감: 영어를 외우기만 하면 아이가 금방 지루해집니다.
2. 수업 장면: 교구를 활용해 단어와 문장을 몸으로 이해하게 합니다.
3. 변화 포인트: 아이가 "정답 맞히기"보다 "내가 말해보기"에 집중합니다.
4. 상담 연결: 우리 아이에게 맞는 수업 난이도와 교구 활용법을 상담에서 안내합니다.

인스타그램 캡션
${region} 영어 수업, 이제 책상 앞 반복보다 아이가 직접 말하는 경험으로 시작해보세요. 오늘 크잉에듀에서는 ${topic} 활동으로 영어 표현을 자연스럽게 꺼내는 시간을 만들었습니다.

추천 해시태그
#${region.replaceAll(" ", "")} #크잉에듀 #교구영어 #유아영어 #초등영어 #영어수업 #영어학원상담

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

자막
교구로 시작하는 영어 / 아이가 먼저 말하는 수업 / 체험 상담 가능

캡션
${target}에게 필요한 건 더 많은 문제집이 아니라, 영어를 말해도 되는 편안한 경험일 수 있습니다.

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
