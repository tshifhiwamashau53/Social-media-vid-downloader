export default function handler(req, res) {
  res.status(200).json({
    ok: true,
    service: "media-drop-api",
    message: "API is running"
  });
}
