const API_URL = "https://api.cobalt.tools/";

const form = document.getElementById("downloadForm");
const urlInput = document.getElementById("url");
const button = document.getElementById("downloadBtn");
const status = document.getElementById("status");
const result = document.getElementById("result");

function setStatus(message, type = "") {
  status.textContent = message;
  status.className = `status ${type}`;
}

function addVideoPreview(url, filename = "") {
  const preview = document.createElement("div");
  preview.className = "preview-box";

  const label = document.createElement("div");
  label.className = "preview-label";
  label.textContent = "PREVIEW";
  preview.appendChild(label);

  const video = document.createElement("video");
  video.className = "media-preview";
  video.controls = true;
  video.playsInline = true;
  video.preload = "metadata";
  video.src = url;
  video.setAttribute("aria-label", "Downloaded media preview");
  preview.appendChild(video);

  if (filename) {
    const name = document.createElement("p");
    name.className = "filename";
    name.textContent = filename;
    preview.appendChild(name);
  }

  result.appendChild(preview);
}

function addDownloadButton(url, filename = "media") {
  const link = document.createElement("a");
  link.className = "primary-link";
  link.href = url;
  link.download = filename || "media";
  link.textContent = "Download highest quality";
  result.appendChild(link);
}

function showResult(data) {
  result.classList.remove("hidden");
  result.innerHTML = "";

  if (data.status === "picker" && Array.isArray(data.picker)) {
    const videoItem = data.picker.find(item => item.url && /video/i.test(item.type || ""));
    const item = videoItem || data.picker.find(item => item.url);

    if (!item) throw new Error("No downloadable media was returned.");

    const heading = document.createElement("h2");
    heading.textContent = "Preview your video";
    result.appendChild(heading);

    addVideoPreview(item.url, item.filename || "");
    addDownloadButton(item.url, item.filename || "media.mp4");
    return;
  }

  if (data.status === "redirect" || data.status === "tunnel" || data.status === "local-processing") {
    if (!data.url) throw new Error("The downloader returned no media URL.");

    const heading = document.createElement("h2");
    heading.textContent = "Preview your video";
    result.appendChild(heading);

    addVideoPreview(data.url, data.filename || "");
    addDownloadButton(data.url, data.filename || "media.mp4");
    return;
  }

  throw new Error(data.error?.code || "The downloader could not process this link.");
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const url = urlInput.value.trim();
  if (!url) return;

  try {
    new URL(url);
  } catch {
    setStatus("Please enter a valid link.", "error");
    return;
  }

  button.disabled = true;
  result.classList.add("hidden");
  setStatus("Preparing the highest available quality…");

  const body = {
    url,
    videoQuality: "max",
    downloadMode: "auto",
    audioFormat: "mp3",
    youtubeVideoCodec: "h264",
    youtubeVideoContainer: "mp4",
    filenameStyle: "basic"
  };

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    if (!response.ok || data.status === "error") {
      throw new Error(data.error?.code || `Request failed (${response.status})`);
    }

    showResult(data);
    setStatus("Video ready. Preview it before downloading.", "success");
  } catch (error) {
    const reason = error?.message || "Unknown downloader error";
    setStatus("The downloader service could not process that link.", "error");
    result.classList.remove("hidden");
    result.innerHTML = "";

    const message = document.createElement("p");
    message.textContent = `Reason: ${reason}`;
    result.appendChild(message);
  } finally {
    button.disabled = false;
  }
});
