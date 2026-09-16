export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept");

  if (req.method === "OPTIONS") return res.status(204).end();

  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed. Use POST or GET." });
  }

  const url = req.method === "GET" ? req.query?.url : req.body?.url;

  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: "A media URL is required." });
  }

  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return res.status(400).json({ error: "Only HTTP and HTTPS links are supported." });
    }
  } catch {
    return res.status(400).json({ error: "Invalid URL." });
  }

  const apiUrl = process.env.COBALT_API_URL || "https://api.cobalt.tools/api/json";
  const apiKey = process.env.COBALT_API_KEY;

  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
    "User-Agent": "MediaDrop/1.0"
  };

  if (apiKey) headers.Authorization = `Api-Key ${apiKey}`;

  try {
    const upstream = await fetch(apiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        url,
        videoQuality: "max",
        audioFormat: "best",
        filenameStyle: "basic",
        downloadMode: "auto",
        youtubeVideoCodec: "h264"
      })
    });

    const raw = await upstream.text();
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      data = null;
    }

    if (!upstream.ok) {
      console.error("cobalt-upstream", upstream.status, raw.slice(0, 500));
      return res.status(502).json({
        error: `Media processor returned HTTP ${upstream.status}.`,
        details: raw.slice(0, 300)
      });
    }

    if (!data) {
      return res.status(502).json({ error: "Media processor returned an invalid response." });
    }

    if (data.status === "error") {
      return res.status(502).json({
        error: data.error?.code || "The media processing service could not process this link."
      });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error("download-api-error", error);
    return res.status(502).json({
      error: "The downloader backend could not reach the media processing service."
    });
  }
}
