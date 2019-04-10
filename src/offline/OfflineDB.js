import { extend, equal } from '../utils/index';
import { AsyncStorage } from '@tencent/hippy-react';
import { QBDeviceModule } from '@tencent/hippy-react-qb';

let offlineBuffer = [];

/**
 * 封装对 IndexDB 的读写操作
 */
export default class OfflineDB {
    constructor() {
        this.db = null;
    }

    ready(callback) {

        const self = this;
        if (!AsyncStorage) {
            return callback();
        }

        if (AsyncStorage) {
            setTimeout(function () {
                callback(null, self);
            }, 0);
            return;
        }
    }
    /**
     * 根据key存储日志
     * @param key
     * @param log
     */
    insertToDB(key, log) {
        if (typeof log === 'string') {
            return AsyncStorage.setItem(key, log, (err) => {
                console.error(err);
            });
        } else {
            // 平均单条写入10字节1微秒
            return AsyncStorage.setItem(key, JSON.stringify(log), (err) => {
                console.error(err);
            });
        }
    }

    addLogs(logs) {
        if (!AsyncStorage) {
            return;
        }

        for (let i = 0; i < logs.length; i++) {
            this.insertToDB(logs[i][0], logs[i][1]);
        }
    }

    /**
     * 过滤出日期和id还有uid相符合的日志信息
     * @param opt
     * @param callback
     */
    getLogs(opt, callback) {
        if (!AsyncStorage) {
            return;
        }

        // 平均单条读取在1微秒左右
        AsyncStorage.getAllKeys().then((keys) => {
            const result = [];
            const msgObj = {};
            const msgList = [];
            const urlObj = {};
            const urlList = [];
            let num = 0;
            let num1 = 0;

            keys.forEach((key, index, array) => {
                // 非badjs目标上报日志，则跳过
                if (key.indexOf('badjs_' + opt.id) === -1) {
                    if (index >= array.length - 1) {
                        callback(null, result, msgList, urlList);
                    }
                    return;
                }

                AsyncStorage.getItem(key, (err) => {
                    console.error(err);
                }).then((item) => {
                    const value = JSON.parse(item);

                    if (value) {
                        // 上传所有用户的日志
                        // if (value.time >= opt.start && value.time <= opt.end &&
                        //     equal(value.id, opt.id) && equal(value.uin, opt.uin)) {
                        if (value.time >= opt.start && value.time <= opt.end && equal(value.id, opt.id)) {
                            const { from, level, msg, time, version } = value;
                            if (typeof msgObj[msg] !== 'number') {
                                msgList.push(msg);
                                msgObj[msg] = num++;
                            }
                            if (typeof urlObj[from] !== 'number') {
                                urlList.push(from);
                                urlObj[from] = num1++;
                            }
                            result.push({ f: urlObj[from], l: level, m: msgObj[msg], t: time, v: version });
                        }
                    }

                    if (index >= array.length - 1) {
                        callback(null, result, msgList, urlList);
                    }
                });

            });
        });
    }

    /**
     * 根据截止时间去遍历清除日志
     * @param daysToMaintain
     */
    clearDB(daysToMaintain) {
        if (!AsyncStorage) {
            return
        }

        if (!daysToMaintain) {
            return AsyncStorage.getAllKeys().then((keys) => {
                keys.forEach((key) => {
                    return AsyncStorage.removeItem(key)
                })
            })
        }

        return AsyncStorage.getAllKeys().then((keys) => {

            const range = (Date.now() - (daysToMaintain || 2) * 24 * 3600 * 1000)
            // 手动删除所有存储的数据
            // const range = Date.now()

            keys.forEach((key) => {
                // 非badjs日志跳过
                if (key.indexOf('badjs_') === -1) {
                    return
                }

                // 从key上取出记录时间，进行判断清除
                const name = '_t_'
                const time = parseInt(key.slice(key.indexOf(name) + name.length))
                if (time >= range) {
                    return
                }
                return AsyncStorage.removeItem(key);

                // return AsyncStorage.getItem(key, (err) => {
                //     console.error(err);
                // }).then((item) => {
                //     const value = JSON.parse(item);
                //     if (value.time < range || !value.time) {
                //         return AsyncStorage.removeItem(key);
                //     }
                // });
            })
        });
    }

    save2OfflineHandler(key, msgObj, config) {
        msgObj = extend({ id: config.id, uin: config.uin, time: new Date() - 0, version: config.version }, msgObj);
        if (AsyncStorage) {
            this.insertToDB(key, msgObj);
            return;
        }

        if (!AsyncStorage && !offlineBuffer.length) {
            this.ready(function (err, DB) {
                if (err) {
                    console.error(err);
                }
                if (DB) {
                    if (offlineBuffer.length) {
                        DB.addLogs(offlineBuffer);
                        offlineBuffer = [];
                    }
                }
            });
        }
        offlineBuffer.push([key, msgObj]);
    }

    save2Offline(key, msgObj, config) {
        if (QBDeviceModule) {
            QBDeviceModule.getDeviceInfo().then((deviceInfo) => {

                if (typeof msgObj.msg === 'string') {
                    msgObj.msg = JSON.stringify(extend(deviceInfo, {msg: msgObj.msg}))
                } else {
                    msgObj.msg = JSON.stringify(extend(deviceInfo, msgObj.msg))
                }

                this.save2OfflineHandler(key, msgObj, config)
            });
        } else {
            this.save2OfflineHandler(key, msgObj, config)
        }
    }
}
