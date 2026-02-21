const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const video = document.getElementById("baseVideo");
const image = new Image();
const progressBar = document.getElementById("progressBar");

canvas.width = 1920;
canvas.height = 1080;

// ─────────────────────────────
// LOAD SESSION DATA
// ─────────────────────────────
const imageData = sessionStorage.getItem("uploadedImage");
const userName = sessionStorage.getItem("characterName");
const started = sessionStorage.getItem("generationStarted");

if (!imageData || !userName || !started) {
  alert("Missing data. Please start again.");
  window.location.href = "upload.html";
}

image.src = imageData;

// ─────────────────────────────
// TIMING (seconds)
// ─────────────────────────────
const IMAGE_DURATION = 2;
const TEXT_START = 2.5;
const TEXT_DURATION = 8;
const FADE_DURATION = 3;

// ─────────────────────────────
let recorder;
let chunks = [];
let audioContext;

// ─────────────────────────────
// WAIT FOR IMAGE + VIDEO METADATA
// ─────────────────────────────
Promise.all([
  new Promise(res => (image.onload = res)),
  new Promise(res =>
    video.addEventListener("loadedmetadata", res, { once: true })
  )
]).then(startGeneration);

// ─────────────────────────────
// START GENERATION
// ─────────────────────────────
async function startGeneration() {
  chunks = [];

  audioContext = new AudioContext();
  await audioContext.resume();

  const source = audioContext.createMediaElementSource(video);
  const destination = audioContext.createMediaStreamDestination();

  source.connect(destination);
  source.connect(audioContext.destination);

  const canvasStream = canvas.captureStream(30);

  const combinedStream = new MediaStream([
    ...canvasStream.getVideoTracks(),
    ...destination.stream.getAudioTracks()
  ]);

  recorder = new MediaRecorder(combinedStream, {
    mimeType: "video/webm;codecs=vp9,opus"
  });

  recorder.ondataavailable = e => {
    if (e.data && e.data.size > 0) {
      chunks.push(e.data);
    }
  };

  recorder.onstop = () => {
    if (!chunks.length) {
      alert("Rendering failed. Please try again.");
      return;
    }

    const blob = new Blob(chunks, { type: "video/webm" });

    if (blob.size === 0) {
      alert("Video encoding failed.");
      return;
    }

    const url = URL.createObjectURL(blob);
    showActions(url);
  };

  recorder.start();
  video.play();

  video.requestVideoFrameCallback(render);
}

// ─────────────────────────────
// FRAME-SYNC RENDER LOOP
// ─────────────────────────────
function render(now, metadata) {
  const elapsed = metadata.mediaTime;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // IMAGE PHASE
  if (elapsed < IMAGE_DURATION) {
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  }

  // VIDEO PHASE
  else {
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    if (
      elapsed >= TEXT_START &&
      elapsed <= TEXT_START + TEXT_DURATION
    ) {
      const timeIntoText = elapsed - TEXT_START;
      let alpha = 1;

      if (timeIntoText < FADE_DURATION) {
        alpha = timeIntoText / FADE_DURATION;
      } else if (timeIntoText > TEXT_DURATION - FADE_DURATION) {
        alpha =
          1 -
          (timeIntoText - (TEXT_DURATION - FADE_DURATION)) /
            FADE_DURATION;
      }

      drawName(alpha);
    }
  }

  // UPDATE PROGRESS BAR
  if (video.duration) {
    const progress = (video.currentTime / video.duration) * 100;
    progressBar.style.width = progress + "%";
  }

  video.requestVideoFrameCallback(render);
}

// ─────────────────────────────
// TEXT DRAWING
// ─────────────────────────────
function drawName(alpha) {
  const len = userName.length;

  const rules = [
    { max: 4,  right: 0.73, bottom: 0.485 },
    { max: 7,  right: 0.77, bottom: 0.485 },
    { max: 13, right: 0.83, bottom: 0.485 },
    { max: 16, right: 0.91, bottom: 0.485 },
    { max: 19, right: 0.98, bottom: 0.485 }
  ];

  const rule = rules.find(r => len <= r.max);

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = `${canvas.width * 0.03}px AvengersFont, sans-serif`;
  ctx.fillStyle = "white";
  ctx.textBaseline = "bottom";

  if (rule) {
    ctx.textAlign = "left";
    ctx.fillText(
      userName,
      canvas.width * (1 - rule.right),
      canvas.height * (1 - rule.bottom)
    );
  } else {
    ctx.textAlign = "center";
    ctx.fillText(
      userName,
      canvas.width / 2,
      canvas.height * 0.45
    );
  }

  ctx.restore();
}

// ─────────────────────────────
// DOWNLOAD / SHARE
// ─────────────────────────────
function showActions(url) {
  const actions = document.getElementById("actions");
  actions.hidden = false;

  document.querySelector(".loading-title").textContent =
    "Your Trailer is Ready!";
  document.querySelector(".loading-text").textContent =
    "You can download or share it!";
  document.querySelector(".loader").style.display = "none";

  const button = document.getElementsByClassName("button");
  button[0].style.display = "flex";

  const saveBtn = document.createElement("a");
  saveBtn.href = url;
  saveBtn.download = `${userName}-avengers-trailer.webm`;
  saveBtn.className = "action-btn action-save";
  saveBtn.textContent = "SAVE";

  const shareBtn = document.createElement("button");
  shareBtn.className = "action-btn action-share";
  shareBtn.textContent = "SHARE";

  shareBtn.onclick = async () => {
    const shareData = {
      title: "My Avengers Trailer",
      text: "I just created my Avengers trailer. Check it out!",
      url: "https://willbeinavengersdoomsday.com/"
    };

    if (navigator.share) {
      await navigator.share(shareData);
    } else {
      navigator.clipboard.writeText(shareData.url);
      alert("Link copied to clipboard!");
    }
  };

  actions.appendChild(saveBtn);
  actions.appendChild(shareBtn);
}

video.addEventListener("ended", () => {
  progressBar.style.width = "100%";

  // Give encoder a moment to flush
  setTimeout(() => {
    if (recorder && recorder.state === "recording") {
      recorder.stop();
    }
  }, 200);
});