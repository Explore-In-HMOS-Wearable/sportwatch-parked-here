import Storage from '@system.storage';
import Geolocation from '@system.geolocation';
import Vibrator from '@system.vibrator';
import { formatTime } from '../../common/format_time';
import { calculateDistance, formatDistance } from '../../common/calculate_distance';
import { calculateBearing } from '../../common/calculate_bearing';

export default {
    data: {
        appTitle: 'ParkedHereLite',

        //Session State
        hasSession: false,

        // Park and current location
        parkLatitude: null,
        parkLongitude: null,
        parkStartTime: null,
        currentLatitude: null,
        currentLongitude: null,

        // Display values
        elapsedTime: '00:00:00',
        distanceText: '--',
        distance: null,
        lastDistance: null,
        bearing: 0,
        lastBearing: null,
        statusMessage: 'You haven\'t parked yet.',

        // Intervals
        timerInterval: null,
        locationInterval: null,

        // Canvas context
        canvasCtx: null,
    },

    onInit() {
        this.loadSession()
    },

    onDestroy() {
        this.clearIntervals()
    },

    loadSession() {
        var that = this

        // Get park location if it exists
        Storage.get({
            key: 'loc_park',
            success: function (data) {
                if (data && data !== '') {
                    // Parse as 'Park|lat|lng'
                    var parts = data.split('|')
                    that.parkLatitude = parts[1] - 0
                    that.parkLongitude = parts[2] - 0

                    // Load start time
                    Storage.get({
                        key: 'park_start',
                        success: function (timeData) {
                            if (timeData && timeData !== '') {
                                that.parkStartTime = timeData - 0
                                that.hasSession = true
                                that.statusMessage = 'Session active'
                                that.startTracking()

                                // Draw canvas after session loads successfully
                                setTimeout(function () {
                                    var canvas = that.$refs.navigationCanvas
                                    if (canvas) {
                                        that.canvasCtx = canvas.getContext('2d')
                                        if (that.canvasCtx) {
                                            that.drawNavigationArrow(that.canvasCtx, that.bearing)
                                        }
                                    } else {
                                        console.error('Canvas element not found')
                                    }
                                }, 200)
                            }
                        },
                        fail: function () {
                            console.error('Failed to load park_start')
                        }
                    })
                }
            },
            fail: function () {
                console.info('No existing session')
            }
        })
    },

    drawNavigationArrow(ctx, bearing) {
        // Canvas fullscreen in the background (454x454px)
        var centerX = 227
        var centerY = 195

        // Black background
        ctx.fillStyle = '#000000'
        ctx.fillRect(0, 0, 454, 454)

        // Circle border for the compass
        ctx.beginPath()
        ctx.arc(centerX, centerY, 90, 0, 6.28)
        ctx.lineWidth = 2
        ctx.strokeStyle = '#444444' // darkgray in css
        ctx.stroke()

        // Arrow coordinates calculation based on bearing
        var bearingRad = bearing * Math.PI / 180
        var cosB = Math.cos(bearingRad)
        var sinB = Math.sin(bearingRad)

        // Arrow shaft
        // Start point
        var shaftStartX = centerX + (0 * cosB - (-20) * sinB)
        var shaftStartY = centerY + (0 * sinB + (-20) * cosB)
        // End point
        var shaftEndX = centerX + (0 * cosB - (-50) * sinB)
        var shaftEndY = centerY + (0 * sinB + (-50) * cosB)

        // Arrowhead
        var tipX = shaftEndX
        var tipY = shaftEndY

        // Left wing, included rotation
        var leftWingX = centerX + ((-8) * cosB - (-40) * sinB)
        var leftWingY = centerY + ((-8) * sinB + (-40) * cosB)

        // Right wing, included rotation
        var rightWingX = centerX + (8 * cosB - (-40) * sinB)
        var rightWingY = centerY + (8 * sinB + (-40) * cosB)

        // Draw arrow shaft
        ctx.beginPath()
        ctx.moveTo(shaftStartX, shaftStartY)
        ctx.lineTo(shaftEndX, shaftEndY)
        ctx.lineWidth = 3
        ctx.strokeStyle = '#00bfff' // deepskyblue in css
        ctx.stroke()

        // Draw left wing
        ctx.beginPath()
        ctx.moveTo(tipX, tipY)
        ctx.lineTo(leftWingX, leftWingY)
        ctx.lineWidth = 3
        ctx.strokeStyle = '#00bfff' // deepskyblue in css
        ctx.stroke()

        // Draw right wing
        ctx.beginPath()
        ctx.moveTo(tipX, tipY)
        ctx.lineTo(rightWingX, rightWingY)
        ctx.lineWidth = 3
        ctx.strokeStyle = '#00bfff' // deepskyblue in css
        ctx.stroke()

        // Draw center dot
        ctx.beginPath()
        ctx.arc(centerX, centerY, 2, 0, 6.28)
        ctx.lineWidth = 10
        ctx.strokeStyle = '#cd5c5c' // indianred in css
        ctx.stroke()
    },

    parkHere() {
        var that = this
        that.statusMessage = 'Getting Location...'

        Geolocation.getLocation({
            success: function (data) {
                that.parkLatitude = data.latitude
                that.parkLongitude = data.longitude
                that.parkStartTime = Math.floor(Date.now() / 1000)

                // Save to storage
                var locationData = 'Park|' + that.parkLatitude + '|' + that.parkLongitude

                Storage.set({
                    key: 'loc_park',
                    value: locationData,
                    success: function () {
                        console.info('Location saved')

                        // Save start time
                        Storage.set({
                            key: 'park_start',
                            value: '' + that.parkStartTime,
                            success: function () {
                                that.hasSession = true
                                that.statusMessage = 'Location saved'

                                Vibrator.vibrate({
                                    mode: 'short'
                                })

                                that.startTracking()

                                // Draw canvas after session start
                                setTimeout(function () {
                                    var canvas = that.$refs.navigationCanvas
                                    if (canvas) {
                                        that.canvasCtx = canvas.getContext('2d')
                                        if (that.canvasCtx) {
                                            that.drawNavigationArrow(that.canvasCtx, that.bearing)
                                        }
                                    } else {
                                        console.error('Canvas not found')
                                    }
                                }, 200)
                            },
                            fail: function () {
                                console.error('Failed to save start time')
                                that.statusMessage = 'Save failed'
                            }
                        })
                    },
                    fail: function () {
                        console.error('Failed to save location')
                        that.statusMessage = 'Save failed'
                    }
                })
            },
            fail: function () {
                console.error('Geolocation failed')
                that.statusMessage = 'GPS failed'
            }
        })
    },

    startTracking() {
        var that = this

        // Start timer, updating every 250ms
        that.timerInterval = setInterval(function () {
            that.updateTimer()
        }, 250)

        // Location update chain with added delay
        that.updateLocation()
    },

    updateTimer() {
        if (!this.hasSession || !this.parkStartTime) {
            return
        }

        var now = Math.floor(Date.now() / 1000)
        var elapsed = now - this.parkStartTime
        this.elapsedTime = formatTime(elapsed)
    },

    updateLocation() {
        var that = this

        Geolocation.getLocation({
            success: function (data) {
                that.currentLatitude = data.latitude
                that.currentLongitude = data.longitude

                if (that.parkLatitude && that.parkLongitude) {
                    // Calculate distance
                    that.distance = calculateDistance(
                        that.currentLatitude,
                        that.currentLongitude,
                        that.parkLatitude,
                        that.parkLongitude
                    )
                    that.distanceText = formatDistance(that.distance)

                    // Calculate bearing
                    that.bearing = calculateBearing(
                        that.currentLatitude,
                        that.currentLongitude,
                        that.parkLatitude,
                        that.parkLongitude
                    )
                    // Update arrow if bearing changed more than 5 degrees
                    if (that.canvasCtx) {
                        if (that.lastBearing === null || Math.abs(that.bearing - that.lastBearing) > 5) {
                            that.drawNavigationArrow(that.canvasCtx, that.bearing)
                            that.lastBearing = that.bearing
                        }
                    }

                    // Proximity haptic feedback
                    that.checkProximity()
                }

                // Schedule next update
                that.scheduleNextUpdate()
            },
            fail: function () {
                console.error('Location update failed')
                // Schedule next update even on error
                that.scheduleNextUpdate()
            }
        })
    },

    scheduleNextUpdate() {
        var that = this

        // Clear any timeout if exists
        if (that.locationInterval) {
            clearTimeout(that.locationInterval)
        }

        // Schedule next location update after 800ms
        that.locationInterval = setInterval(function () {
            if (that.hasSession) {
                that.updateLocation()
            }
        }, 800)
    },

    checkProximity() {
        if (!this.distance || !this.lastDistance) {
            this.lastDistance = this.distance
            return
        }

        // Vibrate when close (<10 meters)
        if (this.distance < 10 && this.lastDistance >= 10) {
            Vibrator.vibrate({
                mode: 'short'
            })
        }

        this.lastDistance = this.distance
    },

    clearSession() {
        var that = this

        // Clear storage
        Storage.delete({
            key: 'loc_park',
            success: function () {
                console.info('Cleared loc_park')
            }
        })

        Storage.delete({
            key: 'park_start',
            success: function () {
                console.info('Cleared park_start')
            }
        })

        // Clear intervals
        that.clearIntervals()

        // Reset state
        that.hasSession = false
        that.parkLatitude = null
        that.parkLongitude = null
        that.parkStartTime = null
        that.currentLatitude = null
        that.currentLongitude = null
        that.elapsedTime = '00:00:00'
        that.distanceText = '--'
        that.distance = null
        that.bearing = 0
        that.lastBearing = null
        that.statusMessage = 'Session cleared'
        that.lastDistance = null
        that.canvasCtx = null

        // Confirmation vibrate
        Vibrator.vibrate({
            mode: 'short'
        })
    },

    clearIntervals(){
        if(this.timerInterval) {
            clearInterval(this.timerInterval)
            this.timerInterval = null
        }
        if(this.locationInterval) {
            clearInterval(this.locationInterval)
            this.locationInterval = null
        }
    }
}
