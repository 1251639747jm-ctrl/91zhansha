import React from 'react';
import { Partner } from '../types';
import { Heart, Home, Car, Users, Gift, ShoppingBag, HeartCrack, XCircle } from 'lucide-react';
import { ASSET_COSTS } from '../constants';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  partner: Partner | null;
  flags: { hasHouse: boolean; hasCar: boolean; parentPressure: number; isPursuing: boolean };
  money: number;
  actions: {
    findPartner: () => void;
    dateMovie: () => void;
    dateShopping: () => void;
    confess: () => void; // 表白
    breakup: () => void;
    buyHouse: () => void;
    buyCar: () => void;
  };
}

const RelationshipModal: React.FC<Props> = ({ isOpen, onClose, partner, flags, money, actions }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-700 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950">
          <h2 className="text-xl font-bold text-pink-400 flex items-center">
            <Heart className="w-5 h-5 mr-2 animate-pulse" /> 情感与家庭中心
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400">
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-8">
          
          {/* Section 1: 伴侣状态 */}
          <section>
            <h3 className="text-zinc-400 text-sm font-mono uppercase tracking-widest mb-4">Current Relationship</h3>
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
                         <div className="text-xs text-zinc-600">(你猜?)</div>
                      </div>
                   </div>

                   {flags.isPursuing ? (
                     <div className="space-y-3">
                        <p className="text-sm text-yellow-500 mb-2">状态：正在苦苦追求中...</p>
                        <div className="grid grid-cols-2 gap-3">
                           <button onClick={actions.dateShopping} className="btn-rel bg-orange-900/40 text-orange-200 border-orange-800">
                              <ShoppingBag className="w-4 h-4 mr-2"/> 送礼物/清空购物车
                           </button>
                           <button onClick={actions.confess} className="btn-rel bg-pink-900/40 text-pink-200 border-pink-800">
                              <Heart className="w-4 h-4 mr-2"/> 鼓起勇气表白
                           </button>
                        </div>
                     </div>
                   ) : (
                     <div className="space-y-3">
                        <p className="text-sm text-green-500 mb-2">状态：交往中 (提款机模式)</p>
                        <div className="grid grid-cols-2 gap-3">
                           <button onClick={actions.dateMovie} className="btn-rel bg-indigo-900/40 text-indigo-200 border-indigo-800">
                              <Users className="w-4 h-4 mr-2"/> 看电影/吃饭
                           </button>
                           <button onClick={actions.dateShopping} className="btn-rel bg-orange-900/40 text-orange-200 border-orange-800">
                              <ShoppingBag className="w-4 h-4 mr-2"/> 逛商场 (高消费)
                           </button>
                        </div>
                        <button onClick={actions.breakup} className="w-full mt-3 py-2 text-sm text-red-400 hover:text-red-300 border border-red-900/30 hover:bg-red-900/20 rounded">
                           分手 (及时止损)
                        </button>
                     </div>
                   )}
                </div>
              )}
            </div>
          </section>

          {/* Section 2: 家庭重压 */}
          <section>
            <div className="flex justify-between items-center mb-4">
               <h3 className="text-zinc-400 text-sm font-mono uppercase tracking-widest">Parental Pressure</h3>
               <span className="text-xs text-red-400 font-bold">催命指数: {flags.parentPressure}%</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 房产 */}
              <div className={`p-4 rounded-xl border ${flags.hasHouse ? 'bg-green-900/20 border-green-800' : 'bg-zinc-800/50 border-zinc-700'}`}>
                <div className="flex items-center mb-3">
                  <Home className={`w-5 h-5 mr-2 ${flags.hasHouse ? 'text-green-500' : 'text-zinc-500'}`} />
                  <span className="font-bold text-white">{flags.hasHouse ? '已购房' : '刚需婚房'}</span>
                </div>
                {!flags.hasHouse && (
                  <>
                    <p className="text-xs text-zinc-500 mb-3">首付: ¥{ASSET_COSTS.HOUSE_DOWN_PAYMENT.toLocaleString()}</p>
                    <button onClick={actions.buyHouse} className="w-full py-2 bg-zinc-700 hover:bg-green-800 text-white rounded text-sm transition-colors">
                      {money < ASSET_COSTS.HOUSE_DOWN_PAYMENT ? '强制贷款买房 (负债)' : '全款拿下'}
                    </button>
                  </>
                )}
              </div>

              {/* 车子 */}
              <div className={`p-4 rounded-xl border ${flags.hasCar ? 'bg-green-900/20 border-green-800' : 'bg-zinc-800/50 border-zinc-700'}`}>
                <div className="flex items-center mb-3">
                  <Car className={`w-5 h-5 mr-2 ${flags.hasCar ? 'text-green-500' : 'text-zinc-500'}`} />
                  <span className="font-bold text-white">{flags.hasCar ? '已购车' : '代步车'}</span>
                </div>
                {!flags.hasCar && (
                  <>
                    <p className="text-xs text-zinc-500 mb-3">价格: ¥{ASSET_COSTS.CAR_COST.toLocaleString()}</p>
                    <button onClick={actions.buyCar} className="w-full py-2 bg-zinc-700 hover:bg-green-800 text-white rounded text-sm transition-colors">
                      {money < ASSET_COSTS.CAR_COST ? '强制贷款买车' : '全款拿下'}
                    </button>
                  </>
                )}
              </div>
            </div>
            <p className="text-[10px] text-zinc-600 mt-2 text-center">* 提示：资金不足时强行购买将导致巨额负债，可能直接导致游戏结束。</p>
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
