# FuckCSDN

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/JanePHPDev/FuckCSDN/blob/main/LICENSE)
[![Install Script](https://img.shields.io/badge/install-Tampermonkey-green.svg)](https://zeart.ink/fuckcsdn.user.js)

一个用户脚本，用于全面屏蔽 CSDN 及其关联网站，包括搜索结果中的链接、直接访问和页面跳转。  
CSDN 的商业化实践已深刻影响了中国技术社区的分享生态。

---

## 背景与动机

CSDN 起初作为技术爱好者和专业人士的交流平台，提供免费的代码分享、问题讨论和技术文章，支撑了早期中国互联网开发社区的成长。然而，随着其商业模式的演变，平台引入了付费阅读机制、资源下载限制以及密集的广告投放。这些变化不仅提高了用户获取信息的门槛，还逐步改变了内容生产者的行为模式。原本基于互惠的知识共享转向了以盈利为导向的模式：作者需为优质内容设置付费墙，平台算法优先推送商业化资源，导致免费、高质量的内容日益稀缺。

这种转变对整个技术博客生态产生了连锁效应。其他平台效仿 CSDN 的做法，强化了付费逻辑，削弱了开源协作的核心价值。开发者在寻找解决方案时，常被迫面对低质复制内容或高额费用，社区的包容性和创新活力随之衰退。FuckCSDN 脚本旨在通过技术手段恢复用户的自主选择权，鼓励回归非商业化的知识传播渠道，如开源仓库和独立博客。

---

## 核心功能

- **域名拦截**：针对 CSDN 主站及子域（如 `blog.csdn.net`、`download.csdn.net`）进行全局阻塞，支持自定义白名单以允许特定访问。
- **搜索结果过滤**：在主流搜索引擎（如 Google、Baidu、Bing）中自动隐藏 CSDN 相关链接，确保搜索体验的纯净度。
- **文本内容审查**：扫描页面文本，将 CSDN 域名替换为空格，防止间接曝光。
- **配置管理**：提供调试日志、自定义屏蔽页面消息、设置导出/导入以及一键重置功能，支持精细化调整。

---

## 安装步骤

该脚本依赖浏览器用户脚本管理器，如 Tampermonkey 或 Violentmonkey。

1. 从浏览器扩展商店安装 [Tampermonkey](https://www.tampermonkey.net/)。
2. 访问脚本链接并确认安装：[安装脚本](https://zeart.ink/fuckcsdn.user.js)。
3. 在管理器中启用脚本。
4. 刷新当前页面或重启浏览器以激活效果。

### 使用说明

- **自定义配置**：在 Tampermonkey 仪表盘中点击脚本图标，编辑 `@grant` 和 `@match` 规则以适应您的需求。
- **白名单添加**：通过脚本设置面板添加例外域名，避免误屏蔽。
- **调试模式**：启用日志查看拦截详情，便于排查问题。

---

## 相关链接

- [脚本安装地址](https://zeart.ink/fuckcsdn.user.js)
- [Tampermonkey 官网](https://www.tampermonkey.net/)
- [GitHub 仓库](https://github.com/JanePHPDev/FuckCSDN)

---

## 贡献与问题反馈

欢迎通过 [GitHub Issues](https://github.com/JanePHPDev/FuckCSDN/issues) 提交 bug 报告或功能建议。  
 fork 项目并提交 Pull Request 以贡献代码。

---

© 2025 JanePHPDev | [MIT License](https://github.com/JanePHPDev/FuckCSDN/blob/main/LICENSE)