import { cn } from '../lib/cn';
import { IconBell } from '../Icons';
import type { ThemeId, ZuriSettings } from '../preload';
import { themeLabel } from '../lib/theme';

export type SettingsFormProps = {
  settings: ZuriSettings;
  onPickMarkdown: () => Promise<void>;
  onPatchSettings: (patch: Partial<ZuriSettings>) => Promise<void>;
};

type ToggleProps = {
  label: React.ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  first?: boolean;
};

function Toggle({ label, checked, onChange, first }: ToggleProps) {
  return (
    <label className={cn(
      'flex items-center justify-between w-full py-1.5 text-[13px] text-text cursor-pointer',
      !first && 'border-t border-edge',
    )}>
      <span>{label}</span>
      <div className="relative inline-flex items-center shrink-0">
        <input
          type="checkbox"
          className="sr-only peer"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div
          data-toggle-track
          className="w-9 h-5 bg-overlay rounded-[10px] transition-colors peer-checked:bg-success"
        />
        <div
          data-toggle-thumb
          className={cn(
            'absolute left-[2px] top-[2px] w-4 h-4 rounded-full bg-white shadow-sm transition-transform',
            checked && 'translate-x-4',
          )}
        />
      </div>
    </label>
  );
}

export function SettingsForm({ settings, onPickMarkdown, onPatchSettings }: SettingsFormProps) {
  const options = Object.keys(themeLabel) as ThemeId[];

  return (
    <div data-settings className="flex flex-col gap-2 p-3 overflow-y-auto h-full">
      <section data-settings-card className="bg-surface border border-edge rounded-[var(--radius)] px-3 py-[10px]">
        <h2 className="text-[11px] font-semibold text-subtle uppercase tracking-[0.03em] mb-2">File</h2>
        <div className="flex items-center justify-between py-1.5">
          <span className="text-[13px] text-text">Markdown file</span>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-muted max-w-[160px] overflow-hidden text-ellipsis whitespace-nowrap">
              {settings.markdownPath || <em>none</em>}
            </span>
            <button className="btn btn-small" onClick={() => void onPickMarkdown()}>
              Choose...
            </button>
          </div>
        </div>
      </section>

      <section data-settings-card className="bg-surface border border-edge rounded-[var(--radius)] px-3 py-[10px]">
        <h2 className="text-[11px] font-semibold text-subtle uppercase tracking-[0.03em] mb-2">Features</h2>
        <Toggle
          first
          label="Priority levels"
          checked={settings.features.priority}
          onChange={(v) => void onPatchSettings({ features: { ...settings.features, priority: v } })}
        />
        <Toggle
          label="Effort estimates"
          checked={settings.features.effort}
          onChange={(v) => void onPatchSettings({ features: { ...settings.features, effort: v } })}
        />
        <Toggle
          label={<><IconBell size={14} className="inline mr-1.5 align-middle" />Notifications</>}
          checked={settings.features.notifications}
          onChange={(v) => void onPatchSettings({ features: { ...settings.features, notifications: v } })}
        />
        <Toggle
          label="Recurring tasks"
          checked={settings.features.recurring}
          onChange={(v) => void onPatchSettings({ features: { ...settings.features, recurring: v } })}
        />
        {settings.features.notifications && (
          <div className="flex items-center justify-between py-1.5 border-t border-edge">
            <span className="text-[13px] text-text">Notify at</span>
            <input
              className="input"
              type="time"
              value={settings.notificationTime}
              onChange={(e) => void onPatchSettings({ notificationTime: e.target.value || '09:00' })}
              style={{ width: 120 }}
            />
          </div>
        )}
      </section>

      <section data-settings-card className="bg-surface border border-edge rounded-[var(--radius)] px-3 py-[10px]">
        <h2 className="text-[11px] font-semibold text-subtle uppercase tracking-[0.03em] mb-2">Shortcuts</h2>
        <Toggle
          first
          label="Global shortcut"
          checked={settings.globalShortcut.enabled}
          onChange={(v) => void onPatchSettings({ globalShortcut: { ...settings.globalShortcut, enabled: v } })}
        />
        {settings.globalShortcut.enabled && (
          <div className="flex items-center justify-between py-1.5 border-t border-edge">
            <span className="text-[13px] text-text">Accelerator</span>
            <input
              className="input"
              type="text"
              value={settings.globalShortcut.accelerator}
              onChange={(e) => void onPatchSettings({ globalShortcut: { ...settings.globalShortcut, accelerator: e.target.value } })}
              style={{ width: 200 }}
            />
          </div>
        )}
      </section>

      <section data-settings-card className="bg-surface border border-edge rounded-[var(--radius)] px-3 py-[10px]">
        <h2 className="text-[11px] font-semibold text-subtle uppercase tracking-[0.03em] mb-2">Appearance</h2>
        <div className="flex items-center justify-between py-1.5">
          <span className="text-[13px] text-text">Layout</span>
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
        <div className="flex items-center justify-between py-1.5 border-t border-edge">
          <span className="text-[13px] text-text">Theme</span>
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

      <section data-settings-card className="bg-surface border border-edge rounded-[var(--radius)] px-3 py-[10px]">
        <h2 className="text-[11px] font-semibold text-subtle uppercase tracking-[0.03em] mb-2">Developer</h2>
        <Toggle
          first
          label="Developer mode"
          checked={settings.devMode}
          onChange={(v) => void onPatchSettings({ devMode: v })}
        />
      </section>

      <p className="text-[11px] text-subtle py-2 text-center">
        Settings stored at <code className="font-mono bg-overlay px-[5px] py-0.5 rounded-sm">~/.zuri/settings.json</code>
      </p>
    </div>
  );
}
