const baseUrl = import.meta.env.BASE_URL || "/";

export function mediaUrl(path: string) {
  if (/^(?:https?:|data:|blob:)/.test(path)) return path;
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  if (path.startsWith(normalizedBase)) return path;
  const normalizedPath = path.replace(/^\.?\//, "");
  return `${normalizedBase}${normalizedPath}`;
}

export function mediaCssUrl(path: string) {
  return `url("${mediaUrl(path).replace(/"/g, '\\"')}")`;
}
