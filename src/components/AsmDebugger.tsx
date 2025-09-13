/**
 * Enhanced MicroZ Assembly Debugger with line awareness and resizable UI
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  Pause,
  StepForward,
  SkipForward,
  RotateCcw,
  Bug,
  Eye,
  Terminal,
  HardDrive,
  Activity,
  Settings,
  AlertTriangle,
  ArrowLeft,
  Lightbulb,
  FileText
} from 'lucide-react';
import { NeonButton } from './ui/NeonButton';
import { GlassCard } from './ui/GlassCard';
import { PanelHeader } from './ui/PanelHeader';
import { TagPill } from './ui/TagPill';
import { GlowTabs } from './ui/GlowTabs';
import { MemoryViewer } from './MemoryViewer';
import { WatchesPanel } from './WatchesPanel';
import { TracePanel } from './TracePanel';
import { PerformanceControls } from './PerformanceControls';
import { DebuggerLayout } from './DebuggerLayout';
import ErrorBoundary from './ErrorBoundary';
import { useDebuggerBus } from '../state/debuggerBus';
import { createRAM, RAM_SIZE } from '../utils/memory';
import { assemble, createCPU, step, run, type CPU, type Program, AsmError } from '../runners/asmEngine';
import { findExecutableLines, snapToExecutableLine } from '../utils/positions';
import { createIdentityAdapter, type SourceMapAdapter } from '../utils/sourceMap';
import { debuggerLog } from '../utils/log';
import { validateBreakpoint, validateStepEvent, type Breakpoint } from '../utils/validation';

// Example programs for Load Example functionality
const examples = {
  'showcase.asm': `; MicroZ Complete Instruction Set Showcase
; Demonstrates all available instructions without .DATA section

.TEXT
main:
    MOV R0, #42
    MOV R1, R0
    MOV R2, #15

    ADD R0, #10
    SUB R1, #2
    MUL R2, #3
    DIV R0, #2
    INC R1
    DEC R2

    PUSH R0
    PUSH R1
    POP R3
    POP R4

    MOV R0, #123
    SYS #1

    MOV R5, #0

loop_start:
    MOV R0, R5
    SYS #1
    INC R5
    CMP R5, #5
    JL loop_start

    CALL math_function

    MOV R9, #0xFF
    AND R9, #0x0F
    OR R9, #0xF0
    XOR R9, #0xAA
    NOT R9

    MOV R10, #8
    SHL R10, #2
    SHR R10, #1

    MOV R11, #1000
    STORE [1000], R11
    LOAD R12, [1000]

    MOV R0, #0
    SYS #3
    HLT

math_function:
    PUSH BP
    MOV BP, SP
    MOV R0, #10
    MOV R1, #5
    ADD R0, R1
    POP BP
    RET`,

  'extensive-showcase.asm': `; MicroZ Complete Instruction Set Showcase
; Demonstrates all available instructions without .DATA section

.TEXT
main:
    ; Set breakpoint here to start debugging
    MOV R0, #42
    MOV R1, R0
    MOV R2, #15

    ; Basic arithmetic operations
    ADD R0, #10
    SUB R1, #2
    MUL R2, #3
    DIV R0, #2
    INC R1
    DEC R2

    ; Stack operations
    PUSH R0
    PUSH R1
    POP R3
    POP R4

    ; System calls - print numbers
    MOV R0, #123
    SYS #1

    ; Loop with conditional jumps
    MOV R5, #0

loop_start:
    MOV R0, R5
    SYS #1
    INC R5
    CMP R5, #5
    JL loop_start
    JNE skip_equal
    JE equal_branch

skip_equal:
    ; More jump instructions
    CMP R5, #10
    JG greater_branch
    JGE greater_equal_branch
    JLE less_equal_branch

greater_branch:
    JMP continue_program

greater_equal_branch:
    JMP continue_program

less_equal_branch:
    JMP continue_program

equal_branch:
    JMP continue_program

continue_program:
    ; Function call demonstration
    CALL math_function

    ; Bitwise operations
    MOV R9, #0xFF
    AND R9, #0x0F
    OR R9, #0xF0
    XOR R9, #0xAA
    NOT R9

    ; Shift operations
    MOV R10, #8
    SHL R10, #2
    SHR R10, #1

    ; Memory operations using immediate addresses
    MOV R11, #1000
    STORE [1000], R11
    LOAD R12, [1000]

    ; Indirect memory access
    MOV R13, #1002
    STORE [R13], #999
    LOAD R14, [R13]

    ; More conditional jumps
    CMP R14, #999
    JC carry_set
    JNC no_carry
    JN negative_flag
    JNN not_negative

carry_set:
    JMP test_complete

no_carry:
    JMP test_complete

negative_flag:
    JMP test_complete

not_negative:
    JMP test_complete

test_complete:
    ; Test comparison instruction
    TEST R0, #0xFF
    
    ; Final system calls
    MOV R0, #0
    SYS #3
    HLT

; Function demonstrating all instruction types
math_function:
    PUSH BP
    MOV BP, SP

    ; Local calculations
    MOV R0, #10
    MOV R1, #5
    ADD R0, R1
    SUB R0, #3
    MUL R0, #2
    DIV R0, #4

    ; Test all arithmetic with different operands
    MOV R2, #100
    ADD R2, R0
    SUB R2, R1
    MUL R2, #2
    DIV R2, R0

    ; Bitwise operations on results
    AND R2, #0xFF
    OR R2, #0x100
    XOR R2, R0
    NOT R2

    ; Shift the result
    SHL R2, #1
    SHR R2, #2

    ; Increment and decrement tests
    INC R0
    DEC R1
    INC R2
    DEC R0

    ; Memory operations within function
    STORE [2000], R2
    LOAD R3, [2000]

    ; Compare and conditional execution
    CMP R3, R2
    JE values_equal
    JNE values_different

values_equal:
    MOV R0, #1
    JMP function_end

values_different:
    MOV R0, #0

function_end:
    POP BP
    RET

; Additional test functions for complete coverage
utility_functions:
    ; Test NOP instruction
    NOP
    NOP
    NOP

    ; Test all register operations
    MOV R0, #1
    MOV R1, #2
    MOV R2, #3
    MOV R3, #4
    MOV R4, #5
    MOV R5, #6
    MOV R6, #7
    MOV R7, #8
    MOV R8, #9
    MOV R9, #10
    MOV R10, #11
    MOV R11, #12
    MOV R12, #13
    MOV R13, #14
    MOV R14, #15
    MOV R15, #16

    ; Test stack with all registers
    PUSH R0
    PUSH R1
    PUSH R2
    PUSH R3
    POP R15
    POP R14
    POP R13
    POP R12

    ; Test memory with register indirect
    MOV R0, #3000
    STORE [R0], #777
    LOAD R1, [R0]

    ; Test all comparison scenarios
    CMP R1, #777
    CMP R1, #778
    CMP R1, #776

    RET`,

  'factorial.asm': `; Factorial Example - No .DATA section
.TEXT
start:
    ; Calculate 5! using registers only (max 7! for 16-bit registers)
    MOV R0, #5
    MOV R1, #1
    
factorial_loop:
    CMP R0, #1
    JLE done
    MUL R1, R0
    DEC R0
    JNE factorial_loop
    
done:
    ; Print result
    MOV R0, R1
    SYS #1
    
    ; Exit
    MOV R0, #0
    SYS #3
    HLT`
};

interface DebuggerState {
  cpu: CPU;
  ram: DataView;
  program: Program | null;
  sourceMap: SourceMapAdapter;
  executableLines: Set<number>;
  breakpoints: Map<number, Breakpoint>;
  watches: Array<{
    id: string;
    expression: string;
    value: number | string;
    history: (number | string)[];
    error?: string;
    changed: boolean;
  }>;
  running: boolean;
  currentLine: number | null;
  consoleOutput: string[];
  error: string | null;
}

interface AsmDebuggerProps {
  initialCode?: string;
  readonly?: boolean;
  theme?: 'light' | 'dark' | 'system';
}

const AsmDebugger: React.FC<AsmDebuggerProps> = ({
  initialCode = '',
  readonly = false,
  theme = 'dark'
}) => {
  const { pendingLoad, consumed, markConsumed } = useDebuggerBus();
  const [code, setCode] = useState(initialCode ?? '');
  const [debuggerState, setDebuggerState] = useState<DebuggerState>(() => ({
    cpu: createCPU(),
    ram: createRAM(),
    program: null,
    sourceMap: createIdentityAdapter(),
    executableLines: new Set(),
    breakpoints: new Map(),
    watches: [],
    running: false,
    currentLine: null,
    consoleOutput: [],
    error: null
  }));

  const [activePanel, setActivePanel] = useState('registers');
  const [speed, setSpeed] = useState(1);
  const [batchSize, setBatchSize] = useState(100);
  const [showBreakpointToast, setShowBreakpointToast] = useState<{ line: number; snapped: boolean } | null>(null);
  const [currentLessonId, setCurrentLessonId] = useState<string | null>(null);
  const [currentChallengeId, setCurrentChallengeId] = useState<string | null>(null);
  const [currentLessonTitle, setCurrentLessonTitle] = useState<string | null>(null);
  const [currentChallengeTitle, setCurrentChallengeTitle] = useState<string | null>(null);
  const editorRef = useRef<any>(null);
  const monacoGlobalRef = useRef<any>(null);

  // Clear debugger state completely
  const clearDebuggerState = useCallback(() => {
    debuggerLog.debug('Clearing debugger state completely');
    setDebuggerState({
      cpu: createCPU(),
      ram: createRAM(),
      program: null,
      sourceMap: createIdentityAdapter(),
      executableLines: new Set(),
      breakpoints: new Map(),
      watches: [],
      running: false,
      currentLine: null,
      consoleOutput: [],
      error: null
    });

    // Clear lesson/challenge context
    setCurrentLessonId(null);
    setCurrentChallengeId(null);
    setCurrentLessonTitle(null);
    setCurrentChallengeTitle(null);

    // Clear any cached localStorage data
    localStorage.removeItem('microz.debugger.source');
  }, []);

  // Persistence: load/save editor buffer (only when not loading from lesson)
  useEffect(() => {
    if (!pendingLoad && !consumed && !currentLessonId && !currentChallengeId) {
      const cached = localStorage.getItem('microz.debugger.source');
      if (cached && !code) setCode(cached);
    }
  }, [pendingLoad, consumed, currentLessonId, currentChallengeId, code]);

  useEffect(() => {
    // Only save to localStorage if not from a lesson/challenge
    if (!currentLessonId && !currentChallengeId) {
      const t = setTimeout(() => {
        localStorage.setItem('microz.debugger.source', code ?? '');
      }, 200);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [code, currentLessonId, currentChallengeId]);

  // Load pending code from debugger bus
  useEffect(() => {
    if (pendingLoad && !consumed) {
      debuggerLog.debug('Loading pending code from bus', pendingLoad);

      // Clear old program and reset debugger state completely
      clearDebuggerState();

      setCode(pendingLoad.source ?? '');

      // Set up breakpoints
      if (pendingLoad.breakpoints) {
        const newBreakpoints = new Map<number, Breakpoint>();
        pendingLoad.breakpoints.forEach(line => {
          try {
            const bp = validateBreakpoint({ line, enabled: true });
            newBreakpoints.set(line, bp);
          } catch (error) {
            debuggerLog.warn('Invalid breakpoint from bus:', error);
          }
        });

        setDebuggerState(prev => ({
          ...prev,
          breakpoints: newBreakpoints
        }));
      }

      // Set up watches
      if (pendingLoad.watches) {
        const newWatches = pendingLoad.watches.map((expr, index) => ({
          id: `watch_${index}`,
          expression: expr,
          value: 0,
          history: [],
          changed: false
        }));

        setDebuggerState(prev => ({
          ...prev,
          watches: newWatches
        }));
      }

      // Track lesson/challenge context
      setCurrentLessonId(pendingLoad.lessonId || null);
      setCurrentChallengeId(pendingLoad.challengeId || null);
      setCurrentLessonTitle(pendingLoad.lessonTitle || null);
      setCurrentChallengeTitle(pendingLoad.challengeTitle || null);

      markConsumed();
    }
  }, [pendingLoad, consumed, markConsumed, clearDebuggerState]);

  // Assemble code when it changes
  useEffect(() => {
    if (!code || !code.trim()) {
      setDebuggerState(prev => ({ ...prev, program: null, executableLines: new Set(), error: null }));
      return;
    }

    try {
      debuggerLog.debug('Assembling code');
      const program = assemble(code);
      const executableLines = findExecutableLines(code);

      setDebuggerState(prev => ({
        ...prev,
        program,
        executableLines,
        error: null
      }));

      debuggerLog.debug('Assembly successful', {
        instructions: program.ast.length,
        executableLines: executableLines.size
      });

    } catch (error) {
      const errorMsg = error instanceof AsmError
        ? `Line ${error.line}:${error.column}: ${error.message}${error.suggestion ? ` (${error.suggestion})` : ''}`
        : error instanceof Error
          ? error.message
          : 'Assembly failed';

      setDebuggerState(prev => ({
        ...prev,
        program: null,
        error: errorMsg
      }));

      debuggerLog.error('Assembly failed:', error);
    }
  }, [code]);

  // Hide breakpoint toast after delay
  useEffect(() => {
    if (showBreakpointToast) {
      const timer = setTimeout(() => setShowBreakpointToast(null), 3000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [showBreakpointToast]);

  // Monaco editor setup
  const handleEditorDidMount = useCallback((editor: any, monaco: any) => {
    editorRef.current = editor;
    monacoGlobalRef.current = monaco;

    // Register MicroZ assembly language
    monaco.languages.register({ id: 'microz-asm' });
    monaco.languages.setMonarchTokensProvider('microz-asm', {
      tokenizer: {
        root: [
          [/;.*$/, 'comment'],
          [/\b(MOV|LOAD|STORE|ADD|SUB|MUL|DIV|INC|DEC|AND|OR|XOR|NOT|SHL|SHR|CMP|JMP|JE|JNE|JNZ|JG|JGE|JL|JLE|JC|JNC|PUSH|POP|CALL|RET|SYS|SYSCALL|HLT|HALT|NOP)\b/i, 'keyword'],
          [/\bR\d+\b|SP|BP|IP/i, 'variable.predefined'],
          [/\b0x[0-9A-Fa-f]+\b|\b0b[01]+\b|\b\d+\b|'.'/, 'number'],
          [/".*?"/, 'string'],
          [/^\s*[A-Za-z_][\w]*\s*:/, 'type.identifier'],
          [/\.(DATA|TEXT|WORD|BYTE|ASCII|ASCIZ|STRING|ALIGN|ORG)\b/i, 'keyword.control'],
        ],
      },
    });

    // Toggle breakpoints by clicking the glyph margin
    editor.onMouseDown((e: any) => {
      const t = e.target;
      if (!t) return;
      const isGlyph = t.type === monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN;
      const line = t.position?.lineNumber;
      if (isGlyph && line) {
        toggleBreakpoint(line);
        e.event?.preventDefault?.();
      }
    });

    // Keyboard shortcuts
    editor.addCommand(monaco.KeyCode.F9, () => {
      const position = editor.getPosition();
      if (position) toggleBreakpoint(position.lineNumber);
    });
    editor.addCommand(monaco.KeyCode.F10, () => handleStep('over'));
    editor.addCommand(monaco.KeyCode.F11, () => handleStep('into'));
    editor.addCommand(monaco.KeyMod.Shift | monaco.KeyCode.F11, () => handleStep('out'));
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyB, () => setActivePanel('registers'));

    // Initial decorations
    updateBreakpointDecorations();

    // Force a layout after mount
    setTimeout(() => editor.layout(), 0);

    debuggerLog.debug('Monaco editor mounted with MicroZ syntax highlighting');
  }, []);

  const updateBreakpointDecorations = useCallback(() => {
    if (!editorRef.current || !monacoGlobalRef.current) return;
    const monaco = monacoGlobalRef.current;

    const decorations: any[] = Array.from(debuggerState.breakpoints.entries()).map(([line, bp]) => ({
      range: new monaco.Range(line, 1, line, 1),
      options: {
        isWholeLine: true,
        className: 'breakpoint-line',
        glyphMarginClassName: bp.enabled ? 'breakpoint-glyph' : 'breakpoint-glyph-disabled',
        glyphMarginHoverMessage: { value: `Breakpoint at line ${line}` }
      }
    }));

    if (debuggerState.currentLine) {
      decorations.push({
        range: new monaco.Range(debuggerState.currentLine, 1, debuggerState.currentLine, 1),
        options: {
          isWholeLine: true,
          className: 'current-execution-line',
          glyphMarginClassName: 'current-execution-glyph'
        }
      });
    }

    editorRef.current.deltaDecorations([], decorations);
  }, [debuggerState.breakpoints, debuggerState.currentLine]);

  useEffect(() => {
    updateBreakpointDecorations();
  }, [updateBreakpointDecorations]);

  const toggleBreakpoint = useCallback((line: number) => {
    const { line: snappedLine, snapped } = snapToExecutableLine(line, debuggerState.executableLines);

    if (snapped) {
      setShowBreakpointToast({ line: snappedLine, snapped: true });
      debuggerLog.info(`Breakpoint moved to line ${snappedLine} (nearest executable)`);
    }

    setDebuggerState(prev => {
      const newBreakpoints = new Map(prev.breakpoints);
      if (newBreakpoints.has(snappedLine)) {
        newBreakpoints.delete(snappedLine);
      } else {
        newBreakpoints.set(snappedLine, { line: snappedLine, enabled: true });
      }
      return { ...prev, breakpoints: newBreakpoints };
    });
  }, [debuggerState.executableLines]);

  const handleReset = useCallback(() => {
    debuggerLog.debug('Resetting debugger state');
    setDebuggerState(prev => {
      const newCpu = createCPU();
      const newRam = createRAM();
      if (prev.program && prev.program.dataSection && prev.program.dataStart !== undefined) {
        for (let i = 0; i < prev.program.dataSection.length; i++) {
          const dataByte = prev.program.dataSection[i];
          if (dataByte !== undefined) {
            newRam.setUint8(prev.program.dataStart + i, dataByte);
          }
        }
      }
      return {
        ...prev,
        cpu: newCpu,
        ram: newRam,
        running: false,
        currentLine: null,
        consoleOutput: [],
        error: null
      };
    });
  }, []);



  const evaluateWatchExpression = (
    expr: string,
    cpu: CPU,
    ram: DataView,
    labels: Record<string, number>
  ): number | string => {
    const trimmed = expr.trim().toUpperCase();

    // Register expressions
    if (trimmed.match(/^R\d+$/)) {
      const regNum = parseInt(trimmed.slice(1));
      if (regNum >= 0 && regNum < 16) {
        const regValue = cpu.R[regNum];
        return regValue ?? 0;
      }
    }
    if (trimmed === 'SP') return cpu.SP;
    if (trimmed === 'BP') return cpu.BP;
    if (trimmed === 'IP') return cpu.IP;

    // Memory expressions [addr], [label], [label+offset]
    const memMatch = trimmed.match(/^\[(.+)\]$/);
    if (memMatch) {
      const addrExpr = memMatch[1];
      if (!addrExpr) throw new Error(`Invalid expression: ${expr}`);

      let addr: number;

      if (Object.prototype.hasOwnProperty.call(labels, addrExpr.toLowerCase())) {
        addr = labels[addrExpr.toLowerCase()] ?? 0;
      } else if (/^[A-Z_][A-Z0-9_]*\+\d+$/.test(addrExpr)) {
        const parts = addrExpr.split('+');
        const label = parts[0];
        const offset = parts[1];
        if (!label || !offset) throw new Error(`Invalid expression: ${expr}`);
        addr = (labels[label.toLowerCase()] ?? 0) + parseInt(offset, 10);
      } else {
        addr = parseInt(addrExpr, addrExpr.startsWith('0X') ? 16 : 10);
        if (Number.isNaN(addr)) addr = parseInt(addrExpr, 10);
      }

      if (Number.isFinite(addr) && addr >= 0 && addr < RAM_SIZE - 1) {
        return ram.getInt16(addr, true);
      }
    }

    throw new Error(`Invalid expression: ${expr}`);
  };

  const handleStep = useCallback((type: 'into' | 'over' | 'out') => {
    if (!debuggerState.program || debuggerState.running) return;

    try {
      const stepEvent = validateStepEvent({ type, count: 1 });
      debuggerLog.debug('Stepping', stepEvent);

      setDebuggerState(prev => {
        const newState = { ...prev };
        if (newState.cpu.halted) {
          debuggerLog.warn('Cannot step: CPU halted');
          return prev;
        }

        try {
          step(newState.cpu, newState.program!, newState.ram, {
            onSys: (syscall: number) => {
              switch (syscall) {
                case 1: {
                  const output = `${newState.cpu.R[0]}`;
                  newState.consoleOutput = [...newState.consoleOutput, output];
                  return output;
                }
                case 2: {
                  const strAddr = newState.cpu.R[0];
                  if (strAddr === undefined) return '';
                  let str = '';
                  for (let i = 0; i < 256; i++) {
                    if (strAddr + i >= RAM_SIZE) break;
                    const byte = newState.ram.getUint8(strAddr + i);
                    if (byte === 0) break;
                    str += String.fromCharCode(byte);
                  }
                  newState.consoleOutput = [...newState.consoleOutput, str];
                  return str;
                }
                case 3: {
                  const msg = `Exit: ${newState.cpu.R[0]}`;
                  newState.consoleOutput = [...newState.consoleOutput, msg];
                  return msg;
                }
                default:
                  return '';
              }
            }
          });

          // Update current line based on IP
          if (newState.program && newState.cpu.IP < newState.program.ast.length) {
            const instruction = newState.program.ast[newState.cpu.IP];
            newState.currentLine = instruction?.line ?? null;
          } else {
            newState.currentLine = null;
          }

          // Auto-reveal current line
          if (editorRef.current && newState.currentLine) {
            editorRef.current.revealLineInCenterIfOutsideViewport(newState.currentLine);
          }

          // Update watches
          newState.watches = newState.watches.map(watch => {
            try {
              const newValue = evaluateWatchExpression(
                watch.expression, newState.cpu, newState.ram, newState.program?.labels || {}
              );
              const changed = newValue !== watch.value;
              return {
                ...watch,
                value: newValue,
                history: changed ? [watch.value, ...watch.history.slice(0, 9)] : watch.history,
                changed,
                error: undefined
              };
            } catch (error) {
              return {
                ...watch,
                error: error instanceof Error ? error.message : 'Evaluation error',
                changed: false
              };
            }
          });

        } catch (error) {
          newState.error = error instanceof AsmError
            ? `Line ${error.line}:${error.column}: ${error.message}`
            : error instanceof Error
              ? error.message
              : 'Execution error';
          debuggerLog.error('Step execution failed:', error);
        }

        return newState;
      });
    } catch (error) {
      debuggerLog.error('Step validation failed:', error);
    }
  }, [debuggerState.program, debuggerState.running]);

  const handleRun = useCallback(() => {
    if (!debuggerState.program || debuggerState.running) return;

    debuggerLog.debug('Starting execution');
    setDebuggerState(prev => ({ ...prev, running: true }));

    setTimeout(() => {
      setDebuggerState(prev => {
        const newState = { ...prev };

        try {
          const result = run(newState.cpu, newState.program!, newState.ram, {
            maxSteps: 10000,
            breakpoints: new Set(Array.from(newState.breakpoints.keys())),
            onSys: (syscall: number) => {
              switch (syscall) {
                case 1: {
                  const output = `${newState.cpu.R[0]}`;
                  newState.consoleOutput = [...newState.consoleOutput, output];
                  return output;
                }
                case 2: {
                  const strAddr = newState.cpu.R[0];
                  if (strAddr === undefined) return '';
                  let str = '';
                  for (let i = 0; i < 256; i++) {
                    if (strAddr + i >= RAM_SIZE) break;
                    const byte = newState.ram.getUint8(strAddr + i);
                    if (byte === 0) break;
                    str += String.fromCharCode(byte);
                  }
                  newState.consoleOutput = [...newState.consoleOutput, str];
                  return str;
                }
                case 3: {
                  const msg = `Exit: ${newState.cpu.R[0]}`;
                  newState.consoleOutput = [...newState.consoleOutput, msg];
                  return msg;
                }
                default:
                  return '';
              }
            }
          });

          debuggerLog.debug('Execution completed', result);

          if (newState.program && newState.cpu.IP < newState.program.ast.length) {
            const instruction = newState.program.ast[newState.cpu.IP];
            newState.currentLine = instruction?.line ?? null;
          } else {
            newState.currentLine = null;
          }

          if (editorRef.current && newState.currentLine) {
            editorRef.current.revealLineInCenterIfOutsideViewport(newState.currentLine);
          }

        } catch (error) {
          newState.error = error instanceof AsmError
            ? `Line ${error.line}:${error.column}: ${error.message}`
            : error instanceof Error
              ? error.message
              : 'Execution error';
          debuggerLog.error('Execution failed:', error);
        }

        return { ...newState, running: false };
      });
    }, 10);
  }, [debuggerState.program, debuggerState.running]);

  const addWatch = useCallback((expression: string) => {
    const newWatch = {
      id: `watch_${Date.now()}`,
      expression,
      value: 0,
      history: [],
      changed: false
    };
    setDebuggerState(prev => ({ ...prev, watches: [...prev.watches, newWatch] }));
  }, []);

  const removeWatch = useCallback((id: string) => {
    setDebuggerState(prev => ({ ...prev, watches: prev.watches.filter(w => w.id !== id) }));
  }, []);

  const copyValue = useCallback((value: number | string) => {
    navigator.clipboard.writeText(String(value));
  }, []);

  const panels = [
    { id: 'registers', label: 'Registers', icon: <Settings className="w-4 h-4" /> },
    { id: 'memory', label: 'Memory', icon: <HardDrive className="w-4 h-4" /> },
    { id: 'watches', label: 'Watches', icon: <Eye className="w-4 h-4" /> },
    { id: 'console', label: 'Console', icon: <Terminal className="w-4 h-4" /> },
    { id: 'trace', label: 'Trace', icon: <Activity className="w-4 h-4" /> },
    ...(currentLessonId || currentChallengeId ? [{ id: 'hints', label: 'Hints', icon: <Lightbulb className="w-4 h-4" /> }] : []),
  ];

  const handleBackToLesson = (): void => {
    // Navigate back to the lesson or challenge
    if (currentLessonId || currentChallengeId) {
      // Dispatch navigation event to Learn component first
      window.dispatchEvent(new CustomEvent('navigate-to-learn', {
        detail: { lessonId: currentLessonId, challengeId: currentChallengeId }
      }));

      // Navigate to Learn tab
      window.dispatchEvent(new CustomEvent('navigate-to-tab', {
        detail: { tab: 'learn' }
      }));
    }
  };

  const renderEditor = () => (
    <GlassCard className="h-full">
      <PanelHeader
        title="MicroZ Assembly Debugger"
        subtitle={debuggerState.program ? `${debuggerState.program.ast.length} instructions` : 'No program loaded'}
        icon={<Bug className="w-5 h-5" />}
        actions={
          <div className="flex items-center space-x-2">
            {(currentLessonId || currentChallengeId) && (
              <NeonButton
                variant="ghost"
                size="sm"
                onClick={handleBackToLesson}
                className="flex items-center space-x-1"
                title={`Return to ${currentLessonTitle || currentChallengeTitle || (currentLessonId ? 'Lesson' : 'Challenge')}`}
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="truncate max-w-32">
                  Back to {currentLessonId ? 'Lesson' : 'Challenge'}
                </span>
              </NeonButton>
            )}
            <TagPill variant={debuggerState.cpu.halted ? 'danger' : 'success'}>
              {debuggerState.cpu.halted ? 'Halted' : 'Ready'}
            </TagPill>
            {debuggerState.running && <TagPill variant="warning">Running</TagPill>}
          </div>
        }
      />

      <div className="flex-1 flex flex-col min-h-0">
        {/* Controls */}
        <div className="p-4 border-b border-edge/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <NeonButton
                variant="accent"
                size="sm"
                onClick={handleRun}
                disabled={debuggerState.running || !debuggerState.program}
              >
                {debuggerState.running ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {debuggerState.running ? 'Running' : 'Run'}
              </NeonButton>

              <NeonButton
                variant="secondary"
                size="sm"
                onClick={() => handleStep('over')}
                disabled={debuggerState.running || debuggerState.cpu.halted}
                title="Step Over"
              >
                <StepForward className="w-4 h-4" />
              </NeonButton>

              <NeonButton
                variant="secondary"
                size="sm"
                onClick={() => handleStep('into')}
                disabled={debuggerState.running || debuggerState.cpu.halted}
                title="Step Into"
              >
                <SkipForward className="w-4 h-4" />
              </NeonButton>

              <NeonButton
                variant="ghost"
                size="sm"
                onClick={handleReset}
                title="Reset"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </NeonButton>

              <div className="relative">
                <select
                  className="appearance-none bg-bg border border-edge/50 rounded-lg px-3 py-2 pr-8 text-sm text-slate-200 hover:border-accent/50 focus:border-accent focus:outline-none cursor-pointer"
                  onChange={(e) => {
                    if (e.target.value) {
                      setCode(examples[e.target.value as keyof typeof examples]);
                      e.target.value = '';
                    }
                  }}
                  defaultValue=""
                >
                  <option value="" disabled className="bg-bg text-slate-400">Load Example</option>
                  <option value="showcase.asm" className="bg-bg text-slate-200">Complete Showcase</option>
                  <option value="extensive-showcase.asm" className="bg-bg text-slate-200">Extensive Showcase</option>
                  <option value="factorial.asm" className="bg-bg text-slate-200">Factorial</option>
                </select>
                <FileText className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <PerformanceControls
              speed={speed}
              onSpeedChange={setSpeed}
              isRunning={debuggerState.running}
              batchSize={batchSize}
              onBatchSizeChange={setBatchSize}
            />
          </div>

          {debuggerState.error && (
            <div className="p-3 bg-danger/20 border border-danger/50 rounded-lg text-danger text-sm">
              {debuggerState.error}
            </div>
          )}

          {showBreakpointToast && (
            <div className="p-3 bg-accent/20 border border-accent/50 rounded-lg text-accent text-sm flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Breakpoint moved to line {showBreakpointToast.line} (nearest executable)
            </div>
          )}
        </div>

        {/* Monaco Editor */}
        <div
          className="flex-1 min-h-[320px]"
          data-testid="code-editor"
          style={{ height: '65vh' }}
        >
          <MonacoEditor
            value={code}
            onChange={setCode}
            language="microz-asm"
            theme={theme}
            onMount={handleEditorDidMount}
            options={{
              readOnly: readonly,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              fontSize: 14,
              lineNumbers: 'on',
              glyphMargin: true,
              folding: false,
              automaticLayout: true
            }}
          />
        </div>
      </div>
    </GlassCard>
  );

  const renderDebugPanel = () => (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-edge/50">
        <GlowTabs
          tabs={panels}
          activeTab={activePanel}
          onTabChange={setActivePanel}
          className="flex-wrap gap-1"
        />
      </div>

      <div className="flex-1 min-h-0">
        {activePanel === 'registers' && (
          <div className="h-full overflow-y-auto">
            <div className="p-4 space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-slate-300 mb-2">General Purpose (R0-R15)</h4>
                <div className="grid grid-cols-1 gap-2">
                  {Array.from({ length: 16 }, (_, i) => (
                    <div key={i} className="flex justify-between items-center p-2 bg-edge/30 rounded">
                      <span className="font-mono text-accent">R{i}</span>
                      <div className="flex flex-col items-end">
                        <span className="font-mono text-slate-200 text-sm">0x{(debuggerState.cpu.R[i] ?? 0).toString(16).padStart(4, '0').toUpperCase()}</span>
                        <span className="font-mono text-slate-400 text-xs">{debuggerState.cpu.R[i] ?? 0}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-300 mb-2">Special</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-2 bg-edge/30 rounded">
                    <span className="font-mono text-accent">SP</span>
                    <div className="flex flex-col items-end">
                      <span className="font-mono text-slate-200 text-sm">0x{debuggerState.cpu.SP.toString(16).padStart(4, '0').toUpperCase()}</span>
                      <span className="font-mono text-slate-400 text-xs">{debuggerState.cpu.SP}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-edge/30 rounded">
                    <span className="font-mono text-accent">BP</span>
                    <div className="flex flex-col items-end">
                      <span className="font-mono text-slate-200 text-sm">0x{debuggerState.cpu.BP.toString(16).padStart(4, '0').toUpperCase()}</span>
                      <span className="font-mono text-slate-400 text-xs">{debuggerState.cpu.BP}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-edge/30 rounded">
                    <span className="font-mono text-accent">IP</span>
                    <div className="flex flex-col items-end">
                      <span className="font-mono text-slate-200 text-sm">{debuggerState.cpu.IP}</span>
                      <span className="font-mono text-slate-400 text-xs">instruction</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-300 mb-2">Flags</h4>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(debuggerState.cpu.F).map(([flag, value]) => (
                    <div key={flag} className="flex justify-between p-2 bg-edge/30 rounded">
                      <span className="font-mono text-accent">{flag}</span>
                      <span className={`font-mono ${value ? 'text-ok' : 'text-slate-500'}`}>
                        {value ? '1' : '0'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activePanel === 'memory' && (
          <MemoryViewer
            ram={debuggerState.ram}
            currentSP={debuggerState.cpu.SP}
            symbols={debuggerState.program?.labels || {}}
          />
        )}

        {activePanel === 'watches' && (
          <WatchesPanel
            watches={debuggerState.watches}
            onAddWatch={addWatch}
            onRemoveWatch={removeWatch}
            onToggleWatchpoint={() => { }}
            onCopyValue={copyValue}
          />
        )}

        {activePanel === 'console' && (
          <div className="p-4">
            <div className="h-64 bg-bg/50 border border-edge/50 rounded-lg p-3 font-mono text-sm overflow-y-auto">
              {debuggerState.consoleOutput.length === 0 ? (
                <div className="text-slate-400 italic">No output</div>
              ) : (
                debuggerState.consoleOutput.map((line, index) => (
                  <div key={index} className="text-slate-200">
                    {line}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activePanel === 'trace' && (
          <TracePanel
            isRecording={false}
            trace={[]}
            currentIndex={-1}
            maxEntries={1024}
            onToggleRecording={() => { }}
            onStepBack={() => { }}
            onClearTrace={() => { }}
            onJumpToTrace={() => { }}
          />
        )}

        {activePanel === 'hints' && (currentLessonId || currentChallengeId) && (
          <div className="h-full overflow-y-auto p-4">
            <div className="space-y-4">
              <div className="bg-accent/10 border border-accent/30 rounded-lg p-4">
                <h3 className="text-accent font-medium mb-2 flex items-center">
                  <Bug className="w-4 h-4 mr-2" />
                  Debugging Tips
                </h3>
                <div className="space-y-2 text-sm text-slate-300">
                  <p>• Use breakpoints to pause execution at specific lines</p>
                  <p>• Watch key registers and memory locations</p>
                  <p>• Step through code line by line to understand flow</p>
                  <p>• Check flags after arithmetic operations</p>
                </div>
              </div>

              {currentLessonId && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                  <h3 className="text-blue-400 font-medium mb-2">
                    Lesson Context: {currentLessonTitle || 'Interactive Lesson'}
                  </h3>
                  <div className="space-y-2 text-sm text-slate-300">
                    <p>• This code demonstrates key assembly concepts</p>
                    <p>• Try modifying values and see how they affect execution</p>
                    <p>• Pay attention to how registers change over time</p>
                    <p>• Use the watches panel to track important values</p>
                  </div>
                </div>
              )}

              {currentChallengeId && (
                <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
                  <h3 className="text-orange-400 font-medium mb-2">
                    Challenge: {currentChallengeTitle || 'Programming Challenge'}
                  </h3>
                  <div className="space-y-2 text-sm text-slate-300">
                    <p>• Debug your solution step by step</p>
                    <p>• Check if your algorithm produces expected results</p>
                    <p>• Verify edge cases and boundary conditions</p>
                    <p>• Make sure your code handles all test scenarios</p>
                  </div>
                </div>
              )}

              <div className="bg-slate-700/30 border border-slate-600/50 rounded-lg p-4">
                <h3 className="text-slate-300 font-medium mb-2">Common Issues</h3>
                <div className="space-y-2 text-sm text-slate-400">
                  <p>• <strong>Infinite loops:</strong> Check your loop conditions</p>
                  <p>• <strong>Wrong results:</strong> Verify your arithmetic logic</p>
                  <p>• <strong>Memory errors:</strong> Check array bounds and pointers</p>
                  <p>• <strong>Stack issues:</strong> Balance PUSH/POP operations</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div
      className="h-[calc(100vh-140px)] min-h-[500px]"
      data-testid="debugger-container"
    >
      <ErrorBoundary
        fallback={
          <div className="h-full flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="text-6xl">⚠️</div>
              <h3 className="text-lg font-medium text-slate-200">Debugger Error</h3>
              <p className="text-slate-400">The debugger encountered an error. Try refreshing the page.</p>
              <NeonButton onClick={() => window.location.reload()}>
                Reset Debugger
              </NeonButton>
            </div>
          </div>
        }
      >
        <DebuggerLayout
          debuggerPanel={renderDebugPanel()}
          onLayoutChange={(layout) => {
            debuggerLog.debug('Layout changed:', layout);
          }}
        >
          {renderEditor()}
        </DebuggerLayout>
      </ErrorBoundary>
    </div>
  );
};

// Monaco Editor wrapper
const MonacoEditor: React.FC<{
  value?: string;
  onChange: (value: string) => void;
  language?: string;
  theme?: string;
  onMount: (editor: any, monaco: any) => void;
  options?: any;
  height?: number | string;
}> = ({ value = '', onChange, language = 'plaintext', theme = 'vs-dark', onMount, options = {}, height = '100%' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<any>(null);
  const [monaco, setMonaco] = useState<any>(null);

  useEffect(() => {
    const loadMonaco = async (): Promise<void> => {
      try {
        const monacoModule = await import('monaco-editor');
        setMonaco(monacoModule);
      } catch (error) {
        debuggerLog.error('Failed to load Monaco:', error);
      }
    };
    loadMonaco();
  }, []);

  // Observe parent size to trigger layout when height changes
  useEffect(() => {
    const parent = containerRef.current?.parentElement || undefined;
    if (!parent) return;

    const ro = new ResizeObserver(() => {
      if (editorRef.current) editorRef.current.layout();
    });
    ro.observe(parent);

    const handleWindowResize = () => {
      if (editorRef.current) editorRef.current.layout();
    };

    window.addEventListener('resize', handleWindowResize);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', handleWindowResize);
    };
  }, []);

  useEffect(() => {
    if (!monaco || !containerRef.current || editorRef.current) return;

    const resolvedTheme = theme === 'dark' ? 'vs-dark' : theme === 'light' ? 'vs' : 'vs-dark';

    const editor = monaco.editor.create(containerRef.current, {
      value: value ?? '',
      language,
      theme: resolvedTheme,
      automaticLayout: true,
      ...options
    });

    editorRef.current = editor;

    editor.onDidChangeModelContent(() => {
      onChange(editor.getValue() ?? '');
    });

    onMount(editor, monaco);

    setTimeout(() => editor.layout(), 0);

    return () => {
      editor.dispose();
      editorRef.current = null;
    };
  }, [monaco, onMount]);

  useEffect(() => {
    if (editorRef.current && value !== undefined && value !== editorRef.current.getValue()) {
      editorRef.current.setValue(value);
    }
  }, [value]);

  return (
    <div
      ref={containerRef}
      className="h-full"
      style={{ height: typeof height === 'number' ? `${height}px` : height, minHeight: 320 }}
    />
  );
};

export default AsmDebugger;
