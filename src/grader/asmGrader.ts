import { assemble, createCPU, step, AsmError } from '../runners/asmEngine';
import { RAM_SIZE } from '../utils/memory';

export interface AssertResult {
  id: string;
  ok: boolean;
  got: any;
  expected: any;
  detail?: string;
}

export interface GradeResult {
  passed: boolean;
  results: AssertResult[];
  error?: string;
  steps?: number;
}

export interface Challenge {
  id: string;
  title: string;
  difficulty?: string;
  category?: string;
  prompt: string;
  realWorldContext?: string;
  starter: string;
  watches: string[];
  breakpoints?: number[];
  asserts: Array<{
    type: 'register' | 'memory' | 'registerIn' | 'memoryEqualsRange';
    register?: string;
    address?: number;
    value?: number;
    description?: string;
    reg?: string;
    addr?: string | number;
    equals?: number;
    min?: number;
    max?: number;
    range?: number[];
  }>;
  maxSteps?: number;
  hints: string[];
  visualization?: string;
  interactiveInput?: boolean;
  dynamicTests?: boolean;
  goldStandardSolution?: string;
  completionMessage?: string;
}

/**
 * Run a challenge and grade the solution
 */
export async function runChallenge(source: string, challenge: Challenge): Promise<GradeResult> {
  try {
    // Assemble the code
    const program = assemble(source);
    
    // Initialize CPU and memory
    const cpu = createCPU();
    const ram = new Uint8Array(RAM_SIZE);
    const ramView = new DataView(ram.buffer);
    
    // Initialize RAM with data section
    for (let i = 0; i < program.dataSection.length; i++) {
      ram[i] = program.dataSection[i];
    }
    
    // Execute the program with step limit
    let steps = 0;
    const maxSteps = challenge.maxSteps || 10000;
    
    while (!cpu.halted && steps < maxSteps) {
      try {
        step(cpu, program, ramView, {
          onSys: (syscall: number) => {
            // Handle system calls silently during grading
            switch (syscall) {
              case 1: // PRINT_INT
                return `${cpu.R[0]}`;
              case 2: // PRINT_STR
                return `String at ${cpu.R[1]}`;
              case 3: // EXIT
                cpu.halted = true;
                return `Exit: ${cpu.R[0]}`;
              default:
                return '';
            }
          }
        });
        steps++;
      } catch (err) {
        return {
          passed: false,
          results: [],
          error: err instanceof Error ? err.message : 'Runtime error during execution',
          steps
        };
      }
    }
    
    if (steps >= maxSteps) {
      return {
        passed: false,
        results: [],
        error: `Execution exceeded maximum steps (${maxSteps})`,
        steps
      };
    }
    
    // Grade the assertions
    const results: AssertResult[] = [];
    let allPassed = true;
    
    for (let i = 0; i < challenge.asserts.length; i++) {
      const assert = challenge.asserts[i];
      const result: AssertResult = {
        id: `assert_${i}`,
        ok: false,
        got: null,
        expected: assert.equals
      };
      
      try {
        if (assert.type === 'register') {
          // Check register value - support both old and new format
          const regName = (assert.register || assert.reg)!.toUpperCase();
          let got: number;
          
          if (regName.startsWith('R') && regName.length === 2) {
            const regNum = parseInt(regName[1]);
            if (regNum >= 0 && regNum <= 7) {
              got = cpu.R[regNum];
            } else {
              throw new Error(`Invalid register: ${regName}`);
            }
          } else if (regName === 'SP') {
            got = cpu.SP;
          } else if (regName === 'BP') {
            got = cpu.BP;
          } else if (regName === 'IP') {
            got = cpu.IP;
          } else {
            throw new Error(`Unknown register: ${regName}`);
          }
          
          result.got = got;
          const expected = assert.value !== undefined ? assert.value : assert.equals!;
          result.expected = expected;
          result.ok = got === expected;
          
          if (!result.ok) {
            result.detail = assert.description || `Expected ${regName}=${expected}, got ${got}`;
          }
          
        } else if (assert.type === 'registerIn') {
          // Check register value is in range
          const regName = assert.reg!.toUpperCase();
          let got: number;
          
          if (regName.startsWith('R') && regName.length === 2) {
            const regNum = parseInt(regName[1]);
            if (regNum >= 0 && regNum <= 7) {
              got = cpu.R[regNum];
            } else {
              throw new Error(`Invalid register: ${regName}`);
            }
          } else if (regName === 'SP') {
            got = cpu.SP;
          } else if (regName === 'BP') {
            got = cpu.BP;
          } else if (regName === 'IP') {
            got = cpu.IP;
          } else {
            throw new Error(`Unknown register: ${regName}`);
          }
          
          result.got = got;
          result.ok = got >= assert.min! && got <= assert.max!;
          
          if (!result.ok) {
            result.detail = `Expected ${regName} in range [${assert.min}, ${assert.max}], got ${got}`;
          }
          
        } else if (assert.type === 'memory') {
          // Check memory value - support both old and new format
          let addr: number;
          
          if (assert.address !== undefined) {
            addr = assert.address;
          } else if (typeof assert.addr === 'number') {
            addr = assert.addr;
          } else if (typeof assert.addr === 'string') {
            // Resolve label or expression
            addr = resolveAddress(assert.addr, program.labels);
          } else {
            throw new Error('Invalid address specification');
          }
          
          if (addr < 0 || addr >= RAM_SIZE - 3) {
            throw new Error(`Address out of bounds: ${addr}`);
          }
          
          const got = ramView.getInt16(addr, true); // Little endian, 16-bit
          result.got = got;
          const expected = assert.value !== undefined ? assert.value : assert.equals!;
          result.expected = expected;
          result.ok = got === expected;
          
          if (!result.ok) {
            result.detail = assert.description || `Expected memory[${addr}]=${expected}, got ${got}`;
          }
          
        } else if (assert.type === 'memoryEqualsRange') {
          // Check memory range equals expected array
          let addr: number;
          
          if (typeof assert.addr === 'number') {
            addr = assert.addr;
          } else if (typeof assert.addr === 'string') {
            addr = resolveAddress(assert.addr, program.labels);
          } else {
            throw new Error('Invalid address specification');
          }
          
          if (addr < 0 || addr >= RAM_SIZE - (assert.range!.length * 4)) {
            throw new Error(`Address range out of bounds: ${addr}`);
          }
          
          const expectedRange = assert.range!;
          const gotRange: number[] = [];
          let allMatch = true;
          
          for (let i = 0; i < expectedRange.length; i++) {
            const value = ramView.getInt32(addr + (i * 4), true);
            gotRange.push(value);
            if (value !== expectedRange[i]) {
              allMatch = false;
            }
          }
          
          result.got = gotRange;
          result.expected = expectedRange;
          result.ok = allMatch;
          
          if (!result.ok) {
            result.detail = `Expected memory range [${expectedRange.join(', ')}], got [${gotRange.join(', ')}]`;
          }
        }
        
      } catch (err) {
        result.ok = false;
        result.detail = err instanceof Error ? err.message : 'Assertion evaluation error';
        result.got = 'ERROR';
      }
      
      results.push(result);
      if (!result.ok) {
        allPassed = false;
      }
    }
    
    return {
      passed: allPassed,
      results,
      steps
    };
    
  } catch (err) {
    if (err instanceof AsmError) {
      return {
        passed: false,
        results: [],
        error: `Assembly error on line ${err.line}: ${err.message}`,
        steps: 0
      };
    } else {
      return {
        passed: false,
        results: [],
        error: err instanceof Error ? err.message : 'Unknown error',
        steps: 0
      };
    }
  }
}

/**
 * Resolve address from string (label or expression)
 */
function resolveAddress(addrStr: string, labels: Record<string, number>): number {
  const addr = addrStr.trim();
  
  // Handle simple numeric addresses
  if (/^\d+$/.test(addr)) {
    return parseInt(addr, 10);
  }
  
  if (/^0x[0-9a-f]+$/i.test(addr)) {
    return parseInt(addr, 16);
  }
  
  // Handle label + offset (e.g., "array+4", "data+8")
  const offsetMatch = addr.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*\+\s*(\d+)$/);
  if (offsetMatch) {
    const labelName = offsetMatch[1].toLowerCase();
    const offset = parseInt(offsetMatch[2], 10);
    
    if (labels[labelName] !== undefined) {
      return labels[labelName] + offset;
    } else {
      throw new Error(`Unknown label: ${labelName}`);
    }
  }
  
  // Handle simple label
  const labelName = addr.toLowerCase();
  if (labels[labelName] !== undefined) {
    return labels[labelName];
  }
  
  throw new Error(`Cannot resolve address: ${addr}`);
}

/**
 * Load challenges from JSON
 */
export async function loadChallenges(): Promise<Record<string, Challenge[]>> {
  try {
    const response = await fetch('/asm_challenges.json');
    if (!response.ok) {
      throw new Error(`Failed to load challenges: ${response.statusText}`);
    }
    const data = await response.json();
    
    // The new format has challenges directly under difficulty levels
    const challenges = {
      beginner: data.beginner || [],
      intermediate: data.intermediate || [],
      advanced: data.advanced || [],
      expert: data.expert || []
    };
    
    console.log('Loaded challenges:', challenges);
    return challenges;
  } catch (err) {
    console.error('Error loading challenges:', err);
    return { beginner: [], intermediate: [], advanced: [], expert: [] };
  }
}

/**
 * Load lessons from JSON
 */
export async function loadLessons(): Promise<any[]> {
  try {
    const response = await fetch('/asm_lessons.json');
    if (!response.ok) {
      throw new Error(`Failed to load lessons: ${response.statusText}`);
    }
    const data = await response.json();
    return data.lessons;
  } catch (err) {
    console.error('Error loading lessons:', err);
    return [];
  }
}

/**
 * Validate challenge structure
 */
export function validateChallenge(challenge: any): challenge is Challenge {
  return (
    typeof challenge === 'object' &&
    typeof challenge.id === 'string' &&
    typeof challenge.title === 'string' &&
    typeof challenge.prompt === 'string' &&
    typeof challenge.starter === 'string' &&
    Array.isArray(challenge.watches) &&
    Array.isArray(challenge.asserts) &&
    typeof challenge.maxSteps === 'number' &&
    Array.isArray(challenge.hints) &&
    challenge.asserts.every((assert: any) => 
      typeof assert === 'object' &&
      (assert.type === 'register' || assert.type === 'memory') &&
      typeof assert.equals === 'number'
    )
  );
}

/**
 * Get completion status from localStorage
 */
export function getCompletionStatus(): Record<string, boolean> {
  try {
    const stored = localStorage.getItem('asmplay_completions');
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

/**
 * Save completion status to localStorage
 */
export function saveCompletion(challengeId: string): void {
  try {
    const completions = getCompletionStatus();
    completions[challengeId] = true;
    localStorage.setItem('asmplay_completions', JSON.stringify(completions));
  } catch (err) {
    console.error('Failed to save completion:', err);
  }
}

/**
 * Clear all progress data from localStorage
 */
export function clearAllProgress(): void {
  try {
    localStorage.removeItem('asmplay_completions');
    localStorage.removeItem('asmplay_quiz_answers');
    console.log('All progress cleared - starting fresh!');
  } catch (err) {
    console.error('Failed to clear progress:', err);
  }
}

/**
 * Show spectacular confetti animation for successful completion
 */
export function showConfetti(): void {
  // Spectacular confetti effect with multiple types
  const confetti = document.createElement('div');
  confetti.className = 'confetti-container';
  confetti.innerHTML = `
    <div class="confetti">🎉</div>
    <div class="confetti">🎊</div>
    <div class="confetti">✨</div>
    <div class="confetti">🌟</div>
    <div class="confetti">🎈</div>
    <div class="confetti">🚀</div>
    <div class="confetti">💎</div>
    <div class="confetti">🔥</div>
    <div class="confetti">⚡</div>
    <div class="confetti">🏆</div>
  `;
  
  // Enhanced CSS for spectacular animation
  const style = document.createElement('style');
  style.textContent = `
    .confetti-container {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 9999;
    }
    .confetti {
      position: absolute;
      font-size: 2rem;
      animation: confetti-fall 4s ease-out forwards;
    }
    .confetti:nth-child(1) { left: 5%; animation-delay: 0s; }
    .confetti:nth-child(2) { left: 15%; animation-delay: 0.2s; }
    .confetti:nth-child(3) { left: 25%; animation-delay: 0.4s; }
    .confetti:nth-child(4) { left: 35%; animation-delay: 0.6s; }
    .confetti:nth-child(5) { left: 45%; animation-delay: 0.8s; }
    .confetti:nth-child(6) { left: 55%; animation-delay: 1s; }
    .confetti:nth-child(7) { left: 65%; animation-delay: 1.2s; }
    .confetti:nth-child(8) { left: 75%; animation-delay: 1.4s; }
    .confetti:nth-child(9) { left: 85%; animation-delay: 1.6s; }
    .confetti:nth-child(10) { left: 95%; animation-delay: 1.8s; }
    
    @keyframes confetti-fall {
      0% {
        top: -10%;
        transform: rotate(0deg) scale(1);
        opacity: 1;
      }
      50% {
        transform: rotate(180deg) scale(1.2);
        opacity: 1;
      }
      100% {
        top: 110%;
        transform: rotate(360deg) scale(0.8);
        opacity: 0;
      }
    }
  `;
  
  document.head.appendChild(style);
  document.body.appendChild(confetti);
  
  // Clean up after animation
  setTimeout(() => {
    document.body.removeChild(confetti);
    document.head.removeChild(style);
  }, 5000);
}

/**
 * Show special effects for Mystery Box completion
 */
export function showMysteryBoxCompletion(): void {
  const container = document.createElement('div');
  container.className = 'mystery-box-completion';
  container.innerHTML = `
    <div class="mystery-box-overlay">
      <div class="mystery-box-content">
        <div class="mystery-box-title">🎁 MYSTERY BOX CONQUERED! 🎁</div>
        <div class="mystery-box-subtitle">LEGENDARY STATUS ACHIEVED!</div>
        <div class="mystery-box-effects">
          <div class="sparkle">✨</div>
          <div class="sparkle">🌟</div>
          <div class="sparkle">💫</div>
          <div class="sparkle">⭐</div>
        </div>
      </div>
    </div>
  `;

  const style = document.createElement('style');
  style.textContent = `
    .mystery-box-completion {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 10000;
      pointer-events: none;
    }
    .mystery-box-overlay {
      width: 100%;
      height: 100%;
      background: radial-gradient(circle, rgba(255,215,0,0.3) 0%, rgba(138,43,226,0.3) 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      animation: mystery-box-fade-in 2s ease-out;
    }
    .mystery-box-content {
      text-align: center;
      color: #FFD700;
      text-shadow: 0 0 20px #FFD700;
    }
    .mystery-box-title {
      font-size: 3rem;
      font-weight: bold;
      margin-bottom: 1rem;
      animation: mystery-box-glow 2s ease-in-out infinite alternate;
    }
    .mystery-box-subtitle {
      font-size: 1.5rem;
      margin-bottom: 2rem;
    }
    .mystery-box-effects {
      position: relative;
    }
    .sparkle {
      position: absolute;
      font-size: 2rem;
      animation: sparkle-dance 3s ease-in-out infinite;
    }
    .sparkle:nth-child(1) { top: -50px; left: -100px; animation-delay: 0s; }
    .sparkle:nth-child(2) { top: -50px; right: -100px; animation-delay: 0.5s; }
    .sparkle:nth-child(3) { bottom: -50px; left: -100px; animation-delay: 1s; }
    .sparkle:nth-child(4) { bottom: -50px; right: -100px; animation-delay: 1.5s; }
    
    @keyframes mystery-box-fade-in {
      0% { opacity: 0; transform: scale(0.5); }
      100% { opacity: 1; transform: scale(1); }
    }
    @keyframes mystery-box-glow {
      0% { text-shadow: 0 0 20px #FFD700; }
      100% { text-shadow: 0 0 40px #FFD700, 0 0 60px #FFD700; }
    }
    @keyframes sparkle-dance {
      0%, 100% { transform: translateY(0) rotate(0deg); }
      50% { transform: translateY(-20px) rotate(180deg); }
    }
  `;

  document.head.appendChild(style);
  document.body.appendChild(container);

  setTimeout(() => {
    document.body.removeChild(container);
    document.head.removeChild(style);
  }, 6000);
}

/**
 * Calculate advanced grading score with efficiency and style metrics
 */
export function calculateAdvancedScore(result: GradeResult, challenge: Challenge, executionTime: number, codeLength: number): {
  correctness: number;
  efficiency: number;
  codeStyle: number;
  total: number;
  grade: string;
} {
  // Correctness (60%)
  const correctness = result.passed ? 60 : (result.results.filter(r => r.ok).length / result.results.length) * 60;
  
  // Efficiency (20%) - based on steps taken vs optimal
  const maxSteps = challenge.maxSteps || 1000;
  const actualSteps = result.steps || 0;
  const efficiencyRatio = Math.max(0, 1 - (actualSteps / maxSteps));
  const efficiency = efficiencyRatio * 20;
  
  // Code Style (20%) - based on code length, comments, structure
  const hasComments = codeLength > 0; // Simplified for now
  const codeStyleScore = hasComments ? 20 : 15;
  
  const total = correctness + efficiency + codeStyleScore;
  
  let grade = 'F';
  if (total >= 90) grade = 'A+';
  else if (total >= 85) grade = 'A';
  else if (total >= 80) grade = 'B+';
  else if (total >= 75) grade = 'B';
  else if (total >= 70) grade = 'C+';
  else if (total >= 65) grade = 'C';
  else if (total >= 60) grade = 'D';
  
  return {
    correctness: Math.round(correctness),
    efficiency: Math.round(efficiency),
    codeStyle: Math.round(codeStyleScore),
    total: Math.round(total),
    grade
  };
}

/**
 * Check and award badges based on completion patterns
 */
export function checkBadges(): string[] {
  const completions = getCompletionStatus();
  const completedChallenges = Object.keys(completions).filter(id => completions[id]);
  const badges: string[] = [];
  
  // Speed Demon: 5 challenges completed (simplified)
  if (completedChallenges.length >= 5) {
    badges.push('speedster');
  }
  
  // Perfectionist: 10 challenges completed
  if (completedChallenges.length >= 10) {
    badges.push('perfectionist');
  }
  
  // Hot Streak: 5 in a row (simplified)
  if (completedChallenges.length >= 5) {
    badges.push('streak');
  }
  
  // Assembly Champion: All 24 challenges
  if (completedChallenges.length >= 24) {
    badges.push('champion');
  }
  
  return badges;
}