import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Lightbulb, Target, Code, Cpu } from 'lucide-react';
import { HolographicBorder, GlitchText } from './SpectacularEffects';

interface AIHintSystemProps {
  challenge: any;
  userCode: string;
  attempts: number;
  onHintUsed: (hint: string) => void;
}

export const AIHintSystem: React.FC<AIHintSystemProps> = ({
  challenge,
  userCode,
  attempts,
  onHintUsed
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentHint, setCurrentHint] = useState<string | null>(null);
  const [hintLevel, setHintLevel] = useState(0);
  const [aiPersonality, setAiPersonality] = useState('mentor');

  const aiPersonalities = {
    mentor: {
      name: "Professor Assembly",
      icon: "🎓",
      style: "wise and encouraging",
      prefix: "Let me guide you, young programmer..."
    },
    hacker: {
      name: "CyberGhost",
      icon: "👻",
      style: "mysterious and cool",
      prefix: "Listen up, code warrior..."
    },
    robot: {
      name: "ASMBOT-3000",
      icon: "🤖",
      style: "logical and precise",
      prefix: "ANALYZING... SUGGESTION COMPUTED..."
    },
    wizard: {
      name: "CodeWizard",
      icon: "🧙‍♂️",
      style: "magical and mystical",
      prefix: "The ancient assembly spirits whisper..."
    }
  };

  const generateSmartHint = (): void => {
    setIsAnalyzing(true);
    
    // Simulate AI analysis
    setTimeout(() => {
      const hints = generateContextualHints();
      const hint = hints[Math.min(hintLevel, hints.length - 1)];
      setCurrentHint(hint);
      setHintLevel(prev => prev + 1);
      onHintUsed(hint);
      setIsAnalyzing(false);
    }, 2000);
  };

  const generateContextualHints = (): string[] => {
    const codeAnalysis = analyzeUserCode(userCode);
    const baseHints = challenge.hints || [];
    
    const smartHints = [
      ...baseHints,
      ...generateCodeSpecificHints(codeAnalysis),
      ...generateProgressiveHints(attempts)
    ];

    return smartHints;
  };

  const analyzeUserCode = (code: string) => {
    const analysis = {
      hasMovInstructions: /MOV/i.test(code),
      hasLoops: /JNZ|JZ|JMP/i.test(code),
      hasArithmetic: /ADD|SUB|MUL|DIV/i.test(code),
      hasMemoryOps: /STORE|LOAD/i.test(code),
      hasStackOps: /PUSH|POP/i.test(code),
      hasHalt: /HALT/i.test(code),
      lineCount: code.split('\n').length,
      isEmpty: code.trim().length === 0
    };

    return analysis;
  };

  const generateCodeSpecificHints = (analysis: any) => {
    const hints = [];

    if (analysis.isEmpty) {
      hints.push("🚀 Start by writing your first instruction! Every great program begins with a single line.");
    }

    if (!analysis.hasHalt) {
      hints.push("⚠️ Don't forget to end your program with HALT - it's like the period at the end of a sentence!");
    }

    if (challenge.category === "Arithmetic" && !analysis.hasArithmetic) {
      hints.push("🧮 This challenge needs arithmetic operations. Try ADD, SUB, MUL, or DIV instructions!");
    }

    if (challenge.category === "Memory Operations" && !analysis.hasMemoryOps) {
      hints.push("💾 You'll need to work with memory here. Use STORE to save data and LOAD to retrieve it!");
    }

    if (challenge.category === "Control Flow" && !analysis.hasLoops) {
      hints.push("🔄 This challenge requires control flow. Use JMP, JNZ, or conditional jumps to control execution!");
    }

    return hints;
  };

  const generateProgressiveHints = (attempts: number) => {
    const hints = [];

    if (attempts > 3) {
      hints.push("🎯 You're getting close! Try breaking down the problem into smaller steps.");
    }

    if (attempts > 5) {
      hints.push("💡 Sometimes stepping away and coming back with fresh eyes helps. You've got this!");
    }

    if (attempts > 8) {
      hints.push("🔥 Persistence is key in programming! Every expert was once a beginner who never gave up.");
    }

    return hints;
  };

  const cyclePersonality = (): void => {
    const personalities = Object.keys(aiPersonalities);
    const currentIndex = personalities.indexOf(aiPersonality);
    const nextIndex = (currentIndex + 1) % personalities.length;
    const nextPersonality = personalities[nextIndex];
    if (nextPersonality) {
      setAiPersonality(nextPersonality);
    }
  };

  const currentPersonality = aiPersonalities[aiPersonality as keyof typeof aiPersonalities];

  return (
    <HolographicBorder className="mb-4">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: isAnalyzing ? 360 : 0 }}
              transition={{ duration: 2, repeat: isAnalyzing ? Infinity : 0 }}
            >
              <Brain className="w-6 h-6 text-purple-400" />
            </motion.div>
            <div>
              <h3 className="text-lg font-bold text-purple-300">AI Hint System</h3>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span>{currentPersonality.icon}</span>
                <GlitchText text={currentPersonality.name} />
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={cyclePersonality}
              className="px-3 py-1 bg-purple-600/20 border border-purple-500/30 rounded text-purple-300 text-sm hover:bg-purple-600/30 transition-colors"
            >
              Switch AI
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={generateSmartHint}
              disabled={isAnalyzing}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded font-semibold text-white disabled:opacity-50 flex items-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <Cpu className="w-4 h-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Lightbulb className="w-4 h-4" />
                  Get Smart Hint
                </>
              )}
            </motion.button>
          </div>
        </div>

        <AnimatePresence>
          {isAnalyzing && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4"
            >
              <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex space-x-1">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-2 h-2 bg-purple-400 rounded-full"
                        animate={{ scale: [1, 1.5, 1] }}
                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                      />
                    ))}
                  </div>
                  <span className="text-purple-300 font-medium">AI is analyzing your code...</span>
                </div>
                
                <div className="space-y-1 text-sm text-gray-400">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    → Parsing assembly syntax...
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                  >
                    → Analyzing instruction patterns...
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5 }}
                  >
                    → Generating personalized hint...
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {currentHint && !isAnalyzing && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-purple-500/30 rounded-lg p-4"
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl">{currentPersonality.icon}</div>
                <div className="flex-1">
                  <div className="text-purple-300 font-medium mb-1">
                    {currentPersonality.prefix}
                  </div>
                  <div className="text-gray-300 leading-relaxed">
                    {currentHint}
                  </div>
                </div>
              </div>
              
              <div className="mt-3 flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  Hint Level: {hintLevel} | Attempts: {attempts}
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCurrentHint(null)}
                  className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                >
                  Dismiss
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick Tips */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="bg-cyan-900/20 border border-cyan-500/30 rounded p-2 text-center">
            <Target className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
            <div className="text-xs text-cyan-300">Challenge Focus</div>
            <div className="text-xs text-gray-400">{challenge.category}</div>
          </div>
          
          <div className="bg-green-900/20 border border-green-500/30 rounded p-2 text-center">
            <Code className="w-4 h-4 text-green-400 mx-auto mb-1" />
            <div className="text-xs text-green-300">Difficulty</div>
            <div className="text-xs text-gray-400">{challenge.difficulty}</div>
          </div>
        </div>
      </div>
    </HolographicBorder>
  );
};

export default AIHintSystem;