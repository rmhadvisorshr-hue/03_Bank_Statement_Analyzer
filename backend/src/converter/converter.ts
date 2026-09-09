// @ts-nocheck
import { buildWorkbookBuffer, writeWorkbookFile } from "./excelWriter.js";
import { parseStatement } from "./parser.js";
import { extractPdf } from "./pdfExtractor.js";
import { extractScannedFile } from "./ocrExtractor.js";

async function convertPdfToStatement(filePath, options = {}) {
  const logs = [];
  const totalStart = Date.now();
  const extractionStart = Date.now();
  const extraction = options.scanned
    ? await extractScannedFile(filePath)
    : await extractPdf(filePath, options.password);

  logs.push({
    level: "info",
    stage: options.scanned ? "ocr" : "pdf",
    message: `${extraction.pageCount || 0} page(s) processed.`,
    pagesProcessed: extraction.pageCount || 0,
    durationMs: Date.now() - extractionStart,
  });

  const parseStart = Date.now();
  const statement = parseStatement(extraction);
  statement.logs = [...logs, ...(statement.logs || [])];
  statement.logs.push({
    level: "info",
    stage: "parse",
    message: `${statement.transactions.length} transaction(s) extracted.`,
    transactionsExtracted: statement.transactions.length,
    durationMs: Date.now() - parseStart,
  });
  statement.logs.push({
    level: "info",
    stage: "total",
    message: "Conversion pipeline completed.",
    durationMs: Date.now() - totalStart,
  });

  if (statement.transactions.length === 0) {
    if (options.scanned) {
      return {
        ...statement,
        transactions: [],
        rawLines: extraction.lines.map((line) => String(line.text || line)),
      };
    }

    const error = new Error("No transaction rows were detected in this PDF.");
    error.code = "NO_TRANSACTIONS_FOUND";
    throw error;
  }

  return statement;
}

async function convertPdfToExcelBuffer(filePath, options = {}) {
  const statement = await convertPdfToStatement(filePath, options);
  const buffer = await buildWorkbookBuffer(statement);

  return {
    buffer,
    statement,
  };
}

async function convertPdfToExcelFile(filePath, outputPath, options = {}) {
  const statement = await convertPdfToStatement(filePath, options);
  await writeWorkbookFile(statement, outputPath);

  return statement;
}

export { convertPdfToStatement, convertPdfToExcelBuffer, convertPdfToExcelFile };
