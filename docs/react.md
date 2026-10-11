# Frameworks

The module works in any framework. These are examples for React and Vue, and the rules for the others.

## Editor

Create Quill in a `useEffect` and call `destroy()` when the component goes away:

```tsx
import { useEffect, useRef } from 'react'
import Quill from 'quill'
import TableKit from 'quill-tablekit'
import 'quill/dist/quill.snow.css'

Quill.register('modules/tableKit', TableKit)

export function Editor() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const editorElement = document.createElement('div')
    container.append(editorElement)

    const quill = new Quill(editorElement, {
      theme: 'snow',
      modules: {
        toolbar: [
          ['bold', 'italic'],
          ['link', 'table'],
        ],
        tableKit: true,
      },
    })

    return () => {
      ;(quill.getModule('tableKit') as TableKit).destroy()
      container.innerHTML = ''
    }
  }, [])

  return <div ref={containerRef} />
}
```

The [demo](../demo/src) has a full version, with a button that shows the HTML and Delta.

## Showing saved content

To show a Delta from your API, use a read-only Quill:

```tsx
import { useEffect, useRef } from 'react'
import Quill, { type Delta } from 'quill'
import TableKit from 'quill-tablekit'
import 'quill/dist/quill.snow.css'

Quill.register('modules/tableKit', TableKit)

export function ArticleBody({ delta }: { delta: Delta }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return
    const viewer = new Quill(element, { readOnly: true, modules: { toolbar: false } })
    viewer.setContents(delta)
    return () => {
      element.innerHTML = ''
    }
  }, [delta])

  return <div ref={ref} />
}
```

If you render articles on the server, save `quill.getSemanticHTML()` next to the Delta and render that instead. More on that in [Saved content](./content.md#showing-saved-content).

## Cleanup

`destroy()` removes everything the module added: its event listeners, its popups (the picker, the menu, the action bar, the cell highlight and the resize lines), its keyboard shortcuts, its paste handling and the toolbar button's handler. Call it before you remove the editor:

- when the editor component unmounts
- when the user goes to another page in a single-page app
- when you create the Quill instance again yourself

In development, React's Strict Mode runs effects twice. That's fine as long as `destroy()` is in the cleanup.

## Vue, Svelte, Angular and others

Other frameworks work the same way: create Quill when the component mounts, and call `destroy()` when it unmounts. In Vue:

```vue
<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import Quill from 'quill'
import TableKit from 'quill-tablekit'
import 'quill/dist/quill.snow.css'

Quill.register('modules/tableKit', TableKit)

const editorElement = ref(null)
let quill = null

onMounted(() => {
  quill = new Quill(editorElement.value, {
    theme: 'snow',
    modules: { toolbar: [['bold', 'italic'], ['table']], tableKit: true },
  })
})

onBeforeUnmount(() => quill?.getModule('tableKit').destroy())
</script>

<template>
  <div ref="editorElement" />
</template>
```

Quill needs a browser, so with server rendering (Next.js, Nuxt, Astro, SvelteKit) load the editor on the client only, like with `next/dynamic` and `ssr: false`, Nuxt's `<ClientOnly>` or Astro's `client:only`.
