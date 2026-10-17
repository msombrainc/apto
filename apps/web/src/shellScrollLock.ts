/** Keep `documentElement` / `body` scrollTop at 0 while the authenticated shell is mounted (apto#112). */
export function installDocumentScrollLock(
  doc: Document = document,
  win: Window = window,
): () => void {
  const html = doc.documentElement;
  const body = doc.body;
  html.scrollTop = 0;
  body.scrollTop = 0;
  const onScroll = () => {
    if (html.scrollTop !== 0) html.scrollTop = 0;
    if (body.scrollTop !== 0) body.scrollTop = 0;
  };
  win.addEventListener("scroll", onScroll, { passive: true });
  return () => win.removeEventListener("scroll", onScroll);
}
