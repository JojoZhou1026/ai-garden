const API_URL = "https://aihot.virxact.com/api/public/items";
const TOP_N = 20;
const OFFSET_MS = 8 * 60 * 60 * 1000;

const formatDate = (date) => date.toISOString().slice(0, 10);

function getPreviousIsoWeekWindow(now = new Date()) {
  const bjNow = new Date(now.getTime() + OFFSET_MS);
  const day = bjNow.getUTCDay() || 7;
  const thisMondayBj = Date.UTC(
    bjNow.getUTCFullYear(),
    bjNow.getUTCMonth(),
    bjNow.getUTCDate() - day + 1,
    0,
    0,
    0,
    0
  );
  const startBj = thisMondayBj - 7 * 24 * 60 * 60 * 1000;
  const endBj = thisMondayBj - 1;

  return {
    startBj: new Date(startBj),
    endBj: new Date(endBj),
    startUtc: new Date(startBj - OFFSET_MS),
    endUtc: new Date(endBj - OFFSET_MS),
  };
}

function categoryLabel(category = "") {
  const map = {
    "ai-models": "模型",
    "ai-products": "产品",
    industry: "产业",
    paper: "研究",
    tip: "方法",
  };
  return map[category] ?? category;
}

function likelyReason(item) {
  const title = `${item.title} ${item.title_en ?? ""}`.toLowerCase();
  const source = `${item.source ?? ""}`.toLowerCase();
  const text = `${title} ${item.summary}`.toLowerCase();
  if (/security|漏洞|提示词注入|泄露|隐私|后门|风险|僵尸网络|删光|深度伪造/.test(text)) {
    return "安全边界相关";
  }
  if (/voice|video|image|语音|视频|图像|多模态/.test(text)) {
    return "普通用户可感知";
  }
  if (/work|agent|codex|copilot|claude code|chatgpt work|智能体|代理|工作流/.test(text)) {
    return "工作方式相关";
  }
  if (/openai|google|apple|microsoft|meta|nvidia|anthropic|字节|腾讯|阿里|苹果|微软|英伟达/.test(`${title} ${source}`)) {
    return "大厂动向";
  }
  if (item.category === "ai-models") return "模型能力变化";
  if (item.category === "ai-products") return "产品落地相关";
  if (item.category === "industry") return "产业变化相关";
  return "精选候选";
}

function truncate(text = "", length = 120) {
  const compact = text.replace(/\s+/g, " ").trim();
  return compact.length > length ? `${compact.slice(0, length)}...` : compact;
}

async function fetchSelectedItems(window) {
  const url = new URL(API_URL);
  url.searchParams.set("mode", "selected");
  url.searchParams.set("since", window.startUtc.toISOString());
  url.searchParams.set("take", "100");

  const res = await fetch(url, {
    headers: { "user-agent": "ai-garden-weekly-picks/1.0" },
  });

  if (!res.ok) {
    throw new Error(`AI HOT API failed: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return data.items ?? [];
}

function filterAndRank(items, window) {
  return items
    .filter((item) => {
      const publishedAt = new Date(item.publishedAt);
      return publishedAt >= window.startUtc && publishedAt <= window.endUtc;
    })
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, TOP_N);
}

function renderMarkdown(items, window) {
  const range = `${formatDate(window.startBj).slice(5).replace("-", "/")}-${formatDate(window.endBj).slice(5).replace("-", "/")}`;
  const lines = [
    `# ${range} AI HOT精选候选Top${TOP_N}`,
    "",
    `时间窗：北京时间 ${formatDate(window.startBj)} 00:00 - ${formatDate(window.endBj)} 23:59`,
    `生成时间：${new Date().toISOString()}`,
    "",
  ];

  items.forEach((item, index) => {
    lines.push(`## ${index + 1}. ${item.title}`);
    lines.push("");
    lines.push(`- 日期：${formatDate(new Date(item.publishedAt))}`);
    lines.push(`- 分数：${item.score ?? "N/A"}`);
    lines.push(`- 类型：${categoryLabel(item.category)}`);
    lines.push(`- 初筛理由：${likelyReason(item)}`);
    lines.push(`- 原文：${item.url}`);
    lines.push(`- 摘要：${truncate(item.summary)}`);
    lines.push("");
  });

  return lines.join("\n");
}

const window = getPreviousIsoWeekWindow();
const items = await fetchSelectedItems(window);
const ranked = filterAndRank(items, window);

if (ranked.length === 0) {
  console.log("没有取到上周AI HOT精选候选。");
  process.exit(0);
}

console.log(renderMarkdown(ranked, window));
