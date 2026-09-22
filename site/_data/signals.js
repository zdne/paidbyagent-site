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

  return { categories, totalDays, dateRange };
}
