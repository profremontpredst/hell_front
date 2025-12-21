let hellDossier = {};

const form = document.getElementById("hellForm");
const formScreen = document.getElementById("formScreen");
const passportScreen = document.getElementById("passportScreen");
const passportPhoto = document.getElementById("passportPhoto");

const btnCamera = document.getElementById("openCamera");
const btnUpload = document.getElementById("uploadPhoto");
const btnSkip = document.getElementById("skipPhoto");

// ЖЁСТКИЙ СТАРТ: ВСЕГДА АНКЕТА
window.addEventListener("load", () => {
  formScreen.style.display = "block";
  passportScreen.classList.add("hidden");
});

form.addEventListener("submit", (e) => {
  e.preventDefault();

  hellDossier = {
    name: name.value,
    sin: sin.value,
    virtue: virtue.value,
    trait: trait.value,
    dream: dream.value,
    photo: null
  };

  formScreen.style.display = "none";
  passportScreen.classList.remove("hidden");
});

// Фото — гарантированный способ
btnCamera.onclick = () => pickImage(true);
btnUpload.onclick = () => pickImage(false);

btnSkip.onclick = () => {
  Telegram.WebApp.showAlert("Фото пропущено");
};

function pickImage(fromCamera) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  if (fromCamera) input.capture = "user";

  input.onchange = () => {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      hellDossier.photo = reader.result;
      passportPhoto.style.backgroundImage = `url(${reader.result})`;
      const p = passportPhoto.querySelector(".photo-placeholder");
      if (p) p.remove();
    };
    reader.readAsDataURL(file);
  };

  input.click();
}
