// const imageInput = document.getElementById("imageInput");
// const previewImage = document.getElementById("previewImage");
// const placeholder = document.querySelector(".upload-placeholder");
// const uploadBox = document.querySelector(".upload-box");
// const generateBtn = document.getElementById("generateBtn");
// const nameInput = document.getElementById("nameInput");

// let imageSelected = false;

// /* ---------- VALIDATION ---------- */
// function updateButtonState() {
//   const nameFilled = nameInput.value.trim().length > 0;
//   generateBtn.disabled = !(imageSelected && nameFilled);
// }

// /* ---------- IMAGE UPLOAD ---------- */
// imageInput.addEventListener("change", () => {
//   const file = imageInput.files[0];
//   if (!file) return;

//   const reader = new FileReader();

//   reader.onload = () => {
//     previewImage.src = reader.result;
//     previewImage.style.display = "block";
//     placeholder.style.display = "none";
//     uploadBox.classList.add("has-image");

//     imageSelected = true;

//     /* Save image temporarily */
//     sessionStorage.setItem("uploadedImage", reader.result);

//     updateButtonState();
//   };

//   reader.readAsDataURL(file);
// });

// /* ---------- NAME INPUT ---------- */
// nameInput.addEventListener("input", () => {
//   sessionStorage.setItem("characterName", nameInput.value.trim());
//   updateButtonState();
// });

// /* ---------- GENERATE CLICK ---------- */
// generateBtn.addEventListener("click", () => {
//   if (generateBtn.disabled) return;

//   // Optional: prevent double click
//   generateBtn.disabled = true;

//   // Navigate to loading screen
//   window.location.href = "loading.html";
// });





const imageInput = document.getElementById("imageInput");
const previewImage = document.getElementById("previewImage");
const nameInput = document.getElementById("nameInput");
const generateBtn = document.getElementById("generateBtn");

let imageReady = false;
let nameReady = false;

// Image upload
imageInput.addEventListener("change", () => {
  const file = imageInput.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    previewImage.src = reader.result;
    previewImage.style.display = "block";

    sessionStorage.setItem("uploadedImage", reader.result);
    imageReady = true;
    checkReady();
  };
  reader.readAsDataURL(file);
});

// Name input
nameInput.addEventListener("input", () => {
  if (nameInput.value.trim().length > 0) {
    sessionStorage.setItem("characterName", nameInput.value.trim());
    nameReady = true;
  } else {
    nameReady = false;
  }
  checkReady();
});

function checkReady() {
  generateBtn.disabled = !(imageReady && nameReady);
}

// USER GESTURE (IMPORTANT)
generateBtn.addEventListener("click", () => {
  sessionStorage.setItem("generationStarted", "true");
  window.location.href = "loading.html";
});
