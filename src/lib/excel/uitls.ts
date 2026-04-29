export function getExcelColumnName(index: number): string {
  let column = '';
  while (index > 0) {
    let remainder = (index - 1) % 26;
    column = String.fromCharCode(65 + remainder) + column;
    index = Math.floor((index - 1) / 26);
  }
  return column;
}
