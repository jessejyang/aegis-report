import { isOBJ, isEmpty, isRepeat, isOBJByType } from '../utils/index'
import getOfflineDB from '../offline/index'
import send from '../report'

let submitLogList = []
let comboTimeout = 0

const submitLog = function (config) {
    clearTimeout(comboTimeout)

    if (!submitLogList.length) {
        return
    }

    const _url = config._reportUrl + submitLogList.join('&') +
        '&count=' + submitLogList.length + '&_t=' + (+new Date())

    send(_url)

    comboTimeout = 0
    submitLogList = []
}

const reportLog2String = function (error, index, config) {
    const param = []
    const params = []
    const stringify = []
    if (isOBJ(error)) {
        error.level = error.level || config.level
        for (const key in error) {
            let value = error[key]
            if (!isEmpty(value)) {
                if (isOBJ(value)) {
                    try {
                        value = JSON.stringify(value)
                    } catch (err) {
                        value = '[BJ_REPORT detect value stringify error] ' + err.toString()
                    }
                }
                stringify.push(key + ':' + value)
                param.push(key + '=' + encodeURIComponent(value))
                params.push(key + '[' + index + ']=' + encodeURIComponent(value))
            }
        }
    }

    // msg[0]=msg&target[0]=target -- combo report
    // msg:msg,target:target -- ignore
    // msg=msg&target=target -- report with out combo
    return [params.join('&'), stringify.join(','), param.join('&')]
}

export default class Log {
    constructor (config) {
        this.config = config
    }

    // 上报日志
    processLog (logList, immediately) {
        const config = this.config
        if (!config._reportUrl) return
        const randomIgnore = Math.random() >= config.random

        while (logList.length) {
            let isIgnore = false
            const reportLog = logList.shift()

            if (config.beforeReport && config.beforeReport(reportLog) === false) {
                continue
            }

            // 有效保证字符不要过长
            reportLog.msg = (reportLog.msg + '' || '').substr(0, 500)
            // 重复上报
            if (isRepeat(reportLog, config.repeat)) continue
            const logStr = reportLog2String(reportLog, submitLogList.length, config)
            if (isOBJByType(config.ignore, 'Array')) {
                for (let i = 0, l = config.ignore.length; i < l; i++) {
                    const rule = config.ignore[i]
                    if ((isOBJByType(rule, 'RegExp') && rule.test(logStr[1])) ||
                        (isOBJByType(rule, 'Function') && rule(reportLog, logStr[1]))) {
                        isIgnore = true
                        break
                    }
                }
            }
            if (!isIgnore) {
                const offline = getOfflineDB()
                config.offlineLog && offline.save2Offline('badjs_' + config.id + config.uin, reportLog, config)
                if (!randomIgnore && reportLog.level !== 20) {
                    submitLogList.push(logStr[0])
                    config.onReport && (config.onReport(config.id, reportLog))
                }
            }
        }

        if (immediately) {
            submitLog(config) // 立即上报
        } else if (!comboTimeout) {
            comboTimeout = setTimeout(submitLog.bind(null, config), config.delay) // 延迟上报
        }
    }

    reportOffline ({ logs, startDate, endDate }) {
        let iframe = document.createElement('iframe')
        const { id, uin, url } = this.config
        const { userAgent } = navigator
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
            input.value = JSON.stringify({ logs, userAgent, startDate, endDate, id, uin })

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
    }
}
