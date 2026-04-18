import React from 'react';
import { Partner, Child } from '../types';
import {
  Heart,
  Home,
  Car,
  ShoppingBag,
  XCircle,
  Banknote,
  Baby,
  ShoppingCart,
  UserPlus,
  School,
  ShieldCheck,
  AirVent,
  PiggyBank,
  Wallet,
  Gem,
  AlertTriangle
} from 'lucide-react';
import { ASSET_COSTS, PHARMACY_SHOP, EDUCATION_COSTS } from '../constants';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  partner: Partner | null;
  childrenList: Child[];
  flags: {
    hasHouse: boolean;
    hasCar: boolean;
    parentPressure: number;
    isPursuing: boolean;
    isMarried?: boolean;
    weddedPartner?: Partner | null;
    isBankFrozen?: boolean;
    bankBalance?: number;
    hasAC?: boolean;
    isACOn?: boolean;
    inventory: {
      milkPowder: number;
      diapers: number;
      [key: string]: any;
    };
    [key: string]: any;
  };
  money: number;
  debt: number;
  actions: {
    findPartner: () => void;
    deposit: (amount: number) => void;
    withdraw: () => void;
    propose: () => void;
    tryToHaveChild: () => void;
    dateMovie: () => void;
    dateShopping: () => void;
    confess: () => void;
    breakup: () => void;
    buyHouse: () => void;
    buyCar: () => void;
    repayDebt: (amount: number) => void;
    adoptChild: () => void;
    buyBabyItem: (item: any) => void;
    payTuition: (childId: string, cost: number) => void;
    buyAC?: () => void;
    toggleAC?: () => void;
  };
}

const SectionCard: React.FC<{
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  right?: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, subtitle, icon, right, children }) => {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 md:p-6">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="text-white font-bold text-lg flex items-center gap-2">
            {icon}
            {title}
          </h3>
          {subtitle && <p className="text-xs text-zinc-500 mt-1">{subtitle}</p>}
        </div>
        {right}
      </div>
      {children}
    </section>
  );
};

const Tag: React.FC<{ children: React.ReactNode; color?: 'pink' | 'green' | 'amber' | 'zinc' | 'cyan' }> = ({
  children,
  color = 'zinc',
}) => {
  const map = {
    pink: 'text-pink-200 border-pink-400/20 bg-pink-500/10',
    green: 'text-emerald-200 border-emerald-400/20 bg-emerald-500/10',
    amber: 'text-amber-200 border-amber-400/20 bg-amber-500/10',
    zinc: 'text-zinc-300 border-white/10 bg-white/[0.04]',
    cyan: 'text-cyan-200 border-cyan-400/20 bg-cyan-500/10',
  };
  return <span className={`text-[10px] px-2.5 py-1 rounded-full border ${map[color]}`}>{children}</span>;
};

const PrimaryBtn: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className = '', ...props }) => (
  <button
    {...props}
    className={`rounded-2xl border border-pink-400/20 bg-pink-500/20 hover:bg-pink-500/30 text-white px-4 py-3 text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
  />
);

const SoftBtn: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className = '', ...props }) => (
  <button
    {...props}
    className={`rounded-2xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-zinc-200 px-4 py-3 text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
  />
);

const DangerBtn: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className = '', ...props }) => (
  <button
    {...props}
    className={`rounded-2xl border border-red-400/20 bg-red-500/10 hover:bg-red-500/20 text-red-200 px-4 py-3 text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
  />
);

const RelationshipModal: React.FC<Props> = ({
  isOpen,
  onClose,
  partner,
  childrenList,
  flags,
  money,
  debt,
  actions,
}) => {
  if (!isOpen) return null;

  const isBankFrozen = !!flags.isBankFrozen;
  const bankBalance = flags.bankBalance || 0;
  const isMarried = !!flags.isMarried;
  const hasAC = !!flags.hasAC;
  const isACOn = !!flags.isACOn;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 backdrop-blur-md p-3 md:p-6">
      <div className="w-full max-w-6xl max-h-[92vh] rounded-[30px] border border-white/10 bg-zinc-950/95 shadow-[0_20px_90px_rgba(0,0,0,.6)] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 md:px-7 py-4 md:py-5 border-b border-white/10 bg-white/[0.03]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl border border-pink-400/20 bg-pink-500/10 flex items-center justify-center">
                  <Heart className="w-5 h-5 text-pink-400" />
                </div>
                家庭、情感与资产中心
              </h2>
              <p className="text-[11px] tracking-[0.2em] uppercase text-zinc-500 mt-1">
                Family / Relationship / Assets / Banking
              </p>
            </div>

            <button
              onClick={onClose}
              className="w-10 h-10 rounded-2xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 flex items-center justify-center transition-all"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-4 md:p-6 space-y-5">
          {/* 1) 感情区 */}
          <SectionCard
            title="情感状态"
            subtitle="别问爱不爱，先问钱包扛不扛得住"
            icon={<Heart className="w-4 h-4 text-pink-400" />}
            right={<Tag color="pink">{partner ? '已有目标' : '单身'}</Tag>}
          >
            {!partner ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center">
                <p className="text-zinc-400 mb-4">当前还没有情感对象，建议主动出击。</p>
                <PrimaryBtn onClick={actions.findPartner}>去相亲角 / 刷探探</PrimaryBtn>
              </div>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:p-5">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                  <div>
                    <h4 className="text-xl font-bold text-white flex items-center gap-2">
                      {partner.name}
                      <Tag color="pink">{partner.type}</Tag>
                    </h4>
                    <div className="text-xs text-zinc-500 mt-1">
                      拜金指数：{'💰'.repeat(Math.max(1, Math.ceil(partner.materialism)))}
                    </div>
                  </div>

                  <div className="rounded-xl border border-pink-400/20 bg-pink-500/10 px-3 py-2 text-right">
                    <div className="text-[10px] uppercase tracking-wider text-pink-300/80">好感度</div>
                    <div className="text-lg font-black text-pink-200">{Math.floor(partner.affection)}</div>
                  </div>
                </div>

                {flags.isPursuing ? (
                  <div className="space-y-3">
                    <div className="text-xs text-amber-300 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      状态：追求中（高投入高风险）
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <SoftBtn onClick={actions.dateShopping} className="flex items-center justify-center gap-2">
                        <ShoppingBag className="w-4 h-4" />
                        送礼物 / 逛街
                      </SoftBtn>
                      <PrimaryBtn onClick={actions.confess} className="flex items-center justify-center gap-2">
                        <Heart className="w-4 h-4" />
                        鼓起勇气表白
                      </PrimaryBtn>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="text-xs text-emerald-300 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      状态：交往中
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <SoftBtn onClick={actions.dateMovie} className="flex items-center justify-center gap-2">
                        <UserPlus className="w-4 h-4" />
                        约会 / 看电影
                      </SoftBtn>
                      <SoftBtn onClick={actions.dateShopping} className="flex items-center justify-center gap-2">
                        <ShoppingBag className="w-4 h-4" />
                        清空购物车
                      </SoftBtn>
                    </div>

                    <DangerBtn onClick={actions.breakup} className="w-full">
                      分手（及时止损）
                    </DangerBtn>
                  </div>
                )}
              </div>
            )}
          </SectionCard>

          {/* 2) 婚姻区 */}
          <SectionCard
            title="婚姻系统"
            subtitle="爱情可以冲动，婚姻最好算账"
            icon={<Gem className="w-4 h-4 text-pink-300" />}
            right={<Tag color={isMarried ? 'green' : 'amber'}>{isMarried ? '已婚' : '未婚'}</Tag>}
          >
            {isMarried ? (
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 space-y-3">
                <div className="text-emerald-100 font-semibold">
                  当前配偶：{flags.weddedPartner?.name || '未知'}
                </div>
                <PrimaryBtn onClick={actions.tryToHaveChild} className="w-full">
                  开启造人计划（生娃）
                </PrimaryBtn>
              </div>
            ) : partner && !flags.isPursuing ? (
              <div className="rounded-2xl border border-pink-400/20 bg-pink-500/10 p-4 space-y-3">
                <p className="text-pink-100 text-sm">
                  你和 <b>{partner.name}</b> 已进入稳定关系，可尝试求婚。
                </p>
                <PrimaryBtn onClick={actions.propose} className="w-full">
                  💍 向 {partner.name} 求婚
                </PrimaryBtn>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-4 text-zinc-500 text-sm">
                条件不足：需先进入稳定交往状态。
              </div>
            )}
          </SectionCard>

          {/* 3) 子女区 */}
          <SectionCard
            title="子女与育儿"
            subtitle="吞金兽系统已上线，谨慎扩编"
            icon={<Baby className="w-4 h-4 text-cyan-300" />}
            right={
              <div className="flex items-center gap-2">
                <Tag color={flags.inventory.milkPowder < 2 ? 'amber' : 'cyan'}>
                  奶粉：{flags.inventory.milkPowder}
                </Tag>
                <Tag color="zinc">尿布：{flags.inventory.diapers}</Tag>
              </div>
            }
          >
            {childrenList.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center">
                <p className="text-zinc-400 mb-4">当前膝下无子，生活压力较低。</p>
                <PrimaryBtn onClick={actions.adoptChild}>领养 / 生育（¥5000）</PrimaryBtn>
              </div>
            ) : (
              <>
                <div className="flex gap-3 overflow-x-auto pb-3">
                  {childrenList.map((child) => {
                    const stageInfo =
                      child.educationStage !== 'NONE'
                        ? (EDUCATION_COSTS as any)[child.educationStage]
                        : null;

                    return (
                      <div
                        key={child.id}
                        className="min-w-[250px] rounded-2xl border border-white/10 bg-zinc-900/70 p-4 flex-shrink-0"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <div
                            className={`font-bold ${
                              child.gender === 'boy' ? 'text-blue-300' : 'text-pink-300'
                            }`}
                          >
                            {child.name}
                          </div>
                          <Tag color="zinc">{child.age} 岁</Tag>
                        </div>

                        {/* 健康 */}
                        <div className="mb-2">
                          <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
                            <span>健康度</span>
                            <span>{child.health}%</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                            <div className="h-full bg-emerald-400" style={{ width: `${child.health}%` }} />
                          </div>
                        </div>

                        {/* 饱食 */}
                        <div className="mb-3">
                          <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
                            <span>饱食度</span>
                            <span className={child.hunger < 30 ? 'text-red-400 font-semibold' : ''}>
                              {child.hunger}%
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                            <div
                              className={`h-full ${child.hunger < 30 ? 'bg-red-400' : 'bg-orange-400'}`}
                              style={{ width: `${child.hunger}%` }}
                            />
                          </div>
                        </div>

                        <div className="text-xs text-zinc-400 mb-3">
                          阶段：<span className="text-cyan-300">{stageInfo ? stageInfo.name : '待学龄 / 婴幼儿期'}</span>
                        </div>

                        {stageInfo && !child.schoolFeePaid ? (
                          <DangerBtn
                            onClick={() => actions.payTuition(child.id, stageInfo.cost)}
                            className="w-full text-xs"
                          >
                            <div className="flex flex-col items-center">
                              <span>缴纳学费 ¥{stageInfo.cost}</span>
                              <span className="text-[10px] opacity-70">不交会触发负面成长</span>
                            </div>
                          </DangerBtn>
                        ) : stageInfo ? (
                          <div className="text-[11px] text-emerald-300 rounded-lg border border-emerald-400/20 bg-emerald-500/10 text-center py-1.5">
                            本期学费已缴
                          </div>
                        ) : (
                          <div className="text-[11px] text-zinc-500 rounded-lg border border-white/10 bg-white/[0.02] text-center py-1.5">
                            暂无学费要求
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
                  <PrimaryBtn onClick={actions.adoptChild} className="flex items-center justify-center gap-2">
                    <Baby className="w-4 h-4" />
                    领养 / 生育（¥5000）
                  </PrimaryBtn>

                  {PHARMACY_SHOP.map((item) => (
                    <SoftBtn
                      key={item.id}
                      onClick={() => actions.buyBabyItem(item)}
                      className="flex items-center justify-center gap-2"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      买{item.name}（¥{item.cost}）
                    </SoftBtn>
                  ))}
                </div>
              </>
            )}
          </SectionCard>

          {/* 4) 银行区 */}
          <SectionCard
            title="赛博银行"
            subtitle="高收益低保障，系统升级随时冻结"
            icon={<PiggyBank className="w-4 h-4 text-cyan-300" />}
            right={<Tag color={isBankFrozen ? 'amber' : 'cyan'}>{isBankFrozen ? '账户冻结' : '账户正常'}</Tag>}
          >
            <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div className="text-sm text-cyan-100">
                  存款余额：<span className="text-lg font-bold">¥{bankBalance.toLocaleString()}</span>
                </div>
                <Tag color="cyan">日息 0.015%</Tag>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <SoftBtn
                  disabled={isBankFrozen || money <= 0}
                  onClick={() => actions.deposit(money)}
                  className="flex items-center justify-center gap-2"
                >
                  <Banknote className="w-4 h-4" />
                  全部存入（¥{Math.max(0, money).toLocaleString()}）
                </SoftBtn>
                <SoftBtn
                  disabled={isBankFrozen || bankBalance <= 0}
                  onClick={actions.withdraw}
                  className="flex items-center justify-center gap-2"
                >
                  <Wallet className="w-4 h-4" />
                  全部取出
                </SoftBtn>
              </div>
            </div>
          </SectionCard>

          {/* 5) 资产与负债 */}
          <SectionCard
            title="资产与负债"
            subtitle="房车是面子，负债是里子"
            icon={<Home className="w-4 h-4 text-indigo-300" />}
            right={<Tag color="amber">父母压力：{flags.parentPressure}%</Tag>}
          >
            {debt > 0 && (
              <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4 mb-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                  <span className="text-red-100 font-semibold flex items-center gap-2">
                    <Banknote className="w-4 h-4" />
                    当前负债
                  </span>
                  <span className="text-2xl font-black text-red-300">¥{debt.toLocaleString()}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <SoftBtn disabled={money < 10000} onClick={() => actions.repayDebt(10000)}>
                    还款 1 万
                  </SoftBtn>
                  <DangerBtn disabled={money <= 0} onClick={() => actions.repayDebt(money)}>
                    All In 还款
                  </DangerBtn>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 房产 */}
              <div
                className={`rounded-2xl border p-4 ${
                  flags.hasHouse
                    ? 'border-emerald-400/20 bg-emerald-500/10'
                    : 'border-white/10 bg-white/[0.03]'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-white flex items-center gap-2">
                    <Home className={`w-4 h-4 ${flags.hasHouse ? 'text-emerald-300' : 'text-zinc-400'}`} />
                    {flags.hasHouse ? '已购房' : '婚房'}
                  </span>
                  <Tag color={flags.hasHouse ? 'green' : 'zinc'}>{flags.hasHouse ? 'Owned' : 'Missing'}</Tag>
                </div>

                {!flags.hasHouse ? (
                  <>
                    <div className="text-xs text-zinc-500 space-y-1 mb-3">
                      <div className="flex justify-between">
                        <span>首付</span>
                        <span>¥{(ASSET_COSTS.HOUSE_DOWN_PAYMENT / 10000).toFixed(0)} 万</span>
                      </div>
                      <div className="flex justify-between">
                        <span>总价</span>
                        <span>¥{(ASSET_COSTS.HOUSE_TOTAL_PRICE / 10000).toFixed(0)} 万</span>
                      </div>
                    </div>
                    <DangerBtn onClick={actions.buyHouse} className="w-full">
                      零首付强行上车（背贷）
                    </DangerBtn>
                  </>
                ) : (
                  <p className="text-xs text-emerald-200">已拥有房产，婚恋与家庭稳定性提升。</p>
                )}
              </div>

              {/* 车辆 */}
              <div
                className={`rounded-2xl border p-4 ${
                  flags.hasCar
                    ? 'border-emerald-400/20 bg-emerald-500/10'
                    : 'border-white/10 bg-white/[0.03]'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-white flex items-center gap-2">
                    <Car className={`w-4 h-4 ${flags.hasCar ? 'text-emerald-300' : 'text-zinc-400'}`} />
                    {flags.hasCar ? '已购车' : '代步车'}
                  </span>
                  <Tag color={flags.hasCar ? 'green' : 'zinc'}>{flags.hasCar ? 'Owned' : 'Missing'}</Tag>
                </div>

                {!flags.hasCar ? (
                  <>
                    <div className="text-xs text-zinc-500 mb-3">
                      全款参考：¥{(ASSET_COSTS.CAR_COST / 10000).toFixed(0)} 万
                    </div>
                    <DangerBtn onClick={actions.buyCar} className="w-full">
                      零首付提车（背贷）
                    </DangerBtn>
                  </>
                ) : (
                  <p className="text-xs text-emerald-200">已拥有车辆，社交便利性提升。</p>
                )}
              </div>

              {/* 空调 */}
              <div
                className={`rounded-2xl border p-4 md:col-span-2 ${
                  hasAC
                    ? isACOn
                      ? 'border-cyan-400/20 bg-cyan-500/10'
                      : 'border-white/10 bg-white/[0.03]'
                    : 'border-white/10 bg-white/[0.03]'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-white flex items-center gap-2">
                    <AirVent className={`w-4 h-4 ${hasAC ? 'text-cyan-300' : 'text-zinc-400'}`} />
                    {hasAC ? (isACOn ? '空调运行中' : '空调已关闭') : '暂无空调'}
                  </span>
                  <Tag color={hasAC ? 'cyan' : 'zinc'}>{hasAC ? 'Installed' : 'Not Installed'}</Tag>
                </div>

                {!hasAC ? (
                  <SoftBtn onClick={actions.buyAC} className="w-full">
                    购买空调（¥2500）
                  </SoftBtn>
                ) : (
                  <SoftBtn onClick={actions.toggleAC} className="w-full">
                    {isACOn ? '关闭空调（省电）' : '开启空调（续命）'}
                  </SoftBtn>
                )}
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
};

export default RelationshipModal;
