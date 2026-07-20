import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const distDir = resolve(root, "dist");
const outputDir = resolve(root, "portable");
const sourceHtml = await readFile(resolve(distDir, "index.html"), "utf8");

const scriptMatch = sourceHtml.match(/<script[^>]+src="([^"]+)"[^>]*><\/script>/);
const styleMatch = sourceHtml.match(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"[^>]*>/);

if (!scriptMatch || !styleMatch) {
  throw new Error("Unable to locate the generated JavaScript or CSS assets.");
}

const assetPath = (relativePath) => resolve(distDir, relativePath.replace(/^\.\//, ""));
const script = (await readFile(assetPath(scriptMatch[1]), "utf8")).replaceAll("</script", "<\\/script");
const style = (await readFile(assetPath(styleMatch[1]), "utf8"))
  .replaceAll('url("/media/', 'url("./media/')
  .replaceAll("url('/media/", "url('./media/")
  .replaceAll("url(/media/", "url(./media/")
  .replaceAll('url("../media/', 'url("./media/')
  .replaceAll("url('../media/", "url('./media/")
  .replaceAll("url(../media/", "url(./media/");

const portableHtml = sourceHtml
  .replace(/\s*<link[^>]+href="https:\/\/fonts\.(?:googleapis|gstatic)\.com[^>]*>\s*/g, "\n")
  .replace(styleMatch[0], () => `<style>${style}</style>`)
  .replace(scriptMatch[0], "")
  .replace("</body>", () => `<script>${script}</script>\n  </body>`);

await mkdir(outputDir, { recursive: true });
await writeFile(resolve(outputDir, "index.html"), portableHtml);
await cp(resolve(distDir, "media"), resolve(outputDir, "media"), { recursive: true, force: true });

console.log(`Portable build created at ${outputDir}`);
