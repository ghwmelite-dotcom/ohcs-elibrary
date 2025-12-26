import sharp from 'sharp';
import { mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SCREENSHOTS = [
  // Desktop
  { width: 1920, height: 1080, name: 'desktop', label: 'Desktop View' },
  { width: 2560, height: 1440, name: 'desktop-2k', label: 'Desktop 2K View' },

  // Standard mobile (for manifest)
  { width: 390, height: 844, name: 'mobile', label: 'Mobile View' },

  // iPhone series
  { width: 430, height: 932, name: 'iphone-15-pro-max', label: 'iPhone 15 Pro Max' },
  { width: 393, height: 852, name: 'iphone-15-pro', label: 'iPhone 15 Pro' },
  { width: 440, height: 956, name: 'iphone-16-pro-max', label: 'iPhone 16 Pro Max' },
  { width: 402, height: 874, name: 'iphone-16-pro', label: 'iPhone 16 Pro' },

  // Samsung Galaxy
  { width: 412, height: 915, name: 'galaxy-s24-ultra', label: 'Galaxy S24 Ultra' },
  { width: 360, height: 780, name: 'galaxy-s24', label: 'Galaxy S24' },
  { width: 412, height: 915, name: 'galaxy-s25-ultra', label: 'Galaxy S25 Ultra' },

  // Samsung Z Fold/Flip
  { width: 673, height: 838, name: 'galaxy-z-fold', label: 'Galaxy Z Fold (Unfolded)' },
  { width: 360, height: 748, name: 'galaxy-z-flip', label: 'Galaxy Z Flip' },

  // Tablets
  { width: 1024, height: 1366, name: 'ipad-pro', label: 'iPad Pro' },
  { width: 800, height: 1280, name: 'android-tablet', label: 'Android Tablet' },
];

async function generateScreenshots() {
  const publicDir = join(__dirname, '..', 'public');
  const screenshotsDir = join(publicDir, 'screenshots');

  // Create directory if it doesn't exist
  if (!existsSync(screenshotsDir)) {
    mkdirSync(screenshotsDir, { recursive: true });
  }

  console.log('Generating PWA screenshots...\n');

  for (const screenshot of SCREENSHOTS) {
    const { width, height, name, label } = screenshot;
    const outputPath = join(screenshotsDir, `${name}.png`);

    const isDesktop = name === 'desktop';
    const padding = isDesktop ? 80 : 40;
    const logoSize = isDesktop ? 120 : 80;
    const titleSize = isDesktop ? 48 : 32;
    const subtitleSize = isDesktop ? 24 : 16;
    const featureSize = isDesktop ? 18 : 14;
    const cardWidth = isDesktop ? 280 : width - 80;
    const cardHeight = isDesktop ? 180 : 120;
    const cardSpacing = isDesktop ? 30 : 20;

    // Create SVG screenshot
    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <!-- Background gradient -->
          <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#0a1628"/>
            <stop offset="50%" style="stop-color:#0f1f35"/>
            <stop offset="100%" style="stop-color:#0a1628"/>
          </linearGradient>

          <!-- Ghana accent gradient -->
          <linearGradient id="ghanaGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:#CE1126"/>
            <stop offset="50%" style="stop-color:#FCD116"/>
            <stop offset="100%" style="stop-color:#006B3F"/>
          </linearGradient>

          <!-- Card gradient -->
          <linearGradient id="cardGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:rgba(255,255,255,0.1)"/>
            <stop offset="100%" style="stop-color:rgba(255,255,255,0.05)"/>
          </linearGradient>

          <!-- Green glow -->
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="20" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          <!-- Subtle pattern -->
          <pattern id="dots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <circle cx="20" cy="20" r="1" fill="rgba(255,255,255,0.03)"/>
          </pattern>
        </defs>

        <!-- Background -->
        <rect width="100%" height="100%" fill="url(#bgGrad)"/>
        <rect width="100%" height="100%" fill="url(#dots)"/>

        <!-- Decorative circles -->
        <circle cx="${width * 0.8}" cy="${height * 0.2}" r="${isDesktop ? 300 : 150}" fill="rgba(0,107,63,0.1)" filter="url(#glow)"/>
        <circle cx="${width * 0.2}" cy="${height * 0.8}" r="${isDesktop ? 250 : 120}" fill="rgba(252,209,22,0.05)"/>

        <!-- Ghana flag stripe at top -->
        <rect x="0" y="0" width="100%" height="4" fill="url(#ghanaGrad)"/>

        <!-- Header bar -->
        <rect x="0" y="4" width="100%" height="${isDesktop ? 70 : 56}" fill="rgba(0,0,0,0.3)"/>

        <!-- Logo in header -->
        <g transform="translate(${padding}, ${isDesktop ? 18 : 14})">
          <!-- Open book icon -->
          <rect x="0" y="8" width="16" height="20" rx="2" fill="#006B3F"/>
          <rect x="18" y="8" width="16" height="20" rx="2" fill="#004d2e"/>
          <polygon points="17,6 17,30 17,6" stroke="#FCD116" stroke-width="2" fill="none"/>
          <!-- Star -->
          <polygon points="17,32 19,38 25,38 20,42 22,48 17,44 12,48 14,42 9,38 15,38" fill="#000" stroke="#FCD116" stroke-width="1" transform="scale(0.5) translate(17, 40)"/>
        </g>

        <!-- App name in header -->
        <text x="${padding + 50}" y="${isDesktop ? 48 : 40}" font-family="Georgia, serif" font-size="${isDesktop ? 22 : 18}" font-weight="bold" fill="white">OHCS E-Library</text>

        <!-- Main content area -->
        <g transform="translate(${width/2}, ${height * 0.35})">
          <!-- Main logo -->
          <g transform="translate(0, 0)">
            <circle cx="0" cy="0" r="${logoSize}" fill="rgba(0,107,63,0.2)" stroke="rgba(252,209,22,0.3)" stroke-width="2"/>
            <!-- Book icon -->
            <g transform="translate(-${logoSize * 0.4}, -${logoSize * 0.3})">
              <path d="M0 0 L0 ${logoSize * 0.8} Q${logoSize * 0.3} ${logoSize * 0.7} ${logoSize * 0.4} ${logoSize * 0.75} L${logoSize * 0.4} -${logoSize * 0.05} Q${logoSize * 0.3} -${logoSize * 0.1} 0 0 Z" fill="white"/>
              <path d="M${logoSize * 0.4} 0 L${logoSize * 0.4} ${logoSize * 0.75} Q${logoSize * 0.5} ${logoSize * 0.7} ${logoSize * 0.8} ${logoSize * 0.8} L${logoSize * 0.8} -${logoSize * 0.05} Q${logoSize * 0.5} -${logoSize * 0.1} ${logoSize * 0.4} 0 Z" fill="#f0f0f0"/>
            </g>
            <!-- Star on book -->
            <polygon points="0,${logoSize * 0.25} ${logoSize * 0.08},${logoSize * 0.35} ${logoSize * 0.15},${logoSize * 0.35} ${logoSize * 0.1},${logoSize * 0.42} ${logoSize * 0.12},${logoSize * 0.52} 0,${logoSize * 0.45} -${logoSize * 0.12},${logoSize * 0.52} -${logoSize * 0.1},${logoSize * 0.42} -${logoSize * 0.15},${logoSize * 0.35} -${logoSize * 0.08},${logoSize * 0.35}" fill="#000" stroke="#FCD116" stroke-width="2"/>
          </g>

          <!-- Title -->
          <text x="0" y="${logoSize + 50}" text-anchor="middle" font-family="Georgia, serif" font-size="${titleSize}" font-weight="bold" fill="white">Ghana Civil Service</text>
          <text x="0" y="${logoSize + 50 + titleSize + 10}" text-anchor="middle" font-family="Georgia, serif" font-size="${titleSize}" font-weight="bold" fill="#FCD116">E-Library</text>

          <!-- Subtitle -->
          <text x="0" y="${logoSize + 50 + titleSize * 2 + 30}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${subtitleSize}" fill="rgba(255,255,255,0.7)">AI-Powered Knowledge Platform for Civil Servants</text>
        </g>

        <!-- Feature cards -->
        ${isDesktop ? `
        <g transform="translate(${(width - (cardWidth * 4 + cardSpacing * 3)) / 2}, ${height * 0.68})">
          <!-- Library card -->
          <g transform="translate(0, 0)">
            <rect width="${cardWidth}" height="${cardHeight}" rx="16" fill="url(#cardGrad)" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
            <rect x="20" y="20" width="40" height="40" rx="8" fill="rgba(0,107,63,0.3)"/>
            <text x="40" y="48" text-anchor="middle" font-size="20" fill="#006B3F">📚</text>
            <text x="20" y="85" font-family="Arial, sans-serif" font-size="${featureSize}" font-weight="600" fill="white">Document Library</text>
            <text x="20" y="105" font-family="Arial, sans-serif" font-size="${featureSize - 2}" fill="rgba(255,255,255,0.6)">2,500+ Documents</text>
            <text x="20" y="125" font-family="Arial, sans-serif" font-size="${featureSize - 2}" fill="rgba(255,255,255,0.6)">AI Summaries</text>
          </g>

          <!-- Forum card -->
          <g transform="translate(${cardWidth + cardSpacing}, 0)">
            <rect width="${cardWidth}" height="${cardHeight}" rx="16" fill="url(#cardGrad)" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
            <rect x="20" y="20" width="40" height="40" rx="8" fill="rgba(252,209,22,0.2)"/>
            <text x="40" y="48" text-anchor="middle" font-size="20" fill="#FCD116">💬</text>
            <text x="20" y="85" font-family="Arial, sans-serif" font-size="${featureSize}" font-weight="600" fill="white">Community Forum</text>
            <text x="20" y="105" font-family="Arial, sans-serif" font-size="${featureSize - 2}" fill="rgba(255,255,255,0.6)">Knowledge Sharing</text>
            <text x="20" y="125" font-family="Arial, sans-serif" font-size="${featureSize - 2}" fill="rgba(255,255,255,0.6)">Expert Discussions</text>
          </g>

          <!-- Chat card -->
          <g transform="translate(${(cardWidth + cardSpacing) * 2}, 0)">
            <rect width="${cardWidth}" height="${cardHeight}" rx="16" fill="url(#cardGrad)" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
            <rect x="20" y="20" width="40" height="40" rx="8" fill="rgba(206,17,38,0.2)"/>
            <text x="40" y="48" text-anchor="middle" font-size="20" fill="#CE1126">🔴</text>
            <text x="20" y="85" font-family="Arial, sans-serif" font-size="${featureSize}" font-weight="600" fill="white">Real-time Chat</text>
            <text x="20" y="105" font-family="Arial, sans-serif" font-size="${featureSize - 2}" fill="rgba(255,255,255,0.6)">Instant Messaging</text>
            <text x="20" y="125" font-family="Arial, sans-serif" font-size="${featureSize - 2}" fill="rgba(255,255,255,0.6)">Team Collaboration</text>
          </g>

          <!-- Gamification card -->
          <g transform="translate(${(cardWidth + cardSpacing) * 3}, 0)">
            <rect width="${cardWidth}" height="${cardHeight}" rx="16" fill="url(#cardGrad)" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
            <rect x="20" y="20" width="40" height="40" rx="8" fill="rgba(252,209,22,0.3)"/>
            <text x="40" y="48" text-anchor="middle" font-size="20" fill="#FCD116">🏆</text>
            <text x="20" y="85" font-family="Arial, sans-serif" font-size="${featureSize}" font-weight="600" fill="white">Gamification</text>
            <text x="20" y="105" font-family="Arial, sans-serif" font-size="${featureSize - 2}" fill="rgba(255,255,255,0.6)">XP &amp; Badges</text>
            <text x="20" y="125" font-family="Arial, sans-serif" font-size="${featureSize - 2}" fill="rgba(255,255,255,0.6)">Leaderboards</text>
          </g>
        </g>
        ` : `
        <!-- Mobile: 2x2 grid -->
        <g transform="translate(${padding}, ${height * 0.62})">
          <g transform="translate(0, 0)">
            <rect width="${(width - padding * 2 - cardSpacing) / 2}" height="${cardHeight}" rx="12" fill="url(#cardGrad)" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
            <text x="15" y="30" font-size="24">📚</text>
            <text x="15" y="55" font-family="Arial, sans-serif" font-size="${featureSize}" font-weight="600" fill="white">Library</text>
            <text x="15" y="75" font-family="Arial, sans-serif" font-size="${featureSize - 2}" fill="rgba(255,255,255,0.6)">2,500+ Docs</text>
          </g>
          <g transform="translate(${(width - padding * 2 + cardSpacing) / 2}, 0)">
            <rect width="${(width - padding * 2 - cardSpacing) / 2}" height="${cardHeight}" rx="12" fill="url(#cardGrad)" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
            <text x="15" y="30" font-size="24">💬</text>
            <text x="15" y="55" font-family="Arial, sans-serif" font-size="${featureSize}" font-weight="600" fill="white">Forum</text>
            <text x="15" y="75" font-family="Arial, sans-serif" font-size="${featureSize - 2}" fill="rgba(255,255,255,0.6)">Discussions</text>
          </g>
          <g transform="translate(0, ${cardHeight + cardSpacing})">
            <rect width="${(width - padding * 2 - cardSpacing) / 2}" height="${cardHeight}" rx="12" fill="url(#cardGrad)" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
            <text x="15" y="30" font-size="24">💭</text>
            <text x="15" y="55" font-family="Arial, sans-serif" font-size="${featureSize}" font-weight="600" fill="white">Chat</text>
            <text x="15" y="75" font-family="Arial, sans-serif" font-size="${featureSize - 2}" fill="rgba(255,255,255,0.6)">Real-time</text>
          </g>
          <g transform="translate(${(width - padding * 2 + cardSpacing) / 2}, ${cardHeight + cardSpacing})">
            <rect width="${(width - padding * 2 - cardSpacing) / 2}" height="${cardHeight}" rx="12" fill="url(#cardGrad)" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
            <text x="15" y="30" font-size="24">🏆</text>
            <text x="15" y="55" font-family="Arial, sans-serif" font-size="${featureSize}" font-weight="600" fill="white">Rewards</text>
            <text x="15" y="75" font-family="Arial, sans-serif" font-size="${featureSize - 2}" fill="rgba(255,255,255,0.6)">XP &amp; Badges</text>
          </g>
        </g>
        `}

        <!-- Stats bar at bottom -->
        <rect x="0" y="${height - 60}" width="100%" height="60" fill="rgba(0,0,0,0.4)"/>
        <g transform="translate(${width / 2}, ${height - 30})">
          <text x="${isDesktop ? -300 : -120}" y="0" text-anchor="middle" font-family="Arial, sans-serif" font-size="${isDesktop ? 14 : 11}" fill="rgba(255,255,255,0.5)">
            <tspan font-weight="bold" fill="#FCD116">${isDesktop ? '20,000+' : '20K+'}</tspan> Civil Servants
          </text>
          <text x="${isDesktop ? -100 : -40}" y="0" text-anchor="middle" font-family="Arial, sans-serif" font-size="${isDesktop ? 14 : 11}" fill="rgba(255,255,255,0.5)">
            <tspan font-weight="bold" fill="#FCD116">${isDesktop ? '2,500+' : '2.5K+'}</tspan> Documents
          </text>
          <text x="${isDesktop ? 100 : 40}" y="0" text-anchor="middle" font-family="Arial, sans-serif" font-size="${isDesktop ? 14 : 11}" fill="rgba(255,255,255,0.5)">
            <tspan font-weight="bold" fill="#FCD116">45</tspan> MDAs
          </text>
          <text x="${isDesktop ? 300 : 120}" y="0" text-anchor="middle" font-family="Arial, sans-serif" font-size="${isDesktop ? 14 : 11}" fill="rgba(255,255,255,0.5)">
            <tspan font-weight="bold" fill="#FCD116">${isDesktop ? '150+' : '150+'}</tspan> Training
          </text>
        </g>

        <!-- Ghana flag stripe at bottom -->
        <rect x="0" y="${height - 4}" width="100%" height="4" fill="url(#ghanaGrad)"/>
      </svg>
    `;

    await sharp(Buffer.from(svg))
      .png()
      .toFile(outputPath);

    console.log(`  Created: screenshots/${name}.png (${width}x${height})`);
  }

  console.log('\nPWA screenshots generated successfully!');
}

generateScreenshots().catch(console.error);
