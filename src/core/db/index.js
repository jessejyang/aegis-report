/**
 * DB 基类
 */
export default class BaseDB {
    addLogs () {
        throw Error('BaseDB addLogs() Function must be implement !')
    }

    /**
     * 过滤出日期和id还有uid相符合的日志信息
     * @param opt
     * @returns Promise
     */
    getLogs () {
        throw Error('BaseDB.getLogs() function must be implement !')
    }

    clearDB () {
        throw Error('BaseDB.clearDB() function must be implement !')
    }
}
