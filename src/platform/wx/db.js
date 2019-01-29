import BaseDB from 'core/db/index'

import { equal } from 'shared/util'

// 写 log 缓存
let logCache = []

// 是否正在写入
let isWriting = false

let instance

class WxDB extends BaseDB {
    addLogs (key, msgObj) {
        return getAndSave(key, msgObj)
    }

    /**
     * 过滤出日期和id还有uid相符合的日志信息
     * @param opt
     * @returns Promise
     */
    getLogs (opt) {
        return getStorage(`badjs_${opt.id}_${opt.uin}`).then(list => {
            list = list.filter(log => {
                if (log.time >= opt.start && log.time <= opt.end &&
                    equal(log.id, opt.id) && equal(log.uin, opt.uin)) {
                    return true
                }
                return false
            })
            return Promise.resolve(list)
        })
    }

    clearDB (daysToMaintain, opt) {
        const range = (Date.now() - (daysToMaintain || 2) * 24 * 3600 * 1000)
        const key = `badjs_${opt.id}_${opt.uin}`
        return getStorage(key).then(data => {
            data = data.filter(log => {
                if (log && (log.time < range || !log.time)) {
                    return false
                }
                return true
            })
            return setStorage(key, data)
        })
    }
}

// helper
function getStorage (key) {
    return new Promise((resolve, reject) => {
        wx.getStorage({
            key,
            success (res) {
                resolve(res.data || [])
            },
            fail (e) {
                resolve([])
            }
        })
    })
}

function setStorage (key, data) {
    return new Promise((resolve, reject) => {
        wx.setStorage({
            key,
            data,
            success () {
                resolve(data)
            },
            fail (e) {
            }
        })
    })
}

function getAndSave (key, data) {
    if (isWriting) {
        // 如果正在写入 推入缓存延迟写入
        logCache.push(data)
        return
    }
    isWriting = true
    let newData = data ? [...logCache, data] : [...logCache]
    logCache = [] // 清空缓存
    return getStorage(key).then(list => {
        // 限制 2000 条
        if (list.length + newData.length >= 2000) {
            list.splice(0, newData.length)
        }
        let newList = [...list, ...newData]
        return setStorage(key, newList).then(e => {
            isWriting = false
            // 写完后检查 logcache 中是否还有内容未写入 保证全部写入
            if (logCache.length > 0) {
                getAndSave(key)
            }
        })
    })
}

/**
 * 获取 DB 单例
 * @returns {*}
 */
export default function getDB () {
    if (instance) {
        return instance
    }
    instance = new WxDB()
    return instance
}
