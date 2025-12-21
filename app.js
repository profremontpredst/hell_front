const form = document.getElementById("hellForm");
const formScreen = document.getElementById("formScreen");
const passportScreen = document.getElementById("passportScreen");
const passportPhoto = document.getElementById("passportPhoto");

const btnCamera = document.getElementById("openCamera");
const btnUpload = document.getElementById("uploadPhoto");
const btnSkip = document.getElementById("skipPhoto");

// СТАРТ: ВСЕГДА АНКЕТА
formScreen.style.display = "block";
passportScreen.classList.add("hidden");
passportScreen.style.display = "none";

// SUBMIT
form.addEventListener("submit", (e) => {
  e.preventDefault();
  formScreen.style.display = "none";
  passportScreen.classList.remove("hidden");
  passportScreen.style.display = "flex";
});

// ===== КАМЕРА (МАКСИМАЛЬНО ПРИНУДИТЕЛЬНО) =====
btnCamera.onclick = () => openCameraOnly();

// ===== ГАЛЕРЕЯ =====
btnUpload.onclick = () => openGallery();

btnSkip.onclick = () => Telegram.WebApp.showAlert("Фото пропущено");

function openCameraOnly() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.setAttribute("capture", "environment"); // принудительно камера
  input.style.display = "none";

  document.body.appendChild(input);

  input.onchange = () => {
    const file = input.files && input.files[0];
    if (!file) return;
    showImage(file);
    document.body.removeChild(input);
  };

  input.click();
}

function openGallery() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.style.display = "none";

  document.body.appendChild(input);

  input.onchange = () => {
    const file = input.files && input.files[0];
    if (!file) return;
    showImage(file);
    document.body.removeChild(input);
  };

  input.click();
}

function showImage(file) {
  const r = new FileReader();
  r.onload = () => {
    passportPhoto.style.backgroundImage = `url(${r.result})`;
    const p = passportPhoto.querySelector(".photo-placeholder");
    if (p) p.remove();
  };
  r.readAsDataURL(file);
}
