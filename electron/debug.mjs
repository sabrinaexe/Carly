import { app } from 'electron';
console.log('App type:', typeof app);
console.log('App is packaged:', app && app.isPackaged);
