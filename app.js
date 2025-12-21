const form = document.getElementById("hellForm");
const formScreen = document.getElementById("formScreen");
const passportScreen = document.getElementById("passportScreen");
const passportPhoto = document.getElementById("passportPhoto");

const btnCamera = document.getElementById("openCamera");
const btnUpload = document.getElementById("uploadPhoto");
const btnSkip = document.getElementById("skipPhoto");

// старт
formScreen.style.display = "block";
passportScreen.classList.add("hidden");
passportScreen.style.display = "none";

// submit анкеты
form.addEventListener("submit", (e) => {
  e.preventDefault();
  formScreen.style.display = "none";
  passportScreen.classList.remove("hidden");
  passportScreen.style.display = "flex";
});

// ===== РЕАЛЬНАЯ КАМЕРА =====
btnCamera.onclick = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user" },
      audio: false
    });

    // оверлей
    const overlay = document.createElement("div");
    overlay.style.cssText = `
      position:fixed; inset:0; background:#000; z-index:1000;
      display:flex; flex-direction:column;
    `;

    const video = document.createElement("video");
    video.autoplay = true;
    video.playsInline = true;
    video.srcObject = stream;
    video.style.cssText = "flex:1; object-fit:cover;";

    const snap = document.createElement("button");
    snap.textContent = "СДЕЛАТЬ СНИМОК";
    snap.style.cssText = `
      padding:16px; border:none; color:#fff;
      background:linear-gradient(180deg,#700,#400);
      font-weight:bold; letter-spacing:.15em;
    `;

    overlay.appendChild(video);
    overlay.appendChild(snap);
    document.body.appendChild(overlay);

    snap.onclick = () => {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0);

      const img = canvas.toDataURL("image/jpeg", 0.9);
      passportPhoto.style.backgroundImage = `url(${img})`;
      const p = passportPhoto.querySelector(".photo-placeholder");
      if (p) p.remove();

      stream.getTracks().forEach(t => t.stop());
      document.body.removeChild(overlay);
    };

  } catch (err) {
    Telegram.WebApp.showAlert("Камера недоступна: " + err.message);
  }
};

// ===== ГАЛЕРЕЯ =====
btnUpload.onclick = () => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.onchange = () => {
    const file = input.files[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = () => {
      passportPhoto.style.backgroundImage = `url(${r.result})`;
      const p = passportPhoto.querySelector(".photo-placeholder");
      if (p) p.remove();
    };
    r.readAsDataURL(file);
  };
  input.click();
};

btnSkip.onclick = () => Telegram.WebApp.showAlert("Фото пропущено");
