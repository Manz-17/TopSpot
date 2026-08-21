// pages/api/fetch-link-meta.js
// Given a URL, returns { title, thumbnail } by:
// - Using YouTube's known thumbnail pattern for YouTube links
// - Otherwise fetching the page and reading its <title> and og:image tags

export default async function handler(req, res) {
  const { url } = req.query;
  if (!url) {
    return res.status(400).json({ error: 'Missing url' });
  }

  try {
    const youtubeId = extractYouTubeId(url);
    if (youtubeId) {
      const title = await fetchYouTubeTitle(youtubeId);
      return res.status(200).json({
        title: title || 'YouTube Video',
        thumbnail: `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`,
      });
    }

    // Generic page: fetch HTML and pull title + og:image
    const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const html = await response.text();

    const title =
      matchTag(html, /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) ||
      matchTag(html, /<title>([^<]+)<\/title>/i) ||
      url;

    const image = matchTag(html, /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);

    return res.status(200).json({
      title: decodeHtml(title.trim()),
      thumbnail: image || null,
    });
  } catch (err) {
    return res.status(200).json({ title: url, thumbnail: null });
  }
}

function extractYouTubeId(url) {
  const patterns = [
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

async function fetchYouTubeTitle(videoId) {
  try {
    const res = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
    const data = await res.json();
    return data.title;
  } catch {
    return null;
  }
}

function matchTag(html, regex) {
  const m = html.match(regex);
  return m ? m[1] : null;
}

function decodeHtml(str) {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}
