// Fixed scenes for screenshots: ?shot=editor shows the page with sample photos
// loaded; ?shot=cover shows the cover alone. `photo` picks the sample
// (samples/<photo>.jpg), `caption` the headline, `sub` the reward line and
// `size` the export size (square, portrait or landscape). window.__shotReady
// is set once the cover has been painted.
import { exportSize } from './cover.js';

export async function runShot(shot, query, app) {
  const { canvas, state, loadImage, setCaption, redraw } = app;
  const photo = query.get('photo') ?? 'pier';
  const other = photo === 'pier' ? 'boulevard' : 'pier';
  const sizeName = query.get('size') ?? 'square';

  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    const [w, h] = exportSize(sizeName);
    canvas.width = w;
    canvas.height = h;
  }

  // Three panels, two photos: the named sample fills panels 1 and 3, the other
  // sample fills panel 2, so the cover shows several panels at once.
  const [first, second] = await Promise.all([
    loadImage(`samples/${photo}.jpg`),
    loadImage(`samples/${other}.jpg`),
  ]);
  state.panels[0].img = first;
  state.panels[1].img = second;
  state.panels[2].img = first;
  for (const panel of state.panels) {
    panel.zoom = 1.15;
    panel.ox = 0;
    panel.oy = 0;
  }
  setCaption(
    query.get('caption') ?? 'MOST WANTED',
    query.get('sub') ?? 'REWARD $50,000 — WANTED ALIVE',
  );
  redraw();
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
