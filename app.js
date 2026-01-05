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

  // Настройки по умолчанию
  const defaultSettings = {
    showFolderName: true,
    showCoordinates: true
  };
  
  let settings = JSON.parse(localStorage.getItem("settings")) || defaultSettings;

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
  }

  // submit анкеты
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    formScreen.style.display = "none";
    passportScreen.classList.remove("hidden");
    passportScreen.style.display = "flex";
  });

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

  // Функция для получения геолокации
  function getCurrentLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Геолокация не поддерживается"));
        return;
      }
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    });
  }

  // Функция для отрисовки текста на фото
  function drawTextOnPhoto(ctx, canvas, folderName, coordinates) {
    const textLines = [];
    
    // Добавляем название папки если включено
    if (settings.showFolderName) {
      textLines.push(folderName);
    }
    
    // Добавляем координаты если включены
    if (settings.showCoordinates && coordinates) {
      const lat = coordinates.latitude.toFixed(6);
      const lon = coordinates.longitude.toFixed(6);
      textLines.push(`${lat}, ${lon}`);
    }
    
    if (textLines.length === 0) return;
    
    // Настройки текста
    const fontSize = Math.min(canvas.width, canvas.height) * 0.025;
    const padding = fontSize * 0.5;
    const lineHeight = fontSize * 1.2;
    
    ctx.font = `bold ${fontSize}px Arial, sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "bottom";
    
    // Рисуем текст с подложкой
    const startY = canvas.height - padding - (textLines.length - 1) * lineHeight;
    
    textLines.forEach((line, index) => {
      const y = startY + (index * lineHeight);
      const textX = padding;
      
      // Рисуем подложку для лучшей читаемости
      const textWidth = ctx.measureText(line).width;
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.fillRect(
        textX - padding/2,
        y - fontSize + padding/4,
        textWidth + padding,
        fontSize + padding/2
      );
      
      // Рисуем текст
      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
      ctx.shadowBlur = 4;
      ctx.fillText(line, textX, y);
      ctx.shadowBlur = 0;
    });
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

      // КНОПКА НАСТРОЕК
      const settingsBtn = document.createElement("button");
      settingsBtn.textContent = "⚙ НАСТРОЙКИ";
      settingsBtn.style.cssText = `
        position:fixed;
        bottom:80px;
        left:16px;
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

      // ПАНЕЛЬ НАСТРОЕК
      const settingsPanel = document.createElement("div");
      settingsPanel.style.cssText = `
        position:fixed;
        bottom:140px;
        left:16px;
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

      // Создание панели настроек
      function renderSettingsPanel() {
        settingsPanel.innerHTML = '';
        
        const title = document.createElement("div");
        title.textContent = "Настройки фото";
        title.style.cssText = "color:#fff; font-weight:bold; margin-bottom:8px;";
        settingsPanel.appendChild(title);
        
        // Настройка показа названия папки
        const folderNameSetting = document.createElement("div");
        folderNameSetting.style.cssText = "display:flex; justify-content:space-between; align-items:center;";
        
        const folderNameLabel = document.createElement("span");
        folderNameLabel.textContent = "Название папки";
        folderNameLabel.style.cssText = "color:#fff;";
        
        const folderNameToggle = document.createElement("input");
        folderNameToggle.type = "checkbox";
        folderNameToggle.checked = settings.showFolderName;
        folderNameToggle.style.cssText = "transform:scale(1.3);";
        
        folderNameToggle.onchange = () => {
          settings.showFolderName = folderNameToggle.checked;
          localStorage.setItem("settings", JSON.stringify(settings));
        };
        
        folderNameSetting.appendChild(folderNameLabel);
        folderNameSetting.appendChild(folderNameToggle);
        settingsPanel.appendChild(folderNameSetting);
        
        // Настройка показа координат
        const coordsSetting = document.createElement("div");
        coordsSetting.style.cssText = "display:flex; justify-content:space-between; align-items:center;";
        
        const coordsLabel = document.createElement("span");
        coordsLabel.textContent = "Координаты";
        coordsLabel.style.cssText = "color:#fff;";
        
        const coordsToggle = document.createElement("input");
        coordsToggle.type = "checkbox";
        coordsToggle.checked = settings.showCoordinates;
        coordsToggle.style.cssText = "transform:scale(1.3);";
        
        coordsToggle.onchange = () => {
          settings.showCoordinates = coordsToggle.checked;
          localStorage.setItem("settings", JSON.stringify(settings));
        };
        
        coordsSetting.appendChild(coordsLabel);
        coordsSetting.appendChild(coordsToggle);
        settingsPanel.appendChild(coordsSetting);
        
        // Кнопка закрытия
        const closeBtn = document.createElement("button");
        closeBtn.textContent = "ЗАКРЫТЬ";
        closeBtn.style.cssText = `
          margin-top:8px;
          padding:8px;
          background:#700;
          color:#fff;
          border:none;
          border-radius:6px;
          cursor:pointer;
          font-weight:bold;
        `;
        
        closeBtn.onclick = () => {
          settingsPanel.style.display = 'none';
        };
        
        settingsPanel.appendChild(closeBtn);
      }

      // Обработчик клика на кнопку папки
      folderBtn.onclick = (e) => {
        e.stopPropagation();
        if (folderPanel.style.display === 'flex') {
          folderPanel.style.display = 'none';
        } else {
          renderFolderList();
          folderPanel.style.display = 'flex';
          settingsPanel.style.display = 'none';
        }
      };

      // Обработчик клика на кнопку настроек
      settingsBtn.onclick = (e) => {
        e.stopPropagation();
        if (settingsPanel.style.display === 'flex') {
          settingsPanel.style.display = 'none';
        } else {
          renderSettingsPanel();
          settingsPanel.style.display = 'flex';
          folderPanel.style.display = 'none';
        }
      };

      // ОБРАБОТЧИК ДЛЯ OVERLAY, А НЕ ДЛЯ ВСЕГО DOCUMENT
      overlay.addEventListener('click', (e) => {
        if (!folderPanel.contains(e.target) && e.target !== folderBtn &&
            !settingsPanel.contains(e.target) && e.target !== settingsBtn) {
          folderPanel.style.display = 'none';
          settingsPanel.style.display = 'none';
        }
      });

      overlay.appendChild(video);
      overlay.appendChild(laser);
      overlay.appendChild(folderBtn);
      overlay.appendChild(settingsBtn);
      overlay.appendChild(folderPanel);
      overlay.appendChild(settingsPanel);
      overlay.appendChild(snap);
      document.body.appendChild(overlay);

      // Инициализация кнопки
      updateFolderButton();

      snap.onclick = async () => {
        try {
          let coordinates = null;
          
          // Получаем геолокацию перед съемкой фото
          if (settings.showCoordinates) {
            try {
              coordinates = await getCurrentLocation();
            } catch (error) {
              console.warn("Не удалось получить геолокацию:", error.message);
              // Продолжаем без координат
            }
          }
          
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
          
          // === РИСУЕМ ТЕКСТ НА ФОТО ===
          const folder = folders.find(f => f.id === activeFolderId);
          if (folder) {
            drawTextOnPhoto(ctx, canvas, folder.name, coordinates);
          }

          const img = canvas.toDataURL("image/jpeg", 0.9);
          
          // СОХРАНЕНИЕ В ПАПКУ
          const text = folder.template.replace("{date}", new Date().toLocaleString());

          const photos = JSON.parse(localStorage.getItem("photos")) || [];
          photos.push({
            id: Date.now(),
            folderId: activeFolderId,
            image: img,
            text
          });
          localStorage.setItem("photos", JSON.stringify(photos));

          stream.getTracks().forEach(t => t.stop());
          document.body.removeChild(overlay);
          
          // Показываем сообщение о сохранении
          Telegram.WebApp.showAlert("Фото сохранено в папку: " + folder.name);
        } catch (error) {
          console.error("Ошибка при создании фото:", error);
          Telegram.WebApp.showAlert("Ошибка при создании фото: " + error.message);
        }
      };

    }).catch(err => {
      Telegram.WebApp.showAlert("Камера недоступна: " + err.message);
    });
  }

  // ===== ПРОСТОЙ ГРАФИЧЕСКИЙ КЛЮЧ БЕЗ БИБЛИОТЕК =====

  const lockEl = document.getElementById("patternLock");
  if (lockEl) {
    // ИСПРАВЛЕНО: Правильная комбинация 0 → 4 → 8
    const CORRECT_PATTERN = "048"; // 0->4->8
    let pattern = [];
    let isDrawing = false;
    let currentLine = null;

    // гарантируем размер, даже если CSS сломают
    lockEl.style.width = lockEl.style.width || "300px";
    lockEl.style.height = lockEl.style.height || "300px";

    lockEl.innerHTML = "";
    lockEl.style.display = "grid";
    lockEl.style.gridTemplateColumns = "repeat(3, 1fr)";
    lockEl.style.gridTemplateRows = "repeat(3, 1fr)";
    lockEl.style.gap = "20px";
    lockEl.style.position = "relative";
    lockEl.style.touchAction = "none";

    const dots = [];
    const positions = [];

    for (let i = 0; i < 9; i++) {
      const dot = document.createElement("div");
      dot.dataset.index = i;
      dot.style.width = "100%";
      dot.style.height = "100%";
      dot.style.borderRadius = "50%";
      dot.style.background = "#222";
      dot.style.border = "2px solid #500";
      dot.style.position = "relative";
      dot.style.zIndex = "2";
      dot.style.touchAction = "none";

      dot.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        isDrawing = true;
        pattern = [];
        dots.forEach(d => {
          d.style.background = "#222";
          d.style.transform = "scale(1)";
        });
        
        // Создаем линию для рисования
        if (currentLine) {
          lockEl.removeChild(currentLine);
        }
        currentLine = document.createElement("div");
        currentLine.style.position = "absolute";
        currentLine.style.top = "0";
        currentLine.style.left = "0";
        currentLine.style.width = "100%";
        currentLine.style.height = "100%";
        currentLine.style.zIndex = "1";
        currentLine.style.pointerEvents = "none";
        lockEl.appendChild(currentLine);
        
        addDot(dot, e);
      });

      // УДАЛЕНО: обработчик pointerenter

      dots.push(dot);
      lockEl.appendChild(dot);
      
      // Запоминаем позиции точек для рисования линий
      positions[i] = { x: 0, y: 0 };
    }

    document.addEventListener("pointermove", (e) => {
      if (!isDrawing || !currentLine) return;

      const rect = lockEl.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      drawLineTo(x, y);

      // ПРОВЕРКА ТОЧЕК ПРИ ДВИЖЕНИИ
      dots.forEach(dot => {
        const dRect = dot.getBoundingClientRect();
        const cx = dRect.left + dRect.width / 2;
        const cy = dRect.top + dRect.height / 2;

        const dx = e.clientX - cx;
        const dy = e.clientY - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < dRect.width / 2) {
          addDot(dot, e);
        }
      });
    });

    document.addEventListener("pointerup", () => {
      if (!isDrawing) return;
      isDrawing = false;
      
      // Удаляем линию
      if (currentLine) {
        setTimeout(() => {
          if (currentLine && currentLine.parentNode === lockEl) {
            lockEl.removeChild(currentLine);
            currentLine = null;
          }
        }, 300);
      }

      // Проверяем комбинацию
      if (pattern.join("") === CORRECT_PATTERN) {
        openCamera();
      } else {
        showDevil();
      }

      // Сбрасываем точки через секунду
      setTimeout(() => {
        dots.forEach(d => {
          d.style.background = "#222";
          d.style.transform = "scale(1)";
        });
        pattern = [];
      }, 1000);
    });

    function addDot(dot, event) {
      const index = dot.dataset.index;
      if (pattern.includes(index)) return;
      
      pattern.push(index);
      dot.style.background = "#ff4444";
      dot.style.transform = "scale(1.2)";
      
      // Запоминаем позицию точки
      const rect = dot.getBoundingClientRect();
      const lockRect = lockEl.getBoundingClientRect();
      positions[index].x = rect.left - lockRect.left + rect.width / 2;
      positions[index].y = rect.top - lockRect.top + rect.height / 2;
      
      // Рисуем линии между точками
      drawLines();
    }

    function drawLines() {
      if (!currentLine || pattern.length < 2) return;
      
      const canvas = document.createElement("canvas");
      canvas.width = lockEl.offsetWidth;
      canvas.height = lockEl.offsetHeight;
      currentLine.innerHTML = '';
      currentLine.appendChild(canvas);
      
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Рисуем линии между выбранными точками
      for (let i = 1; i < pattern.length; i++) {
        const prevIndex = pattern[i-1];
        const currIndex = pattern[i];
        
        ctx.beginPath();
        ctx.moveTo(positions[prevIndex].x, positions[prevIndex].y);
        ctx.lineTo(positions[currIndex].x, positions[currIndex].y);
        ctx.strokeStyle = "#ff4444";
        ctx.lineWidth = 4;
        ctx.lineCap = "round";
        ctx.stroke();
      }
    }

    function drawLineTo(x, y) {
      if (!currentLine || pattern.length === 0) return;
      
      const lastIndex = pattern[pattern.length - 1];
      const lastPos = positions[lastIndex];
      
      const canvas = currentLine.querySelector("canvas");
      if (!canvas) return;
      
      const ctx = canvas.getContext("2d");
      // ОЧИЩАЕМ КАНВАС ПЕРЕД РИСОВАНИЕМ
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Сначала рисуем постоянные линии
      for (let i = 1; i < pattern.length; i++) {
        const prevIndex = pattern[i-1];
        const currIndex = pattern[i];
        
        ctx.beginPath();
        ctx.moveTo(positions[prevIndex].x, positions[prevIndex].y);
        ctx.lineTo(positions[currIndex].x, positions[currIndex].y);
        ctx.strokeStyle = "#ff4444";
        ctx.lineWidth = 4;
        ctx.lineCap = "round";
        ctx.stroke();
      }
      
      // Рисуем временную линию к текущей позиции указателя
      ctx.beginPath();
      ctx.moveTo(lastPos.x, lastPos.y);
      ctx.lineTo(x, y);
      ctx.strokeStyle = "#ff4444";
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }
});
