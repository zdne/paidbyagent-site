export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("site/style.css");
  eleventyConfig.addPassthroughCopy("site/robots.txt");
  eleventyConfig.addPassthroughCopy("site/favicon.svg");
  eleventyConfig.addPassthroughCopy("site/favicon.png");
  eleventyConfig.addPassthroughCopy("site/og-map.png");
  eleventyConfig.addPassthroughCopy("site/og-consulting.png");
  eleventyConfig.addPassthroughCopy("site/logos@2x.png");

  eleventyConfig.addFilter("readableDate", (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
  });

  eleventyConfig.addFilter("isoDate", (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toISOString().slice(0, 10);
  });

  return {
    // Served at the domain root on Cloudflare Pages (both the paidbyagent.com
    // custom domain and *.pages.dev preview URLs), so this is always "/" in
    // practice. PATH_PREFIX is kept as an override for local testing of a
    // subpath deploy, should that ever be needed again.
    pathPrefix: process.env.PATH_PREFIX || "/",
    dir: {
      input: "site",
      output: "site/_site",
      includes: "_includes"
    }
  };
}
