/* Receipt OCR — in-browser via tesseract.js. Uses eng+hin so Tesseract
   recognises ₹ natively; falls back to eng-only if hin data isn't cached. */

export type OcrResult = { amount?: number; date?: string; category?: string; raw: string };

export async function scanReceipt(dataUrl: string): Promise<OcrResult> {
  const Tesseract = (await import("tesseract.js")).default;
  let raw = "";
  try {
    const { data } = await Tesseract.recognize(dataUrl, "eng+hin");
    raw = data.text || "";
  } catch {
    const { data } = await Tesseract.recognize(dataUrl, "eng");
    raw = data.text || "";
  }
  return { amount: extractAmount(raw), date: extractDate(raw), category: inferCategory(raw), raw };
}

function extractAmount(text: string): number | undefined {
  const lines = text.split(/\n/);

  // On total/amount lines only, strip a single leading digit (3, 9, or 8)
  // from the last number on the line — that digit is almost always a misread ₹.
  // Scoped to end-of-line so bill numbers / dates earlier in the line are safe.
  const normLines = lines.map((line) => {
    if (/total|amount|grand|balance|paid|net|payable/i.test(line)) {
      return line.replace(/(?<!\d)[389] ?(\d{3,})(\s*)$/, "$1$2");
    }
    return line;
  });

  // Keyword groups ordered from most- to least-specific.
  // We take the LAST number on the matched line because the amount is always
  // at the end (bill no., item counts, dates appear earlier).
  const groups: RegExp[] = [
    /grand\s*total|total\s*amount|net\s*total|net\s*payable|amount\s*payable/i,
    /\btotal\b/i,
    /\bbalance\b|\bpaid\b|\bpayable\b/i,
    /\bamount\b|\bnet\b/i,
  ];

  for (const groupRe of groups) {
    for (const line of normLines) {
      if (!groupRe.test(line)) continue;
      const nums = [...line.matchAll(/[\d,]+(?:\.\d{1,2})?/g)]
        .map((m) => parseFloat(m[0].replace(/,(?=\d{3})/g, "")))
        .filter((n) => !isNaN(n) && n >= 1);
      if (nums.length) return nums[nums.length - 1]; // last = the amount
    }
  }

  // Fallback: explicit currency symbol anywhere in the text
  const currRe = /[$₹€£]\s?([\d,]+(?:\.\d{1,2})?)/g;
  const currNums: number[] = [];
  let m: RegExpExecArray | null;
  while ((m = currRe.exec(text))) {
    const n = parseFloat(m[1].replace(/,(?=\d{3})/g, ""));
    if (!isNaN(n) && n >= 1) currNums.push(n);
  }
  if (currNums.length) return Math.max(...currNums);

  return undefined;
}

export function inferCategory(raw: string): string | undefined {
  const t = raw.toLowerCase();
  if (/emergency|urgent|critical|24[\s-]?hour/i.test(t)) return "Emergency";
  if (/clinic|hospital|vet|veterinar|doctor|dr\b|consult|diagnos|surgery|operation|treatment|checkup|exam/i.test(t)) return "Veterinary";
  if (/medicine|medicat|tablet|capsule|injection|antibiotic|drug|pharmacy|pharma|\brx\b/i.test(t)) return "Medication";
  if (/groom|bath|trim|nail|shampoo|spa/i.test(t)) return "Grooming";
  if (/food|feed|kibble|treat|diet|meal|biscuit|snack/i.test(t)) return "Food";
  if (/collar|leash|toy|cage|crate|bed|suppl|accessory/i.test(t)) return "Supplies";
  if (/train|class|lesson|obedience/i.test(t)) return "Training";
  return undefined;
}

function extractDate(text: string): string | undefined {
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
