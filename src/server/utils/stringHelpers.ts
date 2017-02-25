// TODO Use Lodash with reduce instead
export default function count(pattern) {
  let occurrences = 0;
  let startIndex = 0;
  do {
    startIndex = this.indexOf(pattern, startIndex);
    if (startIndex < 0) {
      break;
    }
    occurrences++;
    startIndex += pattern.length;
  }
  while (startIndex >= 0);

  return occurrences;
}
