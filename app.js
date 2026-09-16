const API_URL = "https://media-drop-p8ajsfbah-tshifhiwamashau53-4996.vercel.app/api/download";

const form = document.getElementById("downloadForm");
const urlInput = document.getElementById("url");
const button = document.getElementById("downloadBtn");
const status = document.getElementById("status");
const result = document.getElementById("result");

function setStatus(message, type = "") {
  status.textContent = message;
  status.className = `status ${type}`;
}

function showError(message) {
  result.classList.remove("hidden");
  result.innerHTML = "";
  const box = document.createElement("div");
  box.className = "error-box";
  const title = document.createElement("strong");
  title.textContent = "Could not prepare this media";
  const text = document.createElement("p");
  text.textContent = message;
  const note = document.createElement("small");
  note.textContent = "Use a public media link you have permission to save. Some platforms or private posts may not be available.";
  box.append(title, text, note);
  result.appendChild(box);
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
  video.addEventListener("error", () => {
    setStatus("The media was found, but this browser could not play the returned file.", "error");
  });
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
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.download = filename || "media";
  link.textContent = "Download highest quality";
  result.appendChild(link);
}

function showResult(data) {
  result.classList.remove("hidden");
  result.innerHTML = "";

  if (data.status === "picker" && Array.isArray(data.picker)) {
    const item = data.picker.find(item => item.url && /video/i.test(item.type || "")) || data.picker.find(item => item.url);
    if (!item) throw new Error("No downloadable media was returned.");

    const heading = document.createElement("h2");
    heading.textContent = "Preview your video";
    result.appendChild(heading);
    addVideoPreview(item.url, item.filename || "");
    addDownloadButton(item.url, item.filename || "media.mp4");
    return;
  }

  if (["redirect", "tunnel", "local-processing"].includes(data.status)) {
    if (!data.url) throw new Error("The processing service returned no media URL.");

    const heading = document.createElement("h2");
    heading.textContent = "Preview your video";
    result.appendChild(heading);
    addVideoPreview(data.url, data.filename || "");
    addDownloadButton(data.url, data.filename || "media.mp4");
    return;
  }

  throw new Error(data.error?.code || "Unsupported or unavailable public media link.");
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

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ url })
    });

    const contentType = response.headers.get("content-type") || "";
    const data = contentType.includes("application/json")
      ? await response.json()
      : { error: `Backend returned HTTP ${response.status}.` };

    if (!response.ok || data.status === "error" || data.error) {
      throw new Error(data.error?.code || data.error || `Request failed (HTTP ${response.status})`);
    }

    showResult(data);
    setStatus("Video ready. Preview it before downloading.", "success");
  } catch (error) {
    console.error(error);
    setStatus("The downloader could not process this link.", "error");
    showError(error?.message || "Unknown downloader error.");
  } finally {
    button.disabled = false;
  }
});
