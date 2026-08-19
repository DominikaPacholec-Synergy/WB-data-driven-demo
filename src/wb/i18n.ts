import i18next from 'i18next';

// Side-effect import, not a type-only one: the SDK calls `i18next.init()` at
// module scope, and we can only add a bundle on top of resources that exist.
import '@workflowbuilder/sdk';

/**
 * One SDK string, corrected.
 *
 * On mount the SDK's integration wrapper asks nothing more than "is any part of
 * the seed diagram truthy?" — and if so announces `snackbar.restoreDiagramSuccess`,
 * "Saved data has been restored". It never asks where the seed came from. Ours
 * comes from the config backend as `initialNodes` / `initialEdges`; there is no
 * saved state to restore, because `INTEGRATION` in `./runtime` opts out of the
 * `localStorage` strategy on purpose. In a demo whose whole point is that the
 * editor is described by data, a toast crediting local storage says the opposite
 * of the thing being demonstrated.
 *
 * It has to be done here because there is no prop for it: the snackbar provider
 * is internal to `<Root>`, and `registerPluginTranslation` forwards only the
 * `plugins.*` subtree. What the SDK does expose, unintentionally, is the shared
 * i18next singleton — it imports the bare `i18next` specifier, which resolves to
 * the same instance we depend on. The label is read with `t()` at render time,
 * so an override installed before the first render is the one that shows.
 */
const RESTORED_SNACKBAR: Record<string, string> = {
  en: 'Workflow loaded from config',
  pl: 'Workflow wczytany z konfiguracji',
};

/*
 * Both languages, because the SDK ships `en` and `pl` and lets a browser
 * detector choose — patching only `en` would leave a Polish browser reading the
 * original "Zapisane dane zostały przywrócone".
 *
 * `deep` merges into the existing `snackbar` namespace rather than replacing it,
 * so the other ten messages survive; `overwrite` is what lets our value win.
 */
for (const [language, restoreDiagramSuccess] of Object.entries(RESTORED_SNACKBAR)) {
  i18next.addResourceBundle(
    language,
    'translation',
    { snackbar: { restoreDiagramSuccess } },
    true,
    true,
  );
}
