import getOfflineDB from './offline/index'
import { isOBJ, isOBJByType, processStackMsg, processError, extend } from './utils/index'
import Log from './log/index'
import sendBadjs from './report'

let logList = []

const _config = {
    id: 0, // 上报 id
    uin: 0, // user id
    url: '//now.qq.com/badjs', // 上报接口
    version: 0,
    ext: null, // 扩展参数 用于自定义上报
    level: 4, // 错误级别 1-debug 2-info 4-error
    ignore: [], // 忽略某个错误, 支持 Regexp 和 Function
    random: 1, // 抽样 (0-1] 1-全量
    delay: 1000, // 延迟上报
    submit: null, // 自定义上报方式
    repeat: 5, // 重复上报次数(对于同一个错误超过多少次不上报),
    offlineLog: false,
    offlineLogExp: 5, // 离线日志过期时间，默认5天
    offlineLogAuto: false, // 是否自动询问服务器需要自动上报
    onReport: () => {
    }, // 与上报同时触发，用于统计相关内容
    beforeReport: () => {
        return true
    } // aop：上报前执行，如果返回 false 则不上报
}

export default class WardjsReport {
    constructor (props) {
        this._initConfig(props)
        this.log = new Log(_config)
        if (this.offlineLog) {
            this._initOffline()
        }
        this._initError()
    }

    // 初始化参数
    _initConfig (props) {
        for (const key in _config) {
            if (key in props) {
                _config[key] = props[key]
            }
        }
        const id = parseInt(_config.id, 10)
        if (id) {
            if (/qq\.com$/gi.test(location.hostname)) {
                if (!_config.url) {
                    _config.url = '//now.qq.com/badjs'
                }

                if (!_config.uin) {
                    _config.uin = parseInt((document.cookie.match(/\buin=\D+(\d+)/) || [])[1], 10)
                }
            }

            _config._reportUrl = (_config.url || '//now.qq.com/badjs') +
                '?id=' + id +
                '&uin=' + _config.uin +
                '&version=' + _config.version +
                // '&from=' + encodeURIComponent(location.href) +
                '&'
            // pv
            sendBadjs(`${_config.url}/${id}`)
        }
        for (const key in _config) {
            this[key] = _config[key]
        }
    }

    // 初始化离线数据库
    _initOffline () {
        const _this = this
        this.offlineDB = getOfflineDB()

        this.offlineDB.ready(function (err, DB) {
            if (!err && DB) {
                setTimeout(function () {
                    DB.clearDB(_this.offlineLogExp)
                    setTimeout(function () {
                        _this.offlineLogAuto && _this._autoReportOffline()
                    }, 5000)
                }, 1000)
            }
        })
        return this
    }

    // 初始化错误
    _initError () {
        const orgError = window.onerror
        const _this = this
        // rewrite window.oerror
        window.onerror = function (msg, url, line, col, error) {
            let newMsg = msg

            if (error && error.stack) {
                newMsg = processStackMsg(error)
            }

            if (isOBJByType(newMsg, 'Event')) {
                newMsg += newMsg.type
                    ? ('--' + newMsg.type + '--' + (newMsg.target
                        ? (newMsg.target.tagName + '::' + newMsg.target.src) : '')) : ''
            }

            _this._push({
                msg: newMsg,
                target: url,
                rowNum: line,
                colNum: col,
                _orgMsg: msg
            })

            orgError && orgError.apply(window, arguments)
        }

        // badjs 系统查看错误使用
        typeof console !== 'undefined' && console.error && setTimeout(function () {
            const err = ((location.hash || '').match(/([#&])BJ_ERROR=([^&$]+)/) || [])[2]
            err && console.error('BJ_ERROR', decodeURIComponent(err).replace(/(:\d+:\d+)\s*/g, '$1\n'))
        }, 0)
    }

    // 处理log
    _processLog (immediately = false) {
        if (logList.length) {
            this.log.processLog(logList, immediately)
            logList = []
        }
    }

    // 将错误推到缓存池
    _push (msg, immediately) {
        const data = isOBJ(msg) ? processError(msg) : {
            msg: msg
        }

        // ext 有默认值, 且上报不包含 ext, 使用默认 ext
        if (this.ext && !data.ext) {
            data.ext = this.ext
        }
        // 在错误发生时获取页面链接
        // https://github.com/BetterJS/badjs-report/issues/19
        if (!data.from) {
            data.from = location.href
        }

        if (data._orgMsg) {
            delete data._orgMsg
            data.level = 2
            const newData = extend({}, data)
            newData.level = 4
            newData.msg = data.msg
            logList.push(data)
            logList.push(newData)
        } else {
            logList.push(data)
        }

        this._processLog(immediately)
        return this
    }

    // 上报错误事件
    report (msg, isReportNow) {
        msg && this._push(msg, isReportNow)
        return this
    }

    // 上报 info 事件
    info (msg) {
        if (!msg) {
            return this
        }
        if (isOBJ(msg)) {
            msg.level = 2
        } else {
            msg = {
                msg: msg,
                level: 2
            }
        }
        this._push(msg)
        return this
    }

    // 上报 debug 事件
    debug (msg) {
        if (!msg) {
            return this
        }
        if (isOBJ(msg)) {
            msg.level = 1
        } else {
            msg = {
                msg: msg,
                level: 1
            }
        }
        this._push(msg)
        return this
    }

    // 增加离线日志
    addOfflineLog (msg) {
        if (!msg) {
            return this
        }
        if (isOBJ(msg)) {
            msg.level = 20
        } else {
            msg = {
                msg: msg,
                level: 20
            }
        }
        this._push(msg)
        return this
    }

    // 上报离线日志
    reportOfflineLog () {
        if (!window.indexedDB) {
            this.info('unsupport offlineLog')
            return
        }
        const _this = this
        this.offlineDB.ready(function (err, DB) {
            if (err || !DB) {
                return
            }
            const startDate = new Date() - 0 - _this.offlineLogExp * 24 * 3600 * 1000
            const endDate = new Date() - 0
            DB.getLogs({
                start: startDate,
                end: endDate,
                id: _this.id,
                uin: _this.uin
            }, function (err, logs) {
                if (err) {
                    console.error(err)
                    return
                }
                _this.log.reportOffline({ logs, startDate, endDate })
            })
        })
    }

    // 询问服务器是否上报离线日志
    _autoReportOffline () {
        const _this = this
        const script = document.createElement('script')
        script.src = `${this.url}/offlineAuto?id=${this.id}&uin=${this.uin}`
        // 通过 script 的返回值执行回调
        window._badjsOfflineAuto = function (isReport) {
            if (isReport) {
                _this.reportOfflineLog()
            }
        }
        document.head.appendChild(script)
    }
}
