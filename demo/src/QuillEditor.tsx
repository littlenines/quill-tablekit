import { forwardRef, useEffect, useRef } from 'react'
import Quill from 'quill'
import TableKit from 'quill-tablekit'
import ImageResize from 'resize-quill-image'
import AltText from 'quill-image-alt'
import 'quill/dist/quill.snow.css'
import './QuillEditor.css'

Quill.register('modules/tableKit', TableKit)
Quill.register('modules/imageResize', ImageResize)
Quill.register('modules/altText', AltText)

const toolbarOptions = [
  [{ header: [1, 2, 3, false] }],
  ['bold', 'italic', 'underline', 'strike'],
  [{ list: 'ordered' }, { list: 'bullet' }, { align: [] }],
  ['link', 'image', 'table'],
  ['clean'],
]

const QuillEditor = forwardRef<Quill | null>(function QuillEditor(_props, ref) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const editorElement = document.createElement('div')
    container.appendChild(editorElement)

    const quill = new Quill(editorElement, {
      theme: 'snow',
      placeholder: 'Compose an epic...',
      modules: {
        toolbar: toolbarOptions,
        tableKit: { pickerRows: 8, pickerColumns: 10, sortable: true },
        imageResize: { helpIcon: true, displaySize: true },
        altText: true,
      },
    })

    if (typeof ref === 'function') ref(quill)
    else if (ref) ref.current = quill

    return () => {
      ;(quill.getModule('tableKit') as TableKit).destroy()
      ;(quill.getModule('imageResize') as ImageResize).destroy()
      ;(quill.getModule('altText') as AltText).destroy()
      container.innerHTML = ''

      if (typeof ref === 'function') ref(null)
      else if (ref) ref.current = null
    }
  }, [ref])

  return <div className="quill-editor" ref={containerRef} />
})

export default QuillEditor
