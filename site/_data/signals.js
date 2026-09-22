import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

// Every daily briefing carries the same six fixed "Watchlist" subsections
// (see briefed's daily-digest pipeline) — each either reports real signal or
// says "No meaningful new signal found in this window." Four of them map
// directly onto the consulting page's "Three flows. One trust layer."
// framework, so this counts how many of the published days actually had
// reportable movement per flow. Recomputed from site/posts on every build,
// so it never goes stale as new briefings land.
const CATEGORIES = [
  { heading: "Agentic Commerce Checkout: ACP, UCP, And AP2", label: "Commerce" },
  { heading: "Agentic Machine Payments: X402 And Stripe MPP", label: "Machine Payments" },
  { heading: "Agent Payment Identity And Authorization: Visa TAP And Mastercard Agent Pay", label: "Trust" },
  { heading: "Agentic Treasury And Business Banking Agents", label: "Treasury" }
];

function formatDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

// Chart geometry for the trend sparkline (site/consulting.njk's <svg viewBox
// "0 0 680 136">) — plot area is y:[10,110], baseline at y:120, axis labels
// at y:128.
const CHART_WIDTH = 680;
const PLOT_TOP = 10;
const PLOT_BOTTOM = 110;

function buildTrend(files, postsDir) {
  const daily = files
    .map((file) => {
      const text = readFileSync(resolve(postsDir, file), "utf8");
      const cand = text.match(/Candidates reviewed:\*\* (\d+)/);
      return cand ? { date: file.slice(0, 10), n: parseInt(cand[1], 10) } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.date.localeCompare(b.date));

  const n = daily.length;
  if (n < 2) return null;

  // 7-day rolling average smooths day-to-day noise so the underlying trend
  // (not e.g. a single unusually busy day) is what the line shows.
  const rolling = daily.map((_, i) => {
    const slice = daily.slice(Math.max(0, i - 6), i + 1);
    return slice.reduce((sum, d) => sum + d.n, 0) / slice.length;
  });

  const min = Math.min(...rolling);
  const max = Math.max(...rolling);
  const xAt = (i) => Math.round((i / (n - 1)) * CHART_WIDTH);
  const yAt = (v) => Math.round(PLOT_TOP + (1 - (v - min) / (max - min || 1)) * (PLOT_BOTTOM - PLOT_TOP));

  const points = rolling.map((v, i) => `${xAt(i)},${yAt(v)}`).join(" ");

  const monthTicks = daily
    .map((d, i) => ({ i, date: d.date }))
    .filter(({ i, date }) => i > 0 && i < n - 1 && date.slice(8, 10) === "01")
    .map(({ i, date }) => ({ x: xAt(i), label: formatDate(date) }));

  const half = Math.floor(n / 2);
  const firstHalfAvg = daily.slice(0, half).reduce((s, d) => s + d.n, 0) / half;
  const secondHalfAvg = daily.slice(n - half).reduce((s, d) => s + d.n, 0) / half;
  const growthPercent = firstHalfAvg ? Math.round(((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100) : 0;

  return {
    points,
    startX: xAt(0),
    startY: yAt(rolling[0]),
    startValue: Math.round(rolling[0]),
    endX: xAt(n - 1),
    endY: yAt(rolling[n - 1]),
    endValue: Math.round(rolling[n - 1]),
    startLabel: formatDate(daily[0].date),
    endLabel: formatDate(daily[n - 1].date),
    monthTicks,
    growthPercent
  };
}

export default function () {
  const postsDir = resolve(process.cwd(), "site/posts");
  const files = readdirSync(postsDir).filter((f) => f.endsWith(".md")).sort();

  const counts = Object.fromEntries(CATEGORIES.map((c) => [c.heading, { days: 0, items: 0 }]));

  for (const file of files) {
    const lines = readFileSync(resolve(postsDir, file), "utf8").split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line.startsWith("### ")) continue;
      const category = CATEGORIES.find((c) => c.heading === line.slice(4));
      if (!category) continue;

      let bullets = 0;
      let noSignal = false;
      let j = i + 1;
      while (j < lines.length && !lines[j].trim().startsWith("#")) {
        const item = lines[j].trim();
        if (item.startsWith("- ")) {
          bullets++;
          if (item.includes("No meaningful new signal found")) noSignal = true;
        }
        j++;
      }
      if (!noSignal && bullets > 0) {
        counts[category.heading].days++;
        counts[category.heading].items += bullets;
      }
    }
  }

  const totalDays = files.length;
  const categories = CATEGORIES.map((c) => ({
    label: c.label,
    days: counts[c.heading].days,
    percent: totalDays ? Math.round((counts[c.heading].days / totalDays) * 100) : 0
  })).sort((a, b) => b.percent - a.percent);

  const dates = files.map((f) => f.slice(0, 10)).sort();
  const firstDate = dates[0];
  const lastDate = dates[dates.length - 1];
  const dateRange = firstDate && lastDate
    ? `${formatDate(firstDate)} – ${formatDate(lastDate)}, ${lastDate.slice(0, 4)}`
    : "";

  const trend = buildTrend(files, postsDir);

  return { categories, totalDays, dateRange, trend };
}
