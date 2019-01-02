import OfflineDB from './OfflineDB'

let instance

/**
 * 获取 indexDB 单例模式
 * @returns {*}
 */
export default function getOfflineDB () {
    if (instance) {
        return instance
    }
    instance = new OfflineDB()
    return instance
}
