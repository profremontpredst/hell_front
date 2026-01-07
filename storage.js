// storage.js
// ЕДИНЫЙ слой хранения. НИЧЕГО лишнего. localStorage.

/*
СТРУКТУРА ДАННЫХ:

folders: [
  { id: "f1", name: "Папка 1", template: "Фото из папки 1 • {date}" },
  ...
]

photos: [
  {
    id: 1712345678901,
    folderId: "f1",
    image: "data:image/jpeg;base64,...",
    text: "Фото из папки 1 • 01.01.2026, 12:00"
  },
  ...
]
*/

const STORAGE_KEYS = {
  FOLDERS: "folders",
  PHOTOS: "photos"
};

// ===== ПАПКИ =====
export function getFolders() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.FOLDERS)) || [];
}

// ===== ФОТО =====
export function getPhotos() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.PHOTOS)) || [];
}

// ===== ПОЛНАЯ ОЧИСТКА ФОТО (ПАПКИ НЕ ТРОГАЕМ) =====
export function deleteAll() {
  localStorage.removeItem(STORAGE_KEYS.PHOTOS);
}
