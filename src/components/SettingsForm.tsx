import { IconBell } from '../Icons';
import type { ThemeId, ZuriSettings } from '../preload';
import { themeLabel } from '../theme';

export type SettingsFormProps = {
  settings: ZuriSettings;
  onPickMarkdown: () => Promise<void>;
  onPatchSettings: (patch: Partial<ZuriSettings>) => Promise<void>;
};

export function SettingsForm({ settings, onPickMarkdown, onPatchSettings }: SettingsFormProps) {
  const options = Object.keys(themeLabel) as ThemeId[];

  return (
    <div className="settings">
      <section className="settings-card">
        <h2 className="settings-card-title">File</h2>
        <div className="settings-row">
          <span className="settings-label">Markdown file</span>
          <div className="settings-value">
            <span className="settings-path">
              {settings.markdownPath || <em>none</em>}
            </span>
            <button className="btn btn-small" onClick={() => void onPickMarkdown()}>
              Choose...
            </button>
          </div>
        </div>
      </section>

      <section className="settings-card">
        <h2 className="settings-card-title">Features</h2>
        <label className="toggle">
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
        <label className="toggle">
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
        <label className="toggle">
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
        <label className="toggle">
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
          <div className="settings-row">
            <span className="settings-label">Notify at</span>
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

      <section className="settings-card">
        <h2 className="settings-card-title">Shortcuts</h2>
        <label className="toggle">
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
          <div className="settings-row">
            <span className="settings-label">Accelerator</span>
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

      <section className="settings-card">
        <h2 className="settings-card-title">Appearance</h2>
        <div className="settings-row">
          <span className="settings-label">Theme</span>
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

      <section className="settings-card">
        <h2 className="settings-card-title">Developer</h2>
        <label className="toggle">
          <span>Developer mode</span>
          <input
            type="checkbox"
            checked={settings.devMode}
            onChange={(e) => void onPatchSettings({ devMode: e.target.checked })}
          />
        </label>
      </section>

      <p className="settings-foot">
        Settings stored at <code>~/.zuri/settings.json</code>
      </p>
    </div>
  );
}
