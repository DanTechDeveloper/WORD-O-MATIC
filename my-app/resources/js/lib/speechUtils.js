const peq = new Int32Array(0x10000);
const touched = [];

function standardLevenshtein(s1, s2, start, len1, len2) {
    const a = s1.slice(start, start + len1);
    const b = s2.slice(start, start + len2);
    const m = a.length, n = b.length;

    let prev = new Int32Array(n + 1);
    let curr = new Int32Array(n + 1);
    for (let j = 0; j <= n; j++) prev[j] = j;

    for (let i = 1; i <= m; i++) {
        curr[0] = i;
        for (let j = 1; j <= n; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            curr[j] = Math.min(
                prev[j] + 1,
                curr[j - 1] + 1,
                prev[j - 1] + cost,
            );
        }
        [prev, curr] = [curr, prev];
    }
    return prev[n];
}

function fastestLevenshtein(a, b) {
    if (a === b) return 0;

    let str1 = a, str2 = b;
    if (str1.length > str2.length) [str1, str2] = [str2, str1];

    let len1 = str1.length;
    let len2 = str2.length;

    while (len1 > 0 && str1.charCodeAt(len1 - 1) === str2.charCodeAt(len2 - 1)) {
        len1--;
        len2--;
    }

    let start = 0;
    while (start < len1 && str1.charCodeAt(start) === str2.charCodeAt(start)) {
        start++;
    }

    len1 -= start;
    len2 -= start;

    if (len1 === 0) return len2;

    if (len1 > 31) {
        return Math.abs(len1 - len2) > maxDist(b.length)
            ? len1
            : standardLevenshtein(str1, str2, start, len1, len2);
    }

    for (let i = 0; i < touched.length; i++) peq[touched[i]] = 0;
    touched.length = 0;

    let vp = ~0;
    let vn = 0;
    let distance = len1;

    for (let i = 0; i < len1; i++) {
        const code = str1.charCodeAt(start + i);
        if (peq[code] === 0) touched.push(code);
        peq[code] |= (1 << i);
    }

    for (let i = 0; i < len2; i++) {
        let eq = peq[str2.charCodeAt(start + i)];
        let xv = eq | vn;
        let xh = (((eq & vp) + vp) ^ vp) | eq;
        let ph = vp & xh;
        let nh = vn | ~(vp | xh);

        if (ph & (1 << (len1 - 1))) distance++;
        if (nh & (1 << (len1 - 1))) distance--;

        vp = nh | ~(xv | ph);
        vn = ph & xv;
    }

    return distance;
}

function maxDist(wordLength) {
    if (wordLength <= 5) return 1;
    if (wordLength <= 8) return 2;
    return 3;
}

export function isFuzzyMatch(spoken, target) {
    if (!spoken || !target) return false;
    const a = spoken.toLowerCase().trim();
    const b = target.toLowerCase().trim();
    if (a === b) return true;
    if (a.length === 0 || b.length === 0) return false;
    return fastestLevenshtein(a, b) <= maxDist(b.length);
}
