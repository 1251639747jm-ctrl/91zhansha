import React from 'react';
import { Partner, Child } from '../types';
import { 
  Heart, Home, Car, ShoppingBag, XCircle, Banknote, 
  Baby, ShoppingCart, UserPlus, School
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
    inventory: {
        milkPowder: number;
        diapers: number;
        [key: string]: any;
    }; 
  };
  money: number;
  debt: number;
  actions: {
    findPartner: () => void;
    dateMovie: () => void;
    dateShopping: () => void;
    confess: () => void;
    breakup: () => void;
    buyHouse: () => void;
    buyCar: () => void;
    repayDebt: (amount: number) => void;
    // 子女相关
    adoptChild: () => void;
    buyBabyItem: (item: any) => void;
    payTuition: (childId: string, cost: number) => void;
  };
}

const RelationshipModal: React.FC<Props> = ({ isOpen, onClose, partner, childrenList, flags, money, debt, actions }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-700 w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950">
          <h2 className="text-xl font-bold text-pink-400 flex items-center">
            <Heart className="w-5 h-5 mr-2 animate-pulse" /> 家庭、情感与资产中心
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400 transition-colors">
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-8 scrollbar-thin scrollbar-thumb-zinc-700">
          
          {/* Section 1: 伴侣状态 */}
          <section>
            <h3 className="text-zinc-400 text-sm font-mono uppercase tracking-widest mb-4 flex items-center">
              Relationship Status
            </h3>
            <div className="bg-zinc-800/50 rounded-xl p-6 border border-zinc-700">
              {!partner ? (
                <div className="text-center py-4">
                  <p className="text-zinc-500 mb-4">当前状态：<span className="text-zinc-300 font-bold">单身</span></p>
                  <button onClick={actions.findPartner} className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-full font-bold transition-all shadow-lg shadow-pink-900/20">
                    {flags.isPursuing ? "继续寻找目标" : "去相亲角 / 刷探探"}
                  </button>
                </div>
              ) : (
                <div>
                   <div className="flex justify-between items-start mb-6">
                      <div>
                        <h4 className="text-2xl font-bold text-white flex items-center">
                          {partner.name} 
                          <span className="ml-2 text-xs bg-pink-900 text-pink-200 px-2 py-0.5 rounded-full border border-pink-700">{partner.type}</span>
                        </h4>
                        <p className="text-xs text-zinc-500 mt-1">拜金指数: {'💰'.repeat(Math.ceil(partner.materialism))}</p>
                      </div>
                      <div className="text-right">
                         <div className="text-sm text-zinc-400">好感度</div>
                         <div className="flex items-center justify-end space-x-1 mt-1">
                            <Heart className={`w-3 h-3 ${partner.affection > 50 ? 'text-pink-500 fill-pink-500' : 'text-zinc-600'}`} />
                            <span className="text-pink-400 font-bold">{Math.floor(partner.affection)}</span>
                         </div>
                      </div>
                   </div>

                   {flags.isPursuing ? (
                     <div className="space-y-3">
                        <p className="text-sm text-yellow-500 mb-2">状态：正在苦苦追求中...</p>
                        <div className="grid grid-cols-2 gap-3">
                           <button onClick={actions.dateShopping} className="btn-rel bg-orange-900/20 text-orange-200 border-orange-800 hover:bg-orange-900/40">
                              <ShoppingBag className="w-4 h-4 mr-2"/> 送礼物
                           </button>
                           <button onClick={actions.confess} className="btn-rel bg-pink-900/20 text-pink-200 border-pink-800 hover:bg-pink-900/40">
                              <Heart className="w-4 h-4 mr-2"/> 鼓起勇气表白
                           </button>
                        </div>
                     </div>
                   ) : (
                     <div className="space-y-3">
                        <p className="text-sm text-green-500 mb-2">状态：交往中</p>
                        <div className="grid grid-cols-2 gap-3">
                           <button onClick={actions.dateMovie} className="btn-rel bg-indigo-900/20 text-indigo-200 border-indigo-800 hover:bg-indigo-900/40">
                              <UserPlus className="w-4 h-4 mr-2"/> 约会/看电影
                           </button>
                           <button onClick={actions.dateShopping} className="btn-rel bg-orange-900/20 text-orange-200 border-orange-800 hover:bg-orange-900/40">
                              <ShoppingBag className="w-4 h-4 mr-2"/> 清空购物车
                           </button>
                        </div>
                        <button onClick={actions.breakup} className="w-full mt-3 py-2 text-sm text-red-400 hover:text-red-300 border border-red-900/30 hover:bg-red-900/20 rounded transition-colors">
                           分手 (及时止损)
                        </button>
                     </div>
                   )}
                </div>
              )}
            </div>
          </section>

{/* Section 2: 子女与育儿 */}
          <section>
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-zinc-400 text-sm font-mono uppercase tracking-widest">Children & Family</h3>
                <div className="text-xs text-zinc-500 flex space-x-3">
                    <span className={flags.inventory.milkPowder < 2 ? "text-red-500 animate-pulse font-bold" : ""}>奶粉: {flags.inventory.milkPowder}</span>
                    <span>尿布: {flags.inventory.diapers}</span>
                </div>
             </div>
             
             <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700 mb-4">
                {childrenList.length === 0 ? (
                    <div className="text-zinc-500 text-sm w-full text-center py-8 border border-dashed border-zinc-700 rounded-lg mb-4">
                        膝下无子。是否考虑领养或生育，体验吞金兽的威力？
                    </div>
                ) : (
                    <div className="flex gap-3 overflow-x-auto pb-4 mb-4 scrollbar-thin scrollbar-thumb-zinc-600">
                        {childrenList.map((child) => {
                             const stageInfo = (EDUCATION_COSTS as any)[child.educationStage];
                             return (
                                <div key={child.id} className="min-w-[220px] bg-zinc-900 p-4 rounded-lg border border-zinc-700 flex-shrink-0 relative group">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className={`font-bold text-lg ${child.gender === 'boy' ? 'text-blue-300' : 'text-pink-300'}`}>
                                            {child.name}
                                        </span>
                                        <span className="text-xs bg-zinc-800 px-2 py-0.5 rounded text-zinc-400 border border-zinc-700">{child.age}岁</span>
                                    </div>
                                    <div className="space-y-1.5 mb-3">
                                        <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                                            <div className="bg-green-500 h-full" style={{width: `${child.health}%`}} />
                                        </div>
                                        <div className="flex justify-between text-[10px] text-zinc-500">
                                            <span>健康度</span>
                                            <span>{child.health}%</span>
                                        </div>

                                        <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                                            <div className={`h-full ${child.hunger < 30 ? 'bg-red-500' : 'bg-orange-400'}`} style={{width: `${child.hunger}%`}} />
                                        </div>
                                        <div className="flex justify-between text-[10px] text-zinc-500">
                                            <span>饱食度</span>
                                            <span className={child.hunger < 30 ? "text-red-400 font-bold" : ""}>{child.hunger}%</span>
                                        </div>
                                        
                                        <div className="text-xs text-zinc-300 mt-2 pt-2 border-t border-zinc-800">
                                            当前阶段: <span className="text-indigo-300">{stageInfo ? stageInfo.name : '纯烧钱阶段(待产/待学)'}</span>
                                        </div>
                                    </div>
                                    
                                    {stageInfo && !child.schoolFeePaid && (
                                        <button onClick={() => actions.payTuition(child.id, stageInfo.cost)} 
                                            className="w-full text-xs bg-red-900/40 text-red-200 border border-red-600 py-2 rounded hover:bg-red-800 transition-all flex flex-col items-center justify-center animate-pulse">
                                            <span className="font-bold">缴纳赎身费(学费) ¥{stageInfo.cost}</span>
                                            <span className="text-[9px] opacity-70">不交钱孩子就变废柴了</span>
                                        </button>
                                    )}
                                    {stageInfo && child.schoolFeePaid && (
                                         <div className="w-full text-center text-[10px] text-green-500 bg-green-900/10 py-1 rounded border border-green-900/30">
                                            本期学费已缴
                                         </div>
                                    )}
                                </div>
                             );
                        })}
                    </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 border-t border-zinc-700 pt-4">
                     <button onClick={actions.adoptChild} className="btn-rel h-12 text-xs bg-green-900/20 text-green-200 border-green-800 hover:bg-green-900/30">
                        <Baby className="w-4 h-4 mr-2"/> 领养/生育 (¥5000)
                     </button>
                     {PHARMACY_SHOP.map(item => (
                         <button key={item.id} onClick={() => actions.buyBabyItem(item)} className="btn-rel h-12 text-xs bg-zinc-800 text-zinc-300 border-zinc-600 hover:bg-zinc-700">
                             <ShoppingCart className="w-3 h-3 mr-2 text-zinc-500"/> 
                             <div className="flex flex-col items-start">
                                 <span>买{item.name}</span>
                                 <span className="text-[10px] opacity-60">¥{item.cost}</span>
                             </div>
                         </button>
                     ))}
                </div>
             </div>
          </section>
          {/* Section 3: 资产与债务 */}
          <section>
            <div className="flex justify-between items-center mb-4">
               <h3 className="text-zinc-400 text-sm font-mono uppercase tracking-widest">Assets & Debt</h3>
               <span className="text-xs text-red-400 font-bold">父母施压: {flags.parentPressure}%</span>
            </div>

            {debt > 0 && (
              <div className="mb-6 bg-red-950/20 border border-red-900/50 p-4 rounded-xl backdrop-blur-sm">
                 <div className="flex justify-between items-center mb-4 border-b border-red-900/30 pb-3">
                    <span className="text-red-200 font-bold flex items-center">
                        <Banknote className="w-5 h-5 mr-2" /> 当前负债 (房贷/车贷)
                    </span>
                    <span className="text-2xl font-mono text-red-400 font-bold">¥{debt.toLocaleString()}</span>
                 </div>
                 
                 <div className="flex flex-col space-y-2">
                    <p className="text-xs text-red-300/70 mb-1">提前还款 (降低每日利息):</p>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => actions.repayDebt(10000)} 
                            disabled={money < 10000} 
                            className="flex-1 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white py-2.5 rounded text-xs border border-zinc-700 transition-all">
                           还款 1万
                        </button>
                        <button 
                            onClick={() => actions.repayDebt(money)} 
                            disabled={money <= 0} 
                            className="flex-1 bg-red-900/40 hover:bg-red-800/60 disabled:opacity-50 text-red-100 py-2.5 rounded text-xs border border-red-800 transition-all flex items-center justify-center">
                           <Banknote className="w-3 h-3 mr-1"/> All In
                        </button>
                     </div>
                 </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 房产 */}
              <div className={`p-4 rounded-xl border ${flags.hasHouse ? 'bg-green-900/20 border-green-800' : 'bg-zinc-800/50 border-zinc-700'}`}>
                <div className="flex items-center mb-3">
                  <Home className={`w-5 h-5 mr-2 ${flags.hasHouse ? 'text-green-500' : 'text-zinc-500'}`} />
                  <span className="font-bold text-white">{flags.hasHouse ? '已购房' : '刚需婚房'}</span>
                </div>
                {!flags.hasHouse ? (
                  <>
                    <div className="space-y-1 mb-4">
                        <div className="flex justify-between text-xs text-zinc-500">
                            <span>首付</span>
                            <span className="font-mono text-zinc-300">¥{(ASSET_COSTS.HOUSE_DOWN_PAYMENT/10000).toFixed(0)}万</span>
                        </div>
                        <div className="flex justify-between text-xs text-zinc-500">
                            <span>总价</span>
                            <span className="font-mono text-zinc-300">¥{(ASSET_COSTS.HOUSE_TOTAL_PRICE/10000).toFixed(0)}万</span>
                        </div>
                    </div>
                    <button 
    onClick={actions.buyHouse} 
    className="w-full py-2 bg-red-900/40 hover:bg-red-800 text-white rounded text-sm transition-colors border border-red-700 hover:border-red-500">
  零首付强行贷款买房 (背贷)
</button>
                  </>
                ) : (
                    <div className="text-xs text-green-400 mt-2">
                        已拥有房产，每晚精神恢复 +5，抗压能力提升。
                    </div>
                )}
              </div>

              {/* 车子 */}
              <div className={`p-4 rounded-xl border ${flags.hasCar ? 'bg-green-900/20 border-green-800' : 'bg-zinc-800/50 border-zinc-700'}`}>
                <div className="flex items-center mb-3">
                  <Car className={`w-5 h-5 mr-2 ${flags.hasCar ? 'text-green-500' : 'text-zinc-500'}`} />
                  <span className="font-bold text-white">{flags.hasCar ? '已购车' : '代步车'}</span>
                </div>
                {!flags.hasCar ? (
                  <>
                    <div className="space-y-1 mb-4">
                        <div className="flex justify-between text-xs text-zinc-500">
                            <span>全款</span>
                            <span className="font-mono text-zinc-300">¥{(ASSET_COSTS.CAR_COST/10000).toFixed(0)}万</span>
                        </div>
                    </div>
                    <button 
    onClick={actions.buyCar} 
    className="w-full py-2 bg-red-900/40 hover:bg-red-800 text-white rounded text-sm transition-colors border border-red-700 hover:border-red-500">
  零首付强行贷款买车 (背贷)
</button>
                  </>
                ) : (
                    <div className="text-xs text-green-400 mt-2">
                        已拥有车辆，相亲成功率提升，周末可自驾游。
                    </div>
                )}
              </div>
              {/* 空调资产 */}
<div className={`p-4 rounded-xl border ${flags.hasAC ? (flags.isACOn ? 'bg-cyan-900/20 border-cyan-800' : 'bg-zinc-800/50 border-zinc-600') : 'bg-zinc-800/50 border-zinc-700'}`}>
  <div className="flex items-center justify-between mb-3">
    <div className="flex items-center">
      <span className="font-bold text-white flex items-center">
         {flags.hasAC ? (flags.isACOn ? '🧊 空调(运行中)' : '⏹ 空调(已关)') : '🥵 无空调'}
      </span>
    </div>
    {flags.hasAC && (
       <span className="text-xs text-zinc-500 font-mono">-¥15/天</span>
    )}
  </div>
  
  {!flags.hasAC ? (
    <button onClick={actions.buyAC} className="w-full py-2 bg-blue-900/40 hover:bg-blue-800 text-blue-200 rounded text-sm transition-colors border border-blue-700">
      购买壁挂空调 (¥2500)
    </button>
  ) : (
    <button onClick={actions.toggleAC} className={`w-full py-2 rounded text-sm transition-colors border ${flags.isACOn ? 'bg-zinc-700 text-zinc-300 border-zinc-600 hover:bg-zinc-600' : 'bg-cyan-900/50 text-cyan-200 border-cyan-700 hover:bg-cyan-800'}`}>
      {flags.isACOn ? '关闭空调 (省钱)' : '开启空调 (续命)'}
    </button>
  )}
</div>
            </div>
          </section>

        </div>
      </div>
      <style>{`
        .btn-rel { @apply flex items-center justify-center py-2 px-3 rounded-lg font-bold border transition-all hover:brightness-125 active:scale-95 text-sm; }
      `}</style>
    </div>
  );
};

export default RelationshipModal;
