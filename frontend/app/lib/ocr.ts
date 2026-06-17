/* Receipt OCR — real, in-browser, via tesseract.js (no API key, works offline).
   Reads an uploaded receipt image and best-effort extracts the total amount and
   a date so the expense form can auto-fill. Falls back gracefully. */

export type OcrResult = { amount?: number; date?: string; raw: string };

export async function scanReceipt(dataUrl: string): Promise<OcrResult> {
  const Tesseract = (await import("tesseract.js")).default;
  const { data } = await Tesseract.recognize(dataUrl, "eng");
  const raw = data.text || "";
  return { amount: extractAmount(raw), date: extractDate(raw), raw };
}

function extractAmount(text: string): number | undefined {
  const lines = text.split(/\n/);
  const moneyRe = /(?:[$₹€£]\s?)?(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})|\d+(?:[.,]\d{2}))/g;
  // Prefer lines mentioning total/amount/grand
  const prioritized = lines.filter((l) => /total|amount|grand|balance|paid/i.test(l));
  const pool = (prioritized.length ? prioritized : lines).join("\n");
  const nums: number[] = [];
  let m: RegExpExecArray | null;
  while ((m = moneyRe.exec(pool))) {
    const n = parseFloat(m[1].replace(/,(?=\d{3}\b)/g, "").replace(",", "."));
    if (!isNaN(n)) nums.push(n);
  }
  if (!nums.length) return undefined;
  return Math.max(...nums);
}

function extractDate(text: string): string | undefined {
  // dd/mm/yyyy, yyyy-mm-dd, dd Mon yyyy, etc.
  const iso = text.match(/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (iso) return `${iso[1]}-${pad(iso[2])}-${pad(iso[3])}`;
  const dmy = text.match(/(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/);
  if (dmy) {
    let y = dmy[3]; if (y.length === 2) y = "20" + y;
    return `${y}-${pad(dmy[2])}-${pad(dmy[1])}`;
  }
  const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  const named = text.toLowerCase().match(/(\d{1,2})\s*([a-z]{3,})\s*(\d{4})/);
  if (named) {
    const mi = months.indexOf(named[2].slice(0, 3));
    if (mi >= 0) return `${named[3]}-${pad(mi + 1)}-${pad(named[1])}`;
  }
  return undefined;
}
const pad = (s: string | number) => String(s).padStart(2, "0");
