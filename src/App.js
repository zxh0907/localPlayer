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

function checkIsValidLesson(lesson) {
  return lesson.info.name.indexOf('-题-') < 0;
}
function App() {
  // const info = `This app is using Chrome (v${version.chrome()}), Node.js (v${version.node()}), and Electron (v${version.electron()})`;
  const videoRef = useRef(null);

  const [lessons, setLessons] = useState([]);
  const [playing, setPlaying] = useState();
  const [error, setError] = useState("");
  const [showInfo, setShowInfo] = useState();
  const [progress, setProgress] = useState({
    completed: 0,
    total: 0,
  });
  console.log('>>> playing', playing?.info);
  const main = async () => {
    const response = await version.ping();
    let lessonList = getLessonList();
    let numsInList = 0;
    let numsOfLessons = lessonList.length;
    let numsOfCompleted = 0;
    let lessonSlice = [];
    for (let i = 0; i < lessonList.length; i++) {
      let lesson = lessonList[i];
      if (lesson.info.completed) {
        numsOfCompleted++;
      } else if (checkIsValidLesson(lesson)) {
        numsInList++;
      }
      lessonSlice.push(lesson);
      if (numsInList > 10) {
        break;
      }
    }
     
    setProgress({
      completed: numsOfCompleted,
      total: numsOfLessons,
    });
    setLessons(lessonSlice);
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
      let currentTimePoint = "playend" === status ? 0 : Math.round(video.currentTime);
      updateLessonStatus(playing, status, currentTimePoint);
      if ("playend" === status) {
        let playingClone = {...playing};
        playingClone.info.completed = true;
        
        setPlaying(playingClone);
        let lessonsClone = [...lessons];

      
        lessonsClone = lessonsClone.map( lesson => {
          
          if (lesson.key === playing.key) {
            lesson.info.completed = true;
          }
          return lesson;
        })
        setLessons(lessonsClone);

        setShowInfo({
          'name': '恭喜完成本课',
          'content': 'You are so great!🎉'
        });
      }
    }
    video.addEventListener("playing", () => {
      playStartTime = Date.now();
      updateStatus("playing");
    });
    video.addEventListener("pause", () => {
      uploadRecord();
      updateStatus("pause");
    });
    video.addEventListener("ended", () => {
      // console.log('>>> ended', video.currentTime)
      uploadRecord();
      updateStatus("playend");
    });
    // video.addEventListener("seeked", () => {
    //   console.log('>>> seeked', video.currentTime)
    // })
    // video.addEventListener("timeupdate", () => {
    //   console.log('>>> timeupdate', video.currentTime)
    // })
    video.addEventListener("canplay", () => {
      console.log('>>> ', video.duration, playing.info.lastTimePoint )
      if (!video.currentTime && playing.info.lastTimePoint > 0) {
        
        video.currentTime = video.duration - playing.info.lastTimePoint < 60 ? 
                video.duration - 60 : 
                playing.info.lastTimePoint;
      }
       
      video.play().catch(err => {
        console.log(err)
        if (Math.abs(video.currentTime - video.duration) <= 1) {
          uploadRecord();
          updateStatus("playend");
        }
      });
      
      
      
      
     
    });
  };
  useEffect(() => {
    main();
  }, []);
  useEffect(() => {
    playLogging();
  }, [playing]);

  const showLogs = (lessonInfo) => {
    console.log(">>>  lessonInfo", lessonInfo);
    setShowInfo(lessonInfo);
  };

  const playLesson = (lessonIndex) => {
    const lesson = lessons[lessonIndex];
    const validLessons = lessons.filter(checkIsValidLesson);
    const indexInValidLessons = validLessons.findIndex(l => l === lesson);
    console.log('>>>>', lesson, lessonIndex, indexInValidLessons,)
    if (indexInValidLessons >= 0) {
      const previousLesson = validLessons[indexInValidLessons - 1];
      console.log('>>>>', previousLesson);
      if (
        previousLesson && 
        !previousLesson.info.completed
      ) {
        setError("先完成之前的课程");
        setPlaying(null);
        return;
      }
    }
    setError("");
   
    console.log('>>>> switch lesson', lessonIndex, lesson)
    setPlaying(lesson);
  };
  function formatDuration(prefix, secs) {
    if (!secs) {
      return "";
    }
    let mins = Math.floor(secs / 60);
    secs = Math.round(secs - mins * 60);
    let str = prefix + " ";
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
          <div>{showInfo.content}</div>
          <ul>
            {showInfo.record?.map((record, i) => {
              let [time, duration, timePoint] = record;
              return (
                duration && (
                  <li key={i}>
                    {new Date(time).toLocaleString()} :{" "}
                    {formatDuration("学习了", duration)}{" "}
                    {formatDuration(",学习到", timePoint)}
                  </li>
                )
              );
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
              className={(playing.info.completed || playing.info.name.indexOf('-题-') > 0)? "completed" : "uncompleted"}
              ref={videoRef}
              controls
              controlsList="nodownload noplaybackrate"
              playbackrate="1"
              src={playing.filePath}
              type="video/mp4"
            >
               
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
