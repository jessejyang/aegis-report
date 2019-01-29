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

export default _config
