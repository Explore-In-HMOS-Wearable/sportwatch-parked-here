// Haversine formula for calculating distance between two GPS(Lat-Lng) coordinates
// Returns in meters
export function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371e3 //Earth's radius
    const lat1Rad = lat1 * Math.PI / 180
    const lat2Rad = lat2 * Math.PI / 180
    const deltaLat = (lat2 - lat1) * Math.PI / 180
    const deltaLng = (lng2 - lng1) * Math.PI / 180

    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
        Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    const distance = R * c
    return distance
}

export function formatDistance(meters) {
    if (meters === null || meters === undefined) {
        return '--'
    }
    if (meters < 1000) {
        return Math.round(meters) + ' m'
    } else {
        return (meters / 1000).toFixed(2) + ' km'
    }
}

export default {
    calculateDistance,
    formatDistance
}