const { contextBridge, ipcRenderer } = require("electron");

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const WuliPath = path.resolve("/Users/ronwe/Downloads/八年级物理上/");

function MD5(str) {
  let md5 = crypto.createHash("md5");
  return md5.update(str).digest("hex");
}
window.addEventListener("DOMContentLoaded", () => {
  ipcRenderer.on("clientEvents", (...args) => {
    console.log(">>>> clientEvents", args);
  });
});
contextBridge.exposeInMainWorld("lessonList", {
  read: () => {
    const lessonData = ipcRenderer.sendSync("readStore");
    let lessons = fs
      .readdirSync(WuliPath)
      .filter((file) => file.endsWith(".mp4"))
      .map((file) => {
        const key = MD5(file.replace(/\d+\./g, "").replace(/\ +/g, ""));
        let info = lessonData?.[key];
        if (!info) {
          info = {
            name: file,
            record: [],
            completed: false,
            lastTimePoint: 0,
          };
          ipcRenderer.sendSync("setStoreByKey", key, info);
        }

        return {
          key,
          name: file,
          filePath: "atom://" + path.resolve(WuliPath, file),
          info,
        };
      });
    return lessons;
  },
  updateRecord: (lesson, playDuration, currentTime) => {
    console.log('>>> updateRecord', lesson.key, playDuration)
    let info = ipcRenderer.sendSync("getStoreByKey", lesson.key);
    let played = Math.floor(playDuration / 1000);
    info.record.push([Date.now(), played, currentTime]);
    info.record = info.record.filter( record => record[1]);
    if (!info.played) {
      info.played = 0;
    }
    info.played += played;
    ipcRenderer.sendSync("setStoreByKey", lesson.key, info);
  },
  updateStatus: (lesson, status, currentTime) => {
    let info = ipcRenderer.sendSync("getStoreByKey", lesson.key);
    console.log('>>> lesson', lesson,  status, info)
    info.lastTimePoint = currentTime;
    info.status = status;
    ipcRenderer.sendSync("setStoreByKey", lesson.key, info);
  },
});
contextBridge.exposeInMainWorld("versions", {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron,
  ping: () => ipcRenderer.invoke("ping"),
});
