import { useRef, useState } from 'react'
import type Quill from 'quill'
import type { Delta } from 'quill'
import QuillEditor from './QuillEditor'

function App() {
  const quillRef = useRef<Quill | null>(null)
  const [html, setHtml] = useState('')
  const [delta, setDelta] = useState<Delta | null>(null)

  const handleShowContent = () => {
    const quill = quillRef.current
    if (!quill) return

    setHtml(quill.getSemanticHTML())
    setDelta(quill.getContents())
  }

  return (
    <section id="editor-page">
      <h1>Quill Editor - TableKit</h1>
      <p>
        Insert a table from the toolbar. Right-click a cell (or press the table button inside one) for row, column and
        merge actions; drag a cell border to resize a column.
      </p>
      <p>
        Images work inside cells too: click one to resize it (resize-quill-image) and hover it to add alt text
        (quill-image-alt).
      </p>
      <QuillEditor ref={quillRef} />

      <button onClick={handleShowContent} style={{ marginTop: '1rem' }}>
        Show HTML & Delta
      </button>

      {html && (
        <div style={{ marginTop: '2rem' }}>
          <h3>HTML Output</h3>
          <div
            className="html-output"
            style={{ border: '1px solid #ccc', padding: '10px', background: '#fff' }}
            dangerouslySetInnerHTML={{ __html: html }}
          />
          <pre
            style={{
              background: '#f9f9f9',
              padding: '10px',
              border: '1px solid #ccc',
              overflowX: 'auto',
              whiteSpace: 'pre-wrap',
            }}
          >
            {html}
          </pre>
        </div>
      )}

      {delta && (
        <div style={{ marginTop: '2rem' }}>
          <h3>Delta Output</h3>
          <pre style={{ background: '#f9f9f9', padding: '10px', border: '1px solid #ccc', overflowX: 'auto' }}>
            {JSON.stringify(delta, null, 2)}
          </pre>
        </div>
      )}
    </section>
  )
}

export default App
