import QRCode from 'qrcode';

export interface QROptions {
  foreground?: string;
  background?: string;
  width?: number;
  margin?: number;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  centerIcon?: 'phone' | 'contact' | 'custom' | 'none';
  customIconDataUrl?: string;
}

/**
 * Generate QR code as DataURL (PNG) with optional center icon badge
 */
export async function generateQRDataUrl(
  text: string,
  options: QROptions = {}
): Promise<string> {
  const {
    foreground = '#0f172a',
    background = '#ffffff',
    width = 512,
    margin = 2,
    errorCorrectionLevel = 'H', // High error correction permits center logo up to 30%
    centerIcon = 'none',
    customIconDataUrl,
  } = options;

  // Render base QR code onto an offscreen canvas
  if (typeof window !== 'undefined') {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = width;

    await QRCode.toCanvas(canvas, text, {
      width,
      margin,
      errorCorrectionLevel,
      color: {
        dark: foreground,
        light: background,
      },
    });

    // If center icon is selected, overlay badge on canvas
    if (centerIcon !== 'none') {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const iconSize = Math.round(width * 0.22);
        const centerPos = (width - iconSize) / 2;
        const radius = Math.round(iconSize * 0.25);

        // Draw protective background pill/circle
        ctx.save();
        ctx.fillStyle = background;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
        ctx.shadowBlur = 12;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 4;

        ctx.beginPath();
        ctx.roundRect(centerPos - 4, centerPos - 4, iconSize + 8, iconSize + 8, radius + 2);
        ctx.fill();
        ctx.restore();

        // Inner icon border / background
        ctx.fillStyle = foreground;
        ctx.beginPath();
        ctx.roundRect(centerPos, centerPos, iconSize, iconSize, radius);
        ctx.fill();

        // Draw custom image or vector icon
        if (centerIcon === 'custom' && customIconDataUrl) {
          try {
            const img = new Image();
            img.src = customIconDataUrl;
            await new Promise((resolve, reject) => {
              img.onload = resolve;
              img.onerror = reject;
            });
            ctx.save();
            ctx.beginPath();
            ctx.roundRect(centerPos, centerPos, iconSize, iconSize, radius);
            ctx.clip();
            ctx.drawImage(img, centerPos, centerPos, iconSize, iconSize);
            ctx.restore();
          } catch {
            drawFallbackPhoneIcon(ctx, centerPos, iconSize);
          }
        } else {
          drawFallbackPhoneIcon(ctx, centerPos, iconSize);
        }
      }
    }

    return canvas.toDataURL('image/png');
  }

  // Node environment fallback
  return await QRCode.toDataURL(text, {
    width,
    margin,
    errorCorrectionLevel,
    color: {
      dark: foreground,
      light: background,
    },
  });
}

function drawFallbackPhoneIcon(ctx: CanvasRenderingContext2D, centerPos: number, iconSize: number) {
  // Draw clean telephone handset silhouette
  ctx.save();
  ctx.fillStyle = '#ffffff';
  const cx = centerPos + iconSize / 2;
  const cy = centerPos + iconSize / 2;
  const scale = iconSize / 36;

  ctx.translate(cx, cy);
  ctx.scale(scale, scale);

  ctx.beginPath();
  // Standard phone path
  ctx.moveTo(-6, -8);
  ctx.bezierCurveTo(-4, -10, -1, -10, 1, -8);
  ctx.lineTo(3, -5);
  ctx.bezierCurveTo(5, -3, 5, 0, 3, 2);
  ctx.lineTo(2, 3);
  ctx.bezierCurveTo(4, 7, 7, 10, 11, 12);
  ctx.lineTo(12, 11);
  ctx.bezierCurveTo(14, 9, 17, 9, 19, 11);
  ctx.lineTo(22, 13);
  ctx.bezierCurveTo(24, 15, 24, 18, 22, 20);
  ctx.lineTo(20, 22);
  ctx.bezierCurveTo(18, 24, 13, 24, 5, 16);
  ctx.bezierCurveTo(-3, 8, -3, 3, -1, 1);
  ctx.lineTo(1, -1);
  // Center handset
  ctx.translate(-8, -6);
  ctx.fill();
  ctx.restore();
}

/**
 * Generate QR code as SVG string
 */
export async function generateQRSvg(
  text: string,
  options: QROptions = {}
): Promise<string> {
  const {
    foreground = '#0f172a',
    background = '#ffffff',
    width = 512,
    margin = 2,
    errorCorrectionLevel = 'H',
  } = options;

  return await QRCode.toString(text, {
    type: 'svg',
    width,
    margin,
    errorCorrectionLevel,
    color: {
      dark: foreground,
      light: background,
    },
  });
}
