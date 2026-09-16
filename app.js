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

function showResult(data) {
  result.classList.remove("hidden");
  result.innerHTML = "";

  if (data.status === "picker" && Array.isArray(data.picker)) {
    const heading = document.createElement("h2");
    heading.textContent = "Media ready";
    result.appendChild(heading);

    data.picker.forEach((item, index) => {
      if (!item.url) return;
      const link = document.createElement("a");
      link.className = "primary-link";
      link.href = item.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.download = `media-${index + 1}`;
      link.textContent = `Save ${item.type || "media"}`;
      result.appendChild(link);
    });
    return;
  }

  if (data.status === "redirect" || data.status === "tunnel" || data.status === "local-processing") {
    const link = document.createElement("a");
    link.className = "primary-link";
    link.href = data.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.download = data.filename || "media";
    link.textContent = "Save highest quality";
    result.appendChild(link);

    if (data.filename) {
      const name = document.createElement("p");
      name.textContent = data.filename;
      result.appendChild(name);
    }
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
  setStatus("Finding the highest available quality…");

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
    setStatus("Highest available quality is ready.", "success");
  } catch (error) {
    setStatus("The downloader service could not process that link. Try a public media link again.", "error");
    result.classList.remove("hidden");
    result.innerHTML = "";

    const message = document.createElement("p");
    message.textContent = "The download service is unavailable for this link right now.";
    result.appendChild(message);
  } finally {
    button.disabled = false;
  }
});
