 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/app.js b/app.js
index 06811c4a603aaf741c4423f4c040388210e61b6d..4c843bb8d6ac1ffe67d658dbf268aa55482b3d91 100644
--- a/app.js
+++ b/app.js
@@ -1,53 +1,55 @@
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
 
   // ===== ЭКРАН ПАПОК (ПРОСМОТР) =====
   const foldersScreen = document.getElementById("foldersScreen");
   const foldersBack = document.getElementById("foldersBack");
   const deleteAllBtn = document.getElementById("deleteAllBtn");
   const foldersListEl = document.getElementById("foldersList");
   const photosGridEl = document.getElementById("photosGrid");
   const foldersBreadcrumbEl = document.getElementById("foldersBreadcrumb");
   const foldersEmptyEl = document.getElementById("foldersEmpty");
 
   // Настройки по умолчанию
   const defaultSettings = {
     showFolderName: true,
-    showCoordinates: true
+    showCoordinates: true,
+    photoMode: "dot"
   };
   
-  let settings = JSON.parse(localStorage.getItem("settings")) || defaultSettings;
+  const storedSettings = JSON.parse(localStorage.getItem("settings")) || {};
+  let settings = { ...defaultSettings, ...storedSettings };
 
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
@@ -247,50 +249,57 @@ document.addEventListener("DOMContentLoaded", () => {
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
 
     // Переменные для геолокации
     let liveCoordinates = null;
     let geolocationWatchId = null;
+    let capturedCoordinates = null;
+    let capturedBaseCanvas = null;
+    let frozenImage = null;
+    let drawCanvas = null;
+    let drawCtx = null;
+    let isDrawingOnPhoto = false;
+    let hasCapturedPhoto = false;
     
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
 
     // Элемент для отображения координат поверх видео
     const coordsOverlay = document.createElement("div");
     coordsOverlay.style.cssText = `
       position:fixed;
       left:0;
       right:0;
       text-align:center;
       color:#fff;
       font-family:Arial, sans-serif;
       font-size:14px;
       font-weight:bold;
       text-shadow:0 0 5px #000, 0 0 10px #000;
@@ -330,89 +339,144 @@ document.addEventListener("DOMContentLoaded", () => {
           updateCoordsOverlay();
         },
         (error) => {
           console.warn("Ошибка геолокации:", error.message);
           coordsOverlay.textContent = "Геолокация недоступна";
           coordsOverlay.style.display = 'block';
           updateCoordsPosition();
         },
         {
           enableHighAccuracy: true,
           maximumAge: 1000,
           timeout: 5000
         }
       );
     }
 
     // Останавливаем слежение за геолокацией
     function stopGeolocationTracking() {
       if (geolocationWatchId !== null) {
         navigator.geolocation.clearWatch(geolocationWatchId);
         geolocationWatchId = null;
       }
       liveCoordinates = null;
     }
 
+    function setDrawingHandlers() {
+      if (!drawCanvas || !drawCtx) return;
+
+      const getCanvasPoint = (touch) => {
+        const rect = drawCanvas.getBoundingClientRect();
+        const scaleX = drawCanvas.width / rect.width;
+        const scaleY = drawCanvas.height / rect.height;
+        return {
+          x: (touch.clientX - rect.left) * scaleX,
+          y: (touch.clientY - rect.top) * scaleY
+        };
+      };
+
+      const startDrawing = (touch) => {
+        const point = getCanvasPoint(touch);
+        drawCtx.beginPath();
+        drawCtx.moveTo(point.x, point.y);
+        isDrawingOnPhoto = true;
+      };
+
+      const drawLine = (touch) => {
+        if (!isDrawingOnPhoto) return;
+        const point = getCanvasPoint(touch);
+        drawCtx.lineTo(point.x, point.y);
+        drawCtx.stroke();
+      };
+
+      const stopDrawing = () => {
+        isDrawingOnPhoto = false;
+      };
+
+      drawCanvas.addEventListener("touchstart", (event) => {
+        event.preventDefault();
+        if (event.touches.length > 0) {
+          startDrawing(event.touches[0]);
+        }
+      }, { passive: false });
+
+      drawCanvas.addEventListener("touchmove", (event) => {
+        event.preventDefault();
+        if (event.touches.length > 0) {
+          drawLine(event.touches[0]);
+        }
+      }, { passive: false });
+
+      drawCanvas.addEventListener("touchend", (event) => {
+        event.preventDefault();
+        stopDrawing();
+      }, { passive: false });
+    }
+
     // ЖДЕМ ЗАГРУЗКИ КАМЕРЫ
     streamPromise.then(stream => {
       video.srcObject = stream;
 
       // Запускаем слежение за геолокацией
       startGeolocationTracking();
 
       const snap = document.createElement("button");
       snap.textContent = "СДЕЛАТЬ СНИМОК";
       snap.style.cssText = `
         padding:16px; border:none; color:#fff;
         background:linear-gradient(180deg,#700,#400);
         font-weight:bold; letter-spacing:.15em;
       `;
 
       function updateCoordsPosition() {
         const r = snap.getBoundingClientRect();
         coordsOverlay.style.bottom = `${window.innerHeight - r.top + 12 + coordsOverlay.offsetHeight}px`;
       }
 
       setTimeout(updateCoordsPosition, 0);
       window.addEventListener("resize", updateCoordsPosition);
 
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
 
+      function updateLaserVisibility() {
+        laser.style.display = settings.photoMode === "dot" ? "block" : "none";
+      }
+
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
@@ -546,50 +610,76 @@ document.addEventListener("DOMContentLoaded", () => {
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
           updateCoordsOverlay();
         };
         
         coordsSetting.appendChild(coordsLabel);
         coordsSetting.appendChild(coordsToggle);
         settingsPanel.appendChild(coordsSetting);
+
+        // Настройка режима фото
+        const photoModeSetting = document.createElement("div");
+        photoModeSetting.style.cssText = "display:flex; justify-content:space-between; align-items:center; gap:8px;";
+
+        const photoModeLabel = document.createElement("span");
+        photoModeLabel.textContent = "Режим фото";
+        photoModeLabel.style.cssText = "color:#fff;";
+
+        const photoModeSelect = document.createElement("select");
+        photoModeSelect.style.cssText = "background:#111; color:#fff; border:1px solid #500; padding:4px 6px; border-radius:4px;";
+        photoModeSelect.innerHTML = `
+          <option value="dot">Точка</option>
+          <option value="draw">Рисование</option>
+        `;
+        photoModeSelect.value = settings.photoMode || "dot";
+
+        photoModeSelect.onchange = () => {
+          settings.photoMode = photoModeSelect.value;
+          localStorage.setItem("settings", JSON.stringify(settings));
+          updateLaserVisibility();
+        };
+
+        photoModeSetting.appendChild(photoModeLabel);
+        photoModeSetting.appendChild(photoModeSelect);
+        settingsPanel.appendChild(photoModeSetting);
         
         // ===== КНОПКА "ПАПКИ" (ПРОСМОТР ФОТО) =====
         const openFoldersBtn = document.createElement("button");
         openFoldersBtn.textContent = "ПАПКИ";
         openFoldersBtn.style.cssText = `
           margin-top:8px;
           padding:10px;
           background:#300;
           color:#fff;
           border:2px solid #500;
           border-radius:6px;
           cursor:pointer;
           font-weight:bold;
         `;
 
         openFoldersBtn.onclick = () => {
           // закрываем настройки
           settingsPanel.style.display = "none";
 
           // открываем экран папок (просмотр)
           renderFoldersBrowseList();
           showFoldersScreen();
         };
 
         settingsPanel.appendChild(openFoldersBtn);
@@ -647,94 +737,183 @@ document.addEventListener("DOMContentLoaded", () => {
           settingsPanel.style.display = 'none';
         }
       });
 
       // Обработчик закрытия камеры
       function closeCamera() {
         stopGeolocationTracking();
         stream.getTracks().forEach(t => t.stop());
         if (overlay.parentNode === document.body) {
           document.body.removeChild(overlay);
         }
       }
 
       overlay.appendChild(video);
       overlay.appendChild(laser);
       overlay.appendChild(coordsOverlay);
       overlay.appendChild(folderBtn);
       overlay.appendChild(settingsBtn);
       overlay.appendChild(folderPanel);
       overlay.appendChild(settingsPanel);
       overlay.appendChild(snap);
       document.body.appendChild(overlay);
 
       // Инициализация кнопки
       updateFolderButton();
+      updateLaserVisibility();
 
       snap.onclick = () => {
         try {
+          if (settings.photoMode === "draw") {
+            if (!hasCapturedPhoto) {
+              capturedCoordinates = liveCoordinates
+                ? { latitude: liveCoordinates.latitude, longitude: liveCoordinates.longitude }
+                : null;
+
+              capturedBaseCanvas = document.createElement("canvas");
+              capturedBaseCanvas.width = video.videoWidth;
+              capturedBaseCanvas.height = video.videoHeight;
+              const baseCtx = capturedBaseCanvas.getContext("2d");
+              baseCtx.drawImage(video, 0, 0);
+
+              const baseImage = capturedBaseCanvas.toDataURL("image/jpeg", 0.9);
+
+              frozenImage = document.createElement("img");
+              frozenImage.src = baseImage;
+              frozenImage.style.cssText = `
+                position:fixed;
+                inset:0;
+                width:100%;
+                height:100%;
+                object-fit:cover;
+                z-index:1000;
+                pointer-events:none;
+              `;
+
+              drawCanvas = document.createElement("canvas");
+              drawCanvas.width = capturedBaseCanvas.width;
+              drawCanvas.height = capturedBaseCanvas.height;
+              drawCanvas.style.cssText = `
+                position:fixed;
+                inset:0;
+                width:100%;
+                height:100%;
+                z-index:1001;
+                touch-action:none;
+              `;
+              drawCtx = drawCanvas.getContext("2d");
+              drawCtx.strokeStyle = "#ff0000";
+              drawCtx.lineWidth = Math.max(3, Math.min(drawCanvas.width, drawCanvas.height) * 0.01);
+              drawCtx.lineCap = "round";
+              drawCtx.lineJoin = "round";
+
+              setDrawingHandlers();
+
+              video.style.display = "none";
+              overlay.appendChild(frozenImage);
+              overlay.appendChild(drawCanvas);
+              snap.textContent = "СОХРАНИТЬ";
+              hasCapturedPhoto = true;
+              return;
+            }
+
+            const mergedCanvas = document.createElement("canvas");
+            mergedCanvas.width = capturedBaseCanvas.width;
+            mergedCanvas.height = capturedBaseCanvas.height;
+            const mergedCtx = mergedCanvas.getContext("2d");
+            mergedCtx.drawImage(capturedBaseCanvas, 0, 0);
+            if (drawCanvas) {
+              mergedCtx.drawImage(drawCanvas, 0, 0);
+            }
+
+            const folder = folders.find(f => f.id === activeFolderId);
+            if (folder) {
+              drawTextOnPhoto(mergedCtx, mergedCanvas, folder.name, capturedCoordinates);
+            }
+
+            const img = mergedCanvas.toDataURL("image/jpeg", 0.9);
+
+            const text = folder.template.replace("{date}", new Date().toLocaleString());
+
+            const photos = JSON.parse(localStorage.getItem("photos")) || [];
+            photos.push({
+              id: Date.now(),
+              folderId: activeFolderId,
+              image: img,
+              text
+            });
+            localStorage.setItem("photos", JSON.stringify(photos));
+
+            closeCamera();
+
+            Telegram.WebApp.showAlert("Фото сохранено в папку: " + folder.name);
+            return;
+          }
+
           const canvas = document.createElement("canvas");
           canvas.width = video.videoWidth;
           canvas.height = video.videoHeight;
           const ctx = canvas.getContext("2d");
           ctx.drawImage(video, 0, 0);
-          
+
           // === ЛАЗЕР В ФОТО (ЦЕНТР) ===
-          const cx = canvas.width / 2;
-          const cy = canvas.height / 2;
-          const r = Math.min(canvas.width, canvas.height) * 0.015;
-
-          ctx.beginPath();
-          ctx.arc(cx, cy, r, 0, Math.PI * 2);
-          ctx.fillStyle = "rgba(255,0,0,0.55)";
-          ctx.shadowColor = "rgba(255,0,0,0.9)";
-          ctx.shadowBlur = r * 2;
-          ctx.fill();
-          
+          if (settings.photoMode === "dot") {
+            const cx = canvas.width / 2;
+            const cy = canvas.height / 2;
+            const r = Math.min(canvas.width, canvas.height) * 0.015;
+
+            ctx.beginPath();
+            ctx.arc(cx, cy, r, 0, Math.PI * 2);
+            ctx.fillStyle = "rgba(255,0,0,0.55)";
+            ctx.shadowColor = "rgba(255,0,0,0.9)";
+            ctx.shadowBlur = r * 2;
+            ctx.fill();
+          }
+
           // === РИСУЕМ ТЕКСТ НА ФОТО ===
           const folder = folders.find(f => f.id === activeFolderId);
           if (folder) {
             // Используем текущие координаты из liveCoordinates
             drawTextOnPhoto(ctx, canvas, folder.name, liveCoordinates);
           }
 
           const img = canvas.toDataURL("image/jpeg", 0.9);
-          
+
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
 
           closeCamera();
-          
+
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
 
EOF
)
