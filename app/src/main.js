// Wires the Most Wanted editor: photo upload (file input + drag-drop), per-panel
// crop (drag to pan, zoom slider), caption editing, and PNG export in 3 sizes.
// A `?shot=` query sets up a fixed scene for a screenshot instead (./shots.js).
import { drawWantedCover, exportSize } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const captionInput = document.getElementById('caption');
const subInput = document.getElementById('subcaption');
const status = document.getElementById('status');
const zoomInput = document.getElementById('zoom');
const dropzone = document.getElementById('dropzone');

const state = {
  caption: 'MOST WANTED',
  subcaption: 'REWARD $50,000 — WANTED ALIVE',
  captionSize: 1,
  captionColor: '#8f0f1e',
  outline: true,
  shadow: true,
  stamp: true,
  selected: 0,
  panels: [
    { img: null, zoom: 1.15, ox: 0, oy: 0 },
    { img: null, zoom: 1.15, ox: 0, oy: 0 },
    { img: null, zoom: 1.15, ox: 0, oy: 0 },
  ],
};

let exportName = 'square';

function redraw() {
  drawWantedCover(canvas, state);
}

/** Loads an image from a URL, resolving to the image once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function loadImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => loadImage(reader.result).then(resolve, reject);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function setPanelPhoto(index, img) {
  const panel = state.panels[index];
  panel.img = img;
  panel.zoom = 1.15;
  panel.ox = 0;
  panel.oy = 0;
  zoomInput.value = '1.15';
}

async function addPhotoFile(file) {
  if (!file || !file.type.startsWith('image/')) {
    status.textContent = 'That file is not an image.';
    return;
  }
  try {
    const img = await loadImageFile(file);
    setPanelPhoto(state.selected, img);
    status.textContent = `Photo loaded into panel ${state.selected + 1}.`;
    redraw();
  } catch {
    status.textContent = 'Could not read that photo.';
  }
}

function selectPanel(index) {
  state.selected = index;
  document.querySelectorAll('.panel-tab').forEach((tab) => {
    tab.classList.toggle('active', Number(tab.dataset.panel) === index);
  });
  zoomInput.value = String(state.panels[index].zoom || 1.15);
}

// Photo input + drag-drop onto the dropzone.
document.getElementById('photo').addEventListener('change', (e) => {
  addPhotoFile(e.target.files[0]);
});
['dragenter', 'dragover'].forEach((name) => dropzone.addEventListener(name, (e) => {
  e.preventDefault();
  dropzone.classList.add('dragging');
}));
['dragleave', 'drop'].forEach((name) => dropzone.addEventListener(name, (e) => {
  e.preventDefault();
  dropzone.classList.remove('dragging');
}));
dropzone.addEventListener('drop', (e) => addPhotoFile(e.dataTransfer.files[0]));
// Dropping a photo straight onto the preview loads it into the panel under it.
canvas.addEventListener('dragover', (e) => e.preventDefault());
canvas.addEventListener('drop', (e) => {
  e.preventDefault();
  const panel = panelAtPoint(e);
  if (panel !== null) selectPanel(panel);
  addPhotoFile(e.dataTransfer.files[0]);
});

// Panel tabs, zoom, crop reset / clear, fill-all, sample photo.
document.querySelectorAll('.panel-tab').forEach((tab) => {
  tab.addEventListener('click', () => selectPanel(Number(tab.dataset.panel)));
});
zoomInput.addEventListener('input', () => {
  state.panels[state.selected].zoom = Number(zoomInput.value);
  redraw();
});
document.getElementById('resetCrop').addEventListener('click', () => {
  const panel = state.panels[state.selected];
  panel.zoom = 1.15;
  panel.ox = 0;
  panel.oy = 0;
  zoomInput.value = '1.15';
  redraw();
});
document.getElementById('clearPanel').addEventListener('click', () => {
  state.panels[state.selected].img = null;
  redraw();
});
document.getElementById('fillAll').addEventListener('click', () => {
  const source = state.panels[state.selected].img;
  if (!source) {
    status.textContent = 'Load a photo into the selected panel first.';
    return;
  }
  state.panels.forEach((panel) => {
    panel.img = source;
    panel.zoom = state.panels[state.selected].zoom;
    panel.ox = 0;
    panel.oy = 0;
  });
  status.textContent = 'One photo now fills all three panels.';
  redraw();
});
document.getElementById('useSample').addEventListener('click', async () => {
  const img = await loadImage('samples/boulevard.jpg');
  setPanelPhoto(state.selected, img);
  status.textContent = `Sample photo loaded into panel ${state.selected + 1}.`;
  redraw();
});

// Caption controls.
captionInput.addEventListener('input', () => { state.caption = captionInput.value; redraw(); });
subInput.addEventListener('input', () => { state.subcaption = subInput.value; redraw(); });
document.getElementById('captionSize').addEventListener('input', (e) => {
  state.captionSize = Number(e.target.value);
  redraw();
});
document.getElementById('captionColor').addEventListener('input', (e) => {
  state.captionColor = e.target.value;
  redraw();
});
document.getElementById('outline').addEventListener('change', (e) => { state.outline = e.target.checked; redraw(); });
document.getElementById('shadow').addEventListener('change', (e) => { state.shadow = e.target.checked; redraw(); });
document.getElementById('stamp').addEventListener('change', (e) => { state.stamp = e.target.checked; redraw(); });

// Export size + PNG export.
document.querySelectorAll('.size-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    exportName = btn.dataset.size;
    document.querySelectorAll('.size-btn').forEach((b) => b.classList.toggle('active', b === btn));
    status.textContent = `Export size: ${btn.textContent.trim()}.`;
  });
});
document.getElementById('export').addEventListener('click', () => {
  const [w, h] = exportSize(exportName);
  const off = document.createElement('canvas');
  off.width = w;
  off.height = h;
  drawWantedCover(off, state);
  off.toBlob((blob) => {
    if (!blob) {
      status.textContent = 'Export failed — try again.';
      return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `most-wanted-${w}x${h}.png`;
    a.click();
    URL.revokeObjectURL(a.href);
    status.textContent = `Saved most-wanted-${w}x${h}.png`;
  }, 'image/png');
});

// Drag on the preview pans the panel under the pointer.
function panelAtPoint(e) {
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) / rect.width;
  const margin = 0.045;
  const gap = 0.018;
  const panelW = (1 - margin * 2 - gap * 2) / 3;
  const y = (e.clientY - rect.top) / rect.height;
  if (y < 0.20 || y > 0.785) return null;
  for (let i = 0; i < 3; i++) {
    const left = margin + i * (panelW + gap);
    if (x >= left && x <= left + panelW) return i;
  }
  return null;
}

let dragging = null;
canvas.addEventListener('pointerdown', (e) => {
  const panel = panelAtPoint(e);
  if (panel === null) return;
  selectPanel(panel);
  canvas.setPointerCapture(e.pointerId);
  dragging = { panel, x: e.clientX, y: e.clientY };
});
canvas.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  const rect = canvas.getBoundingClientRect();
  const scale = canvas.width / rect.width;
  const panel = state.panels[dragging.panel];
  panel.ox += (e.clientX - dragging.x) * scale;
  panel.oy += (e.clientY - dragging.y) * scale;
  dragging.x = e.clientX;
  dragging.y = e.clientY;
  redraw();
});
canvas.addEventListener('pointerup', () => { dragging = null; });
canvas.addEventListener('pointercancel', () => { dragging = null; });

// Screenshot scenes (?shot=cover / ?shot=editor) or the plain editor.
const query = new URLSearchParams(location.search);
const shot = query.get('shot');
if (shot) {
  runShot(shot, query, {
    canvas,
    state,
    loadImage,
    setCaption: (text, sub) => {
      state.caption = text;
      captionInput.value = text;
      if (sub !== undefined) {
        state.subcaption = sub;
        subInput.value = sub;
      }
    },
    redraw,
  });
} else {
  redraw();
}
