/**
 * ECharts CDN 配置
 *
 * 从 jsDelivr CDN 懒加载，不打包到产物中。
 * 使用 echarts 完整 UMD 包（所有图表类型预注册），
 * 加载后通过 window.echarts 全局访问。
 */

export const ECHARTS_CDN = 'https://cdn.jsdelivr.net/npm/echarts@6.1.0/dist/echarts.min.js'
