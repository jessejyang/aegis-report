[![NPM version](https://img.shields.io/npm/v/wardjs-report.svg?style=flat)](https://www.npmjs.org/package/wardjs-report)
[![npm download](https://img.shields.io/npm/dm/wardjs-report.svg?style=flat-square)](https://npmjs.org/package/wardjs-report)
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/iv-web/wardjs-report/blob/master/LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/iv-web/wardjs-report/pulls)


## wardjs-hippy-report

仅用于QQ浏览器的hippy环境中

wardmonitor hippy离线日志上报:

离线日志统计 - 基于 badjs 升级的 wardjs-hippy-report 给你一站式hippy前端日志监控体验。

## Install 

```shell
$ npm install wardjs-hippy-report
```

## Getting started

- npm

```javascript
import WardjsReport from 'wardjs-hippy-report'

const wardjs = new WardjsReport({id: 1})

wardjs.addOfflineLog('error msg') // 保存离线日志
```

- browser

```javascript
const WardjsReport = window['wardjs-report'].default
const wardjs = new WardjsReport({
    id: 0, // 上报 id
    uin: 0, // user id
    url: '//now.qq.com/badjs', // 上报接口
    version: 0,
    ext: null, // 扩展参数 用于自定义上报
    level: 4, // 错误级别 1-debug 2-info 4-error
    ignore: [], // 忽略某个错误, 支持 Regexp 和 Function
    random: 1, // 抽样 (0-1] 1-全量
    delay: 1000, // 延迟上报
    maxLength: 500, // 每条日志内容最大长度，通常不建议修改
    submit: null, // 自定义上报方式
    monitorUrl: '//report.url.cn/report/report_vm', // 自定义统计上报地址
    repeat: 5, // 重复上报次数(对于同一个错误超过多少次不上报),
    offlineLog: true,
    offlineLogExp: 3, // 离线日志过期时间，默认3天
    offlineLogAuto: true, // 是否自动询问服务器需要自动上报
    onReport: () => {
    }, // 与上报同时触发，用于统计相关内容
    beforeReport: () => {
        return true
    } // aop：上报前执行，如果返回 false 则不上报
})
```

### 参数说明

上报 id 需要去 badjs 服务申请

| 参数名 | 默认值 | 简介 |
| --- | --- | --- | 
| id | 0 | 上报id |
| uin | 0 |  user id |
| version | 0 | 上报版本号 |
| url | '//now.qq.com/badjs' | 上报接口 |
| ext | null |  扩展参数 用于自定义上报 |
| level | 4 |  错误级别 1-debug 2-info 4-error |
| ignore | [] | 忽略某个错误, 支持 Regexp 和 Function |
| random | 1 |  抽样 (0-1] 1-全量 |
| delay | 1000 |  延迟上报时间 |
| maxLength | 500 | 每条日志默认长度（不建议修改） |
| submit | null |  自定义上报方式 |
| repeat | 5 |  重复上报次数(对于同一个错误超过多少次不上报) |
| offlineLog | true | 是否开启离线日志 |
| offlineLogExp | 3 |  离线日志过期时间，默认3天 |
| offlineLogAuto | true | 是否自动询问服务器需要自动上报 |
| onReport | function (bid, reportLog) {} | 与上报同时触发，用于统计相关内容 |
| beforeReport | function (reportLog) {} | AOP：上报前执行，如果返回 false 则此条信息不上报 |


### 上报接口


```javascript
wardjs.addOfflineLog(msg)  // 增加离线日志
```


### 离线日志用法

- 首先生成实例对象，开启离线日志, 默认已开启

```javascript
const wardjs = new WardjsReport({
    id: 1,
    offlineLog: true,
    offlineLogAuto: true
})
```

1. offlineLog 表示开启离线日志，将用户日志存储在 IndexDB 中
2. offlineLogAuto 表示每次页面刷新的时候主动询问服务器是否上传离线日志

- 打开 badjs 离线日志页面 http://badjs2.ivweb.io/user/offlinelog.html

选择对应项目的离线日志，按照图示三步走即可

![offlinelog](./images/offlinelog.jpg)


- 刷新项目页面（如果是mobile app则需要重新进入页面）

再次回到 badjs 离线日志页面，在右边栏选择对应的离线日志即可预览了，日志的过滤条件（消息类型，关键词）依然有效。

- 日志大小需要小于 10MB，根据测试，每条日志长度最大为 500，10000条日志的大小约为 600k，所以完全不用担心日志大小。超过 10MB 的日志服务器会返回 413。


## wardjs-report 原理

### 离线日志

通过封装hippy提供的 AsyncStorage 存储用户全部日志，包括对日志的过期处理以及上传操作。具体实现可以查看 `src/Offline.js`。

### 延迟上报

默认时间为 1s，延迟上报可以理解为函数节流，将多次上报合为一次上报。

## Build

rollup 打包，支持 tree-shaking，打包后体积只有 8k，是 badjs-report 体积的 1/3。

## Example

example 使用说明

badjs 虽然实现了跨域，但是 badjs 服务器对域名限制（业务申请中填写业务 url），所以使用 example 需要使用代理机制。


## License

MIT
