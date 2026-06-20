"use client";
import html2canvas from "html2canvas";

function colorToHex(color: string): string {
  if (!color || color === 'transparent' || color === 'rgba(0, 0, 0, 0)') return 'transparent';
  if (color.startsWith('#')) return color;
  
  const ctx = document.createElement('canvas').getContext('2d');
  if (!ctx) return '#000000';
  
  ctx.fillStyle = color;
  return ctx.fillStyle;
}

export async function shareTimeCapsule(elementId: string, year: number) {
  const element = document.getElementById(elementId);
  if (!element) return;
  try {
    // Force all colors to hex before html2canvas
    const allElements = element.querySelectorAll('*');
    const originalStyles: Map<Element, { color: string; backgroundColor: string; cssText: string }> = new Map();
    
    allElements.forEach((el) => {
      const computed = window.getComputedStyle(el as HTMLElement);
      const original = {
        color: (el as HTMLElement).style.color,
        backgroundColor: (el as HTMLElement).style.backgroundColor,
        cssText: (el as HTMLElement).style.cssText
      };
      originalStyles.set(el, original);
      
      // Convert computed colors to hex
      const hexColor = colorToHex(computed.color);
      const hexBg = colorToHex(computed.backgroundColor);
      
      (el as HTMLElement).style.color = hexColor;
      (el as HTMLElement).style.backgroundColor = hexBg;
    });

    const canvas = await html2canvas(element, {
      useCORS: true,
      scale: 2,
      backgroundColor: "#2d1b69",
      logging: false,
    });

    // Restore original styles
    allElements.forEach((el) => {
      const original = originalStyles.get(el);
      if (original) {
        (el as HTMLElement).style.color = original.color;
        (el as HTMLElement).style.backgroundColor = original.backgroundColor;
        (el as HTMLElement).style.cssText = original.cssText;
      }
    });

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], `air-of-${year}.png`, { type: "image/png" });
      const shareData = {
        files: [file],
        title: `On This Day in ${year}`,
        text: `Look what happened in ${year}! 🕰️\n\nretrosite.in`,
      };
      if (navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        const link = document.createElement("a");
        link.download = `time-capsule-${year}.png`;
        link.href = URL.createObjectURL(blob);
        link.click();
        navigator.clipboard?.writeText(window.location.href);
      }
    }, "image/png");
  } catch (err) {
    console.error("Share failed:", err);
  }
}
