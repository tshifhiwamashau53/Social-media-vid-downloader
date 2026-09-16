export default async function handler(req, res) {
  // Accept both methods so the endpoint is easy to test and works across
  // static/frontend deployments that may probe the API with GET first.
  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(405).json({
      error: "Method not allowed. Use POST or GET with a media URL."
    });
  }

  try {
    const url = req.method === "GET"
      ? req.query?.url
      : req.body?.url;

    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "A media URL is required." });
    }

    let parsed;
    try {
      parsed = new URL(url);
    } catch {
      return res.status(400).json({ error: "Invalid URL." });
    }

    if (!["http:", "https:"].includes(parsed.protocol)) {
      return res.status(400).json({ error: "Only HTTP and HTTPS links are supported." });
    }

    const upstream = await fetch("https://api.cobalt.tools/api/json", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "User-Agent": "MediaDrop/1.0"
      },
      body: JSON.stringify({
        url,
        videoQuality: "max",
        videoCodec: "h264",
        audioFormat: "best",
        filenameStyle: "basic",
        downloadMode: "auto"
      })
    });

    const contentType = upstream.headers.get("content-type") || "";
    const raw = await upstream.text();
    let data = null;

    if (contentType.includes("application/json")) {
      try {
        data = JSON.parse(raw);
      } catch {
        data = null;
      }
    }

    if (!upstream.ok || !data) {
      return res.status(502).json({
        error: `Media processor returned HTTP ${upstream.status}.`
      });
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
