export default function sendBadjs (url, data) {
    if (navigator.sendBeacon && typeof navigator.sendBeacon === 'function') {
        try {
            navigator.sendBeacon(url, data)
        } catch (e) {
            new Image().src = url
        }
    } else {
        new Image().src = url
    }
}
