/**
 * Certificate PDF Generation
 * Generates beautiful PDF certificates for course completions
 */

import { jsPDF } from 'jspdf';
import type { Certificate } from '@/types/lms';

interface CertificateData {
  recipientName: string;
  courseTitle: string;
  completionDate: string;
  grade?: number;
  gradeLabel?: string;
  certificateNumber: string;
  instructorName?: string;
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};

export const generateCertificatePDF = (data: CertificateData): void => {
  // Create new PDF document (A4 landscape)
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const centerX = pageWidth / 2;

  // Ghana national colors
  const ghanaGreen = '#006B3F';
  const ghanaGold = '#FCD116';
  const ghanaRed = '#CE1126';
  const darkGray = '#1a1a1a';
  const mediumGray = '#666666';

  // Background gradient effect (using rectangles)
  doc.setFillColor(255, 253, 247); // Cream background
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Ghana flag stripe at top
  const stripeHeight = 8;
  doc.setFillColor(206, 17, 38); // Red
  doc.rect(0, 0, pageWidth / 3, stripeHeight, 'F');
  doc.setFillColor(252, 209, 22); // Gold
  doc.rect(pageWidth / 3, 0, pageWidth / 3, stripeHeight, 'F');
  doc.setFillColor(0, 107, 63); // Green
  doc.rect((pageWidth / 3) * 2, 0, pageWidth / 3, stripeHeight, 'F');

  // Decorative border
  doc.setDrawColor(0, 107, 63);
  doc.setLineWidth(3);
  doc.rect(15, 20, pageWidth - 30, pageHeight - 40, 'S');

  // Inner decorative border
  doc.setLineWidth(0.5);
  doc.setDrawColor(252, 209, 22);
  doc.rect(18, 23, pageWidth - 36, pageHeight - 46, 'S');

  // Corner decorations (simple squares)
  const cornerSize = 8;
  const corners = [
    { x: 18, y: 23 },
    { x: pageWidth - 26, y: 23 },
    { x: 18, y: pageHeight - 31 },
    { x: pageWidth - 26, y: pageHeight - 31 },
  ];

  doc.setFillColor(252, 209, 22);
  corners.forEach(corner => {
    doc.rect(corner.x, corner.y, cornerSize, cornerSize, 'F');
  });

  // Black star of Ghana (simplified)
  const starY = 42;
  doc.setFillColor(0, 0, 0);
  doc.setDrawColor(0, 0, 0);

  // Draw star using lines
  const starSize = 10;
  const starCenterY = starY + starSize / 2;

  // Title: "Certificate of Completion"
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(0, 107, 63);
  doc.text('OFFICE OF THE HEAD OF CIVIL SERVICE', centerX, 40, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(102, 102, 102);
  doc.text('Republic of Ghana', centerX, 47, { align: 'center' });

  // Main title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(36);
  doc.setTextColor(0, 107, 63);
  doc.text('CERTIFICATE', centerX, 70, { align: 'center' });

  doc.setFontSize(18);
  doc.setTextColor(102, 102, 102);
  doc.text('OF COMPLETION', centerX, 80, { align: 'center' });

  // Decorative line
  doc.setDrawColor(252, 209, 22);
  doc.setLineWidth(2);
  doc.line(centerX - 50, 88, centerX + 50, 88);

  // "This is to certify that"
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(14);
  doc.setTextColor(102, 102, 102);
  doc.text('This is to certify that', centerX, 102, { align: 'center' });

  // Recipient name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.setTextColor(0, 107, 63);
  doc.text(data.recipientName.toUpperCase(), centerX, 118, { align: 'center' });

  // Decorative line under name
  doc.setDrawColor(206, 17, 38);
  doc.setLineWidth(0.5);
  const nameWidth = doc.getTextWidth(data.recipientName.toUpperCase());
  doc.line(centerX - nameWidth / 2 - 5, 122, centerX + nameWidth / 2 + 5, 122);

  // "has successfully completed"
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(14);
  doc.setTextColor(102, 102, 102);
  doc.text('has successfully completed the course', centerX, 135, { align: 'center' });

  // Course title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(26, 26, 26);

  // Handle long course titles
  const maxWidth = pageWidth - 80;
  const courseLines = doc.splitTextToSize(data.courseTitle, maxWidth);
  doc.text(courseLines, centerX, 150, { align: 'center' });

  // Grade (if applicable)
  let gradeY = 155 + (courseLines.length - 1) * 8;
  if (data.grade && data.gradeLabel) {
    gradeY += 10;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(14);
    doc.setTextColor(102, 102, 102);
    doc.text('with a grade of', centerX, gradeY, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(252, 209, 22);
    doc.text(`${data.gradeLabel} (${data.grade}%)`, centerX, gradeY + 10, { align: 'center' });
    gradeY += 10;
  }

  // Date
  const dateY = gradeY + 15;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(102, 102, 102);
  doc.text(`Issued on ${formatDate(data.completionDate)}`, centerX, dateY, { align: 'center' });

  // Certificate number and verification
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(150, 150, 150);
  doc.text(`Certificate ID: ${data.certificateNumber}`, centerX, pageHeight - 30, { align: 'center' });

  // Generate verification URL
  const baseUrl = window.location.origin;
  const verifyUrl = `${baseUrl}/verify?id=${data.certificateNumber}`;
  doc.text(`Verify at: ${verifyUrl}`, centerX, pageHeight - 24, { align: 'center' });

  // Footer stripe (Ghana colors)
  const footerStripeHeight = 4;
  const footerY = pageHeight - 18;
  doc.setFillColor(206, 17, 38);
  doc.rect(20, footerY, (pageWidth - 40) / 3, footerStripeHeight, 'F');
  doc.setFillColor(252, 209, 22);
  doc.rect(20 + (pageWidth - 40) / 3, footerY, (pageWidth - 40) / 3, footerStripeHeight, 'F');
  doc.setFillColor(0, 107, 63);
  doc.rect(20 + ((pageWidth - 40) / 3) * 2, footerY, (pageWidth - 40) / 3, footerStripeHeight, 'F');

  // Save the PDF
  const fileName = `Certificate_${data.courseTitle.replace(/[^a-zA-Z0-9]/g, '_')}_${data.recipientName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
  doc.save(fileName);
};

export const generateCertificateFromData = (certificate: Certificate): void => {
  generateCertificatePDF({
    recipientName: certificate.recipientName,
    courseTitle: certificate.courseTitle,
    completionDate: certificate.completionDate,
    grade: certificate.grade,
    gradeLabel: certificate.gradeLabel,
    certificateNumber: certificate.certificateNumber,
  });
};
