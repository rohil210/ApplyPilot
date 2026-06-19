(() => {
  const JOB_KEYWORDS = [
    "hiring", "we are hiring", "looking for", "job opening", "opportunity",
    "data engineer", "data engineering", "immediate joiner", "share your resume",
    "send your resume", "apply"
  ];

  const CARD_SELECTORS = [
    "div.feed-shared-update-v2",
    "div[data-urn]",
    "article",
    "li"
  ].join(",");

  function isVisible(element) {
    const style = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return style.display !== "none" &&
      style.visibility !== "hidden" &&
      Number(style.opacity) !== 0 &&
      rect.width > 0 &&
      rect.height > 0 &&
      rect.bottom >= 0 &&
      rect.top <= window.innerHeight;
  }

  function normalizeText(text) {
    return text.replace(/\s+/g, " ").trim();
  }

  function absoluteHref(anchor) {
    try {
      return new URL(anchor.href, window.location.href).href;
    } catch (_) {
      return "";
    }
  }

  function findLink(card, patterns) {
    const anchor = Array.from(card.querySelectorAll("a[href]"))
      .find((item) => patterns.some((pattern) => absoluteHref(item).includes(pattern)));
    return anchor ? absoluteHref(anchor) : "";
  }

  function extractRecruiter(card) {
    const profileAnchor = Array.from(card.querySelectorAll('a[href*="/in/"]'))
      .find((anchor) => normalizeText(anchor.innerText || anchor.textContent || ""));
    if (!profileAnchor) return { recruiter_name: "", recruiter_profile_url: "" };

    const name = normalizeText(profileAnchor.innerText || profileAnchor.textContent || "")
      .split(/\n|\s{2,}/)[0]
      .replace(/\s*[•·].*$/, "")
      .trim();
    return {
      recruiter_name: name.slice(0, 120),
      recruiter_profile_url: absoluteHref(profileAnchor)
    };
  }

  function extractVisibleLeads() {
    const candidates = Array.from(document.querySelectorAll(CARD_SELECTORS));
    const seen = new Set();
    const posts = [];

    for (const card of candidates) {
      if (!isVisible(card)) continue;
      const fullPostText = normalizeText(card.innerText || card.textContent || "");
      if (fullPostText.length < 80) continue;

      const lowerText = fullPostText.toLowerCase();
      if (!JOB_KEYWORDS.some((keyword) => lowerText.includes(keyword))) continue;

      // Broad fallback selectors overlap, so text and stable post links prevent repeats.
      const postUrl = findLink(card, ["/feed/update/", "/posts/", "/jobs/view/"]);
      const visibleLinks = Array.from(card.querySelectorAll("a[href]"))
        .filter(isVisible)
        .map(absoluteHref)
        .filter(Boolean);
      const visibleKey = postUrl || fullPostText.toLowerCase().slice(0, 500);
      if (seen.has(visibleKey)) continue;
      seen.add(visibleKey);

      posts.push({
        full_post_text: fullPostText,
        source_url: window.location.href,
        post_url: postUrl,
        ...extractRecruiter(card),
        visible_links: [...new Set(visibleLinks)],
        extracted_at: new Date().toISOString()
      });
    }

    return posts;
  }

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type !== "APPLYPILOT_EXTRACT_VISIBLE") return false;

    try {
      const posts = extractVisibleLeads();
      sendResponse({ ok: true, posts, visibleCount: posts.length });
    } catch (error) {
      sendResponse({ ok: false, error: error.message || "Extraction failed" });
    }
    return true;
  });
})();
