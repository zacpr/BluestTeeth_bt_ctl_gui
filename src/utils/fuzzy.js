export function fuzzyMatch(pattern, str) {
  if (!pattern) return { isMatch: true, score: 0 };
  pattern = pattern.toLowerCase();
  str = str.toLowerCase();
  
  let patternIdx = 0;
  let strIdx = 0;
  let score = 0;
  
  while (patternIdx < pattern.length && strIdx < str.length) {
    if (pattern[patternIdx] === str[strIdx]) {
      // Bonus for consecutive matches or start of word
      if (strIdx === 0 || str[strIdx - 1] === ' ' || str[strIdx - 1] === '-') {
        score += 2;
      } else {
        score += 1;
      }
      patternIdx++;
    }
    strIdx++;
  }
  
  if (patternIdx === pattern.length) {
    return { isMatch: true, score };
  }
  
  return { isMatch: false, score: 0 };
}
