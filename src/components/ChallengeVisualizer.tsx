import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface VisualizationProps {
  type: string;
  data?: any;
  isActive?: boolean;
}

export const ChallengeVisualizer: React.FC<VisualizationProps> = ({ type, data, isActive = false }) => {
  const [animationStep, setAnimationStep] = useState(0);

  useEffect(() => {
    if (isActive) {
      const interval = setInterval(() => {
        setAnimationStep(prev => (prev + 1) % 10);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isActive]);

  const renderVisualization = (): React.ReactNode => {
    switch (type) {
      case 'arithmetic_steps':
        return <ArithmeticVisualization step={animationStep} data={data} />;
      case 'memory_operations':
        return <MemoryVisualization step={animationStep} data={data} />;
      case 'loop_animation':
        return <LoopVisualization step={animationStep} data={data} />;
      case 'stack_animation':
        return <StackVisualization step={animationStep} data={data} />;
      case 'array_traversal':
        return <ArrayVisualization step={animationStep} data={data} />;
      case 'sorting_animation':
      case 'bubble_sort_animation':
        return <SortingVisualization step={animationStep} data={data} />;
      case 'binary_search_animation':
        return <BinarySearchVisualization step={animationStep} data={data} />;
      case 'recursion_tree':
        return <RecursionVisualization step={animationStep} data={data} />;
      case 'matrix_multiplication':
        return <MatrixVisualization step={animationStep} data={data} />;
      case 'mystery_box_algorithm':
        return <MysteryBoxVisualization step={animationStep} data={data} />;
      default:
        return <DefaultVisualization type={type} />;
    }
  };

  if (!isActive) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-xl border border-purple-500/30 p-4 mb-4"
    >
      <div className="flex items-center mb-3">
        <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse mr-2"></div>
        <span className="text-purple-300 font-medium">Algorithm Visualization</span>
      </div>
      <div className="min-h-[200px] flex items-center justify-center">
        {renderVisualization()}
      </div>
    </motion.div>
  );
};

const ArithmeticVisualization: React.FC<{ step: number; data?: any }> = ({ step }) => (
  <div className="flex items-center space-x-4 text-2xl">
    <motion.div
      animate={{ scale: step % 3 === 0 ? 1.2 : 1 }}
      className="text-blue-400 font-bold"
    >
      15
    </motion.div>
    <motion.div
      animate={{ opacity: step > 1 ? 1 : 0.3 }}
      className="text-green-400"
    >
      +
    </motion.div>
    <motion.div
      animate={{ scale: step % 3 === 1 ? 1.2 : 1 }}
      className="text-blue-400 font-bold"
    >
      27
    </motion.div>
    <motion.div
      animate={{ opacity: step > 3 ? 1 : 0.3 }}
      className="text-yellow-400"
    >
      = 42
    </motion.div>
    <motion.div
      animate={{ opacity: step > 5 ? 1 : 0.3 }}
      className="text-green-400"
    >
      × 2
    </motion.div>
    <motion.div
      animate={{ opacity: step > 7 ? 1 : 0.3, scale: step > 7 ? 1.3 : 1 }}
      className="text-purple-400 font-bold"
    >
      = 84
    </motion.div>
  </div>
);

const MemoryVisualization: React.FC<{ step: number; data?: any }> = ({ step }) => (
  <div className="grid grid-cols-3 gap-4">
    <div className="text-center">
      <div className="text-sm text-slate-400 mb-2">Register R0</div>
      <motion.div
        animate={{ 
          backgroundColor: step % 4 === 0 ? '#3B82F6' : '#1E293B',
          scale: step % 4 === 0 ? 1.1 : 1
        }}
        className="w-16 h-16 rounded-lg border-2 border-blue-500 flex items-center justify-center text-white font-bold"
      >
        {step > 0 ? '42' : '0'}
      </motion.div>
    </div>
    
    <motion.div
      animate={{ opacity: step > 1 ? 1 : 0.3 }}
      className="flex items-center justify-center"
    >
      <div className="text-green-400 text-2xl">→</div>
    </motion.div>
    
    <div className="text-center">
      <div className="text-sm text-slate-400 mb-2">Memory [1000]</div>
      <motion.div
        animate={{ 
          backgroundColor: step > 2 ? '#10B981' : '#1E293B',
          scale: step > 2 ? 1.1 : 1
        }}
        className="w-16 h-16 rounded-lg border-2 border-green-500 flex items-center justify-center text-white font-bold"
      >
        {step > 2 ? '42' : '0'}
      </motion.div>
    </div>
  </div>
);

const LoopVisualization: React.FC<{ step: number; data?: any }> = ({ step }) => {
  const currentCount = Math.min(step, 10);
  
  return (
    <div className="text-center">
      <div className="text-lg text-slate-300 mb-4">Countdown Timer</div>
      <motion.div
        animate={{ 
          scale: 1 + (10 - currentCount) * 0.1,
          color: currentCount === 0 ? '#EF4444' : '#3B82F6'
        }}
        className="text-6xl font-bold mb-4"
      >
        {10 - currentCount}
      </motion.div>
      <div className="flex justify-center space-x-1">
        {Array.from({ length: 11 }, (_, i) => (
          <motion.div
            key={i}
            animate={{ 
              backgroundColor: i <= currentCount ? '#10B981' : '#374151',
              scale: i === currentCount ? 1.2 : 1
            }}
            className="w-3 h-3 rounded-full"
          />
        ))}
      </div>
    </div>
  );
};

const StackVisualization: React.FC<{ step: number; data?: any }> = ({ step }) => {
  const stackItems = ['7', '14', '21'];
  const currentStep = step % 6;
  
  return (
    <div className="flex items-end justify-center space-x-8">
      <div className="text-center">
        <div className="text-sm text-slate-400 mb-2">Stack</div>
        <div className="flex flex-col-reverse space-y-reverse space-y-1">
          {stackItems.map((item, index) => (
            <motion.div
              key={index}
              initial={{ y: 50, opacity: 0 }}
              animate={{ 
                y: currentStep > index ? 0 : 50,
                opacity: currentStep > index ? 1 : 0.3,
                backgroundColor: currentStep === index + 3 ? '#EF4444' : '#3B82F6'
              }}
              className="w-16 h-12 rounded border-2 border-blue-500 flex items-center justify-center text-white font-bold"
            >
              {item}
            </motion.div>
          ))}
        </div>
      </div>
      
      <div className="text-center">
        <div className="text-sm text-slate-400 mb-2">Registers</div>
        <div className="space-y-2">
          {['R0', 'R1', 'R2'].map((reg, index) => (
            <motion.div
              key={reg}
              animate={{ 
                backgroundColor: currentStep > index + 3 ? '#10B981' : '#374151',
                scale: currentStep === index + 4 ? 1.1 : 1
              }}
              className="w-16 h-12 rounded border-2 border-green-500 flex items-center justify-center text-white font-bold"
            >
              <div className="text-xs">{reg}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

const ArrayVisualization: React.FC<{ step: number; data?: any }> = ({ step }) => {
  const array = [3, 7, 11, 15, 19];
  const currentIndex = step % array.length;
  
  return (
    <div className="text-center">
      <div className="text-lg text-slate-300 mb-4">Array Summation</div>
      <div className="flex justify-center space-x-2 mb-4">
        {array.map((value, index) => (
          <motion.div
            key={index}
            animate={{ 
              backgroundColor: index <= currentIndex ? '#10B981' : '#374151',
              scale: index === currentIndex ? 1.2 : 1,
              borderColor: index === currentIndex ? '#F59E0B' : '#6B7280'
            }}
            className="w-16 h-16 rounded-lg border-2 flex items-center justify-center text-white font-bold"
          >
            {value}
          </motion.div>
        ))}
      </div>
      <motion.div
        animate={{ scale: step > 0 ? 1 : 0 }}
        className="text-2xl text-purple-400 font-bold"
      >
        Sum: {array.slice(0, currentIndex + 1).reduce((a, b) => a + b, 0)}
      </motion.div>
    </div>
  );
};

const SortingVisualization: React.FC<{ step: number; data?: any }> = ({ step }) => {
  const initialArray = [8, 3, 5, 1, 9, 2];
  const sortedArray = [1, 2, 3, 5, 8, 9];
  const progress = Math.min(step / 10, 1);
  
  return (
    <div className="text-center">
      <div className="text-lg text-slate-300 mb-4">Bubble Sort Animation</div>
      <div className="flex justify-center space-x-2">
        {initialArray.map((value, index) => {
          const targetIndex = sortedArray.indexOf(value);
          const shouldMove = progress > index / initialArray.length;
          
          return (
            <motion.div
              key={`${value}-${index}`}
              animate={{ 
                height: shouldMove ? `${value * 8}px` : `${value * 8}px`,
                backgroundColor: shouldMove ? '#10B981' : '#3B82F6',
                y: shouldMove ? (targetIndex - index) * 20 : 0
              }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className="w-12 rounded-t-lg flex items-end justify-center text-white text-sm font-bold pb-1"
              style={{ minHeight: '20px' }}
            >
              {value}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

const BinarySearchVisualization: React.FC<{ step: number; data?: any }> = ({ step }) => {
  const array = [2, 5, 8, 13, 17, 21, 25];
  const target = 13;
  const targetIndex = 3;
  
  let left = 0, right = array.length - 1, mid = 0;
  const searchStep = step % 4;
  
  if (searchStep >= 1) {
    mid = Math.floor((left + right) / 2);
    const midValue = array[mid];
    if (midValue !== undefined) {
      if (midValue < target) left = mid + 1;
      else if (midValue > target) right = mid - 1;
    }
  }
  
  return (
    <div className="text-center">
      <div className="text-lg text-slate-300 mb-4">Binary Search for {target}</div>
      <div className="flex justify-center space-x-2 mb-4">
        {array.map((value, index) => {
          let bgColor = '#374151';
          if (searchStep >= 1 && index >= left && index <= right) bgColor = '#3B82F6';
          if (searchStep >= 2 && index === mid) bgColor = '#F59E0B';
          if (searchStep >= 3 && index === targetIndex) bgColor = '#10B981';
          
          return (
            <motion.div
              key={index}
              animate={{ backgroundColor: bgColor, scale: index === targetIndex && searchStep >= 3 ? 1.2 : 1 }}
              className="w-12 h-12 rounded border-2 border-gray-500 flex items-center justify-center text-white font-bold"
            >
              {value}
            </motion.div>
          );
        })}
      </div>
      <div className="text-sm text-slate-400">
        {searchStep === 0 && "Starting search..."}
        {searchStep === 1 && `Searching range [${left}, ${right}]`}
        {searchStep === 2 && `Checking middle element: ${array[mid] ?? '?'}`}
        {searchStep === 3 && "Target found! 🎯"}
      </div>
    </div>
  );
};

const RecursionVisualization: React.FC<{ step: number; data?: any }> = ({ step }) => {
  const levels = Math.min(step, 5);
  
  return (
    <div className="text-center">
      <div className="text-lg text-slate-300 mb-4">Recursion Tree</div>
      <div className="flex flex-col items-center space-y-4">
        {Array.from({ length: levels }, (_, level) => (
          <motion.div
            key={level}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: level * 0.5 }}
            className="flex items-center space-x-4"
          >
            <div className="w-16 h-8 bg-purple-600 rounded flex items-center justify-center text-white text-sm">
              f({5 - level})
            </div>
            {level < levels - 1 && (
              <div className="text-slate-400">→</div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const MatrixVisualization: React.FC<{ step: number; data?: any }> = ({ step }) => {
  const matrixA = [[2, 1], [1, 3]];
  const matrixB = [[1, 2], [3, 1]];
  const currentStep = step % 4;
  
  return (
    <div className="text-center">
      <div className="text-lg text-slate-300 mb-4">Matrix Multiplication</div>
      <div className="flex items-center justify-center space-x-8">
        <div className="text-center">
          <div className="text-sm text-slate-400 mb-2">Matrix A</div>
          <div className="grid grid-cols-2 gap-1">
            {matrixA.flat().map((value, index) => (
              <motion.div
                key={index}
                animate={{ 
                  backgroundColor: currentStep >= index ? '#3B82F6' : '#374151',
                  scale: currentStep === index ? 1.1 : 1
                }}
                className="w-8 h-8 rounded border flex items-center justify-center text-white text-sm"
              >
                {value}
              </motion.div>
            ))}
          </div>
        </div>
        
        <div className="text-2xl text-green-400">×</div>
        
        <div className="text-center">
          <div className="text-sm text-slate-400 mb-2">Matrix B</div>
          <div className="grid grid-cols-2 gap-1">
            {matrixB.flat().map((value, index) => (
              <motion.div
                key={index}
                animate={{ 
                  backgroundColor: currentStep >= index ? '#10B981' : '#374151',
                  scale: currentStep === index ? 1.1 : 1
                }}
                className="w-8 h-8 rounded border flex items-center justify-center text-white text-sm"
              >
                {value}
              </motion.div>
            ))}
          </div>
        </div>
        
        <div className="text-2xl text-purple-400">=</div>
        
        <div className="text-center">
          <div className="text-sm text-slate-400 mb-2">Result C</div>
          <div className="grid grid-cols-2 gap-1">
            {[5, 5, 10, 5].map((value, index) => (
              <motion.div
                key={index}
                animate={{ 
                  backgroundColor: currentStep > index + 2 ? '#F59E0B' : '#374151',
                  scale: currentStep === index + 3 ? 1.2 : 1
                }}
                className="w-8 h-8 rounded border flex items-center justify-center text-white text-sm"
              >
                {currentStep > index + 2 ? value : '?'}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const MysteryBoxVisualization: React.FC<{ step: number; data?: any }> = ({ step }) => {
  const fibonacci = [1, 1, 2, 3, 5, 8];
  const transformed = [11, 11, 4, 13, 15, 16];
  const currentStep = step % 8;
  
  return (
    <div className="text-center">
      <div className="text-lg text-purple-300 mb-4">🎁 Mystery Box Algorithm</div>
      <div className="space-y-4">
        <div className="flex justify-center space-x-2">
          <div className="text-sm text-slate-400">Fibonacci:</div>
          {fibonacci.map((value, index) => (
            <motion.div
              key={index}
              animate={{ 
                backgroundColor: currentStep > index ? '#3B82F6' : '#374151',
                scale: currentStep === index + 1 ? 1.2 : 1
              }}
              className="w-8 h-8 rounded border flex items-center justify-center text-white text-xs"
            >
              {value}
            </motion.div>
          ))}
        </div>
        
        <motion.div
          animate={{ opacity: currentStep > 2 ? 1 : 0.3 }}
          className="text-yellow-400"
        >
          ↓ Transform (even×2, odd+10) ↓
        </motion.div>
        
        <div className="flex justify-center space-x-2">
          <div className="text-sm text-slate-400">Result:</div>
          {transformed.map((value, index) => (
            <motion.div
              key={index}
              animate={{ 
                backgroundColor: currentStep > index + 3 ? '#10B981' : '#374151',
                scale: currentStep === index + 4 ? 1.2 : 1
              }}
              className="w-8 h-8 rounded border flex items-center justify-center text-white text-xs"
            >
              {currentStep > index + 3 ? value : '?'}
            </motion.div>
          ))}
        </div>
        
        <motion.div
          animate={{ 
            opacity: currentStep > 6 ? 1 : 0,
            scale: currentStep > 6 ? 1.3 : 1
          }}
          className="text-2xl text-purple-400 font-bold"
        >
          Final Sum: 70 ✨
        </motion.div>
      </div>
    </div>
  );
};

const DefaultVisualization: React.FC<{ type: string }> = ({ type }) => (
  <div className="text-center text-slate-400">
    <div className="text-4xl mb-2">🔮</div>
    <div>Visualization: {type}</div>
    <div className="text-sm mt-2">Algorithm visualization in progress...</div>
  </div>
);

export default ChallengeVisualizer;