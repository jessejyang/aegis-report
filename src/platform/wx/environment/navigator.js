let agent = ''
export default {
    userAgent: (function () {
        if (!agent) {
            let sysInfo = wx.getSystemInfoSync()
            const {
                brand,
                model,
                system,
                SDKVersion,
                version,
                platform,
                language
            } = sysInfo
            agent = `(${brand}; ${model}; ${system}) Platform/${platform} wechatVersion/${version} sdkVersion/${SDKVersion} Language/${language} MicroMessenger`
        }
        return agent
    })()
}
