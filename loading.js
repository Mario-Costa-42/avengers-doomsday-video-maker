const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const video = document.getElementById("baseVideo");
const image = new Image();

canvas.width = 1920;
canvas.height = 1080;

// Load user data
image.src = sessionStorage.getItem("uploadedImage");
const userName = sessionStorage.getItem("characterName");

// ─────────────────────────────
// TIMING (seconds)
// ─────────────────────────────
const IMAGE_DURATION = 2;

const TEXT_START = 2.5;
const TEXT_DURATION = 8.8;
const FADE_DURATION = 1.6;

// ─────────────────────────────

let startTime;
let recorder;
let chunks = [];

// ─────────────────────────────
// STREAM SETUP (FIXED)
// ─────────────────────────────

// Canvas video
const canvasStream = canvas.captureStream(30);

// Video audio
const audioContext = new AudioContext();
const source = audioContext.createMediaElementSource(video);
const destination = audioContext.createMediaStreamDestination();

source.connect(destination);
source.connect(audioContext.destination); // user hears audio

// Merge video + audio
const combinedStream = new MediaStream([
  ...canvasStream.getVideoTracks(),
  ...destination.stream.getAudioTracks()
]);

recorder = new MediaRecorder(combinedStream, {
  mimeType: "video/webm;codecs=vp9,opus"
});

recorder.ondataavailable = e => chunks.push(e.data);

recorder.onstop = () => {
  const blob = new Blob(chunks, { type: "video/webm" });
  const url = URL.createObjectURL(blob);
  showActions(url);
};

// ─────────────────────────────
// START
// ─────────────────────────────
Promise.all([
  new Promise(res => (image.onload = res)),
  new Promise(res => (video.onloadeddata = res))
]).then(async () => {
  await audioContext.resume(); // REQUIRED
  video.play();
  recorder.start();
  startTime = performance.now();
  render();
});

// ─────────────────────────────
// MAIN RENDER LOOP
// ─────────────────────────────
function render() {
  const now = performance.now();
  const elapsed = (now - startTime) / 1000;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Phase A: Image
  if (elapsed < IMAGE_DURATION) {
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  }

  // Phase B: Video
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

  if (!video.ended) {
    requestAnimationFrame(render);
  } else {
    recorder.stop();
  }
}

// ─────────────────────────────
// TEXT DRAWING
// ─────────────────────────────
function drawName(alpha) {
  const len = userName.length;

  // Configuration by length
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
    // Fallback for very long names
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
// DOWNLOAD
// ─────────────────────────────
function showActions(url) {
  const actions = document.getElementById("actions");
  actions.hidden = false;

  // SAVE button (download)
  const saveBtn = document.createElement("a");
  saveBtn.href = url;
  saveBtn.download = `${userName}-avengers-trailer.webm`;
  saveBtn.className = "action-btn action-save";
  saveBtn.textContent = "SAVE";

  // SHARE button
  const shareBtn = document.createElement("button");
  shareBtn.className = "action-btn action-share";
  shareBtn.textContent = "SHARE";

  // YOUR TRAILER IS READY
  const title = document.getElementsByClassName("loading-title")[0];
  title.textContent = "Your Trailer is Ready!";
  const textReady = document.getElementsByClassName("loading-text")[0];
  textReady.textContent = "You can download or share it!";
  const loader = document.getElementsByClassName("loader")[0];
  loader.style.display = "none";

  shareBtn.onclick = async () => {
    const shareData = {
      title: "My Avengers Trailer",
      text: "I just created my Avengers trailer. Check it out!",
      url: window.location.href // ou uma URL pública específica
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error("Share canceled or failed", err);
      }
    } else {
      // Fallback para desktop
      navigator.clipboard.writeText(shareData.url);
      alert("Link copied to clipboard!");
    }
  };

  actions.appendChild(saveBtn);
  actions.appendChild(shareBtn);
}

