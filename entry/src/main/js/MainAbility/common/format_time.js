// Format time in seconds to HH:MM:SS format

export function formatTime(seconds) {
    if(seconds === null || seconds === undefined || seconds < 0) {
        return '00:00:00'
    }

    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    // Pad with zeros
    const hh = hours < 10 ? '0' + hours : '' + hours
    const mm = minutes < 10 ? '0' + minutes : '' + minutes
    const ss = secs < 10 ? '0' + secs : '' + secs

    return hh + ':' + mm + ':' + ss
}

export default {
    formatTime
}