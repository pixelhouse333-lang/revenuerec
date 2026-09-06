import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { recognize } from "tesseract.js";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;

const MAX_OCR_PAGES = 5;

async function extractPdfText(file, setStatus) {
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  let text = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((item) => item.str).join(" ") + "\n";
  }

  if (text.trim().length >= 20 * pdf.numPages) {
    return text;
  }

  // Sparse or missing text layer — likely a scanned PDF. Fall back to OCR.
  const pageCount = Math.min(pdf.numPages, MAX_OCR_PAGES);
  let ocrText = "";
  for (let i = 1; i <= pageCount; i++) {
    setStatus(`Running OCR on page ${i} of ${pageCount}…`);
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d");
    await page.render({ canvasContext: ctx, viewport }).promise;
    const { data } = await recognize(canvas, "eng");
    ocrText += data.text + "\n";
  }
  return ocrText;
}

async function extractImageText(file, setStatus) {
  setStatus("Running OCR on image…");
  const { data } = await recognize(file, "eng", {
    logger: (m) => {
      if (m.status === "recognizing text") {
        setStatus(`Running OCR… ${Math.round(m.progress * 100)}%`);
      }
    },
  });
  return data.text;
}

export async function extractTextFromFile(file, setStatus) {
  if (/\.pdf$/i.test(file.name) || file.type === "application/pdf") {
    return extractPdfText(file, setStatus);
  }
  if (/^image\//.test(file.type) || /\.(png|jpe?g)$/i.test(file.name)) {
    return extractImageText(file, setStatus);
  }
  throw new Error("Unsupported file type");
}
