const sessionKey = "kringedu.memberSession";
const materialsKey = "kringedu.memberMaterials";

const $ = (selector) => document.querySelector(selector);

const starterMaterials = [
  {
    title: "7월 파닉스 교구 수업안",
    category: "교안",
    target: "유치부",
    fileName: "phonics-july-guide.pdf",
    memo: "교구 활동 순서와 학부모 안내 멘트 포함",
    createdAt: "샘플"
  },
  {
    title: "오픈 클래스 학부모 안내문",
    category: "학부모 안내문",
    target: "공통",
    fileName: "open-class-notice.docx",
    memo: "지역별 오픈 클래스 모집 문구로 수정 가능",
    createdAt: "샘플"
  }
];

const toast = (message) => {
  const el = $("#toast");
  el.textContent = message;
  el.classList.add("show");
  window.clearTimeout(toast.timer);
  toast.timer = window.setTimeout(() => el.classList.remove("show"), 1800);
};

const getSession = () => {
  try {
    return JSON.parse(localStorage.getItem(sessionKey));
  } catch {
    return null;
  }
};

const setSession = (session) => {
  localStorage.setItem(sessionKey, JSON.stringify(session));
};

const getMaterials = () => {
  try {
    return JSON.parse(localStorage.getItem(materialsKey)) || starterMaterials;
  } catch {
    return starterMaterials;
  }
};

const setMaterials = (items) => {
  localStorage.setItem(materialsKey, JSON.stringify(items));
};

const showLibrary = () => {
  const session = getSession();
  $("#loginPanel").classList.toggle("hidden", Boolean(session));
  $("#libraryPanel").classList.toggle("hidden", !session);
  $("#logoutButton").style.display = session ? "inline-flex" : "none";
  $("#memberBadge").textContent = session ? session.academy : "";
  renderMaterials();
};

const renderMaterials = () => {
  const list = $("#materialList");
  const items = getMaterials();
  list.innerHTML = items
    .map(
      (item) => `
        <article class="material-item">
          <div>
            <strong>${escapeHtml(item.title)}</strong>
            <div class="material-meta">${escapeHtml(item.category)} / ${escapeHtml(item.target)} / ${escapeHtml(item.fileName)}</div>
            <p class="material-meta">${escapeHtml(item.memo || "운영 메모 없음")}</p>
          </div>
          <div class="material-lock">
            <span>열람 전용</span>
            <span>워터마크 적용 예정</span>
          </div>
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

$("#loginForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.currentTarget));
  setSession({
    academy: data.academy,
    email: data.email,
    loginAt: new Date().toISOString()
  });
  showLibrary();
  toast("원장님 전용관에 입장했습니다.");
});

$("#logoutButton").addEventListener("click", () => {
  localStorage.removeItem(sessionKey);
  showLibrary();
  toast("로그아웃했습니다.");
});

$("#materialForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const data = Object.fromEntries(new FormData(form));
  const file = form.file.files[0];
  const newItem = {
    title: data.title,
    category: data.category,
    target: data.target,
    fileName: file?.name || "파일명 없음",
    memo: data.memo,
    createdAt: new Date().toLocaleString("ko-KR")
  };

  setMaterials([newItem, ...getMaterials()].slice(0, 24));
  form.reset();
  renderMaterials();
  toast("자료 등록 흐름을 저장했습니다.");
});

showLibrary();
