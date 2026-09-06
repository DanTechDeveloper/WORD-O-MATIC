// Space Complexity optimized to O(N)
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
      if (standardLevenshtein(wordsA[i], singleTarget) <= 1) return true;
      
      if (i < wordsA.length - 1) {
        const combined = wordsA[i] + wordsA[i + 1];
        if (standardLevenshtein(combined, singleTarget) <= 1) return true;
      }
    }
    return false;
  }

  // Strategy 2: Multi-Word Target ordered two-pointer evaluation
  let j = 0;
  for (let i = 0; i < wordsA.length && j < wordsB.length; i++) {
    const isExact = wordsA[i] === wordsB[j];
    const isFuzzy = !isExact && standardLevenshtein(wordsA[i], wordsB[j]) <= 1;

    if (isExact || isFuzzy) {
      // Lookahead: If current is a weak match but the immediate next word is 
      // an exact match, drop the current token so the exact match catches it next loop.
      if (isFuzzy && i + 1 < wordsA.length && wordsA[i + 1] === wordsB[j]) {
        continue; 
      }
      j++; // Step forward in target phrase
    }
  }

  return j === wordsB.length;
}