import './index.css';

const el = document.querySelector<HTMLDivElement>('#app');
if (el) {
  el.innerHTML = `
    <div class="wrap">
      <h1>Hello Zuri</h1>
      <p class="sub">Settings live at <code>~/.zuri/settings.json</code></p>
      <button id="pick">Pick markdown file</button>
      <pre id="out"></pre>
    </div>
  `;
}

const out = document.querySelector<HTMLPreElement>('#out');
const render = (obj: unknown) => {
  if (out) out.textContent = JSON.stringify(obj, null, 2);
};

const refresh = async () => {
  const settings = await window.zuri.settings.get();
  render(settings);
};

document.querySelector<HTMLButtonElement>('#pick')?.addEventListener('click', async () => {
  await window.zuri.settings.pickMarkdownFile();
  await refresh();
});

void refresh();
