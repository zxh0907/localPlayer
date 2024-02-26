import React, { useEffect, useState, useRef } from "react";
import "./App.css";
import LogIcon from "./icons/log.png";
import CompletedIcon from "./icons/completed.png";
import PlayingIcon from "./icons/playing.png";

import {
  version,
  getLessonList,
  logLessonPlayTime,
  updateLessonStatus,
} from "./mainTread";

function App() {
  // const info = `This app is using Chrome (v${version.chrome()}), Node.js (v${version.node()}), and Electron (v${version.electron()})`;
  const videoRef = useRef(null);

  const [lessons, setLessons] = useState([]);
  const [playing, setPlaying] = useState();
  const [error, setError] = useState("");
  const [showInfo, setShowInfo] = useState();
  const [progress, setProgress] = useState({
    completed: 0,
    total: 0
  });

  const main = async () => {
    const response = await version.ping();
    let lessonList = getLessonList();
    let numsInList = 0;
    let numsOfLessons = lessonList.length;
    let numsOfCompleted = 0;
    lessonList = lessonList.filter(lesson => {
        if (lesson.info.completed) {
          numsOfCompleted++;
          numsInList++;
          return true;
        }
        if (numsInList <= 10) {
          numsInList++;
          return true;
        }
    })
    setProgress({
      completed: numsOfCompleted,
      total: numsOfLessons
    });
    setLessons(lessonList);
  };
  const playLogging = async () => {
    const video = videoRef.current;
    if (!video) return;

    let playStartTime;
    function uploadRecord() {
      let playDuration = Date.now() - playStartTime;
      if (playDuration) {
        playStartTime = Date.now();
        logLessonPlayTime(playing, playDuration, video.currentTime);
      }
    }
    function updateStatus(status) {
      let currentTimePoint = "playend" === status ? 0 : video.currentTime;
      updateLessonStatus(playing, status, currentTimePoint);
    }
    video.addEventListener("playing", () => {
      playStartTime = Date.now();
      console.log(">>>> playing");
      // updateStatus("playing");
    });
    video.addEventListener("pause", () => {
      uploadRecord();
      updateStatus("pause");
    });
    video.addEventListener("ended", () => {
      uploadRecord();
      updateStatus("playend");
    });
    video.addEventListener("canplay", () => {
      // video.currentTime = 120;
      video.play();

      // not working under file:// protocol
      // if (playing.info.lastTimePoint > 0) {
      //   video.currentTime = playing.info.lastTimePoint;
      // }
    });
  };
  useEffect(() => {
    main();
  }, []);
  useEffect(() => {
    playLogging();
  }, [playing]);

  const showLogs = (lessonInfo) => {
    console.log('>>>  lessonInfo', lessonInfo)
    setShowInfo(lessonInfo);
  };

  const playLesson = (lessonIndex) => {
    const previousLesson = lessons[lessonIndex - 1];
    if (previousLesson && !previousLesson.info.completed) {
      setError("先完成之前的课程");
      return;
    }
    setError("");
    const lesson = lessons[lessonIndex];
    setPlaying(lesson);
  };
  function formatDuration(prefix, secs) {
    if (!secs) {
      return '';
    }
    let mins = Math.floor(secs/60);
    secs = Math.round(secs - mins * 60);
    let str = prefix + ' ';
    if (mins) {
      str += `${mins} 分 `;
    }
    if (secs) {
      str += `${secs} 秒 `;
    }
    return str;
  }
  return (
    <div className="App">
      {showInfo && (
        <dialog open>
          <p>{showInfo.name}</p>
          <ul>
            {showInfo.record.map(record => {
                let [time, duration, timePoint] = record;
                return duration && <li>{(new Date(time)).toLocaleString()} : {formatDuration('学习了', duration)}  {formatDuration(',学习到', timePoint)}</li>;
            })}
          </ul>
          <form method="dialog">
            <button onClick={() => setShowInfo(null)}>OK</button>
          </form>
        </dialog>
      )}
      <div className="App-body">
        {error && <div className="error">{error}</div>}
        {playing && (
          <div className="video-player">
            <video
              className={playing.info.completed ? "completed" : "uncompleted"}
              ref={videoRef}
              controls
              controlsList="nodownload noplaybackrate"
              playbackrate="1"
            >
              <source src={playing.filePath} type="video/mp4" />
            </video>
          </div>
        )}

        <div className="lesson-list">
          {lessons.map((lesson, i) => {
            return (
              <div
                className={
                  "lesson-item " + (lesson === playing ? "current-play" : "")
                }
                key={lesson.key}
              >
                <div className="lesson-item-name" onClick={() => playLesson(i)}>
                  {lesson.name}
                </div>
                <div className="lesson-item-status">
                  {lesson === playing ? (
                    <img src={PlayingIcon}></img>
                  ) : lesson.info.completed ? (
                    <img src={CompletedIcon}></img>
                  ) : (
                    ""
                  )}
                </div>
                <div
                  className="lesson-item-log"
                  onClick={() => showLogs(lesson.info)}
                >
                  <img src={LogIcon}></img>
                </div>
              </div>
            );
          })}
        </div>
        <div className="lesson-progress">
            {progress.completed} / {progress.total}
        </div>
      </div>
    </div>
  );
}

export default App;
