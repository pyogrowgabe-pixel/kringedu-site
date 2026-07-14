const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

const toast = (message) => {
  const el = $("#toast");
  if (!el) return;
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

const createContentDraft = ({ region, topic, goal, tone, context, templateText }) => {
  const compactRegion = String(region || "지역키워드").replace(/\s+/g, "");
  return `${region} ${topic} 블로그 초안

목적: ${goal}
문체: ${tone}
학원 상황: ${context || "학원 상황 미입력"}

도입부
${region}에서 아이 영어 수업을 알아보는 학부모님이라면 단순히 문제를 많이 푸는 수업보다 아이가 직접 말하고 움직이며 기억하는 수업을 찾게 됩니다. 특히 ${topic}은 아이가 영어를 외우는 시간이 아니라 스스로 표현하는 경험으로 연결될 때 효과가 커집니다.

템플릿 반영 방향
${templateText ? "업로드한 템플릿의 제목 흐름, 소제목 구조, 설득 순서를 따라 새 글로 재작성하는 방식입니다." : "템플릿이 없어서 기본 네이버 블로그 최적화 구조로 작성하는 방식입니다."}

1. 교구 수업이 필요한 이유
${region} 학부모님들이 자주 고민하는 부분은 아이가 단어는 알아도 말로 꺼내지 못한다는 점입니다. 크잉에듀 수업은 교구를 통해 아이가 먼저 보고, 만지고, 선택하면서 영어 표현을 자연스럽게 말하게 만듭니다.

2. ${topic} 수업의 차별점
${topic}은 아이가 학습 내용을 손으로 경험하고 문장으로 연결하는 활동입니다. ${region}에서 영어 수업을 찾는 학부모님께는 결과보다 과정이 보이는 수업이라는 점이 큰 장점입니다.

마무리
${region}에서 아이에게 맞는 영어 시작점을 찾고 있다면, 글로만 판단하기보다 짧은 체험 수업에서 아이의 반응을 먼저 확인해보는 것이 가장 정확합니다.

해시태그
#${compactRegion} #크잉에듀 #교구영어 #파닉스수업 #영어학원상담`;
};

const createReelsDraft = ({ subject, target, duration }) => {
  return `릴스 소재: ${subject}
타깃: ${target}
길이: ${duration}

후킹 문장
"영어를 외우기 싫어하는 아이도 교구를 만나면 먼저 말하기 시작합니다."

화면 구성
0-3초: 교구가 책상 위에 놓이고 아이 손이 움직이는 장면
4-8초: 아이가 단어를 고르고 문장으로 말하는 장면
9-13초: 선생님이 칭찬하며 문장을 확장해주는 장면
마무리: 완성된 활동 결과물과 상담 안내 문구

대본
"오늘은 ${subject}로 영어를 배웠어요. 아이가 직접 고르고 움직이니까 영어가 설명이 아니라 표현이 됩니다."

인스타그램 캡션
${target}에게 필요한 건 문제집보다 영어를 말해보는 작은 성공 경험일 수 있습니다. 크잉에듀는 교구 활동으로 아이가 먼저 말하는 수업을 만듭니다.

CTA
아이에게 맞는 교구 영어 수업이 궁금하다면 상담 문의를 남겨주세요.`;
};

$("#templateFile")?.addEventListener("change", async (event) => {
  const file = event.currentTarget.files?.[0];
  if (!file) return;

  const allowed = ["text/plain", "text/markdown", "text/html", "text/csv", ""];
  if (!allowed.includes(file.type) && !/\.(txt|md|html|csv)$/i.test(file.name)) {
    toast("txt, md, html, csv 파일을 권장합니다.");
    return;
  }

  try {
    const text = await file.text();
    $("#templateText").value = text.trim();
    toast("템플릿을 불러왔습니다.");
  } catch {
    toast("파일 내용을 읽지 못했습니다.");
  }
});

$("#contentForm")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const data = Object.fromEntries(new FormData(form));
  delete data.templateFile;

  setLoading(form, true);
  $("#contentOutput").textContent = "ChatGPT가 템플릿 구조를 분석해서 블로그 글을 작성하고 있습니다...";

  try {
    $("#contentOutput").textContent = await requestAiDraft("content", data);
    toast("AI 블로그 포스팅을 생성했습니다.");
  } catch (error) {
    $("#contentOutput").textContent = `${createContentDraft(data)}

---
AI 연결 안내: ${error.message}
비밀번호 또는 OpenAI API 설정을 확인하면 실제 ChatGPT 결과가 표시됩니다.`;
    toast("로컬 샘플 블로그를 표시했습니다.");
  } finally {
    setLoading(form, false);
  }
});

$("#reelsForm")?.addEventListener("submit", async (event) => {
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
비밀번호 또는 OpenAI API 설정을 확인하면 실제 ChatGPT 결과가 표시됩니다.`;
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
      toast("복사했습니다.");
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
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
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

let thumbnailLogoImage = null;
let thumbnailActivityImage = null;

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

const drawCoverImage = (ctx, image, x, y, width, height, radius = 0) => {
  if (!image) return;
  const scale = Math.max(width / image.width, height / image.height);
  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;
  const drawX = x + (width - drawWidth) / 2;
  const drawY = y + (height - drawHeight) / 2;
  ctx.save();
  if (radius) {
    drawRoundedRect(ctx, x, y, width, height, radius);
    ctx.clip();
  }
  ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
  ctx.restore();
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

const drawLogoBox = (ctx) => {
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "rgba(37,39,45,0.08)";
  ctx.lineWidth = 3;
  drawRoundedRect(ctx, 152, 162, 300, 132, 24);
  ctx.fill();
  ctx.stroke();
  drawLogo(ctx, thumbnailLogoImage, 182, 184, 240, 88);
};

const drawBrandFooter = (ctx, theme) => {
  ctx.fillStyle = theme.dark;
  ctx.font = "700 28px Arial, sans-serif";
  ctx.fillText("Creative English", 154, 930);
};

const renderThumbnail = (values = {}) => {
  const canvas = $("#thumbnailCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const theme = thumbnailThemes[values.theme] || thumbnailThemes.coral;
  const layout = values.layout || "photo-natural";
  const academy = values.academy || "크잉에듀";
  const title = values.title || "교구로 배우는 파닉스";
  const subtitle = values.subtitle || "아이가 먼저 말하는 영어 수업";

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = theme.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (layout === "photo-natural" && thumbnailActivityImage) {
    drawCoverImage(ctx, thumbnailActivityImage, 0, 0, 1080, 1080);
    const overlay = ctx.createLinearGradient(0, 120, 0, 1080);
    overlay.addColorStop(0, "rgba(0,0,0,0.10)");
    overlay.addColorStop(0.48, "rgba(0,0,0,0.18)");
    overlay.addColorStop(1, "rgba(0,0,0,0.72)");
    ctx.fillStyle = overlay;
    ctx.fillRect(0, 0, 1080, 1080);
  } else if (layout === "photo-bg" && thumbnailActivityImage) {
    drawCoverImage(ctx, thumbnailActivityImage, 0, 0, 1080, 1080);
    ctx.fillStyle = "rgba(0,0,0,0.38)";
    ctx.fillRect(0, 0, 1080, 1080);
    ctx.fillStyle = "rgba(255,255,255,0.88)";
    drawRoundedRect(ctx, 104, 114, 872, 852, 38);
    ctx.fill();
  } else {
    ctx.fillStyle = theme.primary;
    drawRoundedRect(ctx, 72, 72, 936, 936, 42);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.94)";
    drawRoundedRect(ctx, 112, 112, 856, 856, 36);
    ctx.fill();
  }

  if (layout !== "photo-natural") {
    ctx.fillStyle = theme.accent;
    drawRoundedRect(ctx, 112, 112, 856, 28, 14);
    ctx.fill();
  }

  if (layout === "photo-side" && thumbnailActivityImage) {
    drawCoverImage(ctx, thumbnailActivityImage, 626, 188, 296, 388, 30);
    ctx.strokeStyle = "rgba(37,39,45,0.10)";
    ctx.lineWidth = 3;
    drawRoundedRect(ctx, 626, 188, 296, 388, 30);
    ctx.stroke();
  }

  if (layout === "photo-focus" && thumbnailActivityImage) {
    drawCoverImage(ctx, thumbnailActivityImage, 154, 430, 772, 300, 34);
    ctx.strokeStyle = "rgba(37,39,45,0.10)";
    ctx.lineWidth = 3;
    drawRoundedRect(ctx, 154, 430, 772, 300, 34);
    ctx.stroke();
  }

  if (layout === "photo-natural" && thumbnailActivityImage) {
    if (thumbnailLogoImage) {
      ctx.fillStyle = "rgba(255,255,255,0.90)";
      drawRoundedRect(ctx, 72, 72, 250, 104, 22);
      ctx.fill();
      drawLogo(ctx, thumbnailLogoImage, 98, 94, 198, 60);
    }

    ctx.fillStyle = "#ffffff";
    ctx.font = "700 34px Arial, sans-serif";
    ctx.fillText(academy, 76, 706);
    ctx.font = "800 86px Arial, sans-serif";
    wrapCanvasText(ctx, title, 74, 796, 860, 98, 2);
    ctx.fillStyle = "rgba(255,255,255,0.86)";
    ctx.font = "600 36px Arial, sans-serif";
    wrapCanvasText(ctx, subtitle, 78, 990, 780, 48, 1);
  } else {
    if (layout === "logo-only" || layout === "photo-bg" || layout === "photo-side") {
      drawLogoBox(ctx);
    } else {
      ctx.fillStyle = "#ffffff";
      drawRoundedRect(ctx, 154, 160, 220, 92, 20);
      ctx.fill();
      drawLogo(ctx, thumbnailLogoImage, 178, 178, 172, 56);
    }

    ctx.fillStyle = theme.dark;
    ctx.font = "700 36px Arial, sans-serif";
    ctx.fillText(academy, 154, layout === "photo-focus" ? 324 : 366);

    ctx.fillStyle = theme.primary;
    ctx.font = "800 82px Arial, sans-serif";
    if (layout === "photo-side" && thumbnailActivityImage) {
      wrapCanvasText(ctx, title, 154, 510, 430, 100, 3);
    } else if (layout === "photo-focus" && thumbnailActivityImage) {
      wrapCanvasText(ctx, title, 154, 388, 760, 94, 2);
    } else {
      wrapCanvasText(ctx, title, 154, 510, 760, 104, 3);
    }

    ctx.fillStyle = "#515763";
    ctx.font = "600 38px Arial, sans-serif";
    wrapCanvasText(ctx, subtitle, 158, layout === "photo-focus" ? 820 : 832, 660, 52, 2);

    ctx.fillStyle = theme.accent;
    drawRoundedRect(ctx, 820, 720, 120, 120, 26);
    ctx.fill();

    drawBrandFooter(ctx, theme);
  }
  $("#downloadThumbnail").disabled = false;
};

const loadThumbnailImage = (file, callback) => {
  if (!file) {
    callback(null);
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    const image = new Image();
    image.onload = () => callback(image);
    image.src = reader.result;
  };
  reader.readAsDataURL(file);
};

$("#thumbnailLogo")?.addEventListener("change", (event) => {
  loadThumbnailImage(event.currentTarget.files?.[0], (image) => {
    thumbnailLogoImage = image;
    const form = $("#thumbnailForm");
    if (form) renderThumbnail(Object.fromEntries(new FormData(form)));
  });
});

$("#thumbnailPhoto")?.addEventListener("change", (event) => {
  loadThumbnailImage(event.currentTarget.files?.[0], (image) => {
    thumbnailActivityImage = image;
    const form = $("#thumbnailForm");
    if (form) renderThumbnail(Object.fromEntries(new FormData(form)));
  });
});

$("#thumbnailForm")?.addEventListener("change", (event) => {
  if (event.target.type === "file") return;
  renderThumbnail(Object.fromEntries(new FormData(event.currentTarget)));
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
- 지산동영어학원 + 유치부 영어
- 지산동파닉스 + 교구 수업
- 수성구초등영어 + 말하기 수업
- 예비초영어 + 영어 자신감
- 영어 거부감 아이 + 체험 수업`,
  message: `학부모 상담 문구
안녕하세요. 크잉에듀입니다.
이번 주에는 교구를 활용해 아이가 직접 문장을 만들어보는 체험 수업을 진행합니다.
영어를 어려워하는 아이도 부담 없이 참여할 수 있도록 소수로 운영합니다.
가능한 시간대를 알려주시면 상담 일정을 안내드리겠습니다.`,
  calendar: `월간 콘텐츠 캘린더
1주차: 새 학기 영어 적응 콘텐츠 / 교구 수업 사진
2주차: 파닉스 활동 릴스 / 학부모 상담 후기
3주차: 지역 키워드 블로그 / 아이 발화 변화 사례
4주차: 스피킹 클래스 모집 / 재등록 안내 메시지`,
  report: `상담 전환 체크
- 제목에 지역 키워드가 앞쪽에 있는가
- 도입부가 학부모 고민으로 시작하는가
- 본문에 실제 수업 장면이 보이는가
- 마지막 문단에 상담 문의 행동이 있는가
- 해시태그가 5개로 정리되어 있는가`,
  trial: `체험수업 모집글
이번 주 크잉에듀 교구 영어 체험수업을 소수로 진행합니다.
아이가 영어를 외우는 데서 끝나지 않고, 직접 만지고 고르며 말해보는 수업입니다.
파닉스와 말하기를 자연스럽게 연결하고 싶은 학부모님께 추천드립니다.
가능한 시간대를 남겨주시면 체험 가능 일정을 안내드리겠습니다.`,
  renewal: `재등록 안내 문구
이번 달 수업에서는 아이가 교구를 활용해 스스로 영어 표현을 말해보는 시간이 늘었습니다.
다음 달에는 배운 표현을 짧은 문장과 상황 말하기로 확장할 예정입니다.
아이의 흐름이 끊기지 않도록 재등록 일정을 미리 안내드립니다.
궁금한 점이 있으시면 편하게 말씀 주세요.`,
  review: `후기 요청 문구
안녕하세요. 이번 수업에서 아이가 활동에 집중하는 모습이 참 좋았습니다.
혹시 괜찮으시다면 짧은 수업 후기나 느낀 점을 남겨주실 수 있을까요?
남겨주신 후기는 다른 학부모님들이 수업을 이해하는 데 큰 도움이 됩니다.
사진 사용 여부는 원하시는 범위에 맞춰 확인 후 진행하겠습니다.`,
  place: `네이버 플레이스 새소식
크잉에듀 교구 영어 수업은 아이가 직접 보고 만지며 영어를 말해보는 방식으로 진행됩니다.
파닉스, 단어, 문장을 활동 속에서 연결해 영어 자신감을 키웁니다.
이번 주 체험수업 가능 시간이 열려 있으니 상담 문의로 아이에게 맞는 반을 확인해보세요.`,
  briefing: `설명회 초대 문구
우리 아이 영어 시작, 어떤 기준으로 선택해야 할지 고민되시나요?
크잉에듀에서 교구 영어 수업 방식과 아이 발화가 만들어지는 과정을 짧게 소개하는 시간을 준비했습니다.
소규모로 진행되어 아이 상황에 맞춘 질문도 가능합니다.
참석을 원하시면 가능한 시간을 남겨주세요.`,
  reelsPost: `릴스 업로드 문구
오늘 수업에서는 아이들이 교구를 직접 움직이며 영어 표현을 말해보았습니다.
작은 선택에서 시작한 말하기가 문장으로 이어지는 순간을 영상에 담았습니다.
영어가 부담스러운 아이도 활동 속에서는 훨씬 자연스럽게 참여합니다.
우리 아이에게 맞는 수업이 궁금하다면 상담으로 확인해보세요.`
};

renderThumbnail();
