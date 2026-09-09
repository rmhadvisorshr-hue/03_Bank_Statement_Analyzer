import fs from "node:fs/promises";
import path from "node:path";

const OCR_ENDPOINT = "https://api.ocr.space/parse/image";

function getOcrApiKey() {
  return process.env.OCR_SPACE_API_KEY || "";
}

function normalizeText(value) {
  return String(value || "")
    .replace(/\u00a0/g, " ")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[\s]+/g, " ")
    .trim();
}

function buildLinesFromParsedResult(parsedResult, pageNumber) {
  const lines = [];
  if (parsedResult.TextOverlay?.Lines?.length) {
    for (const line of parsedResult.TextOverlay.Lines) {
      const text = normalizeText(line.LineText || line?.Words?.map((word) => word.WordText).join(" ") || "");
      if (text) {
        lines.push({ pageNumber, text });
      }
    }
  }

  if (lines.length === 0 && parsedResult.ParsedText) {
    for (const rawLine of String(parsedResult.ParsedText).split(/\r?\n/)) {
      const text = normalizeText(rawLine);
      if (text) lines.push({ pageNumber, text });
    }
  }

  return lines;
}

async function extractScannedFile(filePath) {
  const ocrApiKey = getOcrApiKey();
  if (!ocrApiKey) {
    const error = new Error("OCR API key is missing. Set OCR_SPACE_API_KEY.");
    error.code = "OCR_KEY_MISSING";
    throw error;
  }

  const fileBuffer = await fs.readFile(filePath);
  const fileName = path.basename(filePath);
  const ext = path.extname(fileName).toLowerCase();
  const mimeByExt = {
    ".pdf": "application/pdf",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".tif": "image/tiff",
    ".tiff": "image/tiff",
  };
  const mimeType = mimeByExt[ext] || "application/octet-stream";

  const form = new FormData();
  form.append("apikey", ocrApiKey);
  form.append("language", "eng");
  form.append("isTable", "true");
  form.append("OCREngine", "2");
  form.append("detectOrientation", "true");
  form.append("scale", "true");
  if (ext === ".pdf") {
    form.append("filetype", "PDF");
  }
  form.append("file", new Blob([fileBuffer], { type: mimeType }), fileName);

  const response = await fetch(OCR_ENDPOINT, {
    method: "POST",
    body: form,
  });

  if (!response.ok) {
    throw new Error(`OCR request failed with status ${response.status}`);
  }

  const payload = await response.json();
  if (payload.IsErroredOnProcessing) {
    const message = payload.ErrorMessage?.join(" ") || payload.ErrorMessage || "OCR processing failed.";
    const error = new Error(message);
    error.code = "OCR_FAILED";
    throw error;
  }

  const parsedResults = payload.ParsedResults || [];
  if (!parsedResults.length) {
    const error = new Error("No OCR results returned from the OCR service.");
    error.code = "OCR_NO_RESULTS";
    throw error;
  }

  const pages = [];
  const lines = [];

  for (let index = 0; index < parsedResults.length; index += 1) {
    const parsed = parsedResults[index];
    const pageNumber = parsed.Page ?? index + 1;
    const pageLines = buildLinesFromParsedResult(parsed, pageNumber);
    pages.push({ pageNumber, lines: pageLines });
    lines.push(...pageLines);
  }

  return {
    pageCount: pages.length,
    pages,
    lines,
    text: lines.map((line) => line.text).join("\n"),
  };
}

export { extractScannedFile };
