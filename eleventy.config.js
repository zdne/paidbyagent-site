export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("site/style.css");
  eleventyConfig.addPassthroughCopy("site/CNAME");
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
    // Defaults to root for local dev and the eventual paidbyagent.com custom
    // domain; set by CI (via actions/configure-pages) to "/<repo>/" while
    // testing on the default github.io project-page URL, where the site is
    // served under a subpath instead of at the domain root.
    pathPrefix: process.env.PATH_PREFIX || "/",
    dir: {
      input: "site",
      output: "site/_site",
      includes: "_includes"
    }
  };
}
