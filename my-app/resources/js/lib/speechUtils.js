export function standardLevenshtein(a, b) {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  let prevRow = new Int32Array(n + 1);
  let currRow = new Int32Array(n + 1);

  for (let j = 0; j <= n; j++) prevRow[j] = j;

  for (let i = 1; i <= m; i++) {
    currRow[0] = i; // Establish bounds
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const del = prevRow[j] + 1;
      const ins = currRow[j - 1] + 1;
      const sub = prevRow[j - 1] + cost;
      
      currRow[j] = del < ins ? (del < sub ? del : sub) : (ins < sub ? ins : sub);
    }
    let temp = prevRow;
    prevRow = currRow;
    currRow = temp;
  }
  return prevRow[n];
}

export function normalizeText(text) {
  return (text ?? "").toLowerCase().replace(/[^\w\s]/g, "").trim();
}

/**
 * Universal Word Match Validator
 * Angkop sa KAHIT ANONG SALITA (maikli man o mahaba)
 */
function isValidFuzzyMatch(spokenWord, targetWord) {
  if (spokenWord === targetWord) return true;

  const targetLen = targetWord.length;
  const spokenLen = spokenWord.length;
  const rawDist = standardLevenshtein(spokenWord, targetWord);

  // 1. DYNAMIC ERROR ALLOWANCE (20% threshold, max out at 2 errors para hindi sumobra ang luwag sa mahahabang salita)
  const maxAllowedError = Math.min(2, Math.max(1, Math.floor(targetLen * 0.20)));
  
  if (rawDist > maxAllowedError) return false;

  // 2. UNIVERSAL RIGID ANCHOR CHECKS — applied to ALL word lengths
  if (targetLen >= 1) {
    const firstLetterMatch = spokenWord[0] === targetWord[0];
    const lastLetterMatch = spokenWord[spokenLen - 1] === targetWord[targetLen - 1];

    // CRITICAL FIX: Kung mali ang unang letra, AUTOMATIC FAIL agad.
    // Walang porsyento, walang math. Kung hindi binigkas ang panimulang tunog, mali ang basa.
    if (!firstLetterMatch) {
      return false; 
    }

    // Para sa dulo, magpataw ng mabigat na penalty (+1)
    let adjustedDist = rawDist;
    if (!lastLetterMatch) adjustedDist += 1;

    if (adjustedDist > maxAllowedError) return false;
  }

  return true;
}

export function isWordMatch(spoken, target) {
  if (!spoken || !target) return false;

  const a = normalizeText(spoken);
  const b = normalizeText(target);

  if (a.length === 0 || b.length === 0) return false;
  if (a === b) return true;

  const wordsA = a.split(/\s+/);
  const wordsB = b.split(/\s+/);

  // Strategy 1: Single-Word Target processing with strict sliding check
  if (wordsB.length === 1) {
    const singleTarget = wordsB[0];
    
    for (let i = 0; i < wordsA.length; i++) {
      if (isValidFuzzyMatch(wordsA[i], singleTarget)) return true;
      
      if (i < wordsA.length - 1) {
        const combined = wordsA[i] + wordsA[i + 1];
        if (isValidFuzzyMatch(combined, singleTarget)) return true;
      }
    }
    return false;
  }

  // Strategy 2: Multi-Word Target ordered two-pointer evaluation
  let j = 0;
  for (let i = 0; i < wordsA.length && j < wordsB.length; i++) {
    const isExact = wordsA[i] === wordsB[j];
    const isFuzzy = !isExact && isValidFuzzyMatch(wordsA[i], wordsB[j]);

    if (isExact || isFuzzy) {
      if (isFuzzy && i + 1 < wordsA.length && wordsA[i + 1] === wordsB[j]) {
        continue; 
      }
      j++;
    }
  }

  return j === wordsB.length;
}
