const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('publishFlowDesktop', {
  isDesktop: true,
  platform: process.platform,
  version: '1.0.0'
});

window.addEventListener('DOMContentLoaded', () => {
  document.documentElement.classList.add('electron-app');
  document.documentElement.dataset.platform = process.platform;
});
