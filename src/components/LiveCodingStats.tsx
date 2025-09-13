import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Zap, Target, Code, Clock, Cpu, BarChart3 } from 'lucide-react';

interface LiveCodingStatsProps {
  code: string;
  isActive?: boolean;
  onStatsUpdate?: (stats: any) => void;
}

export const LiveCodingStats: React.FC<LiveCodingStatsProps> = ({
  code,
  isActive = true,
  onStatsUpdate
}) => {
  const [stats, setStats] = useState({
    linesOfCode: 0,
    instructions: 0,
    comments: 0,
    registers: new Set<string>(),
    complexity: 0,
    estimatedCycles: 0,
    codeQuality: 0
  });

  const [typingSpeed, setTypingSpeed] = useState(0);
  const [lastCodeLength, setLastCodeLength] = useState(0);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    if (!isActive) return;

    const analyzeCode = (): void => {
      const lines = code.split('\n').filter(line => line.trim());
      const nonEmptyLines = lines.filter(line => !line.trim().startsWith(';'));
      const comments = lines.filter(line => line.trim().startsWith(';'));
      
      // Extract instructions
      const instructions = nonEmptyLines.filter(line => {
        const trimmed = line.trim();
        return trimmed && !trimmed.includes(':') && !trimmed.startsWith('.');
      });

      // Extract registers
      const registerPattern = /\b(R[0-7]|SP|BP|IP)\b/g;
      const foundRegisters = new Set<string>();
      const matches = code.match(registerPattern);
      if (matches) {
        matches.forEach(reg => foundRegisters.add(reg));
      }

      // Calculate complexity (simplified)
      const jumps = (code.match(/\b(JMP|JE|JNE|JZ|JNZ|JG|JL|JGE|JLE|CALL)\b/gi) || []).length;
      const loops = (code.match(/\b(JNZ|JZ)\b/gi) || []).length;
      const complexity = jumps + loops * 2;

      // Estimate cycles (very simplified)
      const estimatedCycles = instructions.length * 2 + jumps * 3 + loops * 10;

      // Code quality score
      const hasComments = comments.length > 0;
      const hasProperStructure = code.includes('HALT');
      const reasonableLength = instructions.length > 0 && instructions.length < 100;
      const codeQuality = (hasComments ? 30 : 0) + (hasProperStructure ? 40 : 0) + (reasonableLength ? 30 : 0);

      const newStats = {
        linesOfCode: lines.length,
        instructions: instructions.length,
        comments: comments.length,
        registers: foundRegisters,
        complexity,
        estimatedCycles,
        codeQuality
      };

      setStats(newStats);
      onStatsUpdate?.(newStats);
    };

    // Calculate typing speed
    const currentLength = code.length;
    const timeDiff = (Date.now() - startTime) / 1000 / 60; // minutes
    const charsDiff = currentLength - lastCodeLength;
    
    if (timeDiff > 0 && charsDiff > 0) {
      setTypingSpeed(Math.round(charsDiff / timeDiff));
    }
    setLastCodeLength(currentLength);

    analyzeCode();
  }, [code, isActive, onStatsUpdate, lastCodeLength, startTime]);

  if (!isActive) return null;

  return (
    <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-600/50 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-green-400" />
        <h3 className="text-lg font-bold text-green-300">Live Coding Analytics</h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Lines of Code */}
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 text-center"
        >
          <Code className="w-6 h-6 text-blue-400 mx-auto mb-2" />
          <motion.div
            key={stats.linesOfCode}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            className="text-2xl font-bold text-blue-300"
          >
            {stats.linesOfCode}
          </motion.div>
          <div className="text-xs text-blue-400">Lines</div>
        </motion.div>

        {/* Instructions */}
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-3 text-center"
        >
          <Cpu className="w-6 h-6 text-purple-400 mx-auto mb-2" />
          <motion.div
            key={stats.instructions}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            className="text-2xl font-bold text-purple-300"
          >
            {stats.instructions}
          </motion.div>
          <div className="text-xs text-purple-400">Instructions</div>
        </motion.div>

        {/* Complexity */}
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-3 text-center"
        >
          <BarChart3 className="w-6 h-6 text-orange-400 mx-auto mb-2" />
          <motion.div
            key={stats.complexity}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            className="text-2xl font-bold text-orange-300"
          >
            {stats.complexity}
          </motion.div>
          <div className="text-xs text-orange-400">Complexity</div>
        </motion.div>

        {/* Code Quality */}
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="bg-green-900/20 border border-green-500/30 rounded-lg p-3 text-center"
        >
          <Target className="w-6 h-6 text-green-400 mx-auto mb-2" />
          <motion.div
            key={stats.codeQuality}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            className="text-2xl font-bold text-green-300"
          >
            {stats.codeQuality}%
          </motion.div>
          <div className="text-xs text-green-400">Quality</div>
        </motion.div>
      </div>

      {/* Additional Stats */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div className="bg-slate-800/50 rounded p-2">
          <div className="text-slate-400">Registers Used</div>
          <div className="text-cyan-300 font-mono">
            {Array.from(stats.registers).join(', ') || 'None'}
          </div>
        </div>

        <div className="bg-slate-800/50 rounded p-2">
          <div className="text-slate-400">Est. Cycles</div>
          <div className="text-yellow-300 font-mono">
            {stats.estimatedCycles.toLocaleString()}
          </div>
        </div>

        <div className="bg-slate-800/50 rounded p-2">
          <div className="text-slate-400">Comments</div>
          <div className="text-green-300 font-mono">
            {stats.comments} lines
          </div>
        </div>
      </div>

      {/* Real-time Typing Speed */}
      {typingSpeed > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-purple-500/30 rounded-lg p-3"
        >
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span className="text-yellow-300 font-medium">
              Typing Speed: {typingSpeed} chars/min
            </span>
            <div className="flex-1 bg-slate-700 rounded-full h-2 ml-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(typingSpeed / 5, 100)}%` }}
                className="bg-gradient-to-r from-yellow-400 to-orange-400 h-2 rounded-full"
              />
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default LiveCodingStats;