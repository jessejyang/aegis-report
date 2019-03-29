function beaconPollyfill (url, data, type) {
    if (type === 'post') {
        let iframe = document.createElement('iframe')
        iframe.name = 'badjs_offline_' + (new Date() - 0)
        iframe.frameborder = 0
        iframe.height = 0
        iframe.width = 0
        iframe.src = 'javascript:false'

        iframe.onload = function () {
            const form = document.createElement('form')
            form.style.display = 'none'
            form.target = iframe.name
            form.method = 'POST'
            form.action = url + '/offlineLog'
            const input = document.createElement('input')
            input.style.display = 'none'
            input.type = 'hidden'
            input.name = 'offline_log'
            input.value = data

            iframe.contentDocument.body.appendChild(form)
            form.appendChild(input)
            form.submit()
            console.log('report offline log success')
            setTimeout(function () {
                document.body.removeChild(iframe)
                iframe = null
            }, 5000)

            iframe.onload = null
        }
        document.body.appendChild(iframe)
    } else {
        new Image().src = url
    }
}

export default function send (url, data, type) {
    if (navigator.sendBeacon && typeof navigator.sendBeacon === 'function') {
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
