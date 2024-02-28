const { app, BrowserWindow, ipcMain, protocol, net } = require("electron");
const path = require("path");
const fs = require("fs");

const ElectronStore = require("electron-store");
ElectronStore.initRenderer();

let win;
const lessonStore = new ElectronStore();

const devUrl = "http://localhost:3000";
// 本地文件路径定位到打包的react文件
const localUrl = `file://${path.join(__dirname, "/index.html")}`;

console.log(localUrl);
function createWindow() {
  // 创建浏览器窗口。
  win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  // 然后加载应用的 index.html。
  import("electron-is-dev").then((module) => {
    const isDev = module.default;
    if (isDev) {
      win.loadURL(devUrl);
      // win.webContents.openDevTools();
    } else {
      win.loadURL(localUrl);
    }
  });

  // 当 window 被关闭，这个事件会被触发。
  win.on("closed", () => {
    win = null;
  });
}

protocol.registerSchemesAsPrivileged([
  { scheme: "atom", privileges: { bypassCSP: true, stream: true } },
]);

app.whenReady().then(() => {
  protocol.handle("atom", (request) => {
    
    let url = request.url.slice(6);
    url = decodeURIComponent(path.normalize(url));
    // url = url.replaceAll(' ', '\\\ ');
    url = path.resolve(url);
  
    const videoPath = url;
    const videoSize = fs.statSync(videoPath).size;
    
    const chunkSize = 10 ** 6; // 1 mb
    const range = request.headers.get("range");
    let start = Number(range.replace(/\D/g, ""));
 
    const end = Math.min(start + chunkSize, videoSize);
    // const contentLength = end - start + 1;
 
    console.log(`request: ${start}-${end}/${videoSize}`)
    if (start >= end) {
      start = end - 200;
    }
    // if (start >= videoSize) {
    //   return new Response('', {status: 200})
    // }
    let headers = {
      "content-type": "video/mpeg4",
      "Content-Length": videoSize,
      "Accept-Ranges": "bytes",
      "Content-Range": `bytes ${start}-${end}/*`,
    }
    if (start + chunkSize >= videoSize) {
      delete headers["Content-Range"];
    }
    return new Response(
      fs.createReadStream(videoPath, { start, end }), 
      // fs.readFileSync(videoPath), 
    {
      status: 206,
      headers
    });
 
  });

  // protocol.registerFileProtocol('atom', (request, callback) => {
  //   const url = request.url.slice(6)
  //   callback(decodeURI(path.normalize(url)))
  // })
  ipcMain.handle("ping", () => "pong");
  const lessonDataPrefix = "lessonData";
  // lessonStore.delete(lessonDataPrefix);
  ipcMain.on("readStore", (event) => {
    let lessonData = lessonStore.get(lessonDataPrefix);

    if (!lessonData) {
      lessonData = {};
      lessonStore.set(lessonDataPrefix, lessonData);
    }
    event.returnValue = lessonData;
  });
  ipcMain.on("setStoreByKey", (event, key, data) => {
    event.returnValue = lessonStore.set(`${lessonDataPrefix}.${key}`, data);
  });
  ipcMain.on("getStoreByKey", (event, key, data) => {
    event.returnValue = lessonStore.get(`${lessonDataPrefix}.${key}`);
  });
  createWindow();
});

// 当全部窗口关闭时退出。
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (win === null) {
    createWindow();
  }
});
