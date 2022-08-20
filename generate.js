const {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  statSync,
  copyFileSync,
} = require("fs");
const url = require("url");
const markdown = require("markdown-it");
const { getHighlighter } = require("shiki");
const path = require("path");
const { read } = require("gray-matter");
const glob = require("glob");

// CONFIG
const siteName = "Cool Blog";
// END CONFIG

getHighlighter({
  theme: "one-dark-pro",
}).then((highlighter) => {
  const files = glob
    .sync("**/*.md", { ignore: ["**/node_modules/**", "README.md"] })
    .map((filename) => {
      const matter = read(filename);
      return [filename, matter];
    });
  files.forEach(([file, matter]) => {
    const md = markdown({
      html: true,
      highlight: (code, lang) => {
        return highlighter.codeToHtml(code, { lang });
      },
    });
    const content = matter.content.replace(
      /^--list ([a-zA-Z\/]+)--$/gm,
      (s, folder) => {
        return files
          .filter((v) => v[0].startsWith(folder))
          .sort((a, b) => statSync(a[0]).birthtime + statSync(b[0]).birthtime)
          .map(
            (v) =>
              `[${v[1].data.title} (${statSync(
                v[0]
              ).birthtime.toLocaleString()})](${v[0]
                .replace(
                  /\.[^/.]+$/,

                  ".html"
                )
                .replace(" ", "%20")})`
          )
          .join("\n\n");
      }
    );
    const html = md.render(content);
    const out = `
		<html lang="en">
		<head>
		<title>${matter.data.title ?? "NO TITLE FOUND"} - ${siteName}</title>
		<link rel="stylesheet" href="/style.css">
		</head>
		<body>
    ${
      !("title" in matter.data)
        ? "<h1>NO TITLE FOUND</h1><br/><p>Add front matter with a title property!</p>"
        : ""
    }
		${html}
		</body>
	  `;
    if (!existsSync("build/" + path.dirname(file)))
      mkdirSync("build/" + path.dirname(file), { recursive: true });
    writeFileSync("build/" + file.replace(/\.[^/.]+$/, ".html"), out);
    writeFileSync("build/style.css", readFileSync("style.css"));
  });
  if (existsSync("favicon.ico"))
    copyFileSync("favicon.ico", "build/favicon.ico");
  console.log("done");
});
