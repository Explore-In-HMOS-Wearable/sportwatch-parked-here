// Calculate bearing between to points
// Returns angle in degrees (0 to 360, 0 is north)

export function calculateBearing(lat1, lng1, lat2, lng2) {
    const dLng = (lng2 - lng1) * Math.PI / 180
    const lat1Rad = lat1 * Math.PI / 180
    const lat2Rad = lat2 * Math.PI / 180

    const y = Math.sin(dLng) * Math.cos(lat2Rad)
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng)

    const bearing = Math.atan2(y, x) * 180 / Math.PI
    return (bearing + 360) % 360 // Normalize to 0-360
}

export default {
    calculateBearing
}