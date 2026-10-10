# Installation

## npm

```bash
npm install quill-tablekit
# or
pnpm add quill-tablekit
```

You also need `quill` 2.0 or newer. It's a peer dependency, so it won't be installed for you.

It doesn't work with Quill 1. Merged cells need nested blots, and Quill 1 can't do that. If you load it with Quill 1 you'll get a warning in the console and the module won't do anything.

`react-quill-new` works fine, it uses Quill 2.

## CDN

Load Quill first, then this module. It's available as `QuillTableKit`.

unpkg:

```html
<link href="https://unpkg.com/quill@2.0.3/dist/quill.snow.css" rel="stylesheet" />
<script src="https://unpkg.com/quill@2.0.3/dist/quill.js"></script>
<script src="https://unpkg.com/quill-tablekit/dist/index.iife.js"></script>
```

jsDelivr:

```html
<link href="https://cdn.jsdelivr.net/npm/quill@2.0.3/dist/quill.snow.css" rel="stylesheet" />
<script src="https://cdn.jsdelivr.net/npm/quill@2.0.3/dist/quill.js"></script>
<script src="https://cdn.jsdelivr.net/npm/quill-tablekit/dist/index.iife.js"></script>
```

Then:

```html
<div id="editor"></div>
<script>
  Quill.register('modules/tableKit', QuillTableKit)

  const quill = new Quill('#editor', {
    theme: 'snow',
    modules: { toolbar: [['bold', 'italic'], ['table']], tableKit: {} },
  })
</script>
```

Next: [Usage](./usage.md)
