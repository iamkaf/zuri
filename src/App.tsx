import { useEffect, useRef } from 'react';
import { useAppState } from './hooks/useAppState';
import { useKeyboard } from './hooks/useKeyboard';
import { ensureSection } from './lib/tasks';
import { AppleLayout } from './components/AppleLayout';
import { StandardLayout } from './components/StandardLayout';

function App() {
  const {
    app,
    setApp,
    settingsRef,
    refreshAll,
    onSetPage,
    onPickMarkdown,
    onToggleTask,
    onEditTask,
    onAddSection,
    onAddTask,
    onPatchSettings,
    onSaveTask,
    onReorderTask,
    onSetThemeFamily,
  } = useAppState();

  const appRef = useRef(app);
  appRef.current = app;

  useKeyboard(appRef, setApp);

  useEffect(() => {
    void refreshAll();
  }, [refreshAll]);

  useEffect(() => {
    const unsubscribe = window.zuri.doc.onChanged(async () => {
      if (!settingsRef.current?.markdownPath) return;
      const model = await window.zuri.doc.get();
      setApp((prev) => ({
        ...prev,
        model,
        section: ensureSection(model, prev.section),
      }));
    });
    return unsubscribe;
  }, [settingsRef, setApp]);

  const currentSection =
    app.section == null
      ? null
      : app.model.sections.find((s) => s.name === app.section) ?? null;

  const theme = app.settings?.theme ?? 'open-dark';
  const layout = app.settings?.layout ?? 'standard';

  const layoutProps = {
    app,
    setApp,
    theme,
    currentSection,
    onSetPage,
    onSetThemeFamily,
    onPickMarkdown,
    onPatchSettings,
    onToggleTask,
    onEditTask,
    onAddTask,
    onAddSection,
    onReorderTask,
    onSaveTask,
  };

  if (layout === 'apple') {
    return <AppleLayout {...layoutProps} />;
  }

  return <StandardLayout {...layoutProps} />;
}

export default App;
