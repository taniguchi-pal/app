"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === "pa1style" && password === "pal001") {
      router.push("/budget");
    } else {
      setError("AUTHENTICATION FAILED. INVALID CREDENTIALS.");
    }
  };

  return (
    <div translate="no" className="relative min-h-screen bg-[#f0f2f5] text-zinc-800 flex items-center justify-center font-noto overflow-hidden select-none">
      
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&family=Noto+Sans+JP:wght@400;500;700&display=swap');
        .font-montserrat { font-family: 'Montserrat', sans-serif; }
        .font-noto { font-family: 'Noto Sans JP', sans-serif; }
        @keyframes scan-line {
          0% { transform: translateY(-100vh); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(100vh); opacity: 0; }
        }
        @keyframes agv-path {
          0% { left: -5%; top: 20%; }
          20% { left: 30%; top: 20%; }
          30% { left: 30%; top: 80%; }
          70% { left: 80%; top: 80%; }
          80% { left: 80%; top: 30%; }
          100% { left: 105%; top: 30%; }
        }
      `}} />

      {/* 🌐 背景サイバーグリッドとアニメーション */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(26,54,110,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(26,54,110,0.04)_1px,transparent_1px)] bg-[size:40px_40px]" />
      <div className="absolute w-3 h-3 bg-blue-800 rounded-sm shadow-[0_0_15px_rgba(29,78,216,0.6)] animate-[agv-path_15s_linear_infinite] flex items-center justify-center z-0">
        <div className="w-1 h-1 bg-white rounded-full animate-pulse" />
      </div>
      <div className="absolute left-0 w-full h-[2px] bg-gradient-to-r from-blue-900 via-blue-500 to-blue-900 shadow-[0_0_15px_rgba(29,78,216,0.5)] animate-[scan-line_7s_ease-in-out_infinite] z-0" />

      {/* 🔮 メインログインボックス */}
      <div className="w-full max-w-md p-10 rounded-[32px] bg-white border border-white shadow-[0_20px_60px_rgba(0,0,0,0.05)] relative z-10">
        
        <div className="text-center mb-10 relative">
          {/* 💡 ロゴの貼り付け感を消すためのCSS (mix-blend-multiply と opacity-90) を追加 */}
          <img src="/logo.png" alt="PAL LOGO" className="h-14 object-contain mx-auto mix-blend-multiply opacity-90" />
          
          <div className="mt-7 border-t border-zinc-100 pt-5 relative">
            <div className="absolute -top-[3px] left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-blue-600"></div>
            
            {/* スローガン */}
            <h1 className="text-[14px] font-bold font-noto tracking-tight text-zinc-900 leading-relaxed">
              フィジカルを超え、<br />PAL COREソリューションで未来を創る。
            </h1>
            <p className="text-[9px] font-medium text-blue-600 font-montserrat tracking-[0.05em] uppercase mt-2 leading-relaxed">
              Beyond Physical. Creating the Future with PAL CORE Solutions.
            </p>
          </div>
        </div>

        {/* フォーム */}
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-zinc-400 ml-1 font-montserrat tracking-widest uppercase">Account ID</label>
            {/* 💡 placeholderを完全に削除 */}
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-[#f8f9fb] border border-zinc-100 rounded-2xl p-4 text-sm text-zinc-900 outline-none focus:border-blue-600 focus:bg-white transition-all font-mono shadow-inner shadow-zinc-100/50" required />
          </div>
          
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-zinc-400 ml-1 font-montserrat tracking-widest uppercase">Password</label>
            {/* 💡 placeholderを完全に削除 */}
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-[#f8f9fb] border border-zinc-100 rounded-2xl p-4 text-sm text-zinc-900 outline-none focus:border-blue-600 focus:bg-white transition-all font-mono shadow-inner shadow-zinc-100/50" required />
          </div>

          {error && <p className="text-[11px] font-mono font-bold text-rose-500 bg-rose-50 p-4 rounded-xl border border-rose-100 text-center animate-pulse">{error}</p>}
          
          <button type="submit" className="w-full py-4 mt-2 bg-gradient-to-r from-blue-900 to-blue-700 hover:from-blue-800 hover:to-blue-600 text-white font-bold text-xs rounded-2xl transition-all duration-150 active:scale-[0.98] shadow-lg shadow-blue-900/20 font-montserrat tracking-[0.2em]">
            INITIALIZE SYSTEM ➔
          </button>
        </form>
      </div>
    </div>
  );
}