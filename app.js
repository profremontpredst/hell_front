const form = document.getElementById("hellForm");
const formScreen = document.getElementById("formScreen");
const passportScreen = document.getElementById("passportScreen");
const passportPhoto = document.getElementById("passportPhoto");

const btnCamera = document.getElementById("openCamera");
const btnUpload = document.getElementById("uploadPhoto");
const btnSkip = document.getElementById("skipPhoto");

// ЖЁСТКИЙ СТАРТ
formScreen.style.display = "block";
passportScreen.classList.add("hidden");
passportScreen.style.display = "none";

form.addEventListener("submit", (e) => {
  e.preventDefault();

  // ПЕРЕКЛЮЧЕНИЕ ЭКРАНОВ
  formScreen.style.display = "none";
  passportScreen.classList.remove("hidden");
  passportScreen.style.display = "flex";
});

// Фото — через input (работает везде)
btnCamera.onclick = () => pickImage(true);
btnUpload.onclick = () => pickImage(false);
btnSkip.onclick = () => Telegram.WebApp.showAlert("Фото пропущено");

function pickImage(fromCamera){
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  if(fromCamera) input.capture = "user";

  input.onchange = () => {
    const file = input.files[0];
    if(!file) return;
    const r = new FileReader();
    r.onload = () => {
      passportPhoto.style.backgroundImage = `url(${r.result})`;
      const p = passportPhoto.querySelector(".photo-placeholder");
      if(p) p.remove();
    };
    r.readAsDataURL(file);
  };
  input.click();
}
