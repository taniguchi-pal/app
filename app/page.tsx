"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PortalPage() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const MASTER_ID = "pa1style";
  const MASTER_PW = "pal001";

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return <div className="min-h-screen bg-[#050a18]"></div>;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (userId === MASTER_ID && password === MASTER_PW) {
      setError("");
      router.push("/budget");
    } else {
      setError("IDまたはパスワードが正しくありません。");
    }
  };

  return (
    <div translate="no" className="relative min-h-screen bg-[#050a18] overflow-hidden flex items-center justify-center text-white select-none var(--font-noto)">
      
      <style dangerouslySetInnerHTML={{ __html: `
        .font-montserrat { font-family: var(--font-montserrat), sans-serif; }
        .font-noto { font-family: var(--font-noto), sans-serif; }
        
        @keyframes agv-move { 0% { transform: translateX(-100vw); } 100% { transform: translateX(100vw); } }
        @keyframes bg-pan { 0% { transform: scale(1.1) translateX(2%); } 100% { transform: scale(1.1) translateX(-2%); } }
        @keyframes fade-in { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
      `}} />

      {/* 🚚 背景：リアル自動リフト（AGV）画像の透過 ＆ ゆっくりスライド移動 */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center opacity-25 pointer-events-none"
        style={{ 
          backgroundImage: "url('/agv-bg.jpg')",
          animation: "bg-pan 40s alternate ease-in-out infinite" 
        }} 
      />
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#050a18] via-[#050a18]/85 to-[#050a18]/95 pointer-events-none" />
      
      {/* 🤖 AGVの走る軌跡（ネオンライン） */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
         <div 
           className="absolute h-[2px] w-[30vw] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_20px_#22d3ee] top-1/4 left-0 opacity-60" 
           style={{ animation: "agv-move 7s linear infinite" }}
         />
         <div 
           className="absolute h-[1px] w-[20vw] bg-gradient-to-r from-transparent via-blue-500 to-transparent shadow-[0_0_15px_#3b82f6] top-3/4 left-0 opacity-40" 
           style={{ animation: "agv-move 10s linear infinite 2.5s" }}
         />
      </div>

      {/* 🪟 メインパネル（磨き上げた美しいすりガラス） */}
      <div className="relative z-10 w-full max-w-lg mx-4 p-10 md:p-14 rounded-[32px] bg-white/[0.02] border border-white/10 backdrop-blur-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.6)] text-center flex flex-col items-center">
        
        {/* 🏢 PAL リアルロゴ画像表示エリア */}
        <div className="mb-10 flex flex-col items-center w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src="/logo.png" 
            alt="PAL Logo" 
            className="h-14 w-auto object-contain max-w-[85%]" 
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              const fallback = document.getElementById('logo-fallback');
              if (fallback) fallback.style.display = 'block';
            }}
          />
          <div id="logo-fallback" style={{ display: 'none' }}>
            <h1 className="text-6xl font-black tracking-tighter text-white font-montserrat">PAL</h1>
          </div>

          <div className="mt-5 flex items-center gap-4">
            <div className="h-[1px] w-8 bg-cyan-400/40"></div>
            <span className="text-[11px] font-light tracking-[0.6em] text-cyan-400 font-montserrat uppercase">
              CORE Solutions
            </span>
            <div className="h-[1px] w-8 bg-cyan-400/40"></div>
          </div>
        </div>

        {/* 📝 スローガン */}
        <div className="mb-10 w-full">
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-wider leading-relaxed font-noto">
            フィジカルを超え、<br />PAL COREソリューションで未来を創る。
          </h2>
          <p className="text-[10px] md:text-xs text-slate-500 tracking-[0.2em] font-montserrat mt-4 uppercase">
            Beyond Physical. Creating the Future with PAL CORE Solutions.
          </p>
        </div>

        {/* 🚀 アクションエリア */}
        <div className="w-full min-h-[220px] flex flex-col justify-center">
          {!showLogin ? (
            <button 
              onClick={() => setShowLogin(true)}
              className="w-full flex items-center justify-center gap-3 py-5 rounded-full text-sm font-bold tracking-[0.2em] text-white border border-cyan-500/50 hover:bg-cyan-500/10 hover:border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.1)] hover:shadow-[0_0_30px_rgba(34,211,238,0.3)] active:scale-95 transition-all duration-300 font-montserrat"
            >
              DASHBOARD ➔
            </button>
          ) : (
            <form onSubmit={handleLogin} className="text-left w-full" style={{ animation: "fade-in 0.4s ease-out" }}>
              <div className="mb-5">
                <label className="block text-[10px] font-bold text-cyan-400 mb-2 tracking-[0.2em] uppercase font-montserrat">User ID</label>
                <input 
                  type="text" 
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="IDを入力"
                  required
                  className="w-full bg-[#050a18]/80 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white outline-none focus:border-cyan-500 transition-colors font-montserrat"
                />
              </div>

              <div className="mb-6">
                <label className="block text-[10px] font-bold text-cyan-400 mb-2 tracking-[0.2em] uppercase font-montserrat">Password</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-[#050a18]/80 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white outline-none focus:border-cyan-500 transition-colors font-montserrat"
                />
              </div>

              {error && (
                <p className="text-red-400 text-xs font-bold mb-5 text-center tracking-wider font-noto">{error}</p>
              )}

              <button 
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-4 rounded-xl text-sm font-bold tracking-[0.2em] text-white bg-gradient-to-r from-cyan-500 to-blue-600 shadow-[0_4px_20px_rgba(14,165,233,0.3)] hover:scale-[1.02] active:scale-95 transition-all font-montserrat"
              >
                ENTER ➔
              </button>
            </form>
          )}
        </div>
        
      </div>
    </div>
  );
}