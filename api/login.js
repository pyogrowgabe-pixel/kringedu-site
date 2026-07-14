const { authCookie, isConfigured, safeEqual } = require("./_auth");

const json = (res, status, body) => {
  res.status(status);
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
};

const readBody = async (req) => {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") return JSON.parse(req.body || "{}");
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
};

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    json(res, 405, { error: "POST 요청만 지원합니다." });
    return;
  }

  if (!isConfigured()) {
    json(res, 500, { error: "앱 비밀번호가 아직 설정되지 않았습니다." });
    return;
  }

  try {
    const { password } = await readBody(req);
    if (!safeEqual(password, process.env.APP_PASSWORD)) {
      json(res, 401, { error: "비밀번호가 맞지 않습니다." });
      return;
    }

    res.setHeader("Set-Cookie", authCookie());
    json(res, 200, { ok: true });
  } catch {
    json(res, 400, { error: "로그인 요청을 읽지 못했습니다." });
  }
};
