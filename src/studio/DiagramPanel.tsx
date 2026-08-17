import { useState } from 'react';
import { getStoreDataForIntegration } from '@workflowbuilder/sdk';

/**
 * The diagram, as data — the seed the backend served next to what the editor
 * currently holds.
 *
 * It closes the loop the other two tabs open: the palette and the theme arrive
 * as JSON, and what the user builds leaves as JSON too. The right-hand side is
 * exactly the payload `integration.onDataSave` receives.
 */
export function DiagramPanel() {
  const [snapshot, setSnapshot] = useState<string>('');

  const capture = () => {
    /*
     * Read on demand rather than on render. The store is a module-level
     * singleton with no React subscription here, so a render-time read would
     * show whatever happened to be there at the last unrelated re-render.
     */
    setSnapshot(JSON.stringify(getStoreDataForIntegration(), null, 2));
  };

  return (
    <div className="studio__panel">
      <p className="studio__lede">
        The live diagram, in the same shape <code>onDataSave</code> receives. Config comes in as
        JSON; the workflow goes out as JSON.
      </p>

      <footer className="studio__footer">
        <button type="button" onClick={capture}>
          Capture diagram
        </button>
        <button
          type="button"
          disabled={!snapshot}
          onClick={() => void navigator.clipboard.writeText(snapshot)}
        >
          Copy
        </button>
      </footer>

      <textarea
        className="studio__editor"
        readOnly
        spellCheck={false}
        value={snapshot}
        placeholder="Press “Capture diagram” to read the current nodes and edges out of the store."
      />
    </div>
  );
}
