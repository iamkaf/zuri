import { IconBell } from '../Icons';
import type { ThemeId, ZuriSettings } from '../preload';
import { themeLabel } from '../lib/theme';
import styles from './SettingsForm.module.css';

export type SettingsFormProps = {
  settings: ZuriSettings;
  onPickMarkdown: () => Promise<void>;
  onPatchSettings: (patch: Partial<ZuriSettings>) => Promise<void>;
};

export function SettingsForm({ settings, onPickMarkdown, onPatchSettings }: SettingsFormProps) {
  const options = Object.keys(themeLabel) as ThemeId[];

  return (
    <div className={styles.settings}>
      <section className={styles.settingsCard}>
        <h2 className={styles.settingsCardTitle}>File</h2>
        <div className={styles.settingsRow}>
          <span className={styles.settingsLabel}>Markdown file</span>
          <div className={styles.settingsValue}>
            <span className={styles.settingsPath}>
              {settings.markdownPath || <em>none</em>}
            </span>
            <button className="btn btn-small" onClick={() => void onPickMarkdown()}>
              Choose...
            </button>
          </div>
        </div>
      </section>

      <section className={styles.settingsCard}>
        <h2 className={styles.settingsCardTitle}>Features</h2>
        <label className={styles.toggle}>
          <span>Priority levels</span>
          <input
            type="checkbox"
            checked={settings.features.priority}
            onChange={(e) =>
              void onPatchSettings({
                features: { ...settings.features, priority: e.target.checked },
              })
            }
          />
        </label>
        <label className={styles.toggle}>
          <span>Effort estimates</span>
          <input
            type="checkbox"
            checked={settings.features.effort}
            onChange={(e) =>
              void onPatchSettings({
                features: { ...settings.features, effort: e.target.checked },
              })
            }
          />
        </label>
        <label className={styles.toggle}>
          <span>
            <IconBell size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
            Notifications
          </span>
          <input
            type="checkbox"
            checked={settings.features.notifications}
            onChange={(e) =>
              void onPatchSettings({
                features: { ...settings.features, notifications: e.target.checked },
              })
            }
          />
        </label>
        <label className={styles.toggle}>
          <span>Recurring tasks</span>
          <input
            type="checkbox"
            checked={settings.features.recurring}
            onChange={(e) =>
              void onPatchSettings({
                features: { ...settings.features, recurring: e.target.checked },
              })
            }
          />
        </label>
        {settings.features.notifications && (
          <div className={styles.settingsRow}>
            <span className={styles.settingsLabel}>Notify at</span>
            <input
              className="input"
              type="time"
              value={settings.notificationTime}
              onChange={(e) =>
                void onPatchSettings({
                  notificationTime: e.target.value || '09:00',
                })
              }
              style={{ width: 120 }}
            />
          </div>
        )}
      </section>

      <section className={styles.settingsCard}>
        <h2 className={styles.settingsCardTitle}>Shortcuts</h2>
        <label className={styles.toggle}>
          <span>Global shortcut</span>
          <input
            type="checkbox"
            checked={settings.globalShortcut.enabled}
            onChange={(e) =>
              void onPatchSettings({
                globalShortcut: { ...settings.globalShortcut, enabled: e.target.checked },
              })
            }
          />
        </label>
        {settings.globalShortcut.enabled && (
          <div className={styles.settingsRow}>
            <span className={styles.settingsLabel}>Accelerator</span>
            <input
              className="input"
              type="text"
              value={settings.globalShortcut.accelerator}
              onChange={(e) =>
                void onPatchSettings({
                  globalShortcut: { ...settings.globalShortcut, accelerator: e.target.value },
                })
              }
              style={{ width: 200 }}
            />
          </div>
        )}
      </section>

      <section className={styles.settingsCard}>
        <h2 className={styles.settingsCardTitle}>Appearance</h2>
        <div className={styles.settingsRow}>
          <span className={styles.settingsLabel}>Layout</span>
          <select
            className="input"
            value={settings.layout}
            onChange={(e) => void onPatchSettings({ layout: e.target.value as 'apple' | 'standard' })}
            style={{ width: 140 }}
          >
            <option value="standard">Standard</option>
            <option value="apple">Apple</option>
          </select>
        </div>
        <div className={styles.settingsRow}>
          <span className={styles.settingsLabel}>Theme</span>
          <select
            className="input"
            value={settings.theme}
            onChange={(e) => void onPatchSettings({ theme: e.target.value as ThemeId })}
            style={{ width: 140 }}
          >
            {options.map((t) => (
              <option key={t} value={t}>
                {themeLabel[t]}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className={styles.settingsCard}>
        <h2 className={styles.settingsCardTitle}>Developer</h2>
        <label className={styles.toggle}>
          <span>Developer mode</span>
          <input
            type="checkbox"
            checked={settings.devMode}
            onChange={(e) => void onPatchSettings({ devMode: e.target.checked })}
          />
        </label>
      </section>

      <p className={styles.settingsFoot}>
        Settings stored at <code>~/.zuri/settings.json</code>
      </p>
    </div>
  );
}
