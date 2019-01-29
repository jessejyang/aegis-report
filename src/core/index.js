import { isOBJ, processError, extend } from 'shared/util'
import baseConf from './config'
import BaseLog from './log/index'

function checkConf (config) {
    return true
}

export default class BaseReport {
    constructor (props) {
        checkConf(props)
        this.send = props.send
        this._config = baseConf
        this.logList = []
        this._initConfig(props)

        let Log = props.log || BaseLog
        this.log = new Log(this._config)

        if (this.offlineLog) {
            this.initOffline(this.offlineLog)
        }
        this.initError()
    }

    // 初始化参数
    _initConfig (props) {
        this.cfg(props)
        // afterInit hooks
        this.afterConfInit(this._config)
    }

    // 更新参数
    cfg (props) {
        const { _config } = this

        for (const key in _config) {
            if (key in props) {
                _config[key] = props[key]
            }
        }

        const id = parseInt(_config.id, 10)
        if (id) {
            let hostname = location ? location.hostname : ''
            if (/qq\.com$/gi.test(hostname)) {
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
        }
        for (const key in _config) {
            this[key] = _config[key]
        }
    }

    afterConfInit (_config) {
    }

    // 初始化离线数据库
    initOffline () {
        throw Error('Class::initOffline function must be implement !')
    }

    // 初始化错误
    initError () {
    }

    // 处理log
    _processLog (immediately = false) {
        let { logList } = this
        if (logList.length) {
            this.log.processLog(logList, immediately)
            logList = []
        }
    }

    // 将错误推到缓存池
    _push (msg, immediately) {
        const { logList } = this

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
            data.from = location ? location.href : ''
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
        throw Error('reportOfflineLog must be implement!')
    }
}
