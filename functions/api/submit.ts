/**
 * 小园地留言接收端
 *
 * 触发：访客在文章页提交留言表单时被 POST 调用
 * 路径：/api/submit
 *
 * 需要的 Cloudflare Pages 环境变量：
 *   - RESEND_API_KEY  ：Resend 的 API key（resend.com 后台创建）
 *   - NOTIFY_EMAIL    ：留言通知发送到的邮箱
 */

interface Env {
  RESEND_API_KEY: string;
  NOTIFY_EMAIL: string;
}

interface Payload {
  name?: string;
  message?: string;
  post?: string;
  /** 蜜罐字段——人类看不见，机器人填了就拒 */
  website?: string;
}

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  const { request, env } = ctx;

  // 解析 payload（支持 JSON 或 multipart form）
  let body: Payload;
  try {
    const ct = request.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      body = await request.json();
    } else {
      const form = await request.formData();
      body = {
        name: (form.get("name") as string) || undefined,
        message: form.get("message") as string,
        post: (form.get("post") as string) || undefined,
        website: (form.get("website") as string) || undefined,
      };
    }
  } catch {
    return json({ ok: false, error: "Invalid payload" }, 400);
  }

  // 反垃圾：蜜罐被填，假装成功（不让机器人察觉）
  if (body.website && body.website.trim() !== "") {
    return json({ ok: true });
  }

  // 校验
  if (!body.message || body.message.trim().length < 1) {
    return json({ ok: false, error: "留言内容不能为空" }, 400);
  }
  if (body.message.length > 5000) {
    return json({ ok: false, error: "留言太长（上限 5000 字）" }, 400);
  }

  // 配置缺失
  if (!env.RESEND_API_KEY || !env.NOTIFY_EMAIL) {
    console.error("Missing env vars: RESEND_API_KEY or NOTIFY_EMAIL");
    return json({ ok: false, error: "服务未就绪，请稍后再试" }, 503);
  }

  const safeName = (body.name?.trim() || "匿名小伙伴").slice(0, 100);
  const safePost = (body.post?.trim() || "未知文章").slice(0, 200);
  const safeMessage = body.message.trim().slice(0, 5000);

  const subject = `[小园地留言] ${safePost} — ${safeName}`;
  const text = [
    `📍 文章：${safePost}`,
    `🙋 来自：${safeName}`,
    "",
    "留言内容：",
    "—".repeat(30),
    safeMessage,
    "—".repeat(30),
    "",
    "（来自 jojomind.com 文章页留言区）",
  ].join("\n");

  // 调用 Resend
  try {
    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "小园地 <onboarding@resend.dev>",
        to: env.NOTIFY_EMAIL,
        subject,
        text,
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error("Resend API error:", resp.status, errText);
      return json({ ok: false, error: "邮件投递失败" }, 502);
    }
  } catch (e) {
    console.error("Fetch to Resend failed:", e);
    return json({ ok: false, error: "服务器错误" }, 500);
  }

  return json({ ok: true });
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}
