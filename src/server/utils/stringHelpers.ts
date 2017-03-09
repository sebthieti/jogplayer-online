// TODO Use Lodash with reduce instead
export function count(source: string, pattern: string): number {
  let occurrences = 0;
  let startIndex = 0;
  do {
    startIndex = source.indexOf(pattern, startIndex);
    if (startIndex < 0) {
      break;
    }
    occurrences++;
    startIndex += pattern.length;
  }
  while (startIndex >= 0);

  return occurrences;
}
