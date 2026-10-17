/** Keep document scroll at 0 while the authenticated shell is mounted (apto#107 / #112). */
export function resetDocumentScrollTops(
  html: { scrollTop: number },
  body: { scrollTop: number },
): void {
  html.scrollTop = 0;
  body.scrollTop = 0;
}

export function handleDocumentScroll(
  html: { scrollTop: number },
  body: { scrollTop: number },
): void {
  if (html.scrollTop !== 0) html.scrollTop = 0;
  if (body.scrollTop !== 0) body.scrollTop = 0;
}
