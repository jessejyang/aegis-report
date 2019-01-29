import BaseSend from 'core/report/index'
import navigator from '../environment/navigator'

export default class Send extends BaseSend {
    static sendBadjs (url, data) {
        const method = typeof data === 'undefined' ? 'GET' : 'POST'
        if (/^https?:/.test(url)) {
            url.replace(/^http:/, 'https:')
        } else {
            url = 'https:' + url
        }
        wx.request({
            url,
            method,
            data: data || {}
        })
    }

    static reportOffline ({ logs, startDate, endDate }, config) {
        const { userAgent } = navigator
        const { id, uin } = config
        let { url } = config

        if (/^https?:/.test(url)) {
            url.replace(/^http:/, 'https:')
        } else {
            url = 'https:' + url
        }

        return new Promise((resolve, reject) => {
            wx.request({
                url: url + '/offlineLog',
                method: 'POST',
                data: {
                    'offline_log': JSON.stringify({ logs, userAgent, startDate, endDate, id, uin })
                },
                header: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                success (res) {
                    resolve(res)
                },
                fail (e) {
                    reject(e)
                }
            })
        })
    }

    static isNeedReportOffline (config) {
        const { id, uin } = config
        let { url } = config

        if (/^https?:/.test(url)) {
            url.replace(/^http:/, 'https:')
        } else {
            url = 'https:' + url
        }

        return new Promise((resolve, reject) => {
            wx.request({
                url: url + `/mpOfflineAuto?id=${id}&uin=${uin}`,
                method: 'GET',
                header: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                success (res) {
                    const { data } = res
                    resolve(data.msg === 'true')
                },
                fail (e) {
                    reject(e)
                }
            })
        })
    }
}
