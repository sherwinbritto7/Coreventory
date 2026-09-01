import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const formatCurrency = (amount) => {
  const val = parseFloat(amount) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2
  }).format(val);
};

export const formatIndianNumber = (num) => {
  const val = parseFloat(num) || 0;
  return new Intl.NumberFormat('en-IN').format(val);
};

export const numberToWords = (num) => {
  // Simple implementation or a library can be used. 
  // For a full production app, standard libraries are better.
  // This is a basic placeholder or logic can be added.
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const inWords = (n) => {
    if ((n = n.toString()).length > 9) return 'overflow';
    let n_match = ('000000000' + n).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n_match) return; 
    let str = '';
    str += (n_match[1] != 0) ? (a[Number(n_match[1])] || b[n_match[1][0]] + ' ' + a[n_match[1][1]]) + 'Crore ' : '';
    str += (n_match[2] != 0) ? (a[Number(n_match[2])] || b[n_match[2][0]] + ' ' + a[n_match[2][1]]) + 'Lakh ' : '';
    str += (n_match[3] != 0) ? (a[Number(n_match[3])] || b[n_match[3][0]] + ' ' + a[n_match[3][1]]) + 'Thousand ' : '';
    str += (n_match[4] != 0) ? (a[Number(n_match[4])] || b[n_match[4][0]] + ' ' + a[n_match[4][1]]) + 'Hundred ' : '';
    str += (n_match[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n_match[5])] || b[n_match[5][0]] + ' ' + a[n_match[5][1]]) + 'Only ' : '';
    return str;
  };

  return inWords(Math.floor(num));
};
