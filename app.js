// =====================
// СОСТОЯНИЕ АНКЕТЫ
// =====================
let hellDossier = {
  name: "",
  sin: "",
  virtue: "",
  trait: "",
  dream: "",
  photo: null // base64 фото (потом уйдёт на сервер)
};

// =====================
// DOM
// =====================
const form = document.getElementById("hellForm");
const formScreen = document.getElementById("formScreen");
const passportScreen = document.getElementById("passportScreen");
const passportPhoto = document.getElementById("passportPhoto");

const btnCamera = document.getElementById("openCamera");
const btnUpload = document.getElementById("uploadPhoto");
const btnSkip = document.getElementById("skipPhoto");

// =====================
// SUBMIT АНКЕТЫ
// =====================
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

  console.log("HELL DOSSIER:", hellDossier);

  // переключаем экран
  formScreen.style.display = "none";
  passportScreen.classList.remove("hidden");
});

// =====================
// КАМЕРА TELEGRAM
// =====================
btnCamera.addEventListener("click", () => {
  if (!Telegram.WebApp || !Telegram.WebApp.showCamera) {
    Telegram.WebApp.showAlert("Камера недоступна");
    return;
  }

  Telegram.WebApp.showCamera({
    front: true
  }, (photo) => {
    if (!photo) return;

    hellDossier.photo = photo;
    setPassportBackground(photo);
  });
});

// =====================
// ЗАГРУЗКА ИЗ ГАЛЕРЕИ
// =====================
btnUpload.addEventListener("click", () => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";

  input.onchange = () => {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      hellDossier.photo = reader.result;
      setPassportBackground(reader.result);
    };
    reader.readAsDataURL(file);
  };

  input.click();
});

// =====================
// ПРОПУСТИТЬ ФОТО
// =====================
btnSkip.addEventListener("click", () => {
  hellDossier.photo = null;
  Telegram.WebApp.showAlert("Фото пропущено. Паспорт будет оформлен без лица.");
});

// =====================
// УСТАНОВКА ФОТО ФОНОМ
// =====================
function setPassportBackground(src) {
  passportPhoto.style.backgroundImage = `url(${src})`;

  const placeholder = passportPhoto.querySelector(".photo-placeholder");
  if (placeholder) placeholder.remove();
}
