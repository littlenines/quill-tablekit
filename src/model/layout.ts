export const sumOf = (numbers: number[]) => numbers.reduce((total, number) => total + number, 0)

export const scaleColumnWidths = (
  startWidths: number[],
  widthChange: number,
  minWidth: number,
  maxTableWidth = Infinity,
): number[] => {
  const startTotal = sumOf(startWidths)
  const widestTotal = Math.max(maxTableWidth, startTotal)
  const newTotal = Math.max(minWidth * startWidths.length, Math.min(widestTotal, startTotal + widthChange))

  const exactWidths = startWidths.map((width) => (width * newTotal) / startTotal)
  const roundedWidths = exactWidths.map(Math.floor)
  let pixelsLeft = Math.round(newTotal) - sumOf(roundedWidths)

  const columnsByRemainder = exactWidths
    .map((width, columnIndex) => ({ columnIndex, remainder: width - Math.floor(width) }))
    .sort((first, second) => second.remainder - first.remainder)

  for (const { columnIndex } of columnsByRemainder) {
    if (pixelsLeft <= 0) break

    roundedWidths[columnIndex] += 1
    pixelsLeft -= 1
  }

  return roundedWidths.map((width) => Math.max(minWidth, width))
}

export const equalColumnWidths = (columnWidths: number[]): number[] => {
  const totalWidth = sumOf(columnWidths)
  const baseWidth = Math.floor(totalWidth / columnWidths.length)
  const pixelsLeft = totalWidth - baseWidth * columnWidths.length

  return columnWidths.map((_width, columnIndex) => baseWidth + (columnIndex < pixelsLeft ? 1 : 0))
}

// Swaps the block start..middle with the block middle..end that follows it
export const swapNeighbors = <Item>(list: Item[], start: number, middle: number, end: number): void => {
  const bothBlocks = list.splice(start, end - start)
  const firstBlockLength = middle - start

  list.splice(start, 0, ...bothBlocks.slice(firstBlockLength), ...bothBlocks.slice(0, firstBlockLength))
}
