/* Conservative OCR-text suggestions. No network, storage, or ledger writes. */
(function(root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ReceiptTextCore = api;
})(typeof globalThis === 'object' ? globalThis : this, function() {
  'use strict';
  const currencies = ['TRY', 'USD', 'EUR', 'SYP', 'LYD', 'SAR', 'QAR', 'JOD', 'LBP', 'EGP', 'OMR'];
  const precision = currency => ['LYD', 'JOD', 'OMR'].includes(currency) ? 3 : 2;
  const normalizeDigits = value => String(value ?? '').replace(/[٠-٩]/g, c => String(c.charCodeAt(0) - 1632)).replace(/[۰-۹]/g, c => String(c.charCodeAt(0) - 1776));
  function normalizeText(value) {
    return normalizeDigits(value).replace(/\r\n?/g, '\n').replace(/[\u200b-\u200f\u202a-\u202e\u2066-\u2069\ufeff]/g, '')
      .split('\n').map(line => line.replace(/[^\S\n]+/g, ' ').trim()).join('\n').trim();
  }
  const fold = value => value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f\u064b-\u065f\u0670ـ]/g, '').replace(/[أإآ]/g, 'ا').replace(/ı/g, 'i');
  const words = (value, pattern) => new RegExp('(?:^|[^\\p{L}\\p{N}])(?:' + pattern + ')(?=$|[^\\p{L}\\p{N}])', 'u').test(value);
  const excluded = value => words(value, 'sub[ -]?total|subtotal|tax|vat|change|cash|card|tender|paid|payment|savings|discount|items|quantity|phone|telephone|tel|barcode|qr|id|invoice no|receipt no|ara toplam|kdv|vergi|para ustu|nakit|kredi|kart|sous[ -]?total|total ht|tva|rendu|especes|carte|المجموع الفرعي|الاجمالي الفرعي|الضريبه|الضريبة|ضريبة|الباقي|نقدا|نقدي|بطاقة|بطاقه|هاتف|الباركود|رقم');
  function strength(value) {
    if (excluded(value)) return 0;
    if (words(value, 'grand total|amount due|genel toplam|odenecek|net a payer|total ttc|المبلغ الاجمالي')) return 2;
    return words(value, 'total|toplam|الاجمالي|المجموع') ? 1 : 0;
  }
  function currencyFor(line, fallback) {
    if (/[£¥₹₽]|\b(?:GBP|CAD|AUD|NZD|AED|KWD|BHD|CHF|JPY|CNY|INR|RUB|HKD|SGD)\b/i.test(line)) return '';
    const found = currencies.filter(code => new RegExp('(?:^|[^A-Z])' + code + '(?=$|[^A-Z])', 'i').test(line));
    if (/₺|(?:^|[^A-Z])TL(?=$|[^A-Z])/i.test(line)) found.push('TRY');
    if (/€/.test(line)) found.push('EUR');
    if (/US\$/i.test(line)) found.push('USD');
    const unique = [...new Set(found)];
    if (unique.length > 1) return '';
    if (/\$/.test(line) && unique.length && unique[0] !== 'USD') return '';
    if (/\$/.test(line) && !unique.length && fallback !== 'USD') return '';
    if (/ريال/u.test(line) && !['SAR', 'QAR', 'OMR'].includes(unique[0] || fallback)) return '';
    return unique[0] || fallback;
  }
  const currencyMark = /(?:TRY|USD|EUR|SYP|LYD|SAR|QAR|JOD|LBP|EGP|OMR|TL|US\$|[$€₺])/i;
  const datePattern = /\b(?:\d{4}-\d{2}-\d{2}|\d{1,2}[/.]\d{1,2}[/.]\d{4})\b/g;
  function dateOf(text) {
    for (const match of text.matchAll(datePattern)) {
      const parts = match[0].split(/[-/.]/).map(Number);
      const [year, month, day] = match[0].includes('-') ? parts : [parts[2], parts[1], parts[0]];
      const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
      const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
      if (year >= 1000 && month >= 1 && month <= 12 && day >= 1 && day <= days[month - 1]) {
        return String(year).padStart(4, '0') + '-' + String(month).padStart(2, '0') + '-' + String(day).padStart(2, '0');
      }
    }
    return '';
  }
  function amountsOf(line) {
    // Match malformed numeric strings as a whole so a valid suffix is never salvaged.
    // Mask recognized currency tokens without moving numeric offsets or splitting OCR errors.
    const mask = token => ' '.repeat(token.length);
    const tokens = new RegExp('(?<![\\p{L}])(?:' + currencies.join('|') + '|TL|ريال)(?![\\p{L}])', 'giu');
    const clean = line.replace(datePattern, mask).replace(/\b\d{1,2}:\d{2}(?::\d{2})?\b/g, mask).replace(tokens, mask);
    return [...clean.matchAll(/[+−–-]?\d+(?:[.,٫٬]\d+)*(?:[ \u00a0\u202f]\d{3})*(?:[.,٫٬]\d+)?/g)]
      .filter(match => !/[\p{L}\p{N}.,٫٬/]/u.test(clean[match.index - 1] || '') && !/[\p{L}\p{N}.,٫٬/]/u.test(clean[match.index + match[0].length] || '')
        && !/[+−–(-]\s*$/.test(clean.slice(0, match.index)) && !/^\s*\)/.test(clean.slice(match.index + match[0].length)));
  }
  function fixed(units, currency) {
    const digits = precision(currency), value = String(units).padStart(digits + 1, '0');
    return value.slice(0, -digits) + '.' + value.slice(-digits);
  }
  function parse(value, options = {}) {
    if (typeof value !== 'string' || value.length > 16384 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f]/.test(value)) throw Error('receipt_invalid');
    const text = normalizeText(value), lines = text.split('\n');
    const fallback = currencies.includes(options.currency) ? options.currency : 'TRY';
    const language = options.language || 'en';
    const result = {amount: '', minor: null, currency: fallback, date: dateOf(text), merchant: '', candidates: [], text};
    const ranked = [];
    for (let index = 0; index < lines.length; index++) {
      const original = lines[index], normalized = fold(original);
      if (!original || excluded(normalized)) continue;
      const rank = strength(normalized);
      let line = original, matches = amountsOf(line);
      // OCR often puts a printed total and its amount on consecutive lines.
      if (rank && !matches.length && lines[index + 1]) {
        const next = lines[index + 1];
        const remainder = next.replace(/[\d\s.,٫٬+−–-]/g, '').replace(/TRY|USD|EUR|SYP|LYD|SAR|QAR|JOD|LBP|EGP|OMR|TL|US\$|[$€₺]/gi, '');
        if (!remainder && !excluded(fold(next))) { line += ' ' + next; matches = amountsOf(line); index++; }
      }
      if (!rank && !currencyMark.test(line)) continue;
      const currency = currencyFor(line, fallback);
      if (!currency || typeof options.minor !== 'function') continue;
      const valid = [];
      for (const match of matches) {
        const raw = match[0];
        if (/^[+−–-]/.test(raw) || /^\d{10,}$/.test(raw) || /[%٪]/.test(line)) continue;
        // Currency-only candidates must actually have a printed currency beside the amount.
        if (!rank && !currencyMark.test(line.slice(match.index + raw.length).trim()) && !currencyMark.test(line.slice(0, match.index).trim())) continue;
        try {
          const minor = options.minor(raw, currency, language);
          if (!Number.isSafeInteger(minor) || minor <= 0) continue;
          const candidate = {amount: fixed(minor, currency), minor, currency, line};
          result.candidates.push(candidate);
          valid.push(candidate);
        } catch (_) { /* Invalid OCR amounts are left for manual review. */ }
      }
      if (rank && valid.length === 1) ranked.push({candidate: valid[0], rank});
    }
    if (ranked.length) {
      const strongest = Math.max(...ranked.map(item => item.rank));
      const final = ranked.filter(item => item.rank === strongest);
      const keys = new Set(final.map(item => item.candidate.currency + ':' + item.candidate.minor));
      if (keys.size === 1) Object.assign(result, {amount: final[final.length - 1].candidate.amount, minor: final[final.length - 1].candidate.minor, currency: final[final.length - 1].candidate.currency});
    }
    result.merchant = lines.slice(0, 6).find(line => /\p{L}{2}/u.test(line) && !/\d|[@:]/.test(line) && line.length <= 100 && !excluded(fold(line)) && !strength(fold(line)) && !words(fold(line), 'receipt|invoice|date|fis|fatura|tarih|recu|ticket|facture|فاتورة|فاتوره|ايصال|التاريخ') && !currencies.includes(line.toUpperCase())) || '';
    return result;
  }
  return {parse, normalizeDigits, normalizeText};
});
