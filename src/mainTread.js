
export const version = window.versions;

export function getLessonList() {
    let lessons = window.lessonList.read();
    return lessons;
}

export function logLessonPlayTime(lesson, playTime, currentTime) {
    return window.lessonList.updateRecord(lesson, playTime, currentTime)
}

export function updateLessonStatus(lesson, status, currentTime) {
    return window.lessonList.updateStatus(lesson, status, currentTime)
}

