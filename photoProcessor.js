// photoProcessor.js
// Отвечает ТОЛЬКО за наложение текста на фото (canvas)
// Никакого хранения, никакого Telegram — чистая обработка изображения.

/**
 * drawTextOnPhoto
 * @param {CanvasRenderingContext2D} ctx
 * @param {HTMLCanvasElement} canvas
 * @param {string} folderName
 * @param {Object|null} coordinates  { latitude, longitude } | null
 * @param {Object} settings { showFolderName: boolean, showCoordinates: boolean }
 */
export function drawTextOnPhoto(ctx, canvas, folderName, coordinates, settings) {
  const lines = [];

  if (settings?.showFolderName && folderName) {
    lines.push(folderName);
  }

  if (settings?.showCoordinates && coordinates) {
    const lat = coordinates.latitude.toFixed(6);
    const lon = coordinates.longitude.toFixed(6);
    lines.push(`${lat}, ${lon}`);
  }

  if (!lines.length) return;

  const fontSize = Math.min(canvas.width, canvas.height) * 0.025;
  const padding = fontSize * 0.6;
  const lineHeight = fontSize * 1.25;

  ctx.font = `bold ${fontSize}px Arial, sans-serif`;
  ctx.textAlign = "left";
  ctx.textBaseline = "bottom";

  const startY =
    canvas.height - padding - (lines.length - 1) * lineHeight;

  lines.forEach((text, i) => {
    const y = startY + i * lineHeight;
    const x = padding;

    const textWidth = ctx.measureText(text).width;

    // подложка
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(
      x - padding * 0.5,
      y - fontSize,
      textWidth + padding,
      fontSize + padding * 0.4
    );

    // текст
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "rgba(0,0,0,0.9)";
    ctx.shadowBlur = 4;
    ctx.fillText(text, x, y);
    ctx.shadowBlur = 0;
  });
}
