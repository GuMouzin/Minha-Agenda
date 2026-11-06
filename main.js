const { app, BrowserWindow, ipcMain, Tray, Menu } = require('electron');
const path = require('path');

let mainWindow = null;
let reminderWindow = null;
let tray = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 420,
    height: 650,
    frame: false,
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile('index.html');

  ipcMain.on('hide-window', () => {
    if (mainWindow) {
      mainWindow.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Cria a janela flutuante de lembrete (pop-up)
function openReminderWindow(taskText, taskId) {
  if (reminderWindow) {
    reminderWindow.close();
  }

  reminderWindow = new BrowserWindow({
    width: 340,
    height: 220,
    frame: false,
    resizable: false,
    alwaysOnTop: true,
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  reminderWindow.loadFile('reminder.html');

  reminderWindow.webContents.once('did-finish-load', () => {
    reminderWindow.webContents.send('set-reminder-data', { taskText, taskId });
  });

  reminderWindow.on('closed', () => {
    reminderWindow = null;
  });
}

// Fecha o pop-up se o usuário responder
ipcMain.on('close-reminder', () => {
  if (reminderWindow) {
    reminderWindow.close();
  }
});

// Comunica com o script principal para concluir a tarefa se clicar em "Sim"
ipcMain.on('task-completed-from-reminder', (event, taskId) => {
  if (mainWindow) {
    mainWindow.webContents.send('complete-task-action', taskId);
  }
});

app.whenReady().then(() => {
  createWindow();

  const iconPath = path.join(__dirname, 'assets', 'icon.png');
  tray = new Tray(iconPath);
  
  const contextMenu = Menu.buildFromTemplate([
    { 
      label: 'Abrir Agenda', 
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      } 
    },
    { type: 'separator' },
    { 
      label: 'Sair', 
      click: () => {
        app.isQuitting = true;
        app.quit();
      } 
    }
  ]);

  tray.setToolTip('Minha Agenda');
  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Recebe o comando do renderer para abrir o pop-up
ipcMain.on('trigger-reminder', (event, { text, id }) => {
  openReminderWindow(text, id);
});