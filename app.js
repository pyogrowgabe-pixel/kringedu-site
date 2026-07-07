const feedKey = "kringedu.activityFeed";

const starterFeed = [
  {
    school: "수원 광교 크잉영어",
    theme: "색깔 카드로 감정 표현하기",
    material: "감정 카드",
    lessonGoal: "감정 표현 문장을 자연스럽게 말하기",
    age: "유치부",
    visibility: "원장님 커뮤니티",
    reactionLevel: "매우 좋음",
    feedbackType: "아이 반응 해석",
    feedbackStatus: "피드백 완료",
    isExcellent: true,
    response: "아이들이 I feel happy 문장을 카드와 연결해서 자연스럽게 말했습니다.",
    lessonDate: "2026-07-07",
    date: "오늘"
  },
  {
    school: "대전 둔산 크잉영어",
    theme: "스토리 큐브로 문장 만들기",
    material: "스토리 큐브",
    lessonGoal: "단어를 조합해 짧은 문장 만들기",
    age: "초등 저학년",
    visibility: "원장님 커뮤니티",
    reactionLevel: "보통",
    feedbackType: "다음 수업 아이디어",
    feedbackStatus: "검토 중",
    isExcellent: false,
    response: "문장을 어려워하던 아이도 큐브 순서를 바꾸며 스스로 문장을 완성했습니다.",
    lessonDate: "2026-07-06",
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
    const saved = JSON.parse(localStorage.getItem(feedKey));
    return Array.isArray(saved) && saved.length ? saved : starterFeed;
  } catch {
    return starterFeed;
  }
};

const setFeed = (items) => {
  localStorage.setItem(feedKey, JSON.stringify(items));
};

const setDefaultLessonDate = () => {
  const input = document.querySelector("input[name='lessonDate']");
  if (input && !input.value) {
    input.value = new Date().toISOString().slice(0, 10);
  }
};

const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const badgeClass = (value) => {
  if (value === "피드백 완료" || value === "매우 좋음") return "success";
  if (value === "검토 중" || value === "보통") return "warning";
  if (value === "어려워함") return "danger";
  return "";
};

const renderFeed = () => {
  const feed = $("#activityFeed");
  const items = getFeed();
  feed.innerHTML = items
    .map((item, index) => {
      const lessonDate = item.lessonDate || item.date || "날짜 미입력";
      const material = item.material || "교구 미입력";
      const lessonGoal = item.lessonGoal || "수업 목표 미입력";
      const reactionLevel = item.reactionLevel || "반응 미입력";
      const feedbackType = item.feedbackType || "피드백 유형 미입력";
      const feedbackStatus = item.feedbackStatus || "피드백 대기";
      return `
        <article class="feed-item">
          <div class="feed-topline">
            <strong>${escapeHtml(item.school)} · ${escapeHtml(item.theme)}</strong>
            ${item.isExcellent ? '<span class="feed-badge excellent">우수 사례</span>' : ""}
          </div>
          <div class="feed-meta">
            <span>${escapeHtml(lessonDate)}</span>
            <span>${escapeHtml(item.age || "연령 미입력")}</span>
            <span>${escapeHtml(item.visibility || "공개 범위 미입력")}</span>
          </div>
          <div class="feed-tags">
            <span class="feed-badge">${escapeHtml(material)}</span>
            <span class="feed-badge ${badgeClass(reactionLevel)}">${escapeHtml(reactionLevel)}</span>
            <span class="feed-badge ${badgeClass(feedbackStatus)}">${escapeHtml(feedbackStatus)}</span>
          </div>
          <dl class="feed-detail">
            <div><dt>수업 목표</dt><dd>${escapeHtml(lessonGoal)}</dd></div>
            <div><dt>원하는 피드백</dt><dd>${escapeHtml(feedbackType)}</dd></div>
          </dl>
          <p>${escapeHtml(item.response)}</p>
          <div class="feed-actions">
            <button class="ghost-button small-button" type="button" data-blog-index="${index}">블로그로 전환</button>
          </div>
        </article>
      `;
    })
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
    material: data.material,
    lessonGoal: data.lessonGoal,
    age: data.age,
    visibility: data.visibility,
    reactionLevel: data.reactionLevel,
    feedbackType: data.feedbackType,
    feedbackStatus: data.feedbackStatus || "피드백 대기",
    isExcellent: data.isExcellent === "on",
    response: data.response,
    lessonDate: data.lessonDate,
    date: "방금"
  };
  setFeed([newItem, ...getFeed()].slice(0, 18));
  event.currentTarget.reset();
  setDefaultLessonDate();
  renderFeed();
  toast("활동이 등록되었습니다.");
});

$("#clearFeed").addEventListener("click", () => {
  setFeed(starterFeed);
  renderFeed();
  toast("활동 피드를 초기화했습니다.");
});

$("#activityFeed").addEventListener("click", (event) => {
  const button = event.target.closest("[data-blog-index]");
  if (!button) return;
  const item = getFeed()[Number(button.dataset.blogIndex)];
  if (!item) return;

  const form = $("#contentForm");
  form.region.value = item.school || "";
  form.topic.value = `${item.material || ""} ${item.theme || ""}`.trim();
  form.goal.value = "수업 전문성 브랜딩";
  form.tone.value = "따뜻하고 전문적인 톤";
  $("#creator").scrollIntoView({ behavior: "smooth", block: "start" });
  toast("활동 내용을 블로그 입력칸으로 옮겼습니다.");
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
교구를 활용한 수업은 아이가 소리와 글자를 눈으로 확인하고 손으로 움직이며 이해하도록 돕습니다.

소제목 2. 파닉스는 말하기와 연결되어야 합니다
파닉스는 글자를 읽는 기술에서 끝나는 것이 아니라, 아이가 단어를 말하고 문장으로 확장하는 과정까지 이어져야 합니다.

소제목 3. 상담에서 아이에게 맞는 시작점을 찾습니다
아이마다 영어 경험과 흥미가 다르기 때문에 같은 수업도 출발점이 달라야 합니다.

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
${target}에게 필요한 건 더 많은 문제집이 아니라, 영어를 말해도 되는 편안한 경험일 수 있습니다.

CTA
우리 아이에게 맞는 교구 영어 수업이 궁금하다면 상담 문의를 남겨주세요.`;
};

let thumbnailLogoImage = null;

const thumbnailThemes = {
  coral: { bg: "#fff5f6", primary: "#ff4f63", accent: "#ffb000", dark: "#272a31" },
  sun: { bg: "#fff8e8", primary: "#ffb000", accent: "#ff4f63", dark: "#272a31" },
  mint: { bg: "#eefdf7", primary: "#35b996", accent: "#3f7bd9", dark: "#272a31" },
  navy: { bg: "#f3f6fb", primary: "#303238", accent: "#ffb000", dark: "#202329" }
};

const drawRoundedRect = (ctx, x, y, width, height, radius) => {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
};

const wrapCanvasText = (ctx, text, x, y, maxWidth, lineHeight, maxLines) => {
  const raw = String(text || "");
  const words = raw.includes(" ") ? raw.split(" ") : raw.split("");
  const lines = [];
  let line = "";

  words.forEach((word) => {
    const joiner = raw.includes(" ") ? " " : "";
    const testLine = line ? line + joiner + word : word;
    if (ctx.measureText(testLine).width <= maxWidth) {
      line = testLine;
      return;
    }
    if (line) lines.push(line);
    line = word;
  });
  if (line) lines.push(line);

  lines.slice(0, maxLines).forEach((item, index) => {
    ctx.fillText(item, x, y + index * lineHeight);
  });
};

const drawLogo = (ctx, image, x, y, width, height) => {
  if (!image) return;
  const ratio = Math.min(width / image.width, height / image.height);
  const drawWidth = image.width * ratio;
  const drawHeight = image.height * ratio;
  ctx.drawImage(image, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight);
};

const renderThumbnail = (values = {}) => {
  const canvas = $("#thumbnailCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const theme = thumbnailThemes[values.theme] || thumbnailThemes.coral;
  const academy = values.academy || "크잉에듀";
  const title = values.title || "교구로 배우는 파닉스";
  const subtitle = values.subtitle || "아이가 먼저 말하는 영어 수업";

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = theme.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = theme.primary;
  drawRoundedRect(ctx, 72, 72, 936, 936, 42);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.94)";
  drawRoundedRect(ctx, 112, 112, 856, 856, 36);
  ctx.fill();
  ctx.fillStyle = theme.accent;
  drawRoundedRect(ctx, 112, 112, 856, 28, 14);
  ctx.fill();
  drawRoundedRect(ctx, 820, 720, 120, 120, 26);
  ctx.fill();
  ctx.fillStyle = "rgba(255, 79, 99, 0.12)";
  ctx.beginPath();
  ctx.arc(830, 248, 96, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "rgba(37,39,45,0.08)";
  ctx.lineWidth = 3;
  drawRoundedRect(ctx, 152, 162, 300, 132, 24);
  ctx.fill();
  ctx.stroke();
  drawLogo(ctx, thumbnailLogoImage, 182, 184, 240, 88);
  ctx.fillStyle = theme.dark;
  ctx.font = "700 36px Arial, sans-serif";
  ctx.fillText(academy, 154, 366);
  ctx.fillStyle = theme.primary;
  ctx.font = "800 86px Arial, sans-serif";
  wrapCanvasText(ctx, title, 154, 510, 760, 104, 3);
  ctx.fillStyle = "#515763";
  ctx.font = "600 38px Arial, sans-serif";
  wrapCanvasText(ctx, subtitle, 158, 832, 660, 52, 2);
  ctx.fillStyle = theme.dark;
  ctx.font = "700 28px Arial, sans-serif";
  ctx.fillText("Creative English", 154, 930);
  $("#downloadThumbnail").disabled = false;
};

$("#thumbnailLogo")?.addEventListener("change", (event) => {
  const file = event.currentTarget.files?.[0];
  if (!file) {
    thumbnailLogoImage = null;
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    const image = new Image();
    image.onload = () => {
      thumbnailLogoImage = image;
      const form = $("#thumbnailForm");
      if (form) renderThumbnail(Object.fromEntries(new FormData(form)));
    };
    image.src = reader.result;
  };
  reader.readAsDataURL(file);
});

$("#thumbnailForm")?.addEventListener("submit", (event) => {
  event.preventDefault();
  renderThumbnail(Object.fromEntries(new FormData(event.currentTarget)));
  toast("썸네일을 생성했습니다.");
});

$("#downloadThumbnail")?.addEventListener("click", () => {
  const canvas = $("#thumbnailCanvas");
  const link = document.createElement("a");
  link.download = "kringedu-blog-thumbnail.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
});

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

renderThumbnail();
setDefaultLessonDate();
renderFeed();
