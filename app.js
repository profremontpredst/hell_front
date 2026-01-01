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

// ===== ПАПКИ (ВНУТРЕННЯЯ ПАМЯТЬ) =====
const MAX_FOLDERS = 6;

let folders = JSON.parse(localStorage.getItem("folders")) || [
  { id: "f1", name: "Папка 1", template: "Фото из папки 1 • {date}" },
  { id: "f2", name: "Папка 2", template: "Фото из папки 2 • {date}" },
  { id: "f3", name: "Папка 3", template: "Фото из папки 3 • {date}" }
];

let activeFolderId = localStorage.getItem("activeFolderId") || folders[0].id;

function saveFolders() {
  localStorage.setItem("folders", JSON.stringify(folders));
  localStorage.setItem("activeFolderId", activeFolderId);
}

// ===== РЕАЛЬНАЯ КАМЕРА =====
btnCamera.onclick = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: "environment" } },
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

    // лазер (виден пользователю при наведении)
    const laser = document.createElement("div");
    laser.style.cssText = `
      position:fixed;
      top:50%;
      left:50%;
      width:16px;
      height:16px;
      background:rgba(255,0,0,.55);
      border-radius:50%;
      transform:translate(-50%,-50%);
      box-shadow:0 0 18px rgba(255,0,0,.9);
      pointer-events:none;
      z-index:1001;
    `;

    // КНОПКА ПАПКИ
    const folderBtn = document.createElement("button");
    folderBtn.textContent = "📁 ПАПКА";
    folderBtn.style.cssText = `
      position:fixed;
      bottom:80px;
      right:16px;
      padding:12px;
      background:#300;
      color:#fff;
      border:none;
      z-index:1002;
    `;

    // ВЫБОР ПАПКИ
    folderBtn.onclick = () => {
      const names = folders.map(f => f.name).join("\n");
      const choice = prompt(
        "Выбери папку:\n" + names,
        folders.find(f => f.id === activeFolderId)?.name
      );

      const found = folders.find(f => f.name === choice);
      if (found) {
        activeFolderId = found.id;
        saveFolders();
      }
    };

    overlay.appendChild(video);
    overlay.appendChild(laser);
    overlay.appendChild(folderBtn);
    overlay.appendChild(snap);
    document.body.appendChild(overlay);

    snap.onclick = () => {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0);
      // === ЛАЗЕР В ФОТО (ЦЕНТР) ===
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const r = Math.min(canvas.width, canvas.height) * 0.015;

      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,0,0,0.55)";
      ctx.shadowColor = "rgba(255,0,0,0.9)";
      ctx.shadowBlur = r * 2;
      ctx.fill();

      const img = canvas.toDataURL("image/jpeg", 0.9);
      
      // СОХРАНЕНИЕ В ПАПКУ
      const folder = folders.find(f => f.id === activeFolderId);
      const text = folder.template.replace("{date}", new Date().toLocaleString());

      const photos = JSON.parse(localStorage.getItem("photos")) || [];
      photos.push({
        id: Date.now(),
        folderId: activeFolderId,
        image: img,
        text
      });
      localStorage.setItem("photos", JSON.stringify(photos));

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
