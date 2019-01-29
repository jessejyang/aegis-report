import { isOBJ, isEmpty, isRepeat, isOBJByType, extend } from 'shared/util'
import BaseLog from 'core/log/index'
import Send from './report'
import getDB from './db'

let submitLogList = []
let comboTimeout = 0

const DB = getDB()

const submitLog = function (config) {
    clearTimeout(comboTimeout)

    if (!submitLogList.length) {
        return
    }

    const _url = config._reportUrl + submitLogList.join('&') +
        '&count=' + submitLogList.length + '&_t=' + (+new Date())

    Send.sendBadjs(_url)

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

export default class WxLog extends BaseLog {
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
            reportLog.msg = (reportLog.msg + '' || '').substr(0, 2000)
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
                this.save2Offline(`badjs_${config.id}_${config.uin}`, reportLog, config)
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

    save2Offline (key, msgObj, config) {
        msgObj = extend({ id: config.id, uin: config.uin, time: new Date() - 0, version: config.version }, msgObj)
        DB.addLogs(key, msgObj)
    }
}
