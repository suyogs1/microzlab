import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Zap, Cpu, Activity } from 'lucide-react';

interface RetroTerminalProps {
  value: string;
  onChange: (value: string) => void;
  onRun?: () => void;
  isRunning?: boolean;
  title?: string;
  className?: string;
}

export const RetroTerminal: React.FC<RetroTerminalProps> = ({
  value,
  onChange,
  onRun,
  isRunning = false,
  title = "MICROZLABOK ASSEMBLY TERMINAL",
  className = ""
}) => {
  const [isBooting, setIsBooting] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [cpuUsage, setCpuUsage] = useState(0);
  const [memoryUsage, setMemoryUsage] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [cursorVisible, setCursorVisible] = useState(true);

  useEffect(() => {
    // Boot sequence
    const bootTimer = setTimeout(() => setIsBooting(false), 2000);
    
    // Update time every second
    const timeInterval = setInterval(() => setCurrentTime(new Date()), 1000);
    
    // Simulate CPU/Memory usage
    const statsInterval = setInterval(() => {
      setCpuUsage(Math.random() * 100);
      setMemoryUsage(30 + Math.random() * 40);
    }, 2000);

    // Cursor blink
    const cursorInterval = setInterval(() => {
      setCursorVisible(prev => !prev);
    }, 530);

    return () => {
      clearTimeout(bootTimer);
      clearInterval(timeInterval);
      clearInterval(statsInterval);
      clearInterval(cursorInterval);
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      onRun?.();
    }
  };

  if (isBooting) {
    return (
      <div className={`retro-terminal-container ${className}`}>
        <BootSequence />
      </div>
    );
  }

  return (
    <div className={`retro-terminal-container ${className}`}>
      <style jsx>{`
        .retro-terminal-container {
          background: #000;
          border: 3px solid #00ff00;
          border-radius: 8px;
          font-family: 'Courier New', monospace;
          position: relative;
          overflow: hidden;
          box-shadow: 
            0 0 20px #00ff00,
            inset 0 0 20px rgba(0, 255, 0, 0.1);
        }
        
        .terminal-header {
          background: linear-gradient(90deg, #003300, #006600);
          color: #00ff00;
          padding: 8px 16px;
          font-size: 14px;
          font-weight: bold;
          border-bottom: 2px solid #00ff00;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .terminal-stats {
          display: flex;
          gap: 16px;
          font-size: 12px;
        }
        
        .stat-item {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        
        .terminal-body {
          background: #000;
          color: #00ff00;
          min-height: 400px;
          position: relative;
        }
        
        .terminal-textarea {
          width: 100%;
          height: 100%;
          min-height: 400px;
          background: transparent;
          border: none;
          outline: none;
          color: #00ff00;
          font-family: 'Courier New', monospace;
          font-size: 14px;
          line-height: 1.4;
          padding: 16px;
          resize: none;
          caret-color: #00ff00;
        }
        
        .terminal-textarea::selection {
          background: #00ff00;
          color: #000;
        }
        
        .scanlines {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0, 255, 0, 0.03) 2px,
            rgba(0, 255, 0, 0.03) 4px
          );
          pointer-events: none;
        }
        
        .screen-flicker {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 255, 0, 0.02);
          animation: flicker 0.15s infinite linear alternate;
          pointer-events: none;
        }
        
        @keyframes flicker {
          0% { opacity: 1; }
          100% { opacity: 0.98; }
        }
        
        .terminal-prompt {
          position: absolute;
          bottom: 16px;
          left: 16px;
          right: 16px;
          color: #00ff00;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .cursor {
          width: 8px;
          height: 16px;
          background: #00ff00;
          animation: ${cursorVisible ? 'none' : 'none'};
          opacity: ${cursorVisible ? 1 : 0};
        }
        
        .run-button {
          position: absolute;
          top: 8px;
          right: 16px;
          background: linear-gradient(45deg, #ff6b00, #ff8500);
          border: 2px solid #ff6b00;
          color: white;
          padding: 8px 16px;
          border-radius: 4px;
          font-family: 'Courier New', monospace;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 0 10px rgba(255, 107, 0, 0.5);
        }
        
        .run-button:hover {
          background: linear-gradient(45deg, #ff8500, #ffa500);
          box-shadow: 0 0 20px rgba(255, 107, 0, 0.8);
          transform: translateY(-1px);
        }
        
        .run-button:active {
          transform: translateY(0);
        }
        
        .run-button.running {
          background: linear-gradient(45deg, #00ff00, #00cc00);
          border-color: #00ff00;
          animation: pulse 1s infinite;
        }
        
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 10px rgba(0, 255, 0, 0.5); }
          50% { box-shadow: 0 0 30px rgba(0, 255, 0, 1); }
        }
      `}</style>
      
      <div className="terminal-header">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4" />
          <span>{title}</span>
        </div>
        <div className="terminal-stats">
          <div className="stat-item">
            <Cpu className="w-3 h-3" />
            <span>CPU: {cpuUsage.toFixed(1)}%</span>
          </div>
          <div className="stat-item">
            <Activity className="w-3 h-3" />
            <span>MEM: {memoryUsage.toFixed(1)}%</span>
          </div>
          <div className="stat-item">
            <span>{currentTime.toLocaleTimeString()}</span>
          </div>
        </div>
      </div>
      
      <div className="terminal-body">
        <textarea
          ref={textareaRef}
          className="terminal-textarea"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="; Enter your assembly code here...\n; Press Ctrl+Enter to execute\n\nMOV R0, #42\nHALT"
          spellCheck={false}
        />
        
        {onRun && (
          <button
            className={`run-button ${isRunning ? 'running' : ''}`}
            onClick={onRun}
            disabled={isRunning}
          >
            {isRunning ? (
              <>
                <Zap className="w-4 h-4 inline mr-1" />
                EXECUTING...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 inline mr-1" />
                RUN [CTRL+ENTER]
              </>
            )}
          </button>
        )}
        
        <div className="scanlines" />
        <div className="screen-flicker" />
      </div>
    </div>
  );
};

const BootSequence: React.FC = () => {
  const [bootStep, setBootStep] = useState(0);
  const bootMessages = [
    "MICROZLABOK ASSEMBLY SYSTEM v2.0",
    "Initializing CPU cores...",
    "Loading instruction set...",
    "Mounting memory banks...",
    "Starting debugger interface...",
    "System ready. Welcome, Assembly Master!"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setBootStep(prev => {
        if (prev < bootMessages.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 300);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="boot-sequence">
      <style jsx>{`
        .boot-sequence {
          background: #000;
          color: #00ff00;
          font-family: 'Courier New', monospace;
          padding: 20px;
          min-height: 400px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        
        .boot-line {
          margin: 4px 0;
          font-size: 14px;
        }
        
        .cursor-blink {
          animation: blink 1s infinite;
        }
        
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `}</style>
      
      {bootMessages.slice(0, bootStep + 1).map((message, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="boot-line"
        >
          {"> "}{message}
          {index === bootStep && <span className="cursor-blink">_</span>}
        </motion.div>
      ))}
    </div>
  );
};

export default RetroTerminal;