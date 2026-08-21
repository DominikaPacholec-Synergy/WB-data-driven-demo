import '@workflowbuilder/sdk';
import i18next from 'i18next';

const RESTORED_SNACKBAR: Record<string, string> = {
  en: 'Workflow loaded from config',
  pl: 'Workflow wczytany z konfiguracji',
};

for (const [language, restoreDiagramSuccess] of Object.entries(RESTORED_SNACKBAR)) {
  i18next.addResourceBundle(
    language,
    'translation',
    { snackbar: { restoreDiagramSuccess } },
    true,
    true,
  );
}
