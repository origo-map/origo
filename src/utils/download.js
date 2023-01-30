import convertHtml2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

let url;

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
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#FFFFFF',
    logging: false,
    height: el.offsetHeight,
    width: el.offsetWidth
  });
};

export const getImageBlob = async function getImageBlob(el) {
  if (el) {
    const mapEl = el;
    const parentEl = mapEl.parentElement;
    const styleAttributes = mapEl.getAttribute('style');
    const parentStyleAttributes = parentEl.getAttribute('style');
    mapEl.style.transform = 'unset';
    mapEl.style.transformOrigin = 'unset';
    parentEl.style.transform = 'unset';
    parentEl.style.transformOrigin = 'unset';
    const canvas = await html2canvas(mapEl);
    mapEl.setAttribute('style', styleAttributes); // Restore scaling
    parentEl.setAttribute('style', parentStyleAttributes); // Restore scaling
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
  const format = size === 'custom' ? [mm2Pt(width), mm2Pt(height)] : size;
  const pdf = new jsPDF({ orientation, format, unit: 'mm', compress: true });

  if (beforeRender) beforeRender(el);
  const canvas = await html2canvas(el);
  if (afterRender) afterRender(el);
  pdf.addImage(canvas, 'PNG', 0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight());
  pdf.save(`${filename}.pdf`);
};

export const printToScalePDF = async function printToScalePDF({
  el,
  filename,
  height,
  orientation,
  size,
  width,
  widthImage,
  heightImage
}) {
  const mapEl = el;
  let orient = orientation;
  if (size === 'custom') {
    if (width > height) {
      orient = widthImage < heightImage ? 'portrait' : 'landscape';
    }
  }
  const format = size === 'custom' ? [mm2Pt(height), mm2Pt(width)] : size;
  const pdf = new jsPDF({ orientation: orient, format, unit: 'mm', compress: true });
  const parentEl = mapEl.parentElement;
  const styleAttributes = mapEl.getAttribute('style');
  const parentStyleAttributes = parentEl.getAttribute('style');
  mapEl.style.transform = 'unset';
  mapEl.style.transformOrigin = 'unset';
  parentEl.style.transform = 'unset';
  parentEl.style.transformOrigin = 'unset';
  convertHtml2canvas(mapEl, {
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#FFFFFF',
    logging: false,
    height: heightImage,
    width: widthImage
  })
    .then((dataUrl) => {
      pdf.addImage(dataUrl, 'JPEG', 0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight());
    })
    .then(() => {
      pdf.save(`${filename}.pdf`);
      mapEl.setAttribute('style', styleAttributes); // Restore scaling
      parentEl.setAttribute('style', parentStyleAttributes); // Restore scaling
    });
};
