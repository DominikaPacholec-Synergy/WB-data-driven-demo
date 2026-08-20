import { useState } from "react";
import { getStoreDataForIntegration } from "@workflowbuilder/sdk";

export const DiagramPanel = () => {
  const [snapshot, setSnapshot] = useState<string>("");

  const capture = () => {
    setSnapshot(JSON.stringify(getStoreDataForIntegration(), null, 2));
  };

  return (
    <div className="studio__panel">
      <p className="studio__lede">
        The live diagram, in the same shape <code>onDataSave</code> receives.
        Config comes in as JSON; the workflow goes out as JSON.
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
};
