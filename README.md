<div align="center">
  <h1>牢中秒杀线 · 社畜生存模拟</h1>
  <p><i>一款关于在极度压抑的职场环境中努力生存的网页文字模拟游戏</i></p>
  <p>
    <img alt="React" src="https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white" />
    <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white" />
    <img alt="Vite" src="https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white" />
    <img alt="Tailwind" src="https://img.shields.io/badge/Tailwind-CDN-38BDF8?logo=tailwindcss&logoColor=white" />
  </p>
</div>

> 平衡身心健康，避免过劳死，小心因为身体太好而被神秘组织盯上。

---

## 目录

- [游戏简介](#游戏简介)
- [核心玩法](#核心玩法)
- [可选职业 / 家庭背景](#可选职业--家庭背景)
- [系统模块](#系统模块)
- [项目结构](#项目结构)
- [本地运行](#本地运行)
- [部署 (GitHub Pages)](#部署-github-pages)
- [开发历程](#开发历程)
- [技术栈](#技术栈)

---

## 游戏简介

「牢中秒杀线」是一款基于 React + TypeScript 的纯文字回合制生存模拟游戏。玩家扮演一个被时代洪流裹挟的当代社畜，要在 996 / 007 / 编制内卷之间挣扎求生，平衡 **体力 / 精神 / 饱食度 / 金钱** 四大核心指标，同时应对随机突发事件、疾病、人际关系、婚育、住房、银行暴雷等"中式生活困境"。

游戏风格偏黑色幽默与荒诞讽刺——你可能因为：

- 喝了过期 9.9 元酱香拿铁脱水而亡；
- 被村镇银行卷走全部存款；
- 在 ICU 里因为干细胞疗法回血失败；
- 或者……单纯因为太健康，被黑色面包车请去"做贡献"。

---

## 核心玩法

游戏以"日"为基本回合，每天分为：

```
MORNING  →  WORK_AM  →  LUNCH  →  WORK_PM  →  DINNER  →  FREE_TIME  →  SLEEP
```

每个阶段提供不同的行动选项（吃饭、加班、就医、社交、消费等），每个选择都会即时影响数值与剧情走向。

### 四大核心数值

| 指标 | 上限 | 归零结局 |
| --- | --- | --- |
| **体力 (Physical)** | 200 | 猝死 |
| **精神 (Mental)** | 100 | 精神崩溃 / 失踪 |
| **饱食度 (Satiety)** | 100 | 饿死 |
| **金钱 (Money)** | ±∞ | 负债太久会被各种社会铁拳精准爆头 |

> 健康上限设为 200，是为了给"干细胞疗法"等富豪续命手段留出空间。

### 死亡判定

包含简单死亡（数值归零）与复合死亡（如：长期 996 + 高负债 + 低精神 → 高概率脑溢血）。所有死法都会写入 **死者档案**（`localStorage`），下次开新档时可以查看历代角色的死因合集。

---

## 可选职业 / 家庭背景

### 9 种职业（`constants.ts → PROFESSIONS`）

| ID | 名称 | 班次 | 月薪基数 | 备注 |
| --- | --- | --- | --- | --- |
| `CIVIL_SERVANT` | 街道办科员 | 965 | 240 | 编制内，稳定但低薪 |
| `PROGRAMMER` | 大厂架构师 | 996 | 1200 | 35 岁优化警告 |
| `FACTORY_WORKER` | 电子厂普工 | 007 | 280 | 流水线螺丝钉 |
| `SECURITY` | 小区保安 | 007 | 120 | 40 岁起可入行 |
| `TAXI_DRIVER` | 网约车司机 | 007 | 350 | 困在系统里 |
| `STREAMER` | 颜值主播 | 996 | 800 | 18-28 岁吃青春饭 |
| `DELIVERY` | 金牌骑手 | 007 | 600 | 与死神赛跑 |
| `SALES` | 房产销售 | 996 | 400 | 不开单就吃土 |
| `UNEMPLOYED` | 全职儿女 | 965 | 50 | 在家蹲 |

每个职业都有专属的日常吐槽日志 (`JOB_LOGS`) 与剧情事件 (`JOB_EVENTS`)，例如：程序员会遇到"删库跑路 / 五彩斑斓的黑"，主播会遇到"公会聚餐 / PK 输了做惩罚"。

### 5 种家庭背景（`constants.ts → FAMILY_BACKGROUNDS`）

`RURAL` 农村出身 / `AVERAGE` 小镇做题家 / `POOR` 城市贫民 / `RICH_2` 富二代 / `SCHOLAR` 书香门第

每种背景会修正初始金钱、负债、属性与抗压系数，决定开局难度。

---

## 系统模块

| 模块 | 关键文件 | 说明 |
| --- | --- | --- |
| **天气与体温** | `components/weather.ts` | 春夏秋冬循环，环境温度影响体温；夏天不开空调连续累积会触发热射病 |
| **饮食与厨艺** | `constants.ts → INGREDIENTS_SHOP / RECIPES` | 6 种食材、5 道菜谱，做饭可练厨艺；存在地沟油 / 罐车混装油食物中毒事件 |
| **疾病与医院** | `constants.ts → DISEASES / HOSPITAL_SERVICES` | 9 种疾病（含煤油中毒、脑溢血、热射病等），住院按日扣费 |
| **情感系统** | `components/RelationshipModal.tsx` | 5 类潜在伴侣（绿茶 / 拜金 / 老实人 / 扶弟魔 / 白月光），有真实好感与表面好感双数值 |
| **婚育系统** | `types.ts → Child` + `EDUCATION_COSTS` | 结婚、怀孕、抚养孩子，孩子有健康 / 饥饿值，需要奶粉与尿布；从幼儿园到大学的学费链 |
| **资产购置** | `ASSET_COSTS` | 100 万首付 / 300 万总价的房子，20 万一次性的车 |
| **银行系统** | `App.tsx → bankActions` | 可存取款，但有 2% 概率银行暴雷，存款被"依法充公" |
| **黑色面包车** | `flags.blackVanRisk` | 体检结果太健康，会被神秘组织盯上 |
| **死者档案** | `flags.deathHistory` | 每次死亡写入 `localStorage`，跨档继承 |

---

## 项目结构

```
91zhansha/
├── App.tsx                  # 主游戏循环、阶段调度、所有数值/事件分发（~2400 行）
├── index.tsx                # React 入口
├── index.html               # Tailwind CDN + Noto Sans SC 字体
├── index.css                # 极光渐变背景 / lift-card / chip / glow-ring 等原子样式
├── constants.ts             # 全部静态配置：职业、背景、食谱、疾病、事件库
├── types.ts                 # 全局 TypeScript 类型
├── utils.ts                 # 通用工具（日期格式化、随机数、货币格式）
├── components/
│   ├── StatBar.tsx          # 顶部 HUD 状态栏（4 大数值 + 时间 + 天气 + 职业）
│   ├── GameLog.tsx          # 可折叠日志抽屉，支持按类型过滤
│   ├── EventModal.tsx       # 通用事件弹窗
│   ├── RelationshipModal.tsx# 关系/家庭面板
│   ├── CollapsibleGroup.tsx # 行动按钮分组容器
│   └── weather.ts           # 季节、温度、体温计算
├── vite.config.ts           # Vite 配置（GitHub Pages base path 自动切换）
└── .github/workflows/
    └── deploy.yml           # GH Pages 自动部署
```

---

## 本地运行

### 前置要求

- **Node.js** ≥ 20
- **npm**（或 pnpm / yarn）

### 步骤

```bash
# 1. 安装依赖
npm install

# 2. (可选) 配置 Gemini API Key —— 如果需要 AI 剧情扩展
echo "GEMINI_API_KEY=你的key" > .env.local

# 3. 启动开发服务器（默认 http://localhost:3000）
npm run dev

# 4. 构建产物
npm run build

# 5. 本地预览构建产物
npm run preview
```

> 项目通过 `<script src="https://cdn.tailwindcss.com">` 在 `index.html` 中加载 Tailwind，因此**首次启动需要联网**。

---

## 部署 (GitHub Pages)

仓库已内置 `.github/workflows/deploy.yml`：

- 推送到 `main` 分支 → 自动构建 → 发布到 GitHub Pages
- `vite.config.ts` 会在 CI 环境（`GITHUB_ACTIONS=true`）下自动把 `base` 切换成 `/91zhansha/`，本地依然使用 `/`

需要在仓库的 **Settings → Secrets and variables → Actions** 中配置 `GEMINI_API_KEY`（如果使用了 AI 相关功能），并在 **Settings → Pages** 把 Source 设为 *GitHub Actions*。

---

## 开发历程

> 截至当前 (`main` @ `1cff30d`) 仓库仅有 1 个提交，整个项目作为一次完整的 UI 重绘 + 初始上传一次性提交，下表按"内部迭代版本"梳理代码中可考的演进脉络。

| 阶段 | 标识 | 主要内容 |
| --- | --- | --- |
| **Init** | `1cff30d feat(ui): 全面重绘` | 一次性导入完整项目（4764 行 / 20 个文件） |
| ↳ App 17 | 代码注释 `streamerSimpCount` | 主播专属"榜一大哥/PK 惩罚/带货"剧情线 |
| ↳ App 18 | 代码注释 `健康上限提升至 200` | 引入住院系统、黑色面包车、子女系统、教育阶段费用 |
| ↳ UI 重绘 | `index.css` / `StatBar` / `GameLog` / `CollapsibleGroup` | 暖粉+靛蓝极光渐变背景、HUD 顶栏、可折叠日志抽屉、按主题分组的行动按钮 |

### 代码考古笔记：AI 古法编程的痕迹

> 本项目主体由作者**纯对话复制粘贴**的方式与 AI 协作完成（即俗称的"AI 古法编程"——不接 IDE、不走 diff、靠人肉搬运），下面这些痕迹被忠实地保留在了仓库里，不打算修——它们也是项目历史的一部分。

#### 1. 一个堆得快要塌了的 `App.tsx`（2409 行）

整个游戏循环挤在单一组件里，没有拆 reducer、没有 context、没有自定义 hook。统计如下：

| 指标 | 次数 |
| --- | --- |
| `useState` | 5 |
| `useEffect` | 2 |
| `setGameState` 调用 | 57 |
| 嵌套的 `const` 函数 | 140+ |
| `Math.random()` 直接散落在业务逻辑里 | 33 |
| `triggerDeath` / `updateStats` / `addLog` / `showModal` 调用 | 24 / 50 / 37 / 19 |

#### 2. 代码注释里嵌着 AI Studio 的版本号

作者每次让 AI 改一版就把版本号写进注释，最后形成了一份"考古地层"：

```ts
// 主播剧情标记 (App 17)
streamerSimpCount: 0,

// 住院与健康标记 (App 18)
hospitalDays: 0,
hospitalDailyCost: 0,
blackVanRisk: 0,

// 限制数值范围 (App 18 将上限提升至 200)
if (changes.physical) newStats.physical = Math.min(200, ...);
```

#### 3. 经典 LLM 输出标记原封保留

```ts
// --- START OF FILE constants.ts ---     ← AI 复制时自带的文件头
// === 常量定义：保留所有文本描述 ===       ← AI 自我安抚式标记
// 物品库存 (合并版)                       ← 多次合并的副产物
// 职业专属日志 (扩充版)                   ← 同上
// [新增] 家庭背景                         ← ChatGPT 风格 diff 注释
// [新增] 子女系统
// [新增] 育儿用品
// 【修复核心】：如果当前油量 > 0，则混合污染
// 核心修复：油用光了，自动清除坏油标记
// App.tsx 内部新增                        ← 当时让 AI"插一段"的对话痕迹
```

#### 4. 缩进彻底崩了——AI 增量补丁的副作用

`App` 组件内部的 `bankActions` / `marriageActions` / `triggerDeath` 这些"后塞进来"的对象，全部用**第 0 列**写在函数体里，夹着 `// App.tsx 内部新增` 这种自述式注释，但确实是 React 组件函数的内部闭包：

```tsx
const App: React.FC = () => {
  // ... 正常 2 空格缩进的 hooks ...

  };
// App.tsx 内部新增           ← 注释贴在了组件外的视觉位置
const bankActions = {        ← 但其实是 App 内部的常量
  deposit: (amount: number) => { ... }
};

const marriageActions = {     ← 同上，缩进 0 列但闭包在 App 内
  propose: () => { ... }
};

const triggerDeath = (reason: string) => { ... }
```

#### 5. 类型系统按"先跑起来再说"原则维护

- `as any` 共 **5** 处
- `// @ts-ignore` 共 **4** 处
- 例如 `[ing.id]: (prev.flags.inventory[ing.id] || 0) + 1` 上面就贴了 `// @ts-ignore`，因为 inventory 的 key 类型从来没收紧过

#### 6. 删不干净的化石

```ts
// 复合死亡条件逻辑已移至 App.tsx 中处理，此处保留空数组防止引用报错
export const COMPLEX_DEATHS: any[] = [];
```

`COMPLEX_DEATHS` 已经在新版本中失去意义，但还在被 `App.tsx` import，所以只能留个空数组当替身。

#### 7. flags 是一个 20+ 字段的"杂物袋"

`gameState.flags` 持续生长，目前同时塞着：`isDepressed / disease / hasLoan / isSingle / partner / hasHouse / hasCar / hasInsurance / streamerSimpCount / hospitalDays / hospitalDailyCost / blackVanRisk / lastCheckupDate / knownHealth / inventory / children / isMarried / weddedPartner / hasAC / isACOn / summerDaysWithoutAC / isBankFrozen / bankBalance / parentPressure / lastJobEventDate / isPursuing` ……每加一个新系统就往里塞一个 flag，没有拆分。

#### 8. 数值上限在常量与逻辑里"分裂"

`constants.ts` 里有个无奈的注释，反映了对话式编程的局限：

```ts
// 注意：健康值上限在逻辑中已改为 200，但初始值在这里设定
export const INITIAL_STATS: PlayerStats = {
  physical: 80, // 初始健康 (上限200)
  mental: 80,   // 初始精神 (上限100)
  ...
};
```

> 上限是改在了 `App.tsx` 的 `Math.min(200, ...)` 里，但常量定义里只能用注释提醒。

---

### 本次 UI 重绘的具体改动

- **`index.css`**：新配色体系（暖粉+靛蓝渐变 + 极光动画 + 细噪点），新增 `lift-card` / `chip` / `glow-ring` 原子样式
- **`index.html`**：移除死黑背景，加载 Noto Sans SC 字体权重 400-900
- **`StatBar`**：全新 HUD 布局——顶部 Time / Weather / Profession / Balance 信息带分隔符，下部 3 条渐变状态进度条（低值时脉动红点）
- **`GameLog`**：重做为可折叠抽屉（默认关闭），支持按类型过滤（剧情 / 成功 / 警告 / 危险），每条带状态色点
- **`CollapsibleGroup`**：新增可折叠分组组件，支持彩色主题 accent
- **`App.tsx` 主界面**：
  - 头条卡片（阶段 chip + 角色摘要 + 高危事件 3 列横幅）
  - 主动作 `HeroAction`（工作 / 睡觉 / 住院的主按钮，大号强调）
  - 行动按钮按主题折叠：用餐 / 生活基础 / 消费放纵 / 免费续命
  - 日志移到底部，默认收起
- 删除已不用的 `MiniBar` / `StatusAlert`，保留 `InfoCard`（GAME_OVER / MORTUARY 仍用）
- 清理 `ShieldAlert` 未使用的 import

---

## 技术栈

| 类别 | 选型 |
| --- | --- |
| 框架 | React 19 (Function Component + Hooks) |
| 语言 | TypeScript 5.8 |
| 构建 | Vite 6 + `@vitejs/plugin-react` |
| 样式 | Tailwind CSS（CDN） + 自定义 CSS（极光动画） |
| 图标 | `lucide-react` 0.563 |
| 字体 | Google Fonts · Noto Sans SC / JetBrains Mono |
| 持久化 | `localStorage`（死者档案） |
| CI/CD | GitHub Actions → GitHub Pages |

---

## 协议

仅作为个人娱乐与表达练习。所有职业 / 家庭剧情设定均为艺术夸张，请勿对号入座。

