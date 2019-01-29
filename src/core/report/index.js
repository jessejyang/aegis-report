export default class BaseSend {
    static sendBadjs () {
        throw Error('sendBadjs must be implement !')
    }
    static reportOffline () {
        throw Error('reportOffline must be implement !')
    }
    static isNeedReportOffline () {
        throw Error('isNeedReportOffline must be implement !')
    }
}
