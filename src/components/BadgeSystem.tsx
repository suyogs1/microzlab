import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award } from 'lucide-react';

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned?: boolean;
  progress?: number;
  maxProgress?: number;
}

interface BadgeSystemProps {
  earnedBadges: string[];
  onBadgeClick?: (badge: Badge) => void;
}

const BADGES: Badge[] = [
  {
    id: 'speedster',
    name: 'Speed Demon',
    description: 'Solve 5 challenges in under 2 minutes each',
    icon: '⚡',
    maxProgress: 5
  },
  {
    id: 'perfectionist',
    name: 'Perfectionist',
    description: 'Get 100% score on 10 challenges',
    icon: '💎',
    maxProgress: 10
  },
  {
    id: 'streak',
    name: 'Hot Streak',
    description: 'Solve 5 challenges in a row without errors',
    icon: '🔥',
    maxProgress: 5
  },
  {
    id: 'optimizer',
    name: 'Code Optimizer',
    description: 'Beat efficiency benchmarks on 8 challenges',
    icon: '🚀',
    maxProgress: 8
  },
  {
    id: 'debugger',
    name: 'Debug Master',
    description: 'Use debugger features in 15 challenges',
    icon: '🔍',
    maxProgress: 15
  },
  {
    id: 'explorer',
    name: 'Algorithm Explorer',
    description: 'Complete all visualization challenges',
    icon: '🗺️',
    maxProgress: 12
  },
  {
    id: 'champion',
    name: 'Assembly Champion',
    description: 'Complete all 24 challenges with 90%+ average',
    icon: '👑',
    maxProgress: 24
  }
];

export const BadgeSystem: React.FC<BadgeSystemProps> = ({ earnedBadges, onBadgeClick }) => {
  const [showBadgeAnimation, setShowBadgeAnimation] = useState<string | null>(null);
  const [previousEarned, setPreviousEarned] = useState<string[]>([]);

  useEffect(() => {
    // Check for newly earned badges
    const newBadges = earnedBadges.filter(badge => !previousEarned.includes(badge));
    if (newBadges.length > 0) {
      const firstBadge = newBadges[0];
      if (firstBadge) {
        setShowBadgeAnimation(firstBadge);
        setTimeout(() => setShowBadgeAnimation(null), 3000);
      }
    }
    setPreviousEarned(earnedBadges);
  }, [earnedBadges, previousEarned]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-200 flex items-center">
          <Award className="w-5 h-5 mr-2 text-yellow-400" />
          Achievement Badges
        </h3>
        <div className="text-sm text-slate-400">
          {earnedBadges.length} / {BADGES.length} earned
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {BADGES.map((badge) => {
          const isEarned = earnedBadges.includes(badge.id);
          const progress = isEarned ? badge.maxProgress : Math.floor(Math.random() * (badge.maxProgress || 1));
          
          return (
            <motion.div
              key={badge.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onBadgeClick?.(badge)}
              className={`
                relative p-3 rounded-xl border cursor-pointer transition-all duration-200
                ${isEarned 
                  ? 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-yellow-500/50 shadow-lg shadow-yellow-500/20' 
                  : 'bg-slate-800/50 border-slate-600/50 hover:border-slate-500/50'
                }
              `}
            >
              <div className="text-center">
                <motion.div
                  animate={{ 
                    scale: isEarned ? [1, 1.2, 1] : 1,
                    rotate: isEarned ? [0, 10, -10, 0] : 0
                  }}
                  transition={{ duration: 2, repeat: isEarned ? Infinity : 0, repeatDelay: 3 }}
                  className={`text-3xl mb-2 ${isEarned ? '' : 'grayscale opacity-50'}`}
                >
                  {badge.icon}
                </motion.div>
                
                <div className={`font-medium text-sm mb-1 ${isEarned ? 'text-yellow-300' : 'text-slate-400'}`}>
                  {badge.name}
                </div>
                
                <div className="text-xs text-slate-500 mb-2 line-clamp-2">
                  {badge.description}
                </div>

                {badge.maxProgress && (
                  <div className="w-full bg-slate-700 rounded-full h-1.5 mb-1">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${((progress ?? 0) / badge.maxProgress) * 100}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className={`h-1.5 rounded-full ${
                        isEarned ? 'bg-gradient-to-r from-yellow-400 to-orange-400' : 'bg-slate-600'
                      }`}
                    />
                  </div>
                )}
                
                <div className="text-xs text-slate-500">
                  {progress} / {badge.maxProgress || 1}
                </div>
              </div>

              {isEarned && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"
                >
                  <Award className="w-3 h-3 text-white" />
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Badge Earned Animation */}
      <AnimatePresence>
        {showBadgeAnimation && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: -50 }}
            className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
          >
            <div className="bg-gradient-to-br from-yellow-500/90 to-orange-500/90 rounded-2xl p-8 text-center shadow-2xl shadow-yellow-500/50">
              <motion.div
                animate={{ 
                  scale: [1, 1.3, 1],
                  rotate: [0, 360, 0]
                }}
                transition={{ duration: 2, ease: "easeInOut" }}
                className="text-6xl mb-4"
              >
                {BADGES.find(b => b.id === showBadgeAnimation)?.icon}
              </motion.div>
              
              <div className="text-2xl font-bold text-white mb-2">
                Badge Earned!
              </div>
              
              <div className="text-lg text-yellow-100">
                {BADGES.find(b => b.id === showBadgeAnimation)?.name}
              </div>
              
              <motion.div
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="mt-4 text-sm text-yellow-200"
              >
                ✨ Achievement Unlocked ✨
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const BadgeProgress: React.FC<{ challengeId: string; earnedBadges: string[] }> = ({ earnedBadges }) => {
  // Calculate progress towards next badge
  const nextBadge = BADGES.find(badge => !earnedBadges.includes(badge.id));
  
  if (!nextBadge) {
    return (
      <div className="text-center p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl border border-purple-500/30">
        <div className="text-2xl mb-2">🏆</div>
        <div className="text-purple-300 font-medium">All Badges Earned!</div>
        <div className="text-sm text-purple-400">You are a true Assembly Master!</div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl border border-blue-500/30"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <span className="text-2xl mr-2">{nextBadge.icon}</span>
          <div>
            <div className="font-medium text-slate-200">{nextBadge.name}</div>
            <div className="text-sm text-slate-400">{nextBadge.description}</div>
          </div>
        </div>
      </div>
      
      <div className="w-full bg-slate-700 rounded-full h-2">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: "30%" }} // Placeholder progress
          transition={{ duration: 1, ease: "easeOut" }}
          className="h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"
        />
      </div>
      
      <div className="text-xs text-slate-500 mt-1">
        Keep going to unlock this badge!
      </div>
    </motion.div>
  );
};

export default BadgeSystem;