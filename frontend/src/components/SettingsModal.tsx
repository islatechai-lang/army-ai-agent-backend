import React, { useState, useEffect } from 'react';
import { X, Key, Database, Globe, Save, CheckCircle, Shield, Server } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiBase: string;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, apiBase }) => {
  const [unorouterKey, setUnorouterKey] = useState('');
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [whopKey, setWhopKey] = useState('');
  const [configData, setConfigData] = useState<any>(null);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetch(`${apiBase}/api/config`)
        .then(r => r.json())
        .then(data => {
          setConfigData(data);
          if (data.supabase_url && !data.supabase_url.includes('Not Configured')) {
            setSupabaseUrl(data.supabase_url);
          }
        })
        .catch(err => console.error('Error fetching config:', err));
    }
  }, [isOpen, apiBase]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveStatus('Saving...');
    try {
      const payload: any = {};
      if (unorouterKey) payload.unorouter_api_key = unorouterKey;
      if (supabaseUrl) payload.supabase_url = supabaseUrl;
      if (supabaseKey) payload.supabase_key = supabaseKey;
      if (whopKey) payload.whop_api_key = whopKey;

      const res = await fetch(`${apiBase}/api/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setSaveStatus('Saved successfully to .env!');
        setTimeout(() => setSaveStatus(null), 3000);
      }
    } catch (err) {
      setSaveStatus('Error saving settings.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-xl rounded-2xl border border-white/10 bg-[#0e101a] p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-white/10">
          <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Credentials & Army Configuration</h2>
            <p className="text-xs text-gray-400">Manage Unorouter API tokens, Supabase database, and Whop keys.</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4 text-xs font-mono">
          {/* Unorouter Key */}
          <div>
            <label className="block text-gray-300 font-semibold mb-1 flex items-center justify-between">
              <span>Unorouter API Key</span>
              <span className="text-[10px] text-gray-500">
                Current: {configData?.unorouter_api_key_masked || 'sk-UE7R...k21C'}
              </span>
            </label>
            <input
              type="password"
              value={unorouterKey}
              onChange={(e) => setUnorouterKey(e.target.value)}
              placeholder="Paste new Unorouter key to replace..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Supabase URL & Key */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-300 font-semibold mb-1 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                <span>Supabase Project URL</span>
              </label>
              <input
                type="text"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                placeholder="https://xyz.supabase.co"
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-gray-300 font-semibold mb-1 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>Supabase Anon/Service Key</span>
              </label>
              <input
                type="password"
                value={supabaseKey}
                onChange={(e) => setSupabaseKey(e.target.value)}
                placeholder="eyJhbGciOi..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Whop API Key */}
          <div>
            <label className="block text-gray-300 font-semibold mb-1 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-purple-400" />
              <span>Whop API Token / OAuth Key (Optional)</span>
            </label>
            <input
              type="password"
              value={whopKey}
              onChange={(e) => setWhopKey(e.target.value)}
              placeholder="Whop developer API token for headless production execution..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Connected Services Badge Box */}
          <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-2 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Whop Docs MCP:</span>
              <span className="text-emerald-400">https://docs.whop.com/mcp (Connected)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Whop Live API MCP:</span>
              <span className="text-emerald-400">https://mcp.whop.com/mcp (Connected)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Database Storage:</span>
              <span className="text-indigo-400">
                {supabaseUrl ? 'Supabase PostgreSQL' : 'Local SQLite (Self-Contained)'}
              </span>
            </div>
          </div>

          {/* Footer Save Button */}
          <div className="flex items-center justify-between pt-3">
            {saveStatus ? (
              <span className="text-emerald-400 font-medium text-xs flex items-center gap-1">
                <CheckCircle className="w-4 h-4" /> {saveStatus}
              </span>
            ) : <span />}

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-2 transition-colors shadow-lg shadow-indigo-600/30"
            >
              <Save className="w-4 h-4" />
              <span>Save Credentials</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
