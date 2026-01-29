import React from 'react';
import { Partner } from '../types';
import { Heart, Home, Car, Users, ShoppingBag, XCircle, Banknote, ArrowDownCircle } from 'lucide-react';
import { ASSET_COSTS } from '../constants';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  partner: Partner | null;
  flags: { 
    hasHouse: boolean; 
    hasCar: boolean; 
    parentPressure: number; 
    isPursuing: boolean 
  };
  money: number;
  debt: number; // [新增] 接收负债数据
  actions: {
    findPartner: () => void;
    dateMovie: () => void;
    dateShopping: () => void;
    confess: () => void;
    breakup: () => void;
    buyHouse: () => void;
    buyCar: () => void;
    repayDebt: (amount: number) => void; // [新增] 还款动作
  };
}

const RelationshipModal: React.FC<Props> = ({ isOpen, onClose, partner, flags, money, debt, actions }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-700 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950">
          <h2 className="text-xl font-bold text-pink-400 flex items-center">
            <Heart className="w-5 h-5 mr-2 animate-pulse" /> 情感与资产中心
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400 transition-colors">
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-8 scrollbar-thin scrollbar-thumb-zinc-700">
          
          {/* Section 1: 伴侣状态 */}
          <section>
            <h3 className="text-zinc-400 text-sm font-mono uppercase tracking-widest mb-4 flex items-center">
              Current Relationship
            </h3>
            <div className="bg-zinc-800/50 rounded-xl p-6 border border-zinc-700">
              {!partner ? (
                <div className="text-center py-4">
                  <p className="text-zinc-500 mb-4">当前状态：<span className="text-zinc-300 font-bold">单身狗</span></p>
                  <button onClick={actions.findPartner} className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-full font-bold transition-all shadow-lg shadow-pink-900/20">
                    {flags.isPursuing ? "继续做舔狗 (寻找目标)" : "去相亲角 / 刷探探"}
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
                              <ShoppingBag className="w-4 h-4 mr-2"/> 送礼物/清空购物车
                           </button>
                           <button onClick={actions.confess} className="btn-rel bg-pink-900/20 text-pink-200 border-pink-800 hover:bg-pink-900/40">
                              <Heart className="w-4 h-4 mr-2"/> 鼓起勇气表白
                           </button>
                        </div>
                     </div>
                   ) : (
                     <div className="space-y-3">
                        <p className="text-sm text-green-500 mb-2">状态：交往中 (提款机模式)</p>
                        <div className="grid grid-cols-2 gap-3">
                           <button onClick={actions.dateMovie} className="btn-rel bg-indigo-900/20 text-indigo-200 border-indigo-800 hover:bg-indigo-900/40">
                              <Users className="w-4 h-4 mr-2"/> 看电影/吃饭
                           </button>
                           <button onClick={actions.dateShopping} className="btn-rel bg-orange-900/20 text-orange-200 border-orange-800 hover:bg-orange-900/40">
                              <ShoppingBag className="w-4 h-4 mr-2"/> 逛商场 (高消费)
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

          {/* Section 2: 资产与债务 */}
          <section>
            <div className="flex justify-between items-center mb-4">
               <h3 className="text-zinc-400 text-sm font-mono uppercase tracking-widest">Assets & Debt</h3>
               <span className="text-xs text-red-400 font-bold">父母施压: {flags.parentPressure}%</span>
            </div>

            {/* [新增] 债务管理面板 */}
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
                            className="flex-1 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2.5 rounded text-xs border border-zinc-700 transition-all active:scale-95">
                           还款 1万
                        </button>
                        <button 
                            onClick={() => actions.repayDebt(100000)} 
                            disabled={money < 100000} 
                            className="flex-1 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2.5 rounded text-xs border border-zinc-700 transition-all active:scale-95">
                           还款 10万
                        </button>
                        <button 
                            onClick={() => actions.repayDebt(money)} 
                            disabled={money <= 0} 
                            className="flex-1 bg-red-900/40 hover:bg-red-800/60 disabled:opacity-50 disabled:cursor-not-allowed text-red-100 py-2.5 rounded text-xs border border-red-800 transition-all active:scale-95 flex items-center justify-center">
                           <ArrowDownCircle className="w-3 h-3 mr-1"/> All In
                        </button>
                     </div>
                 </div>
                 <p className="text-[10px] text-red-400/60 mt-3 text-center">* 每日产生 0.05% 利息，如余额不足扣息，利息将计入本金（利滚利）。</p>
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
                            <span className="font-mono text-zinc-300">¥{ASSET_COSTS.HOUSE_DOWN_PAYMENT.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-xs text-zinc-500">
                            <span>总价</span>
                            <span className="font-mono text-zinc-300">¥{ASSET_COSTS.HOUSE_TOTAL_PRICE.toLocaleString()}</span>
                        </div>
                    </div>
                    <button 
                        onClick={actions.buyHouse} 
                        className="w-full py-2 bg-zinc-700 hover:bg-green-800 text-white rounded text-sm transition-colors border border-zinc-600 hover:border-green-600">
                      {money < ASSET_COSTS.HOUSE_DOWN_PAYMENT ? '首付不足' : '支付首付 (背贷200万)'}
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
                            <span className="font-mono text-zinc-300">¥{ASSET_COSTS.CAR_COST.toLocaleString()}</span>
                        </div>
                    </div>
                    <button 
                        onClick={actions.buyCar} 
                        className="w-full py-2 bg-zinc-700 hover:bg-green-800 text-white rounded text-sm transition-colors border border-zinc-600 hover:border-green-600">
                      {money < ASSET_COSTS.CAR_COST ? '余额不足' : '全款拿下'}
                    </button>
                  </>
                ) : (
                    <div className="text-xs text-green-400 mt-2">
                        已拥有车辆，相亲成功率提升，周末可自驾游。
                    </div>
                )}
              </div>
            </div>
            
            {!debt && !flags.hasHouse && (
                 <p className="text-[10px] text-zinc-600 mt-4 text-center">
                    * 提示：购房将背负巨额贷款，请确保有稳定的现金流偿还利息。
                 </p>
            )}
          </section>

        </div>
      </div>
      <style>{`
        .btn-rel { @apply flex items-center justify-center py-3 px-4 rounded-lg font-bold border transition-all hover:brightness-125 active:scale-95 text-sm; }
      `}</style>
    </div>
  );
};

export default RelationshipModal;
