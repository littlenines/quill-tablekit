const PAST_LIMIT_CLASS = 'qlt-resizing-past-limit'

export const isPastWidthLimit = (startWidths: number[], widthGrowth: number, maxTableWidth: number): boolean => {
  const startTotal = startWidths.reduce((total, width) => total + width, 0)

  return widthGrowth > 0 && startTotal + widthGrowth > Math.max(maxTableWidth, startTotal) + 0.5
}

export const showPastLimit = (isPastLimit: boolean, ...elements: HTMLElement[]): void => {
  document.body.classList.toggle(PAST_LIMIT_CLASS, isPastLimit)

  for (const element of elements) element.classList.toggle('is-past-limit', isPastLimit)
}

export const followMouseUntilRelease = (
  bodyClassName: string,
  onMove: (event: MouseEvent) => void,
  onRelease: () => void,
): AbortController => {
  const dragListeners = new AbortController()
  const { signal } = dragListeners
  let latestMove: MouseEvent | null = null
  let frameId = 0

  const moveOncePerFrame = () => {
    frameId = 0

    if (latestMove) onMove(latestMove)

    latestMove = null
  }

  signal.addEventListener('abort', () => {
    cancelAnimationFrame(frameId)
    document.body.classList.remove(bodyClassName, PAST_LIMIT_CLASS)
  })

  document.body.classList.add(bodyClassName)
  document.addEventListener(
    'mousemove',
    (event) => {
      latestMove = event
      frameId ||= requestAnimationFrame(moveOncePerFrame)
    },
    { signal },
  )
  document.addEventListener(
    'mouseup',
    (event) => {
      onMove(event)
      dragListeners.abort()
      onRelease()
    },
    { signal },
  )

  return dragListeners
}
