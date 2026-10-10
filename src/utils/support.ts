import Quill from 'quill'

export const isSupportedQuill = () => Number.parseInt(String(Quill.version ?? '0'), 10) >= 2

let warned = false

export const warnUnsupported = (): void => {
  if (warned) return

  warned = true
  console.warn(
    `quill-tablekit requires Quill 2 or newer (found ${String(Quill.version)}); the table module is disabled.`,
  )
}
