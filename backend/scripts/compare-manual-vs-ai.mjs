import ExcelJS from "exceljs";
import path from "node:path";

const aiPath = "c:/Users/HP/Downloads/MS. NAMDAR CORNER_Bank of Baroda_8031_Transaction_Summary.xlsx";
const manualPath = "D:/Data/test data/NAMDAR CORNER-all/HDFC BANK 88031 OD.xls";

async function readSheet(filePath, ext) {
  const wb = new ExcelJS.Workbook();
  if (ext === "xls") {
    await wb.xlsx.readFile(filePath).catch(async () => {
      // .xls may need xlsx format - try csv fallback
      throw new Error("Cannot read .xls directly with exceljs - need alternative");
    });
  } else {
    await wb.xlsx.readFile(filePath);
  }
  const ws = wb.worksheets[0];
  const rows = [];
  ws.eachRow((row, n) => {
    rows.push({ n, values: row.values.slice(1).map((v) => (v?.text ?? v ?? "")) });
  });
  return rows;
}

function printRows(label, rows, limit = 100) {
  console.log(`\n=== ${label} (${rows.length} rows) ===`);
  rows.slice(0, limit).forEach((r) => console.log(r.n, JSON.stringify(r.values)));
}

async function main() {
  try {
    const aiRows = await readSheet(aiPath, "xlsx");
    printRows("AI OUTPUT", aiRows, 120);

    // Summarize parties with debit counts from AI
    const parties = new Map();
    let currentParty = null;
    for (const row of aiRows) {
      const vals = row.values.map(String);
      const first = vals[0]?.trim();
      if (first && vals[4] && !isNaN(Number(String(vals[4]).replace(/,/g, ""))) && vals[3]) {
        // summary row: party, category, modes, count, debit, credit
        currentParty = first;
        parties.set(currentParty, { count: Number(vals[3]), debit: vals[4], credit: vals[5], details: [] });
      } else if (currentParty && vals[2] && /\d/.test(String(vals[2]))) {
        parties.get(currentParty)?.details.push({
          date: vals[2],
          type: vals[3],
          mode: vals[4],
          debit: vals[6],
          credit: vals[7],
          narration: vals[8],
        });
      }
    }

    console.log("\n=== AI PARTY SUMMARY (debit txns) ===");
    for (const [party, data] of parties) {
      const debitDetails = data.details.filter((d) => Number(String(d.debit).replace(/,/g, "")) > 0);
      if (debitDetails.length > 0) {
        console.log(`\n${party}: ${debitDetails.length} debit(s), summary count=${data.count}`);
        debitDetails.forEach((d, i) =>
          console.log(`  ${i + 1}. ${d.date} | ${d.mode} | ${d.type} | Dr ${d.debit} | ${String(d.narration).slice(0, 60)}`),
        );
      }
    }
  } catch (e) {
    console.error("AI read error:", e.message);
  }

  // Try reading manual xls with fs
  try {
    const fs = await import("node:fs");
    const buf = fs.readFileSync(manualPath);
    console.log(`\nManual file size: ${buf.length} bytes, header: ${buf.slice(0, 8).toString("hex")}`);
  } catch (e) {
    console.error("Manual read error:", e.message);
  }
}

main();
