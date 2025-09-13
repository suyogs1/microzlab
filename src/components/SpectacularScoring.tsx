import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Zap, Code, Trophy } from 'lucide-react';

interface ScoreBreakdown {
    correctness: number;
    efficiency: number;
    codeStyle: number;
    total: number;
    grade: string;
}

interface SpectacularScoringProps {
    score: ScoreBreakdown | null;
    isVisible: boolean;
    onAnimationComplete?: () => void;
}

export const SpectacularScoring: React.FC<SpectacularScoringProps> = ({
    score,
    isVisible,
    onAnimationComplete
}) => {
    const [animationStep, setAnimationStep] = useState(0);
    const [showFireworks, setShowFireworks] = useState(false);

    useEffect(() => {
        if (isVisible && score) {
            const timer = setTimeout(() => {
                setAnimationStep(1);
                setTimeout(() => setAnimationStep(2), 500);
                setTimeout(() => setAnimationStep(3), 1000);
                setTimeout(() => {
                    setAnimationStep(4);
                    if (score.total >= 90) {
                        setShowFireworks(true);
                        setTimeout(() => setShowFireworks(false), 3000);
                    }
                    onAnimationComplete?.();
                }, 1500);
            }, 300);

            return () => clearTimeout(timer);
        }
    }, [isVisible, score, onAnimationComplete]);

    const getGradeColor = (grade: string) => {
        switch (grade) {
            case 'A+': return 'from-purple-400 to-pink-400';
            case 'A': return 'from-blue-400 to-purple-400';
            case 'B+': case 'B': return 'from-green-400 to-blue-400';
            case 'C+': case 'C': return 'from-yellow-400 to-green-400';
            case 'D': return 'from-orange-400 to-yellow-400';
            default: return 'from-red-400 to-orange-400';
        }
    };

    const getGradeEmoji = (grade: string) => {
        switch (grade) {
            case 'A+': return '🏆';
            case 'A': return '🌟';
            case 'B+': case 'B': return '⭐';
            case 'C+': case 'C': return '👍';
            case 'D': return '📈';
            default: return '💪';
        }
    };

    if (!isVisible || !score) return null;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        >
            <motion.div
                initial={{ y: 50 }}
                animate={{ y: 0 }}
                className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-slate-600 p-8 max-w-md w-full shadow-2xl"
            >
                {/* Header */}
                <div className="text-center mb-6">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: animationStep >= 1 ? 1 : 0 }}
                        transition={{ type: "spring", bounce: 0.5 }}
                        className="text-6xl mb-2"
                    >
                        {getGradeEmoji(score.grade)}
                    </motion.div>

                    <motion.h2
                        initial={{ opacity: 0 }}
                        animate={{ opacity: animationStep >= 1 ? 1 : 0 }}
                        className="text-2xl font-bold text-slate-200 mb-2"
                    >
                        Challenge Complete!
                    </motion.h2>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{
                            opacity: animationStep >= 4 ? 1 : 0,
                            scale: animationStep >= 4 ? 1 : 0.5
                        }}
                        transition={{ type: "spring", bounce: 0.6 }}
                        className={`inline-block px-6 py-2 rounded-full text-3xl font-bold bg-gradient-to-r ${getGradeColor(score.grade)} text-white shadow-lg`}
                    >
                        {score.grade}
                    </motion.div>
                </div>

                {/* Score Breakdown */}
                <div className="space-y-4 mb-6">
                    <ScoreItem
                        icon={<Target className="w-5 h-5" />}
                        label="Correctness"
                        score={score.correctness}
                        maxScore={60}
                        color="text-green-400"
                        delay={0.2}
                        isVisible={animationStep >= 2}
                    />

                    <ScoreItem
                        icon={<Zap className="w-5 h-5" />}
                        label="Efficiency"
                        score={score.efficiency}
                        maxScore={20}
                        color="text-blue-400"
                        delay={0.4}
                        isVisible={animationStep >= 2}
                    />

                    <ScoreItem
                        icon={<Code className="w-5 h-5" />}
                        label="Code Style"
                        score={score.codeStyle}
                        maxScore={20}
                        color="text-purple-400"
                        delay={0.6}
                        isVisible={animationStep >= 2}
                    />

                    <div className="border-t border-slate-600 pt-4">
                        <ScoreItem
                            icon={<Trophy className="w-5 h-5" />}
                            label="Total Score"
                            score={score.total}
                            maxScore={100}
                            color="text-yellow-400"
                            delay={0.8}
                            isVisible={animationStep >= 3}
                            isTotal={true}
                        />
                    </div>
                </div>

                {/* Performance Message */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{
                        opacity: animationStep >= 4 ? 1 : 0,
                        y: animationStep >= 4 ? 0 : 20
                    }}
                    className="text-center"
                >
                    <div className={`text-lg font-medium mb-2 bg-gradient-to-r ${getGradeColor(score.grade)} bg-clip-text text-transparent`}>
                        {getPerformanceMessage(score.grade)}
                    </div>

                    <div className="text-sm text-slate-400">
                        {getPerformanceTip(score)}
                    </div>
                </motion.div>

                {/* Fireworks Effect */}
                <AnimatePresence>
                    {showFireworks && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 pointer-events-none"
                        >
                            {Array.from({ length: 8 }, (_, i) => (
                                <motion.div
                                    key={i}
                                    initial={{
                                        scale: 0,
                                        x: "50%",
                                        y: "50%"
                                    }}
                                    animate={{
                                        scale: [0, 1, 0],
                                        x: `${50 + (Math.random() - 0.5) * 100}%`,
                                        y: `${50 + (Math.random() - 0.5) * 100}%`
                                    }}
                                    transition={{
                                        duration: 2,
                                        delay: i * 0.2,
                                        ease: "easeOut"
                                    }}
                                    className="absolute text-2xl"
                                >
                                    ✨
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </motion.div>
    );
};

interface ScoreItemProps {
    icon: React.ReactNode;
    label: string;
    score: number;
    maxScore: number;
    color: string;
    delay: number;
    isVisible: boolean;
    isTotal?: boolean;
}

const ScoreItem: React.FC<ScoreItemProps> = ({
    icon,
    label,
    score,
    maxScore,
    color,
    delay,
    isVisible,
    isTotal = false
}) => {
    const [animatedScore, setAnimatedScore] = useState(0);

    useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(() => {
                const duration = 1000;
                const steps = 60;
                const increment = score / steps;
                let current = 0;

                const interval = setInterval(() => {
                    current += increment;
                    if (current >= score) {
                        setAnimatedScore(score);
                        clearInterval(interval);
                    } else {
                        setAnimatedScore(Math.floor(current));
                    }
                }, duration / steps);
            }, delay * 1000);

            return () => clearTimeout(timer);
        }
    }, [isVisible, score, delay]);

    const percentage = (score / maxScore) * 100;

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{
                opacity: isVisible ? 1 : 0,
                x: isVisible ? 0 : -20
            }}
            transition={{ delay }}
            className={`flex items-center justify-between ${isTotal ? 'bg-slate-800/50 rounded-lg p-3' : ''}`}
        >
            <div className="flex items-center space-x-3">
                <div className={color}>
                    {icon}
                </div>
                <span className={`font-medium ${isTotal ? 'text-lg' : ''} text-slate-200`}>
                    {label}
                </span>
            </div>

            <div className="flex items-center space-x-3">
                <div className="w-24 bg-slate-700 rounded-full h-2">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: isVisible ? `${percentage}%` : 0 }}
                        transition={{ duration: 1, delay, ease: "easeOut" }}
                        className={`h-2 rounded-full ${percentage >= 90 ? 'bg-gradient-to-r from-green-400 to-emerald-400' :
                            percentage >= 80 ? 'bg-gradient-to-r from-blue-400 to-cyan-400' :
                                percentage >= 70 ? 'bg-gradient-to-r from-yellow-400 to-orange-400' :
                                    'bg-gradient-to-r from-red-400 to-pink-400'
                            }`}
                    />
                </div>

                <motion.span
                    key={animatedScore}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    className={`font-bold ${isTotal ? 'text-xl' : ''} ${color} min-w-[3rem] text-right`}
                >
                    {animatedScore}/{maxScore}
                </motion.span>
            </div>
        </motion.div>
    );
};

const getPerformanceMessage = (grade: string): string => {
    switch (grade) {
        case 'A+': return 'LEGENDARY PERFORMANCE! 🏆';
        case 'A': return 'OUTSTANDING WORK! 🌟';
        case 'B+': return 'EXCELLENT JOB! ⭐';
        case 'B': return 'GREAT WORK! 👏';
        case 'C+': return 'GOOD EFFORT! 👍';
        case 'C': return 'NICE TRY! 📈';
        case 'D': return 'KEEP PRACTICING! 💪';
        default: return 'TRY AGAIN! 🔄';
    }
};

const getPerformanceTip = (score: ScoreBreakdown): string => {
    if (score.correctness < 40) {
        return "Focus on getting the correct output first, then optimize!";
    } else if (score.efficiency < 15) {
        return "Try to optimize your algorithm for better efficiency!";
    } else if (score.codeStyle < 15) {
        return "Add more comments and improve code structure!";
    } else if (score.total >= 90) {
        return "Perfect! You've mastered this challenge! 🎉";
    } else {
        return "Great job! Keep pushing for that perfect score!";
    }
};

export default SpectacularScoring;