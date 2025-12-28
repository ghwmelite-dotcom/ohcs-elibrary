/**
 * PDF Report Generator for Wellness Centre
 * Generates individual user reports and aggregate analytics reports
 * Uses dynamic imports to reduce initial bundle size
 */

import type { UserWellnessReport, AggregateWellnessReport, CounselorTopic } from '@/types';

// Extend jsPDF with autoTable (for TypeScript)
interface JsPDFWithAutoTable {
  autoTable: (options: unknown) => void;
  lastAutoTable: { finalY: number };
  internal: { pageSize: { getWidth: () => number; getHeight: () => number } };
  setFillColor: (r: number, g: number, b: number) => void;
  rect: (x: number, y: number, w: number, h: number, style: string) => void;
  setTextColor: (r: number, g: number, b: number) => void;
  setFontSize: (size: number) => void;
  setFont: (font: string, style: string) => void;
  text: (text: string, x: number, y: number, options?: { align?: string }) => void;
  setDrawColor: (r: number, g: number, b: number) => void;
  line: (x1: number, y1: number, x2: number, y2: number) => void;
  output: (type: string) => Blob;
}

// Topic labels for display
const topicLabels: Record<CounselorTopic, string> = {
  work_stress: 'Work Stress',
  career: 'Career Growth',
  relationships: 'Relationships',
  personal: 'Personal Life',
  financial: 'Financial',
  general: 'General',
};

// Mood emojis and labels
const moodLabels: Record<number, string> = {
  1: 'Very Low',
  2: 'Low',
  3: 'Neutral',
  4: 'Good',
  5: 'Excellent',
};

/**
 * Dynamically load jsPDF and jspdf-autotable
 * This reduces the initial bundle size significantly (~300KB savings)
 */
async function loadJsPDF(): Promise<new () => JsPDFWithAutoTable> {
  const [{ default: jsPDF }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);
  return jsPDF as unknown as new () => JsPDFWithAutoTable;
}

/**
 * Generate Individual User Wellness Report PDF
 */
export async function generateUserReport(data: UserWellnessReport): Promise<Blob> {
  const jsPDF = await loadJsPDF();
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  // Header with OHCS branding
  doc.setFillColor(0, 107, 63); // Ghana Green
  doc.rect(0, 0, pageWidth, 35, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Office of the Head of Civil Service', pageWidth / 2, 15, { align: 'center' });

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Wellness Centre - Individual Report', pageWidth / 2, 25, { align: 'center' });

  yPos = 45;

  // User Information Section
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('User Information', 14, yPos);

  yPos += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const userInfo = [
    ['Name:', data.user.name],
    ['Email:', data.user.email],
    ['Department:', data.user.department || 'Not specified'],
    ['MDA:', data.user.mda || 'Not specified'],
  ];

  userInfo.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, 14, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(value, 50, yPos);
    yPos += 6;
  });

  yPos += 5;

  // Summary Statistics Section
  doc.setFillColor(240, 253, 244); // Light green background
  doc.rect(14, yPos - 4, pageWidth - 28, 45, 'F');

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 107, 63);
  doc.text('Summary Statistics', 20, yPos + 4);

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  yPos += 12;

  // Stats in two columns
  const statsLeft = [
    ['Total Sessions:', String(data.summary.totalSessions)],
    ['Total Messages:', String(data.summary.totalMessages)],
    ['Average Mood:', data.summary.averageMood ? `${data.summary.averageMood.toFixed(1)} / 5` : 'N/A'],
  ];

  const statsRight = [
    ['Mood Trend:', data.summary.moodTrend ? capitalizeFirst(data.summary.moodTrend) : 'N/A'],
    ['Most Common Topic:', data.summary.mostCommonTopic ? topicLabels[data.summary.mostCommonTopic as CounselorTopic] || data.summary.mostCommonTopic : 'N/A'],
    ['Escalations:', String(data.summary.escalationCount)],
  ];

  let statsY = yPos;
  statsLeft.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, 20, statsY);
    doc.setFont('helvetica', 'normal');
    doc.text(value, 55, statsY);
    statsY += 6;
  });

  statsY = yPos;
  statsRight.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, 100, statsY);
    doc.setFont('helvetica', 'normal');
    doc.text(value, 145, statsY);
    statsY += 6;
  });

  yPos += 35;

  // Session period
  if (data.summary.firstSessionAt || data.summary.lastSessionAt) {
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    const period = `Session Period: ${formatDate(data.summary.firstSessionAt)} - ${formatDate(data.summary.lastSessionAt)}`;
    doc.text(period, 14, yPos);
    yPos += 10;
  }

  // Session History Table
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Session History', 14, yPos);

  yPos += 5;

  if (data.sessions.length > 0) {
    const sessionData = data.sessions.slice(0, 15).map((s) => [
      formatDate(s.date),
      s.topic ? topicLabels[s.topic as CounselorTopic] || s.topic : 'General',
      String(s.messageCount),
      s.mood ? `${s.mood}/5` : '-',
      capitalizeFirst(s.status),
    ]);

    doc.autoTable({
      startY: yPos,
      head: [['Date', 'Topic', 'Messages', 'Mood', 'Status']],
      body: sessionData,
      theme: 'striped',
      headStyles: {
        fillColor: [0, 107, 63],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 40 },
        2: { cellWidth: 25 },
        3: { cellWidth: 20 },
        4: { cellWidth: 30 },
      },
    });

    yPos = doc.lastAutoTable.finalY + 10;
  } else {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 100, 100);
    doc.text('No session history available', 14, yPos + 5);
    yPos += 15;
  }

  // Mood History (if available and space permits)
  if (data.moodHistory.length > 0 && yPos < 200) {
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Recent Mood Entries', 14, yPos);

    yPos += 5;

    const moodData = data.moodHistory.slice(0, 10).map((m) => [
      formatDate(m.date),
      `${m.mood}/5 (${moodLabels[m.mood]})`,
      m.factors?.join(', ') || '-',
    ]);

    doc.autoTable({
      startY: yPos,
      head: [['Date', 'Mood', 'Factors']],
      body: moodData,
      theme: 'striped',
      headStyles: {
        fillColor: [13, 148, 136], // Teal
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
    });

    yPos = doc.lastAutoTable.finalY + 10;
  }

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 20;

  doc.setDrawColor(200, 200, 200);
  doc.line(14, footerY - 5, pageWidth - 14, footerY - 5);

  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${formatDateTime(data.generatedAt)}`, 14, footerY);
  doc.text(`Generated by: ${data.generatedBy}`, 14, footerY + 4);
  doc.text('CONFIDENTIAL - OHCS Wellness Centre', pageWidth - 14, footerY, { align: 'right' });
  doc.text('Page 1 of 1', pageWidth - 14, footerY + 4, { align: 'right' });

  return doc.output('blob');
}

/**
 * Generate Aggregate Wellness Analytics Report PDF
 */
export async function generateAggregateReport(data: AggregateWellnessReport): Promise<Blob> {
  const jsPDF = await loadJsPDF();
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  // Header with OHCS branding
  doc.setFillColor(0, 107, 63); // Ghana Green
  doc.rect(0, 0, pageWidth, 35, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Office of the Head of Civil Service', pageWidth / 2, 15, { align: 'center' });

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Wellness Centre - Analytics Report', pageWidth / 2, 25, { align: 'center' });

  yPos = 45;

  // Report Period
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.text(`Report Period: ${formatDate(data.period.from)} - ${formatDate(data.period.to)}`, 14, yPos);

  yPos += 12;

  // Overview Section
  doc.setFillColor(240, 253, 244);
  doc.rect(14, yPos - 4, pageWidth - 28, 50, 'F');

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 107, 63);
  doc.text('Overview', 20, yPos + 4);

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  yPos += 14;

  // Overview stats in grid
  const overviewStats = [
    { label: 'Total Users', value: String(data.overview.totalUsers) },
    { label: 'Total Sessions', value: String(data.overview.totalSessions) },
    { label: 'Total Messages', value: String(data.overview.totalMessages) },
    { label: 'Avg Session Length', value: `${data.overview.averageSessionLength.toFixed(1)} msgs` },
    { label: 'Escalation Rate', value: `${data.overview.escalationRate.toFixed(1)}%` },
    { label: 'Anonymous Sessions', value: `${data.overview.anonymousSessionRate.toFixed(1)}%` },
  ];

  let col = 0;
  let row = 0;
  overviewStats.forEach((stat) => {
    const x = 20 + (col * 60);
    const y = yPos + (row * 10);

    doc.setFont('helvetica', 'bold');
    doc.text(stat.label + ':', x, y);
    doc.setFont('helvetica', 'normal');
    doc.text(stat.value, x + 35, y);

    col++;
    if (col >= 3) {
      col = 0;
      row++;
    }
  });

  yPos += 42;

  // Topic Breakdown
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Topic Distribution', 14, yPos);

  yPos += 5;

  if (data.topicBreakdown.length > 0) {
    const topicData = data.topicBreakdown.map((t) => [
      topicLabels[t.topic as CounselorTopic] || t.topic,
      String(t.count),
      `${t.percentage.toFixed(1)}%`,
    ]);

    doc.autoTable({
      startY: yPos,
      head: [['Topic', 'Sessions', 'Percentage']],
      body: topicData,
      theme: 'striped',
      headStyles: {
        fillColor: [0, 107, 63],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 40 },
        2: { cellWidth: 40 },
      },
    });

    yPos = doc.lastAutoTable.finalY + 10;
  }

  // Mood Analytics
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Mood Analytics', 14, yPos);

  yPos += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  doc.text(`Average Mood: ${data.moodAnalytics.averageMood?.toFixed(1) || 'N/A'} / 5`, 14, yPos);
  yPos += 8;

  // Mood distribution
  if (Object.keys(data.moodAnalytics.moodDistribution).length > 0) {
    const moodDistData = Object.entries(data.moodAnalytics.moodDistribution).map(([mood, count]) => [
      `${mood}/5 (${moodLabels[parseInt(mood)]})`,
      String(count),
    ]);

    doc.autoTable({
      startY: yPos,
      head: [['Mood Level', 'Count']],
      body: moodDistData,
      theme: 'striped',
      headStyles: {
        fillColor: [13, 148, 136],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 40 },
      },
    });

    yPos = doc.lastAutoTable.finalY + 10;
  }

  // Escalation Analytics
  if (yPos < 220) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Escalation Summary', 14, yPos);

    yPos += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const escalationInfo = [
      `Total Escalations: ${data.escalationAnalytics.total}`,
      `By Urgency - Low: ${data.escalationAnalytics.byUrgency.low}, Normal: ${data.escalationAnalytics.byUrgency.normal}, High: ${data.escalationAnalytics.byUrgency.high}, Crisis: ${data.escalationAnalytics.byUrgency.crisis}`,
      `By Status - Pending: ${data.escalationAnalytics.byStatus.pending}, Acknowledged: ${data.escalationAnalytics.byStatus.acknowledged}, Scheduled: ${data.escalationAnalytics.byStatus.scheduled}, Resolved: ${data.escalationAnalytics.byStatus.resolved}`,
    ];

    escalationInfo.forEach((text) => {
      doc.text(text, 14, yPos);
      yPos += 6;
    });
  }

  // Peak Usage Times
  if (yPos < 250 && data.peakUsageTimes.busiestDays.length > 0) {
    yPos += 5;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Peak Usage', 14, yPos);

    yPos += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    doc.text(`Busiest Days: ${data.peakUsageTimes.busiestDays.join(', ')}`, 14, yPos);
  }

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 20;

  doc.setDrawColor(200, 200, 200);
  doc.line(14, footerY - 5, pageWidth - 14, footerY - 5);

  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${formatDateTime(data.generatedAt)}`, 14, footerY);
  doc.text(`Generated by: ${data.generatedBy}`, 14, footerY + 4);
  doc.text('CONFIDENTIAL - OHCS Wellness Centre', pageWidth - 14, footerY, { align: 'right' });
  doc.text('Page 1 of 1', pageWidth - 14, footerY + 4, { align: 'right' });

  return doc.output('blob');
}

// Helper functions
function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'N/A';
  try {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return 'N/A';
  }
}

function formatDateTime(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ');
}
