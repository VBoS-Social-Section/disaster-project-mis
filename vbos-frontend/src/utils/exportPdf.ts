import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import type { MapRef } from "react-map-gl/maplibre";

const PAGE_WIDTH = 210; // A4 mm
const PAGE_HEIGHT = 297;
const MARGIN = 15;

export async function exportMapAndStatsToPdf(
  mapRef: MapRef | null,
  statsSelector = "[data-pdf-stats]",
): Promise<void> {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  let y = MARGIN;

  // 1. Capture map
  if (mapRef) {
    const canvas = mapRef.getCanvas();
    if (canvas && canvas.width > 0) {
      const imgData = canvas.toDataURL("image/png");
      const imgW = PAGE_WIDTH - 2 * MARGIN;
      const imgH = Math.min(120, (imgW * canvas.height) / canvas.width);
      pdf.addImage(imgData, "PNG", MARGIN, y, imgW, imgH);
      y += imgH + 10;
    }
  }

  // 2. Capture stats section
  const statsEl = document.querySelector(statsSelector);
  if (statsEl) {
    const statsCanvas = await html2canvas(statsEl as HTMLElement, {
      useCORS: true,
      scale: 2,
      backgroundColor: "#ffffff",
      logging: false,
    });
    const statsImg = statsCanvas.toDataURL("image/png");
    const statsW = PAGE_WIDTH - 2 * MARGIN;
    const statsH = Math.min(PAGE_HEIGHT - y - MARGIN, (statsW * statsCanvas.height) / statsCanvas.width);
    pdf.addImage(statsImg, "PNG", MARGIN, y, statsW, statsH);
    y += statsH;
  }

  const filename = `disaster-risk-report-${new Date().toISOString().slice(0, 10)}.pdf`;
  pdf.save(filename);
}
