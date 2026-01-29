import { PlayerStats, Profession, ProfessionType, Partner } from './types';

export const INITIAL_STATS: PlayerStats = {
  age: 22, // 默认值，实际会被随机覆盖
  physical: 80,
  mental: 80,
  money: 5000,
  satiety: 80,
  cookingSkill: 0,
  daysSurvived: 0,
};

// 资产成本
export const ASSET_COSTS = {
  HOUSE_DOWN_PAYMENT: 1000000, // 首付100万
  CAR_COST: 200000, // 车20万
};

// 潜在攻略对象库
export const POTENTIAL_PARTNERS: Partner[] = [
  { name: "茶艺大师·小美", type: "绿茶", affection: 10, materialism: 3.0, fidelity: 20 },
  { name: "吞金兽·娜娜", type: "拜金", affection: 5, materialism: 5.0, fidelity: 40 },
  { name: "老实人·阿芳", type: "普通", affection: 30, materialism: 1.0, fidelity: 80 },
  { name: "扶弟魔·招娣", type: "深坑", affection: 20, materialism: 2.5, fidelity: 60 },
  { name: "白月光·校花", type: "女神", affection: 0, materialism: 1.5, fidelity: 50 }
];

// 职业基础定义
export const PROFESSIONS: Record<ProfessionType, Profession> = {
  CIVIL_SERVANT: {
    id: 'CIVIL_SERVANT',
    name: '街道办科员',
    salaryBase: 240, 
    stressFactor: 3,
    healthRisk: 1,
    schedule: '965',
    description: '宇宙尽头编制内。',
    workDesc: [],
    minAge: 24, maxAge: 35
  },
  PROGRAMMER: {
    id: 'PROGRAMMER',
    name: '大厂架构师',
    salaryBase: 1200,
    stressFactor: 8,
    healthRisk: 6,
    schedule: '996',
    description: '拿命换钱。',
    workDesc: [],
    minAge: 20, maxAge: 35
  },
  FACTORY_WORKER: {
    id: 'FACTORY_WORKER',
    name: '电子厂普工',
    salaryBase: 280,
    stressFactor: 5,
    healthRisk: 5,
    schedule: '007',
    description: '流水线上的螺丝钉。',
    workDesc: []
  },
  SECURITY: {
    id: 'SECURITY',
    name: '小区保安',
    salaryBase: 120,
    stressFactor: 1,
    healthRisk: 2,
    schedule: '007',
    description: '少走四十年弯路。',
    minAge: 45,
    maxAge: 90,
    workDesc: []
  },
  // [新增] 网约车 (中年首选)
  TAXI_DRIVER: {
    id: 'TAXI_DRIVER',
    name: '网约车司机',
    salaryBase: 350,
    stressFactor: 5,
    healthRisk: 6,
    schedule: '007',
    description: '腰和前列腺都在抗议。',
    minAge: 25,
    maxAge: 60,
    workDesc: []
  },
  // [新增] 主播 (吃青春饭)
  STREAMER: {
    id: 'STREAMER',
    name: '颜值主播',
    salaryBase: 800, // 波动极大
    stressFactor: 6,
    healthRisk: 3,
    schedule: '996',
    description: '榜一大哥没钱了。',
    minAge: 18,
    maxAge: 30,
    workDesc: []
  },
  DELIVERY: {
    id: 'DELIVERY',
    name: '金牌骑手',
    salaryBase: 600,
    stressFactor: 6,
    healthRisk: 9, 
    schedule: '007',
    description: '困在算法里的人。',
    workDesc: []
  },
  SALES: {
    id: 'SALES',
    name: '房产销售',
    salaryBase: 400,
    stressFactor: 7,
    healthRisk: 4,
    schedule: '996',
    description: '不开单就吃土。',
    workDesc: []
  },
  UNEMPLOYED: {
    id: 'UNEMPLOYED',
    name: '全职儿女',
    salaryBase: 50,
    stressFactor: 2,
    healthRisk: 1,
    schedule: '965',
    description: '家里蹲。',
    workDesc: []
  }
};

// --- 1. 职业专属：普通搬砖日志 (Log) ---
export const JOB_LOGS: Record<ProfessionType, string[]> = {
  CIVIL_SERVANT: [
    "整理了一上午关于‘社区垃圾分类’的红头文件，感觉人生毫无意义。",
    "隔壁窗口的王大妈因为少发了一盒鸡蛋，指着你的鼻子骂了半小时。",
    "领导让你把Excel表格里的字体全部从‘宋体’改成‘仿宋’。",
    "参加了三个小时的‘精神文明建设’会议，睡着差点流口水。",
    "帮领导拿快递，顺便帮他家小孩打印了暑假作业。",
    "接待了一位听力不好的大爷，吼得嗓子都哑了。",
    "写材料写到崩溃，Ctrl+C 和 Ctrl+V 都按出火星子了。",
    "在茶水间摸鱼，听到了隔壁科室的劲爆八卦。",
    "为了应付上级检查，去街上扫了一个小时的落叶。",
    "因为必须穿正装，大夏天捂出了一身痱子。"
  ],
  PROGRAMMER: [
    "盯着屏幕找了一个小时，发现那个Bug是因为少写了一个分号。",
    "产品经理又改需求了，你想把键盘拍在他脸上。",
    "服务器报警，CPU占用率飙升到99%，你的血压也跟着飙升。",
    "参加每日站会，每个人都在用黑话装模作样。",
    "重构了一段祖传代码，结果整个项目都跑不起来了。",
    "隔壁组刚入职的00后，发量比你多，工资比你高。",
    "长时间久坐，感觉腰椎间盘突出又严重了。",
    "在屎山上雕花，试图让这段垃圾代码跑得再快0.1秒。",
    "因为一个低级错误，被CTO在全员群里点名批评。",
    "为了赶版本发布，今晚又要通宵了，咖啡续命中。"
  ],
  FACTORY_WORKER: [
    "机械地重复同一个动作：拿零件，按压，放零件。脑子已麻木。",
    "线长站在你身后，掐着秒表计算你的动作时间。",
    "车间里全是机油味和汗臭味，混合成一种绝望的味道。",
    "上厕所需要拿‘离岗证’，而且被限制在5分钟以内。",
    "如果不小心打瞌睡，手指可能就会被机器切掉。",
    "为了那点全勤奖，生病了也不敢请假。",
    "隔壁工位的阿姨给你介绍对象，说是村口王二麻子。",
    "午饭又是清汤寡水的大白菜，一点油水都没有。",
    "站了一整天，小腿肿得像萝卜一样粗。",
    "不仅要上白班，下周还要倒夜班，生物钟彻底紊乱。"
  ],
  DELIVERY: [
    "暴雨天，视线模糊，差点撞上一辆逆行的三轮车。",
    "顾客住在没有电梯的老破小8楼，爬楼爬到腿软。",
    "因为保安不让进小区，被迫在门口像个傻子一样等顾客。",
    "餐洒了一点，被顾客当面把饭扔在地上。",
    "为了不超时，在红灯路口和死神赛跑。",
    "手机导航把你带进了死胡同，必须原路返回。",
    "电动车电量告急，离换电站还有3公里，只能推着走。",
    "接了一个帮买单，结果是买两桶5L的水。",
    "被顾客恶意差评，这几天的辛苦钱全白干了。",
    "在写字楼楼下等电梯，急得想从楼梯飞上去。"
  ],
  SALES: [
    "打了一百个电话，有99个骂人，还有一个是空号。",
    "为了陪客户，一口气喝了一斤白酒，胃里像火烧。",
    "在客户楼下蹲守了三天，只为了送一份没人看的资料。",
    "被主管在早会上当众羞辱：‘这点业绩，狗都比你强！’",
    "朋友圈全是鸡汤和广告，连亲戚都把你屏蔽了。",
    "客户明明没钱，还要装大款，浪费了你一下午口舌。",
    "为了开单，不得不答应给客户高额回扣，自己倒贴钱。",
    "在售楼处站了一天，笑得脸部肌肉都僵硬了。",
    "被同行抢了单，气得在厕所里锤墙。",
    "不仅要卖房子，还要陪客户家的狗玩。"
  ],
  UNEMPLOYED: [
    "在家躺了一上午，被妈妈骂：‘养头猪还能吃肉，养你有什么用？’",
    "假装在投简历，其实在打游戏，内心充满了负罪感。",
    "看到同学在朋友圈晒工资条，焦虑得睡不着觉。",
    "为了省钱，连拼好饭都不敢点，只能吃泡面。",
    "亲戚来串门，问你‘工作找得怎么样了’，你想找个地缝钻进去。",
    "在网上看招聘信息，发现自己连保安的要求都达不到。",
    "试图考公上岸，但是连书的一页都看不进去。",
    "昼夜颠倒，白天睡觉晚上emo，感觉自己像个吸血鬼。",
    "伸手问爸爸要零花钱，看到了他失望的眼神。",
    "在家里地位不如狗，连呼吸都是错的。"
  ]
};

// --- 2. 职业专属：突发抉择事件 (Modal) ---
export const JOB_EVENTS: Record<ProfessionType, Array<{title: string, desc: string, options: any[]}>> = {
  CIVIL_SERVANT: [
    {
      title: "【紧急任务】领导的茶",
      desc: "大领导突然来视察，处长让你去泡茶，但他只喝那种‘85度的水泡出来的陈年普洱’。",
      options: [
        { text: "小心翼翼地泡 (压力+10)", changes: { mental: -10, money: 0 } },
        { text: "直接倒开水 (作死)", changes: { mental: 20, money: -500 } }, // 扣绩效
      ]
    },
    {
      title: "【职场站队】科长的暗示",
      desc: "科长暗示你，要在下周的评选里给副科长投反对票。这可是职场大忌。",
      options: [
        { text: "听科长的 (卷入斗争)", changes: { mental: -20, stressFactor: 1 } }, 
        { text: "装傻充愣 (两边得罪)", changes: { mental: -10, money: -200 } }
      ]
    },
    {
      title: "【突发】群众闹事",
      desc: "几个情绪激动的居民冲进办公室，指名道姓要找你，因为你的章盖歪了。",
      options: [
        { text: "低头认错道歉 (自尊-50)", changes: { mental: -30, physical: -5 } },
        { text: "和他们对喷 (爽！但是...)", changes: { mental: 30, money: -1000 } } // 严重处分
      ]
    },
    {
      title: "【加班】毫无意义的PPT",
      desc: "明天要汇报，领导觉得PPT背景颜色不够‘大气’，让你今晚改出10个版本。",
      options: [
        { text: "通宵改 (健康-20)", changes: { physical: -20, mental: -15 } },
        { text: "随便改改 (敷衍)", changes: { money: -200, mental: 5 } }
      ]
    }
  ],
  PROGRAMMER: [
    {
      title: "【事故】生产环境删库",
      desc: "你在清理日志时，手一抖敲了 rm -rf /*。虽然权限不够删根目录，但也删了不少业务数据。",
      options: [
        { text: "立即上报 (扣工资)", changes: { money: -2000, mental: -20 } },
        { text: "试图偷偷恢复 (高风险)", changes: { mental: -50, physical: -10 } }
      ]
    },
    {
      title: "【需求】五彩斑斓的黑",
      desc: "UI设计师和PM打起来了，最后决定让你来实现一个‘能根据心情变色的APP背景’。",
      options: [
        { text: "硬着头皮做 (掉头发)", changes: { physical: -15, mental: -20 } },
        { text: "掀桌子不干了 (离职警告)", changes: { mental: 30, money: -500 } }
      ]
    },
    {
      title: "【福报】996变007",
      desc: "项目到了攻坚阶段，老板宣布全员封闭开发一个月，吃住都在公司。",
      options: [
        { text: "接受福报 (身体-30)", changes: { physical: -30, money: 500 } },
        { text: "请病假 (扣钱)", changes: { money: -1000, physical: 5 } }
      ]
    },
    {
      title: "【Bug】无法复现的幽灵",
      desc: "有一个Bug只在老板的手机上出现，你查了三天三夜也没找到原因。",
      options: [
        { text: "继续死磕 (精神-25)", changes: { mental: -25, physical: -10 } },
        { text: "告诉老板是手机问题", changes: { money: -200, mental: 10 } }
      ]
    }
  ],
  FACTORY_WORKER: [
    {
      title: "【危险】机器卡住了",
      desc: "冲压机突然卡住了，如果停机维修会扣全勤奖，如果伸手去掏...",
      options: [
        { text: "伸手去掏 (极高风险)", changes: { physical: -50, mental: -20 } }, // 极大断手概率
        { text: "报修停机 (扣钱)", changes: { money: -300, mental: -5 } }
      ]
    },
    {
      title: "【压榨】强制夜班",
      desc: "线长通知，今晚通宵赶货，不干的明天不用来了。",
      options: [
        { text: "干！ (寿命-1)", changes: { physical: -25, mental: -15, money: 100 } },
        { text: "提桶跑路 (失业风险)", changes: { money: -500, mental: 10 } }
      ]
    },
    {
      title: "【冲突】食堂插队",
      desc: "吃饭时有人插队，还把汤洒在了你身上。",
      options: [
        { text: "忍气吞声 (憋屈)", changes: { mental: -20 } },
        { text: "打他一顿 (赔医药费)", changes: { money: -800, physical: -10, mental: 20 } }
      ]
    },
    {
      title: "【诱惑】偷零件",
      desc: "老乡跟你说，偷偷带点铜线出去卖，没人会发现。",
      options: [
        { text: "同流合污 (风险)", changes: { money: 500, mental: -30 } }, 
        { text: "严词拒绝", changes: { mental: 5 } }
      ]
    }
  ],
  DELIVERY: [
    {
      title: "【意外】餐品被偷",
      desc: "你上楼送餐，下来发现箱子里的另外两份外卖不见了！",
      options: [
        { text: "自掏腰包赔偿 (钱-100)", changes: { money: -100, mental: -20 } },
        { text: "报给平台 (被封号风险)", changes: { mental: -30, money: -50 } }
      ]
    },
    {
      title: "【抉择】暴雨将至",
      desc: "外面下起了特大暴雨，爆单了，每单补贴5块钱，但路面积水严重。",
      options: [
        { text: "富贵险中求 (健康-20)", changes: { physical: -20, money: 300 } },
        { text: "下线保命 (没钱)", changes: { money: 0, physical: 5 } }
      ]
    },
    {
      title: "【超时】死胡同",
      desc: "还有2分钟超时，导航把你带进了死胡同，前面是一堵墙。",
      options: [
        { text: "翻墙过去 (受伤风险)", changes: { physical: -15, mental: -10 } },
        { text: "绕路超时 (扣钱)", changes: { money: -50, mental: -15 } }
      ]
    },
    {
      title: "【侮辱】不准坐电梯",
      desc: "保安拦住你，让你走28楼的楼梯，还骂你是送饭的。",
      options: [
        { text: "爬楼梯 (体力-30)", changes: { physical: -30, mental: -20 } },
        { text: "跟保安干架 (赔钱)", changes: { money: -500, physical: -10, mental: 30 } }
      ]
    }
  ],
  SALES: [
    {
      title: "【酒局】不喝就是不给面子",
      desc: "大客户把一杯52度的白酒推到你面前：‘喝了这杯，合同就签。’",
      options: [
        { text: "干了！ (胃出血风险)", changes: { physical: -35, money: 1000, mental: -10 } },
        { text: "婉拒 (丢单)", changes: { money: -200, mental: -10 } }
      ]
    },
    {
      title: "【潜规则】客户的暗示",
      desc: "客户在KTV里对你动手动脚，暗示今晚去他家聊合同。",
      options: [
        { text: "严词拒绝 (被投诉)", changes: { money: -500, mental: 10 } },
        { text: "虚与委蛇 (精神折磨)", changes: { mental: -40, money: 200 } }
      ]
    },
    {
      title: "【欺诈】夸大宣传",
      desc: "经理让你把这个偏僻的楼盘吹成‘未来CBD核心’，否则就滚蛋。",
      options: [
        { text: "昧着良心吹 (良心痛)", changes: { mental: -25, money: 300 } },
        { text: "拒绝撒谎 (没业绩)", changes: { money: -300, mental: 5 } }
      ]
    },
    {
      title: "【竞争】同事抢单",
      desc: "你跟了一个月的客户，被同事用更低的价格截胡了。",
      options: [
        { text: "扎小人诅咒他", changes: { mental: -15 } },
        { text: "去老板那告状", changes: { mental: -20, money: -50 } }
      ]
    }
  ],
  UNEMPLOYED: [
    {
      title: "【羞辱】亲戚聚会",
      desc: "二姨当着全家人的面问你：‘还没工作呢？我儿子一个月挣两万。’",
      options: [
        { text: "当场发飙 (断绝关系)", changes: { mental: 20, money: -200 } }, // 没红包拿了
        { text: "尴尬陪笑 (内伤)", changes: { mental: -30 } }
      ]
    },
    {
      title: "【断供】经济危机",
      desc: "老爸说这个月退休金还没发，让你自己想办法解决伙食费。",
      options: [
        { text: "卖二手手办 (心痛)", changes: { mental: -20, money: 300 } },
        { text: "饿两天 (健康-15)", changes: { physical: -15, satiety: -50 } }
      ]
    },
    {
      title: "【诱惑】网络兼职",
      desc: "网上看到‘刷单’兼职，日赚500，只需垫付资金。",
      options: [
        { text: "试一试 (被骗)", changes: { money: -1000, mental: -40 } },
        { text: "肯定是骗子", changes: { mental: 5 } }
      ]
    },
    {
      title: "【深夜】网抑云时刻",
      desc: "凌晨三点，看着天花板，觉得自己是个废物。",
      options: [
        { text: "痛哭一场 (精神-20)", changes: { mental: -20 } },
        { text: "打游戏麻痹自己", changes: { mental: 10, physical: -10 } }
      ]
    }
  ]
};

// 疾病池
export const DISEASES = [
  { name: '重感冒', harm: 5, admission: 200, daily: 0, days: 0, desc: '头昏脑涨，吃药就行。' },
  { name: '急性肠胃炎', harm: 15, admission: 500, daily: 200, days: 2, desc: '喷射战士，需要挂水观察。' },
  { name: '腰椎间盘突出', harm: 10, admission: 1000, daily: 0, days: 0, desc: '老毛病，回家躺着吧。' },
  { name: '煤油中毒', harm: 40, admission: 5000, daily: 2000, days: 5, desc: '食用了罐车混装油，多器官受损，正在ICU抢救。' }, // [新增]
  { name: '重度痔疮', harm: 5, admission: 1500, daily: 300, days: 3, desc: '做了个微创手术，趴在床上动弹不得。' },
  { name: '肾结石碎石', harm: 20, admission: 2000, daily: 500, days: 2, desc: '痛不欲生，住院观察排石情况。' },
  { name: '脑溢血', harm: 50, admission: 10000, daily: 5000, days: 10, desc: 'ICU抢救中，家属正在考虑是否拔管。' }
];

// 复合死亡条件
export const COMPLEX_DEATHS = [
  {
    condition: (s: PlayerStats) => s.physical > 97, 
    text: "你在单位体检中，身体数据过于完美。当晚，一辆黑色面包车停在你家楼下。你被某种不可抗力‘特招’了，从此查无此人（传闻某位大人物急需一个健康的肾脏）。"
  },
  {
    condition: (s: PlayerStats) => s.mental < 10 && s.physical < 20,
    text: "身心俱疲的你，走在路上精神恍惚，把红灯看成了绿灯，结束了这荒诞的一生。"
  }
];
