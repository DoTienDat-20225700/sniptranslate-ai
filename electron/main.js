import { app, BrowserWindow, ipcMain, desktopCapturer } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,   // Restored: Better security
      nodeIntegration: false,    // Restored: OCR now in main process
    },
  });

  // Trong lúc dev thì load url localhost, khi build xong thì load file index.html
  const isDev = !app.isPackaged;
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    // Mở DevTools để debug
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  // Import OCR service dynamically
  import('./paddleOCRService.js').then(({ performOCR }) => {
    // Handle OCR requests from renderer
    ipcMain.handle('PERFORM_OCR', async (event, imageBase64) => {
      console.log('[Main Process] Received OCR request');
      try {
        const text = await performOCR(imageBase64);
        console.log('[Main Process] OCR completed, text length:', text.length);
        return text;
      } catch (error) {
        console.error('[Main Process] OCR failed:', error);
        return '';
      }
    });
  }).catch(err => {
    console.error('[Main Process] Failed to load OCR service:', err);
  });

  // Xử lý yêu cầu lấy nguồn màn hình từ React gửi lên
  ipcMain.handle('GET_SCREEN_SOURCES', async () => {
    // 1. Thêm 'window' vào types để lấy cả cửa sổ ứng dụng
    const sources = await desktopCapturer.getSources({
      types: ['window', 'screen'],
      thumbnailSize: { width: 300, height: 300 } // Lấy ảnh thumbnail chất lượng hơn chút
    });

    // 2. Chuyển đổi dữ liệu để React có thể dùng được (đặc biệt là ảnh thumbnail)
    return sources.map(source => ({
      id: source.id,
      name: source.name,
      thumbnail: source.thumbnail.toDataURL() // Chuyển ảnh sang dạng base64
    }));
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});