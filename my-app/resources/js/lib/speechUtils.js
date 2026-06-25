const peq = new Int32Array(0x10000);
const touched = [];

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
