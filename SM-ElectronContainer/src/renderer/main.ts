import { PixiRenderer } from './renderer';

const renderer = new PixiRenderer();

async function main() {
  await renderer.initialize();
  window.electronAPI.runScenario();
}

document.addEventListener('DOMContentLoaded', main);
