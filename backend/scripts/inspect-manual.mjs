import ExcelJS from "exceljs";

const manualPath = "D:/Data/test data/NAMDAR CORNER-all/HDFC BANK 88031 OD.xls";

const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile(manualPath);
const ws = wb.worksheets[0];
console.log("Sheet:", ws.name, "rows:", ws.rowCount, "cols:", ws.columnCount);

const rows = [];
ws.eachRow((row, n) => {
  if (n <= 60) rows.push({ n, v: row.values.slice(1).map((x) => x?.text ?? x ?? "") });
});

rows.forEach((r) => console.log(r.n, JSON.stringify(r.v)));

// Also scan for party-like rows with debit amounts anywhere
console.log("\n--- Rows with debit-like amounts in cols ---");
ws.eachRow((row, n) => {
  const v = row.values.slice(1).map((x) => String(x?.text ?? x ?? "").trim());
  const hasDebit = v.some((c) => /^\d{1,3}(,\d{3})*\.\d{2}$/.test(c.replace(/,/g, "")) || /^\d+\.\d{2}$/.test(c));
  const hasName = v.some((c) => c.length > 3 && /[A-Z]{3,}/.test(c));
  if (hasDebit && hasName && n > 5 && n < 200) {
    console.log(n, JSON.stringify(v));
  }
});
