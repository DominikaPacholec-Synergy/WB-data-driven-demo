import { getStoreDataForIntegration } from '@workflowbuilder/sdk';
import { useState } from 'react';

import styles from './studio.module.css';

export const DiagramPanel = () => {
  const [snapshot, setSnapshot] = useState<string>('');

  const capture = () => {
    setSnapshot(JSON.stringify(getStoreDataForIntegration(), null, 2));
  };

  return (
    <div className={styles['panel']}>
      <p className={styles['lede']}>
        The live diagram, in the same shape <code>onDataSave</code> receives. Config comes in as
        JSON; the workflow goes out as JSON.
      </p>

      <footer className={styles['footer']}>
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

      <div className={styles['scroll']}>
        <textarea
          className={styles['editor']}
          readOnly
          spellCheck={false}
          value={snapshot}
          placeholder="Press “Capture diagram” to read the current nodes and edges out of the store."
        />
      </div>
    </div>
  );
};
