
function beaconPollyfill (url, data, type) {
    if (url.indexOf('http://') !== 0 || url.indexOf('https://') !== 0) {
        url = location.protocol + url
    }
    if (type === 'post') {
        fetch(url, {
            method: 'POST',
            body: data,
            headers: {
                'Content-Type': 'application/json',
                Referer: `https://now.qq.com/`
            }
        }).catch((err) => {
            console.error(err)
        })
    } else {
        fetch(url, {
            headers: {
                Referer: `https://now.qq.com/`
            }
        }).catch((err) => {
            console.error(err)
        })
    }
}

export default function send (url, data, type) {
    if (navigator && navigator.sendBeacon && typeof navigator.sendBeacon === 'function') {
        try {
            if (type === 'post') {
                const fd = new FormData()
                fd.append('offline_log', data)
                navigator.sendBeacon(url, fd)
            } else {
                navigator.sendBeacon(url, data)
            }
        } catch (e) {
            beaconPollyfill(url, data, type)
        }
    } else {
        beaconPollyfill(url, data, type)
    }
}
