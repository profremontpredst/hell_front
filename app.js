document.addEventListener("DOMContentLoaded", () => {
// Режимы запуска
const params = new URLSearchParams(window.location.search);
const mode = params.get("mode") || "lock";

// Получаем элементы
const form = document.getElementById("hellForm");
const formScreen = document.getElementById("formScreen");
const passportScreen = document.getElementById("passportScreen");
const patternLock = document.getElementById("patternLock");
const devilFail = document.getElementById("devilFail");

// Правильный графический ключ (зашитый)
const CORRECT_PATTERN = [0, 1, 4, 7]; // Пример правильного паттерна

// Логика экранов
if (mode === "form") {
  formScreen.style.display = "block";
  passportScreen.classList.add("hidden");
  passportScreen.style.display = "none";
}

if (mode === "lock") {
  formScreen.style.display = "none";
  passportScreen.classList.remove("hidden");
  passportScreen.style.display = "flex";
  
  // Инициализация графического ключа
  initPatternLock();
}

// submit анкеты
form.addEventListener("submit", (e) => {
  e.preventDefault();
  formScreen.style.display = "none";
  passportScreen.classList.remove("hidden");
  passportScreen.style.display = "flex";
  
  // Инициализация графического ключа при переходе из анкеты
  initPatternLock();
});

// ===== ГРАФИЧЕСКИЙ КЛЮЧ =====
let currentPatternListeners = { mouseup: null, touchend: null };

function initPatternLock() {
  patternLock.innerHTML = '';
  
  // Удаляем старые обработчики
  if (currentPatternListeners.mouseup) {
    document.removeEventListener('mouseup', currentPatternListeners.mouseup);
  }
  if (currentPatternListeners.touchend) {
    document.removeEventListener('touchend', currentPatternListeners.touchend);
  }
  
  // Создаем сетку 3x3
  const dots = [];
  for (let i = 0; i < 9; i++) {
    const dot = document.createElement("div");
    dot.className = "pattern-dot";
    dot.dataset.index = i;
    patternLock.appendChild(dot);
    dots.push(dot);
  }
  
  let selectedIndices = [];
  let isDrawing = false;
  let linesContainer = null;
  
  // Создаем контейнер для линий
  linesContainer = document.createElement("div");
  linesContainer.className = "pattern-lines";
  linesContainer.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 1;
  `;
  patternLock.appendChild(linesContainer);
  
  // События для точек
  dots.forEach(dot => {
    dot.addEventListener('mousedown', startDrawing);
    dot.addEventListener('touchstart', startDrawing, { passive: false });
    
    dot.addEventListener('mouseenter', () => {
      if (isDrawing && !selectedIndices.includes(parseInt(dot.dataset.index))) {
        addDotToPattern(parseInt(dot.dataset.index));
      }
    });
    
    dot.addEventListener('touchmove', (e) => {
      if (!isDrawing) return;
      e.preventDefault();
      const touch = e.touches[0];
      const elem = document.elementFromPoint(touch.clientX, touch.clientY);
      if (elem && elem.classList.contains('pattern-dot') && 
          !selectedIndices.includes(parseInt(elem.dataset.index))) {
        addDotToPattern(parseInt(elem.dataset.index));
      }
    }, { passive: false });
  });
  
  function startDrawing(e) {
    e.preventDefault();
    isDrawing = true;
    selectedIndices = [];
    linesContainer.innerHTML = '';
    dots.forEach(dot => dot.classList.remove('selected'));
    addDotToPattern(parseInt(this.dataset.index));
  }
  
  function addDotToPattern(index) {
    if (!isDrawing) return;
    
    selectedIndices.push(index);
    dots[index].classList.add('selected');
    
    // Рисуем линии
    if (selectedIndices.length > 1) {
      const prevIndex = selectedIndices[selectedIndices.length - 2];
      const currentIndex = selectedIndices[selectedIndices.length - 1];
      
      const prevDot = dots[prevIndex];
      const currentDot = dots[currentIndex];
      
      const line = document.createElement("div");
      line.className = "pattern-line";
      
      const prevRect = prevDot.getBoundingClientRect();
      const currentRect = currentDot.getBoundingClientRect();
      const containerRect = patternLock.getBoundingClientRect();
      
      const x1 = prevRect.left + prevRect.width/2 - containerRect.left;
      const y1 = prevRect.top + prevRect.height/2 - containerRect.top;
      const x2 = currentRect.left + currentRect.width/2 - containerRect.left;
      const y2 = currentRect.top + currentRect.height/2 - containerRect.top;
      
      const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
      const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
      
      line.style.cssText = `
        position: absolute;
        left: ${x1}px;
        top: ${y1}px;
        width: ${length}px;
        height: 6px;
        background: #ff4444;
        transform-origin: 0 0;
        transform: rotate(${angle}deg);
        z-index: 1;
      `;
      
      linesContainer.appendChild(line);
    }
  }
  
  function checkPattern() {
    if (!isDrawing || selectedIndices.length === 0) return;
    
    isDrawing = false;
    
    // Проверяем паттерн
    const patternCorrect = JSON.stringify(selectedIndices) === JSON.stringify(CORRECT_PATTERN);
    
    if (patternCorrect) {
      // Запускаем камеру
      openCamera();
    } else {
      // Показываем смеющегося дьявола
      showDevil();
    }
    
    // Сбрасываем выбор через 500ms
    setTimeout(() => {
      selectedIndices.forEach(index => {
        dots[index].classList.remove('selected');
      });
      selectedIndices = [];
      linesContainer.innerHTML = '';
    }, 500);
  }
  
  // Сохраняем ссылки на обработчики для последующего удаления
  currentPatternListeners.mouseup = checkPattern;
  currentPatternListeners.touchend = checkPattern;
  
  // Вешаем обработчики
  document.addEventListener('mouseup', currentPatternListeners.mouseup);
  document.addEventListener('touchend', currentPatternListeners.touchend);
}

function showDevil() {
  // Анимация тряски
  patternLock.classList.add('shake');
  
  // Показываем дьявола
  devilFail.classList.remove('hidden');
  
  // Скрываем дьявола через 3 секунды
  setTimeout(() => {
    patternLock.classList.remove('shake');
    devilFail.classList.add('hidden');
  }, 3000);
}

function openCamera() {
  // === ВАША СУЩЕСТВУЮЩАЯ ЛОГИКА КАМЕРЫ ===
  // НЕ ТРОГАЕМ passportScreen - камера открывается в overlay
  
  try {
    patternLock.innerHTML = '';
    // Запускаем оригинальную камеру
    launchCamera();
  } catch (err) {
    Telegram.WebApp.showAlert("Ошибка: " + err.message);
  }
}

// ===== ОРИГИНАЛЬНАЯ ЛОГИКА КАМЕРЫ (ИСПРАВЛЕННАЯ) =====
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

function launchCamera() {
  const streamPromise = navigator.mediaDevices.getUserMedia({
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
  video.style.cssText = "flex:1; object-fit:cover;";

  // ЖДЕМ ЗАГРУЗКИ КАМЕРЫ
  streamPromise.then(stream => {
    video.srcObject = stream;

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
      padding:12px 16px;
      background:#300;
      color:#fff;
      border:2px solid #500;
      border-radius:8px;
      font-weight:bold;
      z-index:1002;
      cursor:pointer;
      transition:all 0.2s;
    `;

    // ПАНЕЛЬ ВЫБОРА ПАПОК
    const folderPanel = document.createElement("div");
    folderPanel.style.cssText = `
      position:fixed;
      bottom:140px;
      right:16px;
      background:#222;
      border:2px solid #500;
      border-radius:12px;
      padding:12px;
      display:none;
      flex-direction:column;
      gap:8px;
      z-index:1003;
      max-width:250px;
      box-shadow:0 4px 20px rgba(0,0,0,0.7);
    `;

    // Обновление кнопки папки
    function updateFolderButton() {
      const activeFolder = folders.find(f => f.id === activeFolderId);
      if (activeFolder) {
        folderBtn.textContent = `📁 ${activeFolder.name}`;
      }
    }

    // Создание списка папок
    function renderFolderList() {
      folderPanel.innerHTML = '';
      
      folders.slice(0, MAX_FOLDERS).forEach(folder => {
        const folderItem = document.createElement("button");
        folderItem.textContent = folder.name;
        folderItem.style.cssText = `
          padding:10px 14px;
          background:${folder.id === activeFolderId ? '#700' : '#444'};
          color:#fff;
          border:none;
          border-radius:6px;
          cursor:pointer;
          text-align:left;
          font-size:14px;
          font-weight:${folder.id === activeFolderId ? 'bold' : 'normal'};
          transition:all 0.2s;
          border:${folder.id === activeFolderId ? '2px solid #900' : '2px solid transparent'};
        `;
        
        folderItem.onmouseenter = () => {
          if (folder.id !== activeFolderId) {
            folderItem.style.background = '#555';
          }
        };
        
        folderItem.onmouseleave = () => {
          if (folder.id !== activeFolderId) {
            folderItem.style.background = '#444';
          }
        };
        
        folderItem.onclick = () => {
          activeFolderId = folder.id;
          saveFolders();
          updateFolderButton();
          folderPanel.style.display = 'none';
        };
        
        folderPanel.appendChild(folderItem);
      });
    }

    // Обработчик клика на кнопку папки
    folderBtn.onclick = (e) => {
      e.stopPropagation();
      if (folderPanel.style.display === 'flex') {
        folderPanel.style.display = 'none';
      } else {
        renderFolderList();
        folderPanel.style.display = 'flex';
      }
    };

    // ОБРАБОТЧИК ДЛЯ OVERLAY, А НЕ ДЛЯ ВСЕГО DOCUMENT
    overlay.addEventListener('click', (e) => {
      if (!folderPanel.contains(e.target) && e.target !== folderBtn) {
        folderPanel.style.display = 'none';
      }
    });

    overlay.appendChild(video);
    overlay.appendChild(laser);
    overlay.appendChild(folderBtn);
    overlay.appendChild(folderPanel);
    overlay.appendChild(snap);
    document.body.appendChild(overlay);

    // Инициализация кнопки
    updateFolderButton();

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

      // УБРАЛИ ОБРАЩЕНИЕ К passportPhoto - элемента больше нет
      // passportPhoto.style.backgroundImage = `url(${img})`;
      // const p = passportPhoto.querySelector(".photo-placeholder");
      // if (p) p.remove();

      stream.getTracks().forEach(t => t.stop());
      document.body.removeChild(overlay);
      
      // Показываем сообщение о сохранении
      Telegram.WebApp.showAlert("Фото сохранено в папку: " + folder.name);
    };

  }).catch(err => {
    Telegram.WebApp.showAlert("Камера недоступна: " + err.message);
  });
}
});
