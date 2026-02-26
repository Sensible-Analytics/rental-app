const { app } = require('electron');
console.log('Electron Version:', process.versions.electron);
console.log('Node Version:', process.versions.node);
console.log('Modules Version:', process.versions.modules);
app.quit();
