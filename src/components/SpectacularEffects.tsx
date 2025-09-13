import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Matrix Rain Effect
export const MatrixRain: React.FC<{ isActive?: boolean }> = ({ isActive = false }) => {
  const [drops, setDrops] = useState<Array<{ id: number; x: number; chars: string[] }>>([]);

  useEffect(() => {
    if (!isActive) return;

    const characters = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
    const newDrops = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      chars: Array.from({ length: 15 }, () => characters[Math.floor(Math.random() * characters.length)])
    }));

    setDrops(newDrops);
  }, [isActive]);

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {drops.map((drop) => (
        <motion.div
          key={drop.id}
          className="absolute text-green-400 font-mono text-sm opacity-30"
          style={{ left: `${drop.x}%` }}
          initial={{ y: -100 }}
          animate={{ y: '100vh' }}
          transition={{ duration: 3 + Math.random() * 2, repeat: Infinity, ease: 'linear' }}
        >
          {drop.chars.map((char, i) => (
            <div key={i} className="leading-4">
              {char}
            </div>
          ))}
        </motion.div>
      ))}
    </div>
  );
};

// Holographic Border Effect
export const HolographicBorder: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = "" 
}) => (
  <div className={`relative ${className}`}>
    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-lg blur-sm opacity-30 animate-pulse" />
    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-lg opacity-20" 
         style={{
           background: 'linear-gradient(45deg, #00ffff, #ff00ff, #ffff00, #00ffff)',
           backgroundSize: '400% 400%',
           animation: 'holographic 3s ease-in-out infinite'
         }} />
    <div className="relative bg-slate-900/90 backdrop-blur-sm rounded-lg border border-cyan-500/30">
      {children}
    </div>
    <style jsx>{`
      @keyframes holographic {
        0%, 100% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
      }
    `}</style>
  </div>
);

// Enhanced Particle System with more spectacular effects
export const ParticleSystem: React.FC<{ 
  isActive?: boolean; 
  type?: 'success' | 'error' | 'magic';
  intensity?: number;
  className?: string;
}> = ({ 
  isActive = false, 
  type = 'magic',
  intensity = 1,
  className = ""
}) => {
  const [particles, setParticles] = useState<Array<{ 
    id: number; 
    x: number; 
    y: number; 
    color: string;
    size: number;
    emoji?: string;
  }>>([]);

  useEffect(() => {
    if (!isActive) return;

    const configs = {
      success: {
        colors: ['#10B981', '#34D399', '#6EE7B7', '#ECFDF5'],
        emojis: ['✨', '🌟', '💫', '⭐', '🎉', '🎊'],
        count: Math.floor(30 * intensity)
      },
      error: {
        colors: ['#EF4444', '#F87171', '#FCA5A5', '#FEF2F2'],
        emojis: ['💥', '⚡', '🔥', '💢'],
        count: Math.floor(25 * intensity)
      },
      magic: {
        colors: ['#8B5CF6', '#A78BFA', '#C4B5FD', '#DDD6FE', '#00FFFF', '#FF00FF'],
        emojis: ['✨', '🌟', '💫', '🔮', '🎭', '🌈', '💎'],
        count: Math.floor(40 * intensity)
      }
    };

    const config = configs[type];
    const newParticles = Array.from({ length: config.count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      color: config.colors[Math.floor(Math.random() * config.colors.length)],
      size: 0.5 + Math.random() * 1.5,
      emoji: Math.random() > 0.7 ? config.emojis[Math.floor(Math.random() * config.emojis.length)] : undefined
    }));

    setParticles(newParticles);
  }, [isActive, type, intensity]);

  if (!isActive) return null;

  return (
    <div className={`fixed inset-0 pointer-events-none z-10 ${className}`}>
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute"
          style={{ 
            left: `${particle.x}%`, 
            top: `${particle.y}%`,
          }}
          initial={{ scale: 0, opacity: 0, rotate: 0 }}
          animate={{ 
            scale: [0, particle.size, 0],
            opacity: [0, 1, 0],
            y: [0, -100 - Math.random() * 100],
            x: [0, (Math.random() - 0.5) * 100],
            rotate: [0, 360 + Math.random() * 360]
          }}
          transition={{ 
            duration: 2 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 3,
            ease: "easeOut"
          }}
        >
          {particle.emoji ? (
            <span className="text-2xl">{particle.emoji}</span>
          ) : (
            <div 
              className="w-3 h-3 rounded-full"
              style={{ 
                backgroundColor: particle.color,
                boxShadow: `0 0 20px ${particle.color}, 0 0 40px ${particle.color}40`
              }}
            />
          )}
        </motion.div>
      ))}
    </div>
  );
};

// Enhanced Glitch Effect
export const GlitchText: React.FC<{ 
  text: string;
  className?: string;
  glitchIntensity?: number;
}> = ({ 
  text,
  className = "",
  glitchIntensity = 0.3
}) => {
  const [isGlitching, setIsGlitching] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() < glitchIntensity) {
        setIsGlitching(true);
        setTimeout(() => setIsGlitching(false), 150);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [glitchIntensity]);

  return (
    <div className={`relative inline-block ${className}`}>
      {isGlitching && (
        <>
          <div 
            className="absolute inset-0 text-red-500 opacity-70" 
            style={{ 
              transform: 'translate(-2px, 0)',
              clipPath: 'polygon(0 0, 100% 0, 100% 45%, 0 45%)',
              animation: 'glitch-1 0.15s infinite'
            }}
          >
            {text}
          </div>
          <div 
            className="absolute inset-0 text-cyan-500 opacity-70" 
            style={{ 
              transform: 'translate(2px, 0)',
              clipPath: 'polygon(0 55%, 100% 55%, 100% 100%, 0 100%)',
              animation: 'glitch-2 0.15s infinite'
            }}
          >
            {text}
          </div>
        </>
      )}
      <div className="relative z-10">
        {text}
      </div>
      <style jsx>{`
        @keyframes glitch-1 {
          0%, 100% { transform: translate(-2px, 0); }
          20% { transform: translate(2px, 0); }
          40% { transform: translate(-2px, 0); }
          60% { transform: translate(2px, 0); }
          80% { transform: translate(-2px, 0); }
        }
        @keyframes glitch-2 {
          0%, 100% { transform: translate(2px, 0); }
          20% { transform: translate(-2px, 0); }
          40% { transform: translate(2px, 0); }
          60% { transform: translate(-2px, 0); }
          80% { transform: translate(2px, 0); }
        }
      `}</style>
    </div>
  );
};

// Spectacular Progress Celebration
export const ProgressCelebration: React.FC<{
  isVisible: boolean;
  progress: number;
  title: string;
  onComplete?: () => void;
}> = ({ isVisible, progress, title, onComplete }) => {
  const [showFireworks, setShowFireworks] = useState(false);

  useEffect(() => {
    if (isVisible && progress === 100) {
      setShowFireworks(true);
      const timer = setTimeout(() => {
        setShowFireworks(false);
        onComplete?.();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, progress, onComplete]);

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
    >
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-accent/50 p-8 max-w-md w-full mx-4 text-center relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-r from-accent/10 via-accent2/10 to-accent/10 animate-pulse" />
        
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", bounce: 0.6, delay: 0.2 }}
          className="relative z-10"
        >
          <div className="text-6xl mb-4">
            {progress === 100 ? '🏆' : '📚'}
          </div>
          
          <h2 className="text-2xl font-bold bg-gradient-to-r from-accent to-accent2 bg-clip-text text-transparent mb-4">
            {progress === 100 ? 'Lesson Mastered!' : 'Great Progress!'}
          </h2>
          
          <div className="text-lg text-slate-300 mb-6">{title}</div>
          
          <div className="w-full bg-slate-700 rounded-full h-4 mb-4 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 2, ease: "easeOut" }}
              className="h-4 bg-gradient-to-r from-accent via-accent2 to-accent rounded-full relative"
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse" />
            </motion.div>
          </div>
          
          <div className="text-3xl font-bold text-accent mb-2">{progress}%</div>
          
          {progress === 100 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="text-slate-400"
            >
              You've completed all requirements! 🎉
            </motion.div>
          )}
        </motion.div>
        
        {/* Fireworks for 100% completion */}
        {showFireworks && (
          <div className="absolute inset-0 pointer-events-none">
            {Array.from({ length: 12 }, (_, i) => (
              <motion.div
                key={i}
                className="absolute text-2xl"
                initial={{
                  x: "50%",
                  y: "50%",
                  scale: 0
                }}
                animate={{
                  x: `${50 + (Math.cos(i * 30 * Math.PI / 180) * 40)}%`,
                  y: `${50 + (Math.sin(i * 30 * Math.PI / 180) * 40)}%`,
                  scale: [0, 1.5, 0],
                  rotate: [0, 360]
                }}
                transition={{
                  duration: 2,
                  delay: i * 0.1,
                  ease: "easeOut"
                }}
              >
                {['🎉', '🎊', '✨', '🌟', '💫', '⭐'][i % 6]}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Neon Glow Button
export const NeonButton: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  color?: 'cyan' | 'purple' | 'green' | 'orange';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
}> = ({ 
  children, 
  onClick, 
  color = 'cyan', 
  size = 'md', 
  disabled = false,
  className = ""
}) => {
  const colors = {
    cyan: 'from-cyan-400 to-cyan-600 shadow-cyan-500/50 border-cyan-400',
    purple: 'from-purple-400 to-purple-600 shadow-purple-500/50 border-purple-400',
    green: 'from-green-400 to-green-600 shadow-green-500/50 border-green-400',
    orange: 'from-orange-400 to-orange-600 shadow-orange-500/50 border-orange-400'
  };

  const sizes = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-6 py-2 text-base',
    lg: 'px-8 py-3 text-lg'
  };

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      onClick={onClick}
      disabled={disabled}
      className={`
        relative overflow-hidden rounded-lg font-bold text-white
        bg-gradient-to-r ${colors[color]}
        border-2 ${colors[color]}
        shadow-lg ${colors[color]}
        ${sizes[size]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-xl cursor-pointer'}
        transition-all duration-200
        ${className}
      `}
    >
      <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
};

// Code Syntax Highlighter with Neon Effect
export const NeonCodeBlock: React.FC<{ code: string; language?: string }> = ({ 
  code, 
  language = 'assembly' 
}) => {
  const highlightAssembly = (code: string) => {
    const keywords = ['MOV', 'ADD', 'SUB', 'MUL', 'DIV', 'JMP', 'JE', 'JNE', 'CMP', 'HALT', 'PUSH', 'POP', 'CALL', 'RET'];
    const registers = ['R0', 'R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7', 'SP', 'BP', 'IP'];
    
    let highlighted = code;
    
    // Highlight keywords
    keywords.forEach(keyword => {
      highlighted = highlighted.replace(
        new RegExp(`\\b${keyword}\\b`, 'g'),
        `<span class="text-cyan-400 font-bold glow-cyan">${keyword}</span>`
      );
    });
    
    // Highlight registers
    registers.forEach(register => {
      highlighted = highlighted.replace(
        new RegExp(`\\b${register}\\b`, 'g'),
        `<span class="text-purple-400 font-bold glow-purple">${register}</span>`
      );
    });
    
    // Highlight numbers
    highlighted = highlighted.replace(
      /#?\b\d+\b/g,
      '<span class="text-green-400 glow-green">$&</span>'
    );
    
    // Highlight comments
    highlighted = highlighted.replace(
      /;.*$/gm,
      '<span class="text-gray-500 italic">$&</span>'
    );
    
    return highlighted;
  };

  return (
    <div className="relative bg-black/80 rounded-lg border border-cyan-500/30 p-4 font-mono text-sm overflow-x-auto">
      <style jsx>{`
        .glow-cyan { text-shadow: 0 0 10px #00ffff; }
        .glow-purple { text-shadow: 0 0 10px #8b5cf6; }
        .glow-green { text-shadow: 0 0 10px #10b981; }
      `}</style>
      <pre 
        className="text-gray-300"
        dangerouslySetInnerHTML={{ __html: highlightAssembly(code) }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-transparent to-purple-500/5 pointer-events-none" />
    </div>
  );
};

// Achievement Unlock Animation
export const AchievementUnlock: React.FC<{
  isVisible: boolean;
  title: string;
  description: string;
  icon: string;
  onClose: () => void;
}> = ({ isVisible, title, description, icon, onClose }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, 4000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ x: 400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 400, opacity: 0 }}
          className="fixed top-4 right-4 z-50"
        >
          <HolographicBorder>
            <div className="p-4 min-w-[300px]">
              <div className="flex items-center gap-3 mb-2">
                <div className="text-3xl animate-bounce">{icon}</div>
                <div>
                  <div className="text-yellow-400 font-bold text-lg">Achievement Unlocked!</div>
                  <div className="text-cyan-400 font-semibold">{title}</div>
                </div>
              </div>
              <div className="text-gray-300 text-sm">{description}</div>
            </div>
          </HolographicBorder>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default {
  MatrixRain,
  HolographicBorder,
  ParticleSystem,
  GlitchText,
  NeonButton,
  NeonCodeBlock,
  AchievementUnlock,
  ProgressCelebration
};