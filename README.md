# WB — the editor is described by data

A demo built as source material for an article about Workflow Builder.

**The claim:** the palette, the property panels, the seeded workflow and the whole
look of the editor are *data*. The same code renders a different editor depending
on the JSON a backend serves — design-system tokens for the look, JSON Schema +
JSON Forms for the panels. No branch in the code per customer, no fork.

**The demo's content** is a human-in-the-loop *Invoice Approval* workflow: an
automated run pauses for a person, then continues. So HITL is the subject matter;
data-driven configuration is the argument.

Switch the **Profile** dropdown to see it: `Invoice Approval` (teal, Poppins,
light, top-down) and `AI Content Pipeline` (magenta, IBM Plex Mono, dark,
left-to-right) share every line of code.

## Running

```bash
npm install
npm run dev     # http://localhost:5173
npm run build && npm run preview   # the mock config API works here too
```

## Where things live

| Path | Role |
|---|---|
| `config/profiles/<id>/theme.json` | design tokens — keyed by the SDK's **real** custom-property names, split `base` / `light` / `dark`, plus `inspector` (which tokens get live controls) |
| `config/profiles/<id>/palette.json` | node types **and** their property-panel schemas: JSON Schema `properties`, `required`, `allOf` conditional validation, JSON Forms `ui.elements` with `rule` show/hide |
| `config/profiles/<id>/workflow.json` | the seeded diagram + selectable templates |
| `config/profiles/<id>/profile.json` | chrome (product name, nav), status vocabulary, `taskFields`, `run` (mock context + task fact sheet) |
| `vite-plugins/config-api.ts` | stands in for the config backend: `GET /api/profiles`, `/:id` (assembles the four files), `/:id/:part`. Visible in the Network tab — the config genuinely arrives over HTTP |
| `src/config/` | the contract (`types.ts`), the loader, the compiler, the token engine |
| `src/studio/` | Config Studio — edit the tokens and the schema at runtime |
| `src/run/` | the run store and the interpreter that walks the diagram |
| `src/views/` | Tasks (inbox) and Executions (timeline) |

Nothing is `import`ed from `config/`; nothing lives in `public/`.

## The five things worth recording

1. **One token, everything repaints.** Config Studio → *Tokens* → drag Brand.
   Buttons, node borders, node icons, the slider accent, the task inbox and the
   timeline all move together, because the shell consumes the same `--ax-*`
   tokens as the canvas. *Copy theme.json* hands back the file a backend would serve.
2. **Swap the profile.** One dropdown changes the palette, the icons, the node
   shapes, the seeded diagram, the panel fields, the nav labels, the brand, the
   font, the radii and the colour mode.
3. **Tighten a schema at runtime.** Config Studio → *Schema* → on
   `approval.human` set `thresholdAmount`'s `"minimum"` to `5000` (above the
   `1000` the node already carries) → **Apply** → select Human Approval. A
   validation badge appears on a node that was *already on the canvas*, and the
   diagram is untouched. Edits are snapshotted across the remount, so the SDK
   re-validates existing data against the new schema.
4. **A conditional panel, with no React.** On Human Approval, change *Approval
   mode*; `thresholdAmount`, `dueAfterHours` and the warning appear and disappear.
   That is `rule` + `allOf` in JSON.
5. **The human in the loop.** **Run** → nodes light up → `WAITING FOR HUMAN` →
   *Tasks* → Approve → the run resumes to `COMPLETED`. Then prove the branch is
   *configured*, not coded: raise the condition's threshold above the mocked
   amount and the next run takes *Auto-approve* and never creates a task.

Also: the **fingerprint** button labels every node with the config entry it was
compiled from.

## What is data and what is code

Being straight about the boundary is the point of the demo.

**Pure data, no code:** the palette and its groups; node icons (a `WBIcon`
string); four built-in node looks via `templateType`; the whole properties panel
(11 controls, 4 layouts, `rule` show/hide/enable/disable); conditional validation
via `allOf`; the seeded diagram and templates; layout direction; the nav, brand
and status vocabulary; the mocked run context and the task fact sheet.

**Code, but the *choice* stays in data:** `src/renderers/currencyAmount.tsx` is a
custom JSON Forms control. Which field uses it is one key in `palette.json`:

```json
{ "type": "Text", "scope": "#/properties/thresholdAmount",
  "options": { "customRenderer": "CurrencyAmount", "currency": "EUR" } }
```

**Code, unavoidably:** custom node/edge templates, plugins, `isValidConnection`,
and anything beyond light/dark — `setTheme` accepts only `'dark' | 'light'`;
everything else is CSS custom properties.

## Notes for whoever picks this up

- **Tokens must be inline styles on `<html>`.** The SDK's 174 semantic colour
  tokens are declared on `html[data-theme=…]` — specificity (0,1,1) — so a plain
  `:root {}` rule loses, and the blocks are unlayered so `@layer` cannot help.
  Custom properties also resolve on the element that declares them, so
  overriding a primitive on a wrapper `<div>` changes nothing above it. See the
  long comment in `src/config/theme.ts`.
- **`nodeTypes` must be a stable reference.** An inline literal overwrites the
  SDK's module-level palette holder on every parent render. `useProfileRuntime`
  memoises on the profile *object* and logs every identity change in dev — one
  line per profile swap is correct, a burst means something is rebuilding it.
- **One `<Root>` per page.** Plugin, JSON Forms and i18n registries plus the
  store facade are module singletons. That is why Tasks and Executions are views
  inside the same shell, and why the builder is *parked* (`position: fixed;
  opacity: 0`) rather than unmounted or `display: none` — xyflow would measure
  zero and come back mis-laid-out.
- **A node decorator's `content` receives `{ props }`.** The host component's
  props arrive nested under one `props` key. The public type is only
  `ElementType`, so nothing warns you; destructuring `nodeId` at the top level
  silently yields `undefined`.
- **`useFitView()` is not stable and not immediate.** It returns a new function
  identity every render (so never make it an effect dependency) and does nothing
  if called on the next animation frame — xyflow has not re-measured yet. See
  `src/app/BuilderFocus.tsx`.
- **Known limitation:** the `ai-node` template does not render the
  `OptionalNodeContent` slot, so AI nodes show no run badge or provenance label.
- `jsonForm.translations` is wired through from `profile.translations`, but
  neither profile ships translation content yet.

## Deliberately out of scope

Real Temporal, real AI, real payments, auth, a backend, persistence. `Save` logs
the diagram JSON to the console — the payload is the deliverable. Run state is
in-memory, so a reload clears it.

Runs and tasks are **scoped to the profile that started them**: each profile has
its own inbox and run list, and a suspended run survives switching away and back.
That is not just tidiness — the interpreter walks whatever diagram the SDK store
currently holds, so resuming another profile's task would step through unrelated
nodes. `resolveTask` refuses to cross that line even if a view ever let it.
