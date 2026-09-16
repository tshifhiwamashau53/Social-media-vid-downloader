const API_URL = "https://api.cobalt.tools/";

const form = document.getElementById("downloadForm");
const urlInput = document.getElementById("url");
const modeInput = document.getElementById("mode");
const qualityInput = document.getElementById("quality");
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
    heading.textContent = "Choose a file";
    result.appendChild(heading);

    data.picker.forEach((item, index) => {
      if (!item.url) return;
      const link = document.createElement("a");
      link.className = "result-link";
      link.href = item.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.download = `media-${index + 1}`;
      link.textContent = `Download ${item.type || "media"} ${index + 1}`;
      result.appendChild(link);
    });
    return;
  }

  if (data.status === "redirect" || data.status === "tunnel") {
    const link = document.createElement("a");
    link.className = "primary-link";
    link.href = data.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.download = data.filename || "media";
    link.textContent = "Save media";
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
  setStatus("Preparing your download…");

  const body = {
    url,
    videoQuality: qualityInput.value,
    downloadMode: modeInput.value === "audio" ? "audio" : "auto",
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
    setStatus("Your media is ready.", "success");
  } catch (error) {
    setStatus("The downloader service could not process that link. You can try again with a public media link.", "error");
    result.classList.remove("hidden");
    result.innerHTML = "";

    const fallback = document.createElement("a");
    fallback.className = "secondary-link";
    fallback.href = `https://cobalt.tools/#${encodeURIComponent(url)}`;
    fallback.target = "_blank";
    fallback.rel = "noopener noreferrer";
    fallback.textContent = "Open in the compatible downloader";
    result.appendChild(fallback);
  } finally {
    button.disabled = false;
  }
});
