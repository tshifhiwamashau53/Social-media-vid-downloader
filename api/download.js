export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { url } = req.body || {};

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

    const response = await fetch("https://api.cobalt.tools/api/json", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "User-Agent": "MediaDrop/1.0"
      },
      body: JSON.stringify({
        url,
        vQuality: "max",
        vCodec: "h264",
        aFormat: "best",
        filenameStyle: "basic",
        downloadMode: "auto"
      })
    });

    const contentType = response.headers.get("content-type") || "";
    const data = contentType.includes("application/json")
      ? await response.json()
      : null;

    if (!response.ok || !data) {
      return res.status(502).json({
        error: "The media processing service is unavailable for this link right now."
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
