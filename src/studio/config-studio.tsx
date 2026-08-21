import { Icon } from '@workflowbuilder/sdk';
import clsx from 'clsx';
import { useState } from 'react';

import type { PaletteConfig } from '@/config/types/palette';
import type { EditorProfile } from '@/config/types/profile';

import styles from './studio.module.css';

import { DiagramPanel } from './diagram-panel';
import { SchemaPanel } from './schema-panel';
import { TokenPanel } from './token-panel';

/**
 * The Config Studio: a dock that edits the very data the editor was built from.
 */

type Tab = 'tokens' | 'schema' | 'diagram';

const TABS: { id: Tab; label: string }[] = [
  { id: 'tokens', label: 'Tokens' },
  { id: 'schema', label: 'Schema' },
  { id: 'diagram', label: 'Diagram' },
];

type Props = {
  profile: EditorProfile;
  onApplyPalette: (palette: PaletteConfig) => void;
  onClose: () => void;
};

export const ConfigStudio = ({ profile, onApplyPalette, onClose }: Props) => {
  const [tab, setTab] = useState<Tab>('tokens');

  return (
    <aside className={styles['studio']}>
      <header className={styles['head']}>
        <div className={styles['tabs']} role="tablist">
          {TABS.map((entry) => (
            <button
              key={entry.id}
              type="button"
              role="tab"
              aria-selected={tab === entry.id}
              className={clsx({ [styles['is-active']]: tab === entry.id })}
              onClick={() => setTab(entry.id)}
            >
              {entry.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          className={styles['close']}
          onClick={onClose}
          title="Close Config Studio"
        >
          <Icon name="X" size="medium" />
        </button>
      </header>

      {tab === 'tokens' ? <TokenPanel theme={profile.theme} /> : null}
      {tab === 'schema' ? <SchemaPanel profile={profile} onApplyPalette={onApplyPalette} /> : null}
      {tab === 'diagram' ? <DiagramPanel /> : null}
    </aside>
  );
};
