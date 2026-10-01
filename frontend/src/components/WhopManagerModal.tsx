import React, { useState, useEffect } from 'react';
import { 
  X, RefreshCw, Trash2, Tag, ShoppingBag, MessageSquare, 
  ExternalLink, CheckCircle2, AlertTriangle, Send, Sparkles, Shield
} from 'lucide-react';

interface WhopManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataChanged: () => void;
}

const API_BASE = typeof window !== 'undefined' && window.location.port === '5173' ? 'http://localhost:8000' : '';

export function WhopManagerModal({ isOpen, onClose, onDataChanged }: WhopManagerModalProps) {
  const [activeTab, setActiveTab] = useState<'products' | 'promos' | 'forum'>('products');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [promoCodes, setPromoCodes] = useState<any[]>([]);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Forum post form state
  const [forumTitle, setForumTitle] = useState('');
  const [forumContent, setForumContent] = useState('');
  const [isPostingForum, setIsPostingForum] = useState(false);

  const fetchWhopData = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`${API_BASE}/api/whop/sync`);
      const data = await res.json();
      if (data.success) {
        setProducts(data.products || []);
        setPromoCodes(data.promo_codes || []);
        setMessage({ text: `Successfully synced with live Whop account! (${(data.products || []).length} products, ${(data.promo_codes || []).length} promo codes)`, type: 'success' });
        onDataChanged();
      } else {
        setMessage({ text: data.error || 'Failed to sync with Whop', type: 'error' });
      }
    } catch (err: any) {
      setMessage({ text: err.message || 'Network error syncing with Whop', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchWhopData();
    }
  }, [isOpen]);

  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm(`Permanently delete Whop product ${productId}? This action cannot be undone.`)) {
      return;
    }
    setActionLoading(`prod_${productId}`);
    try {
      const res = await fetch(`${API_BASE}/api/whop/products/${productId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setProducts(prev => prev.filter(p => p.id !== productId));
        setMessage({ text: `Product ${productId} deleted successfully from Whop!`, type: 'success' });
        onDataChanged();
      } else {
        setMessage({ text: `Failed to delete product: ${JSON.stringify(data.result?.error || data)}`, type: 'error' });
      }
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeletePromoCode = async (promoId: string) => {
    if (!window.confirm(`Permanently delete promo code ${promoId}?`)) {
      return;
    }
    setActionLoading(`promo_${promoId}`);
    try {
      const res = await fetch(`${API_BASE}/api/whop/promo-codes/${promoId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setPromoCodes(prev => prev.filter(p => p.id !== promoId));
        setMessage({ text: `Promo code ${promoId} deleted successfully from Whop!`, type: 'success' });
        onDataChanged();
      } else {
        setMessage({ text: `Failed to delete promo code: ${JSON.stringify(data.result?.error || data)}`, type: 'error' });
      }
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const handlePostForum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forumTitle.trim() || !forumContent.trim()) return;
    setIsPostingForum(true);
    setMessage(null);
    try {
      const res = await fetch(`${API_BASE}/api/whop/forum/post`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          experience_id: 'exp_GayTl6drytQZDO',
          title: forumTitle,
          content: forumContent
        })
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ text: `Discussion posted to live Whop community forum!`, type: 'success' });
        setForumTitle('');
        setForumContent('');
      } else {
        setMessage({ text: `Forum post error: ${data.error || 'Check Whop API key'}`, type: 'error' });
      }
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setIsPostingForum(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0e111a] border border-white/10 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-sans">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-black/40">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-white tracking-wide">Live Whop Account Manager</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono">
                  biz_wDSHPXqL0Ew9Jr
                </span>
              </div>
              <p className="text-xs text-gray-400">Direct CRUD control over products, promo codes, and community apps</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={fetchWhopData}
              disabled={loading}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 transition-colors flex items-center gap-1.5 text-xs font-mono"
              title="Sync Live Whop Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
              <span className="hidden sm:inline">Sync</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feedback Banner */}
        {message && (
          <div className={`px-5 py-2.5 text-xs font-mono flex items-center space-x-2 border-b ${
            message.type === 'success' 
              ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/20' 
              : 'bg-rose-950/40 text-rose-300 border-rose-500/20'
          }`}>
            {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
            <span className="truncate">{message.text}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-white/10 bg-black/20 px-5 text-xs font-mono overflow-x-auto">
          <button
            onClick={() => setActiveTab('products')}
            className={`py-3 px-4 border-b-2 font-bold transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'products'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Products ({products.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('promos')}
            className={`py-3 px-4 border-b-2 font-bold transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'promos'
                ? 'border-amber-500 text-amber-400 bg-amber-500/5'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Promo Codes ({promoCodes.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('forum')}
            className={`py-3 px-4 border-b-2 font-bold transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'forum'
                ? 'border-purple-500 text-purple-400 bg-purple-500/5'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Community Forum (exp_GayTl6drytQZDO)</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          
          {/* TAB 1: PRODUCTS */}
          {activeTab === 'products' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>Active products on your Whop company:</span>
                <span className="font-mono text-gray-500">{products.length} found</span>
              </div>

              {products.length === 0 ? (
                <div className="text-center py-12 rounded-xl border border-dashed border-white/10 bg-black/20 text-gray-500 text-xs">
                  No products found on account or click "Sync" to refresh.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {products.map((prod) => (
                    <div
                      key={prod.id}
                      className="p-4 rounded-xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-bold text-white text-sm">
                            {prod.title || prod.name || 'Untitled Whop Product'}
                          </h4>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            {prod.id}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 line-clamp-1">
                          {prod.description || 'Live Whop Marketplace Product'}
                        </p>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <a
                          href={`https://whop.com/hub/`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-gray-300 font-mono flex items-center gap-1.5 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Whop Hub</span>
                        </a>

                        <button
                          onClick={() => handleDeleteProduct(prod.id)}
                          disabled={actionLoading === `prod_${prod.id}`}
                          className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{actionLoading === `prod_${prod.id}` ? 'Deleting...' : 'Delete'}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PROMO CODES */}
          {activeTab === 'promos' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>Active discount & promo codes:</span>
                <span className="font-mono text-gray-500">{promoCodes.length} found</span>
              </div>

              {promoCodes.length === 0 ? (
                <div className="text-center py-12 rounded-xl border border-dashed border-white/10 bg-black/20 text-gray-500 text-xs">
                  No promo codes found or click "Sync" to refresh.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {promoCodes.map((p) => {
                    const promoId = p.id;
                    const code = p.code || p.id;
                    const discount = p.amount_off ? `${p.amount_off}% OFF` : 'Active Discount';
                    return (
                      <div
                        key={promoId}
                        className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all flex items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <Tag className="w-3.5 h-3.5 text-amber-400" />
                            <span className="font-mono font-bold text-amber-300 text-sm">{code}</span>
                          </div>
                          <div className="text-[11px] font-mono text-gray-400 flex items-center gap-2">
                            <span className="text-emerald-400">{discount}</span>
                            <span className="text-gray-600">•</span>
                            <span className="text-gray-500">{promoId}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeletePromoCode(promoId)}
                          disabled={actionLoading === `promo_${promoId}`}
                          className="p-2 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 transition-colors cursor-pointer shrink-0"
                          title="Delete Promo Code"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: COMMUNITY FORUM APP */}
          {activeTab === 'forum' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 space-y-2">
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-purple-400" />
                  <h4 className="font-bold text-white text-xs">Connected Whop Community Experience</h4>
                </div>
                <p className="text-xs text-gray-300">
                  Experience ID: <code className="text-purple-300 font-mono">exp_GayTl6drytQZDO</code>. 
                  This is the real community forum attached to your Whop products. Customers gain instant access upon checkout.
                </p>
              </div>

              <form onSubmit={handlePostForum} className="space-y-3 bg-black/40 p-4 rounded-xl border border-white/10">
                <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Publish Announcement or Discussion to Whop Forum</span>
                </h4>

                <div>
                  <label className="block text-[11px] font-mono text-gray-400 mb-1">Post Title</label>
                  <input
                    type="text"
                    value={forumTitle}
                    onChange={(e) => setForumTitle(e.target.value)}
                    placeholder="e.g. Welcome to VIP Members! Download Your Launch Assets Here"
                    className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-gray-400 mb-1">Discussion Content</label>
                  <textarea
                    value={forumContent}
                    onChange={(e) => setForumContent(e.target.value)}
                    rows={4}
                    placeholder="Write detailed member onboarding guidance, download links, or weekly prompts..."
                    className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isPostingForum || !forumTitle.trim() || !forumContent.trim()}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-purple-600/30"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isPostingForum ? 'Publishing to Whop...' : 'Publish to Live Forum'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-white/10 bg-black/40 flex items-center justify-between text-xs font-mono text-gray-400">
          <span>Target Business: biz_wDSHPXqL0Ew9Jr</span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
