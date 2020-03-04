import convertHtml2canvas from 'html2canvas';
import LoadScript from './load-script';

const pdfLibUrl = 'https://unpkg.com/jspdf@latest/dist/jspdf.min.js';

const jsPDFLoader = LoadScript({
  src: pdfLibUrl,
  global: 'jsPDF'
});
let jsPDF;
let url;

export const loadJsPDF = async function loadJsPDF() {
  if (!jsPDF) { jsPDF = await jsPDFLoader.load(); }
};

export const downloadBlob = function downloadBlob({ blob, filename }) {
  return new Promise((resolve) => {
    const link = document.createElement('a');
    url = URL.createObjectURL(blob);

    // ie 11 workaround
    if (!('download' in link) && window.navigator.msSaveOrOpenBlob) {
      window.navigator.msSaveOrOpenBlob(blob, filename);
      URL.revokeObjectURL(url);
      resolve();
      return;
    }

    if (!('download' in link)) {
      link.target = '_blank';
    }

    link.download = filename;
    link.href = url;

    const clickHandler = () => {
      window.setTimeout(() => {
        URL.revokeObjectURL(url);
        link.removeEventListener('click', clickHandler, false);
        resolve();
      }, 200);
    };
    link.addEventListener('click', clickHandler);
    link.click();
  });
};

const canvasToBlob = function canvasToBlob(canvas) {
  const promise = new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob);
    });
  });
  return promise;
};

const mm2Pt = function convertMm2Pt(mm) {
  const factor = 2.8346456692913;
  return mm * factor;
};

export const html2canvas = function html2canvas(el) {
  return convertHtml2canvas(el, {
    allowTaint: true,
    backgroundColor: null,
    logging: false,
    height: el.offsetHeight,
    width: el.offsetWidth,
    scale: 4
  });
};

export const getImageBlob = async function getImageBlob(el) {
  if (el) {
    const canvas = await html2canvas(el);
    const blob = await canvasToBlob(canvas);
    return blob;
  }
  throw new Error('Failed to create image blob from canvas');
};

export const downloadPNG = async function downloadPNG({
  afterRender,
  beforeRender,
  filename,
  el
}) {
  if (beforeRender) beforeRender(el);
  const blob = await getImageBlob(el);
  if (afterRender) afterRender(el);
  try {
    await downloadBlob({ blob, filename });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
  }
};

export const downloadPDF = async function downloadPDF({
  afterRender,
  beforeRender,
  el,
  filename,
  height,
  orientation,
  size,
  width
}) {
  await loadJsPDF();
  const format = size === 'custom' ? [mm2Pt(width), mm2Pt(height)] : size;
  const pdf = new jsPDF({ orientation, format, unit: 'mm' });

  if (beforeRender) beforeRender(el);
  const canvas = await html2canvas(el);
  if (afterRender) afterRender(el);
  pdf.addImage(canvas, 'PNG', 0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight());
  pdf.save(`${filename}.pdf`);
};
