import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { formatCurrency } from '../lib/utils';
import { format } from 'date-fns';

/**
 * Generates a PDF by capturing a DOM element as an image.
 * This guarantees the PDF looks EXACTLY like the on-screen preview.
 */
export const generateInvoiceFromHTML = async (element) => {
  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    const imgData = canvas.toDataURL('image/png');
    const imgWidth = 210; // A4 width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    const doc = new jsPDF('p', 'mm', 'a4');
    const pageHeight = 297;

    if (imgHeight <= pageHeight) {
      doc.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    } else {
      let heightLeft = imgHeight;
      let position = 0;
      doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        doc.addPage();
        doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
    }

    return doc;
  } catch (error) {
    console.error('PDF Generation Error:', error);
    return null;
  }
};

/**
 * Legacy PDF generator from data (no DOM needed).
 * Used in SalesList where no preview modal DOM is available during direct download.
 */
export const generateInvoicePDF = async (sale, businessInfo) => {
  try {
    const doc = new jsPDF();
    const pw = doc.internal.pageSize.getWidth();
    const ph = doc.internal.pageSize.getHeight();
    const m = 20;
    const r = pw - m;

    const fmt = (val) => {
      try { return formatCurrency(parseFloat(val) || 0); }
      catch { return '₹0.00'; }
    };

    const saleDate = sale?.date?.seconds
      ? new Date(sale.date.seconds * 1000)
      : new Date(sale?.date || Date.now());

    // Header & Logo
    let headerY = 20;
    if (businessInfo?.logoURL) {
      try {
        const img = await new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = businessInfo.logoURL;
        });
        doc.addImage(img, 'PNG', m, 15, 15, 15);
        headerY = 20;
      } catch (err) {
        console.error('Failed to load logo for PDF:', err);
      }
    }

    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(businessInfo?.name || 'Coreventory', businessInfo?.logoURL ? m + 18 : m, headerY);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text((businessInfo?.address || '').toUpperCase(), businessInfo?.logoURL ? m + 18 : m, headerY + 7);
    doc.text(`GSTIN: ${businessInfo?.gstin || '---'} | Email: ${businessInfo?.email || '---'}`, businessInfo?.logoURL ? m + 18 : m, headerY + 11);

    const isQuotation = (sale?.invoiceNumber || '').startsWith('QT-');

    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(isQuotation ? 'QUOTATION' : 'INVOICE', r, 20, { align: 'right' });

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(148, 163, 184);
    doc.text(`No: ${sale?.invoiceNumber || '---'}`, r, 27, { align: 'right' });
    doc.text(`Date: ${format(saleDate, 'dd MMM yyyy')}`, r, 32, { align: 'right' });

    // Bill To
    doc.setDrawColor(241, 245, 249);
    doc.line(m, 42, r, 42);

    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(79, 70, 229);
    doc.text(isQuotation ? 'QUOTE TO' : 'BILL TO', m, 50);

    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text(sale?.customerName || 'Walk-in Customer', m, 57);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(sale?.customerPhone || '---', m, 63);

    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(148, 163, 184);
    doc.text(isQuotation ? 'STATUS' : 'PAYMENT INFO', r, 50, { align: 'right' });
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(isQuotation ? 'Estimated Quote' : `Mode: ${sale?.saleType || 'Cash'}`, r, 57, { align: 'right' });

    // Table
    const items = (sale?.items || []).map((item) => [
      item.name || '---',
      `${item.qty || 0} ${item.unit || 'pcs'}`,
      fmt(item.price),
      fmt(item.total),
    ]);

    autoTable(doc, {
      startY: 72,
      head: [['Description', 'Qty', 'Rate', 'Total']],
      body: items,
      theme: 'plain',
      headStyles: {
        fillColor: [248, 250, 252],
        textColor: [148, 163, 184],
        fontSize: 7,
        fontStyle: 'bold',
      },
      bodyStyles: { fontSize: 9, textColor: [15, 23, 42] },
      columnStyles: {
        0: { fontStyle: 'bold' },
        1: { halign: 'center', cellWidth: 22 },
        2: { halign: 'right', cellWidth: 30 },
        3: { halign: 'right', cellWidth: 32, fontStyle: 'bold' },
      },
      margin: { left: m, right: m },
    });

    // Totals
    const finalY = doc.lastAutoTable.finalY + 10;
    const total = parseFloat(sale?.grandTotal || 0);
    const taxable = total / 1.18;
    const halfGst = (total - taxable) / 2;
    const lx = r - 74;

    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(148, 163, 184);
    doc.text('TAXABLE AMOUNT', lx, finalY);
    doc.setTextColor(15, 23, 42);
    doc.text(fmt(taxable), r, finalY, { align: 'right' });

    doc.setTextColor(148, 163, 184);
    doc.text('SGST (9%)', lx, finalY + 6);
    doc.setTextColor(15, 23, 42);
    doc.text(fmt(halfGst), r, finalY + 6, { align: 'right' });

    doc.setTextColor(148, 163, 184);
    doc.text('CGST (9%)', lx, finalY + 12);
    doc.setTextColor(15, 23, 42);
    doc.text(fmt(halfGst), r, finalY + 12, { align: 'right' });

    doc.setDrawColor(241, 245, 249);
    doc.line(lx, finalY + 16, r, finalY + 16);

    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text(isQuotation ? 'ESTIMATED TOTAL' : 'GRAND TOTAL', lx, finalY + 23);
    doc.setFontSize(14);
    doc.setTextColor(79, 70, 229);
    doc.text(fmt(total), r, finalY + 23, { align: 'right' });

    // Footer
    const footerY = ph - 35;
    doc.setDrawColor(241, 245, 249);
    doc.line(m, footerY - 5, r, footerY - 5);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(148, 163, 184);
    doc.text('TERMS & CONDITIONS', m, footerY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    const terms = businessInfo?.terms || '1. Goods once sold will not be returned.\n2. Subject to local jurisdiction.';
    terms.split('\n').forEach((line, i) => doc.text(line, m, footerY + 4 + i * 3.5));

    doc.setDrawColor(148, 163, 184);
    doc.line(r - 45, footerY + 10, r, footerY + 10);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(148, 163, 184);
    doc.text('Authorized Signatory', r, footerY + 15, { align: 'right' });

    return doc;
  } catch (error) {
    console.error('PDF Generation Error:', error);
    return null;
  }
};
