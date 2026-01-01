/**
 * OHCS E-Library - Stunning Splash Screen Generator
 * Generates beautiful, premium splash screens for iOS and Android PWA
 *
 * Features:
 * - Ghana flag-inspired color gradients
 * - Floating particle effects (rendered as static for splash)
 * - 3D book icon with AI sparkle
 * - Modern glassmorphic design elements
 * - Professional typography
 */

const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

// Color palette - Ghana theme
const COLORS = {
  green: '#006B3F',
  greenDark: '#004026',
  greenLight: '#33af77',
  gold: '#FCD116',
  goldDark: '#e6bc00',
  red: '#CE1126',
  black: '#0a0f0d',
  backgroundDark: '#0d1a14',
  white: '#ffffff',
};

// All required splash screen sizes
const SPLASH_SIZES = [
  // Legacy iPhones
  { width: 640, height: 1136, name: 'splash-640x1136.png' },
  { width: 750, height: 1334, name: 'splash-750x1334.png' },
  { width: 1242, height: 2208, name: 'splash-1242x2208.png' },
  { width: 828, height: 1792, name: 'splash-828x1792.png' },
  { width: 1242, height: 2688, name: 'splash-1242x2688.png' },
  { width: 1125, height: 2436, name: 'splash-1125x2436.png' },
  // iPhone 12/13/14 series
  { width: 1170, height: 2532, name: 'splash-1170x2532.png' },
  { width: 1284, height: 2778, name: 'splash-1284x2778.png' },
  { width: 1179, height: 2556, name: 'splash-1179x2556.png' },
  { width: 1290, height: 2796, name: 'splash-1290x2796.png' },
  // iPhone 15/16 Pro series
  { width: 1179, height: 2556, name: 'splash-1179x2556-15pro.png' },
  { width: 1290, height: 2796, name: 'splash-1290x2796-15promax.png' },
  { width: 1206, height: 2622, name: 'splash-1206x2622.png' },
  { width: 1320, height: 2868, name: 'splash-1320x2868.png' },
  // Android common sizes
  { width: 1080, height: 2340, name: 'splash-1080x2340.png' },
  { width: 1080, height: 2400, name: 'splash-1080x2400.png' },
  { width: 1440, height: 3088, name: 'splash-1440x3088.png' },
  { width: 1440, height: 3120, name: 'splash-1440x3120.png' },
  // Samsung devices
  { width: 1080, height: 2340, name: 'splash-samsung-s24.png' },
  { width: 1440, height: 3120, name: 'splash-samsung-s25-ultra.png' },
  // Foldables
  { width: 1768, height: 2208, name: 'splash-zfold-inner.png' },
  { width: 832, height: 2268, name: 'splash-zfold-outer.png' },
  { width: 1080, height: 2640, name: 'splash-zflip.png' },
  // iPads
  { width: 1536, height: 2048, name: 'splash-1536x2048.png' },
  { width: 1668, height: 2224, name: 'splash-1668x2224.png' },
  { width: 1668, height: 2388, name: 'splash-1668x2388.png' },
  { width: 2048, height: 2732, name: 'splash-2048x2732.png' },
];

/**
 * Create radial gradient for background glow effects
 */
function createRadialGlow(ctx, centerX, centerY, radius, color, opacity) {
  const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
  const hex = Math.round(opacity * 255).toString(16).padStart(2, '0');
  const hex2 = Math.round(opacity * 0.5 * 255).toString(16).padStart(2, '0');
  gradient.addColorStop(0, `${color}${hex}`);
  gradient.addColorStop(0.5, `${color}${hex2}`);
  gradient.addColorStop(1, 'rgba(0,0,0,0)');
  return gradient;
}

/**
 * Draw a floating particle
 */
function drawParticle(ctx, x, y, size, color, opacity) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 2);
  const hex = Math.round(opacity * 255).toString(16).padStart(2, '0');
  ctx.fillStyle = color + hex;
  ctx.shadowColor = color;
  ctx.shadowBlur = size * 3;
  ctx.fill();
  ctx.restore();
}

/**
 * Draw the 3D book icon
 */
function drawBookIcon(ctx, centerX, centerY, scale) {
  const bookWidth = 60 * scale;
  const bookHeight = 80 * scale;
  const spineWidth = 8 * scale;

  ctx.save();
  ctx.translate(centerX, centerY);

  // Shadow
  ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
  ctx.shadowBlur = 20 * scale;
  ctx.shadowOffsetX = 5 * scale;
  ctx.shadowOffsetY = 10 * scale;

  // Book spine (3D effect)
  ctx.fillStyle = COLORS.greenDark;
  ctx.beginPath();
  ctx.moveTo(-bookWidth/2 - spineWidth, -bookHeight/2);
  ctx.lineTo(-bookWidth/2, -bookHeight/2);
  ctx.lineTo(-bookWidth/2, bookHeight/2);
  ctx.lineTo(-bookWidth/2 - spineWidth, bookHeight/2);
  ctx.closePath();
  ctx.fill();

  // Book cover gradient
  const coverGradient = ctx.createLinearGradient(-bookWidth/2, 0, bookWidth/2, 0);
  coverGradient.addColorStop(0, COLORS.green);
  coverGradient.addColorStop(1, COLORS.greenDark);

  ctx.shadowColor = 'transparent';
  ctx.fillStyle = coverGradient;
  ctx.fillRect(-bookWidth/2, -bookHeight/2, bookWidth, bookHeight);

  // Gold border accents
  ctx.strokeStyle = COLORS.gold + '66';
  ctx.lineWidth = 2 * scale;
  ctx.strokeRect(-bookWidth/2 + 4*scale, -bookHeight/2 + 4*scale, bookWidth - 8*scale, bookHeight - 8*scale);

  // Gold decoration lines
  ctx.fillStyle = COLORS.gold + '99';
  ctx.fillRect(-bookWidth/2 + 8*scale, -bookHeight/2 + 12*scale, bookWidth - 16*scale, 2*scale);
  ctx.fillRect(-bookWidth/2 + 8*scale, bookHeight/2 - 14*scale, bookWidth - 16*scale, 2*scale);

  // Book pages (right edge)
  ctx.fillStyle = '#f5f0e6';
  ctx.beginPath();
  ctx.moveTo(bookWidth/2, -bookHeight/2 + 4*scale);
  ctx.lineTo(bookWidth/2 + 4*scale, -bookHeight/2 + 6*scale);
  ctx.lineTo(bookWidth/2 + 4*scale, bookHeight/2 - 6*scale);
  ctx.lineTo(bookWidth/2, bookHeight/2 - 4*scale);
  ctx.closePath();
  ctx.fill();

  // Page lines
  ctx.strokeStyle = '#e0ddd5';
  ctx.lineWidth = 0.5 * scale;
  for (let i = 0; i < 6; i++) {
    const y = -bookHeight/2 + 4*scale + (i * (bookHeight - 8*scale) / 6);
    ctx.beginPath();
    ctx.moveTo(bookWidth/2, y);
    ctx.lineTo(bookWidth/2 + 4*scale, y + 2*scale);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Draw the AI sparkle icon
 */
function drawAISparkle(ctx, centerX, centerY, size) {
  ctx.save();
  ctx.translate(centerX, centerY);

  // Glow effect
  ctx.shadowColor = COLORS.gold;
  ctx.shadowBlur = size * 0.8;

  // Draw 4-pointed star
  ctx.fillStyle = COLORS.gold;
  ctx.beginPath();

  const outerRadius = size;
  const innerRadius = size * 0.35;
  const points = 4;

  for (let i = 0; i < points * 2; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = (i * Math.PI) / points - Math.PI / 2;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;

    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }

  ctx.closePath();
  ctx.fill();

  // Inner glow
  ctx.fillStyle = '#ffffff88';
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const radius = i % 2 === 0 ? outerRadius * 0.4 : innerRadius * 0.6;
    const angle = (i * Math.PI) / points - Math.PI / 2;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;

    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

/**
 * Draw glowing ring around the icon
 */
function drawGlowRing(ctx, centerX, centerY, radius, scale) {
  ctx.save();

  // Outer glow ring
  ctx.strokeStyle = COLORS.gold + '40';
  ctx.lineWidth = 2 * scale;
  ctx.shadowColor = COLORS.gold;
  ctx.shadowBlur = 15 * scale;

  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.stroke();

  // Inner green glow
  ctx.strokeStyle = COLORS.green + '30';
  ctx.shadowColor = COLORS.green;
  ctx.shadowBlur = 10 * scale;

  ctx.beginPath();
  ctx.arc(centerX, centerY, radius * 0.85, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

/**
 * Draw the Ghana flag stripe decoration
 */
function drawGhanaStripe(ctx, y, width, scale) {
  const stripeWidth = 30 * scale;
  const stripeHeight = 4 * scale;
  const gap = 6 * scale;
  const totalWidth = (stripeWidth * 3) + (gap * 2);
  const startX = (width - totalWidth) / 2;

  ctx.save();

  // Red stripe
  ctx.fillStyle = COLORS.red;
  ctx.shadowColor = COLORS.red;
  ctx.shadowBlur = 8 * scale;
  roundRect(ctx, startX, y, stripeWidth, stripeHeight, 2 * scale);
  ctx.fill();

  // Gold stripe
  ctx.fillStyle = COLORS.gold;
  ctx.shadowColor = COLORS.gold;
  roundRect(ctx, startX + stripeWidth + gap, y, stripeWidth, stripeHeight, 2 * scale);
  ctx.fill();

  // Green stripe
  ctx.fillStyle = COLORS.green;
  ctx.shadowColor = COLORS.green;
  roundRect(ctx, startX + (stripeWidth + gap) * 2, y, stripeWidth, stripeHeight, 2 * scale);
  ctx.fill();

  ctx.restore();
}

/**
 * Helper function to draw rounded rectangles
 */
function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/**
 * Generate a splash screen with the given dimensions
 */
function generateSplashScreen(width, height, outputPath) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Calculate scale based on screen size
  const baseSize = 750;
  const scale = Math.min(width, height) / baseSize;
  const contentScale = scale * 1.2; // Slightly larger for visibility

  // ===== BACKGROUND =====
  // Deep dark gradient background
  const bgGradient = ctx.createLinearGradient(0, 0, width, height);
  bgGradient.addColorStop(0, COLORS.black);
  bgGradient.addColorStop(0.5, COLORS.backgroundDark);
  bgGradient.addColorStop(1, COLORS.black);
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, width, height);

  // ===== AMBIENT GLOWS =====
  // Top green glow
  ctx.fillStyle = createRadialGlow(ctx, width * 0.5, 0, height * 0.5, COLORS.green, 0.15);
  ctx.fillRect(0, 0, width, height);

  // Bottom-right gold glow
  ctx.fillStyle = createRadialGlow(ctx, width * 0.8, height, height * 0.4, COLORS.gold, 0.08);
  ctx.fillRect(0, 0, width, height);

  // Bottom-left red glow
  ctx.fillStyle = createRadialGlow(ctx, width * 0.2, height * 0.8, height * 0.3, COLORS.red, 0.05);
  ctx.fillRect(0, 0, width, height);

  // ===== FLOATING PARTICLES =====
  const particles = [
    { x: 0.1, y: 0.2, size: 4, color: COLORS.gold, opacity: 0.6 },
    { x: 0.2, y: 0.75, size: 3, color: COLORS.green, opacity: 0.5 },
    { x: 0.85, y: 0.3, size: 4, color: COLORS.gold, opacity: 0.5 },
    { x: 0.75, y: 0.7, size: 3, color: COLORS.green, opacity: 0.4 },
    { x: 0.5, y: 0.1, size: 3, color: COLORS.gold, opacity: 0.4 },
    { x: 0.3, y: 0.55, size: 2, color: COLORS.red, opacity: 0.35 },
    { x: 0.9, y: 0.5, size: 3, color: COLORS.gold, opacity: 0.5 },
    { x: 0.05, y: 0.45, size: 2, color: COLORS.green, opacity: 0.4 },
    { x: 0.6, y: 0.85, size: 2, color: COLORS.gold, opacity: 0.3 },
    { x: 0.4, y: 0.15, size: 3, color: COLORS.green, opacity: 0.4 },
  ];

  particles.forEach(p => {
    drawParticle(ctx, width * p.x, height * p.y, p.size * scale, p.color, p.opacity);
  });

  // ===== MAIN CONTENT =====
  const centerX = width / 2;
  const contentCenterY = height * 0.42;

  // Glowing ring
  drawGlowRing(ctx, centerX, contentCenterY - 10 * contentScale, 65 * contentScale, contentScale);

  // Book icon
  drawBookIcon(ctx, centerX, contentCenterY, contentScale);

  // AI Sparkle
  drawAISparkle(ctx, centerX + 45 * contentScale, contentCenterY - 55 * contentScale, 18 * contentScale);

  // ===== TYPOGRAPHY =====
  const titleY = contentCenterY + 90 * contentScale;

  // "The" text
  ctx.font = `${Math.round(16 * contentScale)}px Georgia, serif`;
  ctx.fillStyle = COLORS.white + 'cc';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('The', centerX, titleY - 25 * contentScale);

  // "AI-Powered" highlight text
  ctx.font = `bold ${Math.round(28 * contentScale)}px Georgia, serif`;

  // Create gold gradient for AI-Powered text
  const goldTextGradient = ctx.createLinearGradient(
    centerX - 100 * contentScale,
    0,
    centerX + 100 * contentScale,
    0
  );
  goldTextGradient.addColorStop(0, COLORS.gold);
  goldTextGradient.addColorStop(0.5, '#ffe066');
  goldTextGradient.addColorStop(1, COLORS.gold);

  ctx.fillStyle = goldTextGradient;
  ctx.shadowColor = COLORS.gold;
  ctx.shadowBlur = 10 * contentScale;
  ctx.fillText('AI-Powered', centerX, titleY);

  // "Library" text
  ctx.shadowBlur = 0;
  ctx.fillStyle = COLORS.white;
  ctx.font = `bold ${Math.round(28 * contentScale)}px Georgia, serif`;
  ctx.fillText('Library', centerX, titleY + 35 * contentScale);

  // Subtitle
  ctx.fillStyle = COLORS.white + '99';
  ctx.font = `${Math.round(14 * contentScale)}px Arial, sans-serif`;
  ctx.fillText("for Ghana's Civil Service", centerX, titleY + 70 * contentScale);

  // ===== LOADING INDICATOR =====
  const progressY = titleY + 110 * contentScale;
  const progressWidth = 180 * contentScale;
  const progressHeight = 3 * contentScale;

  // Progress track
  ctx.fillStyle = COLORS.white + '1a';
  roundRect(ctx, centerX - progressWidth/2, progressY, progressWidth, progressHeight, progressHeight/2);
  ctx.fill();

  // Progress bar (static position for splash screen)
  const progressGradient = ctx.createLinearGradient(
    centerX - progressWidth/2,
    0,
    centerX + progressWidth/2,
    0
  );
  progressGradient.addColorStop(0, COLORS.green);
  progressGradient.addColorStop(0.5, COLORS.gold);
  progressGradient.addColorStop(1, COLORS.green);

  ctx.fillStyle = progressGradient;
  roundRect(ctx, centerX - progressWidth/4, progressY, progressWidth * 0.4, progressHeight, progressHeight/2);
  ctx.fill();

  // ===== GHANA FLAG STRIPE =====
  drawGhanaStripe(ctx, height - 50 * contentScale, width, contentScale);

  // ===== SAVE FILE =====
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);
  console.log(`  Created: ${path.basename(outputPath)} (${width}x${height})`);
}

/**
 * Main function to generate all splash screens
 */
async function main() {
  const outputDir = path.join(__dirname, '..', 'public', 'splash');

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log('\n========================================');
  console.log('  OHCS E-Library Splash Screen Generator');
  console.log('========================================\n');
  console.log(`Generating ${SPLASH_SIZES.length} splash screens...\n`);

  for (const size of SPLASH_SIZES) {
    const outputPath = path.join(outputDir, size.name);
    generateSplashScreen(size.width, size.height, outputPath);
  }

  console.log('\n========================================');
  console.log(`  Successfully generated ${SPLASH_SIZES.length} splash screens!`);
  console.log('========================================\n');
}

// Run the generator
main().catch(console.error);
