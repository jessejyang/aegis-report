import BaseReport from 'core/index'
import Log from './log'
import getDB from './db'
import Send from './report/index'

export default class WardjsReport extends BaseReport {
    constructor (props) {
        props = Object.assign({}, {
            log: Log
        }, props)

        super(props)
    }

    // 初始化错误
    initError () {
        const _this = this

        wx.onError(function (msg) {
            let match = msg.match(/;at\s(\S*)\s/) || []
            let url = match.length >= 1 ? match[1] : ''

            _this._push({
                msg,
                target: url,
                rowNum: 0,
                colNum: 0,
                _orgMsg: msg
            })
        })
        // badjs 系统查看错误使用
        // typeof console !== 'undefined' && console.error && setTimeout(function () {
        //     const err = ((location.hash || '').match(/([#&])BJ_ERROR=([^&$]+)/) || [])[2]
        //     err && console.error('BJ_ERROR', decodeURIComponent(err).replace(/(:\d+:\d+)\s*/g, '$1\n'))
        // }, 0)
    }

    afterConfInit (conf) {
        Send.sendBadjs(`${conf.url}/${parseInt(conf.id, 10)}`)
    }

    initOffline (autoReport) {
        if (!this.offlineDB) {
            this.offlineDB = getDB()
        }

        this.offlineDB.clearDB(this.offlineLogExp, this._config)
        if (autoReport) {
            setTimeout(() => {
                this.reportOfflineLog()
                wx.onAppShow(() => {
                    setTimeout(() => {
                        this.reportOfflineLog()
                    }, 5000)
                })
            }, 5000)
        }
    }

    // 上报离线日志
    reportOfflineLog () {
        Send.isNeedReportOffline(this._config).then(need => {
            if (!need) {
                return
            }
            const startDate = new Date() - 0 - this.offlineLogExp * 24 * 3600 * 1000
            const endDate = new Date() - 0
            this.offlineDB.getLogs({
                start: startDate,
                end: endDate,
                id: this.id,
                uin: this.uin
            }).then(logs => {
                Send.reportOffline({ logs, startDate, endDate }, this._config)
            })
        }).catch(e => {
            console.log(e)
        })
    }
}
