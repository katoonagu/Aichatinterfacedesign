import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Cpu, Activity, Globe, Wifi } from 'lucide-react';

export function InitialLoader() {
  const [loadingText, setLoadingText] = useState("INITIALIZING");
  
  // Cycle through technical status messages
  useEffect(() => {
    const states = ["CONNECTING TO NEURAL NET", "LOADING MODULES", "BYPASSING SECURITY", "ESTABLISHING UPLINK", "SYSTEM READY"];
    let i = 0;
    const interval = setInterval(() => {
      setLoadingText(states[i % states.length]);
      i++;
    }, 450);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
      transition={{ duration: 0.8 }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black text-cyan-500 overflow-hidden font-mono selection:bg-cyan-500/30"
    >
        {/* Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_100%)]" />

        {/* Central HUD Element */}
        <div className="relative flex items-center justify-center mb-12">
            {/* Outer Spinning Ring */}
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="absolute w-48 h-48 border border-cyan-500/20 rounded-full border-t-cyan-500/80 border-r-transparent border-b-cyan-500/20 border-l-transparent"
            />
            <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className="absolute w-64 h-64 border border-dashed border-cyan-900/40 rounded-full"
            />
            
            {/* Inner Tech Core */}
            <div className="relative z-10 w-32 h-32 bg-black/80 backdrop-blur-sm border border-cyan-500/30 rounded-full flex items-center justify-center shadow-[0_0_30px_-5px_rgba(6,182,212,0.3)]">
                <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                >
                   <Cpu className="w-12 h-12 text-cyan-400" />
                </motion.div>
                
                {/* Orbiting blip */}
                <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 rounded-full"
                >
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_10px_2px_rgba(34,211,238,0.8)]" />
                </motion.div>
            </div>
            
            {/* Scanning Line */}
            <motion.div
                initial={{ top: "0%" }}
                animate={{ top: "100%" }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="absolute w-64 h-[2px] bg-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.5)] z-20"
                style={{ clipPath: "inset(0 20% 0 20%)" }}
            />
        </div>

        {/* Text Interface */}
        <div className="flex flex-col items-center gap-4 z-10">
            <motion.h1 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl font-black tracking-[0.2em] text-white mix-blend-screen relative"
            >
                <span className="text-cyan-500">&lt;</span>
                AI_ENGINEER
                <span className="text-cyan-500">/&gt;</span>
            </motion.h1>
            
            <div className="flex items-center gap-3">
                <Activity className="w-4 h-4 text-cyan-500 animate-pulse" />
                <span className="text-xs tracking-[0.3em] font-semibold text-cyan-400/80 min-w-[200px] text-center">
                    {loadingText}
                </span>
            </div>

            {/* Binary Data Stream Decoration */}
            <div className="flex gap-1 mt-2 text-[10px] text-cyan-900/50 font-mono select-none">
                {Array.from({ length: 8 }).map((_, i) => (
                    <motion.span 
                        key={i}
                        animate={{ opacity: [0.2, 1, 0.2] }}
                        transition={{ duration: 0.5, delay: i * 0.1, repeat: Infinity }}
                    >
                        {Math.random() > 0.5 ? '1' : '0'}
                    </motion.span>
                ))}
            </div>
        </div>

        {/* Corner Decorations */}
        <div className="absolute top-8 left-8 w-16 h-16 border-t-2 border-l-2 border-cyan-500/20" />
        <div className="absolute top-8 right-8 w-16 h-16 border-t-2 border-r-2 border-cyan-500/20" />
        <div className="absolute bottom-8 left-8 w-16 h-16 border-b-2 border-l-2 border-cyan-500/20" />
        <div className="absolute bottom-8 right-8 w-16 h-16 border-b-2 border-r-2 border-cyan-500/20" />
        
        {/* Version Number */}
        <div className="absolute bottom-6 right-8 text-[10px] text-cyan-900 tracking-widest">
            SYS.VER.2.0.4
        </div>
    </motion.div>
  );
}