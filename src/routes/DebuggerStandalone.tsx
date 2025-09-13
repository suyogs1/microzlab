/**
 * Standalone debugger route - can be used outside learning context
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bug, BookOpen, Code, Play, Cpu, FileText, Zap } from 'lucide-react';
import AsmDebugger from '../components/AsmDebugger';
import { GlassCard } from '../components/ui/GlassCard';
import { PanelHeader } from '../components/ui/PanelHeader';
import { NeonButton } from '../components/ui/NeonButton';
import { GlowTabs } from '../components/ui/GlowTabs';
import { ScrollArea } from '../components/ScrollArea';
import { DebuggerBusProvider } from '../state/debuggerBus';

interface DebuggerStandaloneProps {
  initialFile?: string;
  initialBreakpoints?: Array<{ path: string; line: number }>;
  readonly?: boolean;
  theme?: 'light' | 'dark' | 'system';
  lessonId?: string;
  challengeId?: string;
}

const examples = {
  'showcase.asm': `; MicroZ Complete Instruction Set Showcase
; Demonstrates all available instructions without .DATA section

.TEXT
main:
    ; Set breakpoint here (F9) to start debugging
    MOV R0, #42
    MOV R1, R0

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

  // Removed hello.asm example
    
  'controlflow.asm': `; Control Flow Example - Factorial without .DATA
.TEXT
start:
    ; Calculate 5! using registers only
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
    HALT`,
    
  'aliases.asm': `; Instruction Aliases Test - No .DATA section
.TEXT
start:
    ; Test instruction aliases with factorial
    MOV R0, #5          ; Calculate 5! (max 7! for 16-bit)
    MOV R1, #1
    
loop:
    MUL R1, R0          ; result *= N
    DEC R0              ; N--
    CMP R0, #0
    JNE loop            ; JNE alias for JNZ
    
    ; Test other aliases
    CMP R1, #120
    JE success          ; Jump if equal (same as JZ)
    
    MOV R0, #1          ; Error code
    JMP exit
    
success:
    MOV R0, #0          ; Success code
    
exit:
    SYS #1              ; Print result
    HALT                ; HALT alias for HLT`
};

export const DebuggerStandalone: React.FC<DebuggerStandaloneProps> = ({
  initialFile,
  initialBreakpoints = [],
  readonly = false,
  theme = 'dark',
  lessonId,
  challengeId
}) => {
  const [activeTab, setActiveTab] = useState<'debugger' | 'instructions'>('debugger');
  const [selectedExample, setSelectedExample] = useState<string>('showcase.asm');
  const [code, setCode] = useState(() => {
    if (initialFile && examples[initialFile as keyof typeof examples]) {
      return examples[initialFile as keyof typeof examples];
    }
    return examples['showcase.asm'];
  });

  const tabs = [
    { id: 'debugger' as const, label: 'Debugger', icon: <Bug className="w-4 h-4" /> },
    { id: 'instructions' as const, label: 'Instructions', icon: <BookOpen className="w-4 h-4" /> }
  ];

  const loadExample = (exampleName: string) => {
    setSelectedExample(exampleName);
    setCode(examples[exampleName as keyof typeof examples]);
  };

  const renderInstructions = () => (
    <div className="h-full">
      <ScrollArea>
        <div className="p-6 max-w-4xl mx-auto space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl font-bold bg-gradient-to-r from-accent to-accent2 bg-clip-text text-transparent mb-4">
              MicroZ Standalone Debugger
            </h1>
            <p className="text-slate-400 text-lg">
              Use the MicroZ Lab debugger outside the learning environment
            </p>
          </motion.div>

          {/* Quickstart */}
          <GlassCard>
            <PanelHeader
              title="Quickstart Outside the Lab"
              icon={<Play className="w-4 h-4" />}
            />
            <div className="p-6 space-y-4">
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-accent/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-accent text-xs font-bold">1</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-200">Load or write MicroZ assembly code</h4>
                    <p className="text-sm text-slate-400">Use the examples below or write your own MicroZ assembly code</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-accent/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-accent text-xs font-bold">2</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-200">Set breakpoints on executable lines</h4>
                    <p className="text-sm text-slate-400">Click in the gutter or press F9. Breakpoints snap to nearest executable line automatically.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-accent/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-accent text-xs font-bold">3</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-200">Run or step through code</h4>
                    <p className="text-sm text-slate-400">Use Run button or F10/F11 to step through execution with proper line mapping</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-accent/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-accent text-xs font-bold">4</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-200">Monitor state in resizable panels</h4>
                    <p className="text-sm text-slate-400">Watch registers, memory, and console output. Dock right, bottom, or fullscreen.</p>
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Examples */}
          <GlassCard>
            <PanelHeader
              title="Example Programs"
              icon={<Code className="w-4 h-4" />}
            />
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(examples).map(([name, source]) => (
                  <div
                    key={name}
                    className={`p-4 border rounded-xl cursor-pointer transition-all ${
                      selectedExample === name
                        ? 'border-accent/50 bg-accent/10'
                        : 'border-edge/50 bg-edge/20 hover:border-accent/30'
                    }`}
                    onClick={() => loadExample(name)}
                  >
                    <h4 className="font-medium text-slate-200 mb-2">{name}</h4>
                    <p className="text-sm text-slate-400 mb-3">
                      {name === 'showcase.asm' 
                        ? 'Complete instruction set demonstration - all MicroZ features'
                        : name === 'hello.asm' 
                        ? 'Basic program with string output' 
                        : name === 'controlflow.asm'
                        ? 'Factorial calculation with loops and aliases'
                        : 'Test of instruction aliases and factorial calculation'}
                    </p>
                    <pre className="text-xs font-mono text-slate-300 bg-bg/50 p-2 rounded overflow-x-auto">
                      {source.split('\n').slice(0, 4).join('\n')}
                      {source.split('\n').length > 4 && '\n...'}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>

          {/* MicroZ ISA Reference */}
          <GlassCard>
            <PanelHeader
              title="MicroZ Instruction Set"
              icon={<Cpu className="w-4 h-4" />}
            />
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-slate-200 mb-3">Data Movement</h4>
                  <div className="space-y-2 text-sm font-mono">
                    <div><span className="text-accent">MOV</span> <span className="text-slate-400">dst, src</span></div>
                    <div><span className="text-accent">LOAD</span> <span className="text-slate-400">Rd, [addr]</span></div>
                    <div><span className="text-accent">STORE</span> <span className="text-slate-400">[addr], Rs</span></div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-slate-200 mb-3">Arithmetic</h4>
                  <div className="space-y-2 text-sm font-mono">
                    <div><span className="text-accent">ADD</span> <span className="text-slate-400">Rd, src</span></div>
                    <div><span className="text-accent">SUB</span> <span className="text-slate-400">Rd, src</span></div>
                    <div><span className="text-accent">MUL</span> <span className="text-slate-400">Rd, src</span></div>
                    <div><span className="text-accent">DIV</span> <span className="text-slate-400">Rd, src</span></div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-slate-200 mb-3">Control Flow</h4>
                  <div className="space-y-2 text-sm font-mono">
                    <div><span className="text-accent">JMP</span> <span className="text-slate-400">label</span></div>
                    <div><span className="text-accent">JE/JNE</span> <span className="text-slate-400">label</span></div>
                    <div><span className="text-accent">JG/JL</span> <span className="text-slate-400">label</span></div>
                    <div><span className="text-accent">CALL/RET</span></div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-slate-200 mb-3">System</h4>
                  <div className="space-y-2 text-sm font-mono">
                    <div><span className="text-accent">SYS</span> <span className="text-slate-400">#1</span> <span className="text-slate-500">; print R0</span></div>
                    <div><span className="text-accent">SYS</span> <span className="text-slate-400">#2</span> <span className="text-slate-500">; print string</span></div>
                    <div><span className="text-accent">HLT</span> <span className="text-slate-500">; halt</span></div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-accent/10 border border-accent/30 rounded-lg">
                <h4 className="font-medium text-accent mb-2">Aliases Supported</h4>
                <div className="text-sm text-slate-300 space-y-1">
                  <div><span className="text-accent2">HALT</span> → <span className="text-accent">HLT</span></div>
                  <div><span className="text-accent2">JNE</span> → <span className="text-accent">JNZ</span></div>
                  <div><span className="text-accent2">JEQ</span> → <span className="text-accent">JE</span></div>
                  <div><span className="text-accent2">JZ</span> → <span className="text-accent">JE</span></div>
                  <div><span className="text-accent2">SYSCALL</span> → <span className="text-accent">SYS</span></div>
                  <div><span className="text-accent2">LOADB</span> → <span className="text-accent">LOAD</span></div>
                  <div><span className="text-accent2">STOREB</span> → <span className="text-accent">STORE</span></div>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Embedding Guide */}
          <GlassCard>
            <PanelHeader
              title="Embedding the Debugger"
              icon={<Code className="w-4 h-4" />}
            />
            <div className="p-6 space-y-4">
              <p className="text-slate-300">
                You can embed the MicroZ debugger in your own applications:
              </p>
              
              <div className="bg-bg/50 border border-edge/50 rounded-lg p-4">
                <pre className="text-sm font-mono text-accent overflow-x-auto">
{`import { DebuggerStandalone } from '@microz/debugger';

<DebuggerStandalone 
  initialFile="examples/hello.asm"
  theme="system"
  readonly={false}
  initialBreakpoints={[{ path: 'main.asm', line: 5 }]}
/>`}
                </pre>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-edge/50">
                      <th className="text-left p-2 text-slate-300 font-medium">Prop</th>
                      <th className="text-left p-2 text-slate-300 font-medium">Type</th>
                      <th className="text-left p-2 text-slate-300 font-medium">Default</th>
                      <th className="text-left p-2 text-slate-300 font-medium">Description</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-400">
                    <tr className="border-b border-edge/30">
                      <td className="p-2 font-mono text-accent">initialFile</td>
                      <td className="p-2">string</td>
                      <td className="p-2">-</td>
                      <td className="p-2">Load example file on mount</td>
                    </tr>
                    <tr className="border-b border-edge/30">
                      <td className="p-2 font-mono text-accent">readonly</td>
                      <td className="p-2">boolean</td>
                      <td className="p-2">false</td>
                      <td className="p-2">Disable code editing</td>
                    </tr>
                    <tr className="border-b border-edge/30">
                      <td className="p-2 font-mono text-accent">theme</td>
                      <td className="p-2">'light'|'dark'|'system'</td>
                      <td className="p-2">'dark'</td>
                      <td className="p-2">Editor theme</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-mono text-accent">initialBreakpoints</td>
                      <td className="p-2">{"Array<"}{"{path:string; line:number}"}{">"}</td>

                      <td className="p-2">[]</td>
                      <td className="p-2">Set breakpoints on load</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </GlassCard>

          {/* Technical Features */}
          <GlassCard>
            <PanelHeader
              title="Technical Features"
              icon={<Zap className="w-4 h-4" />}
            />
            <div className="p-6 space-y-4 text-sm text-slate-300">
              <div>
                <h4 className="font-medium text-slate-200 mb-2 flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  Line Awareness
                </h4>
                <p className="text-slate-400">
                  Breakpoints automatically snap to the nearest executable line. Comments and blank lines are skipped.
                  Source mapping ensures accurate line correspondence between editor and runtime.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-slate-200 mb-2">Keyboard Shortcuts</h4>
                <div className="grid grid-cols-2 gap-2 text-xs bg-edge/20 p-3 rounded-lg">
                  <div><kbd className="bg-accent/20 px-1 rounded">F9</kbd> Toggle breakpoint</div>
                  <div><kbd className="bg-accent/20 px-1 rounded">F10</kbd> Step over</div>
                  <div><kbd className="bg-accent/20 px-1 rounded">F11</kbd> Step into</div>
                  <div><kbd className="bg-accent/20 px-1 rounded">Shift+F11</kbd> Step out</div>
                  <div><kbd className="bg-accent/20 px-1 rounded">Ctrl+B</kbd> Focus registers</div>
                  <div><kbd className="bg-accent/20 px-1 rounded">Ctrl+Enter</kbd> Run program</div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-slate-200 mb-2">Resizable Layout Options</h4>
                <p className="text-slate-400">
                  Use the layout controls to dock the debugger right (40% width), bottom (30% height), or fullscreen. 
                  Layout preferences are saved automatically. Panels are resizable with 30%-70% constraints.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-slate-200 mb-2">Error Recovery</h4>
                <p className="text-slate-400">
                  Robust error boundaries capture runtime errors without crashing the app. 
                  Actionable error messages point to line/column with suggestions for common typos.
                </p>
              </div>
            </div>
          </GlassCard>

          {/* MicroZ Assembly Reference */}
          <GlassCard>
            <PanelHeader
              title="MicroZ Assembly Syntax"
              icon={<FileText className="w-4 h-4" />}
            />
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-slate-200 mb-3">Sections & Directives</h4>
                  <div className="space-y-2 text-sm font-mono">
                    <div><span className="text-warn">.DATA</span> <span className="text-slate-400">; data section</span></div>
                    <div><span className="text-warn">.TEXT</span> <span className="text-slate-400">; code section</span></div>
                    <div><span className="text-warn">.ORG</span> <span className="text-slate-400">0x1000</span> <span className="text-slate-500">; set origin</span></div>
                    <div><span className="text-warn">.WORD</span> <span className="text-slate-400">123, 0x7B</span></div>
                    <div><span className="text-warn">.BYTE</span> <span className="text-slate-400">65, 'A'</span></div>
                    <div><span className="text-warn">.ASCII</span> <span className="text-slate-400">"Hello"</span></div>
                    <div><span className="text-warn">.ASCIZ</span> <span className="text-slate-400">"Hello"</span> <span className="text-slate-500">; null-terminated</span></div>
                    <div><span className="text-warn">.STRING</span> <span className="text-slate-400">"Hello"</span> <span className="text-slate-500">; no null terminator</span></div>
                    <div><span className="text-warn">.SPACE</span> <span className="text-slate-400">10</span> <span className="text-slate-500">; reserve bytes</span></div>
                    <div><span className="text-warn">.ALIGN</span> <span className="text-slate-400">4</span> <span className="text-slate-500">; align to boundary</span></div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-slate-200 mb-3">Addressing Modes</h4>
                  <div className="space-y-2 text-sm font-mono">
                    <div><span className="text-accent2">#42</span> <span className="text-slate-400">; immediate</span></div>
                    <div><span className="text-accent2">R0</span> <span className="text-slate-400">; register</span></div>
                    <div><span className="text-accent2">[1000]</span> <span className="text-slate-400">; direct memory</span></div>
                    <div><span className="text-accent2">[R0]</span> <span className="text-slate-400">; indirect</span></div>
                    <div><span className="text-accent2">[R0+4]</span> <span className="text-slate-400">; indexed</span></div>
                    <div><span className="text-accent2">[label]</span> <span className="text-slate-400">; label reference</span></div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-slate-200 mb-3">Number Formats</h4>
                  <div className="space-y-2 text-sm font-mono">
                    <div><span className="text-accent2">123</span> <span className="text-slate-400">; decimal</span></div>
                    <div><span className="text-accent2">0x7B</span> <span className="text-slate-400">; hexadecimal</span></div>
                    <div><span className="text-accent2">0b1111011</span> <span className="text-slate-400">; binary</span></div>
                    <div><span className="text-accent2">'A'</span> <span className="text-slate-400">; character (65)</span></div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-slate-200 mb-3">Registers</h4>
                  <div className="space-y-2 text-sm font-mono">
                    <div><span className="text-accent2">R0-R15</span> <span className="text-slate-400">; general purpose</span></div>
                    <div><span className="text-accent2">SP</span> <span className="text-slate-400">; stack pointer</span></div>
                    <div><span className="text-accent2">BP</span> <span className="text-slate-400">; base pointer</span></div>
                    <div><span className="text-accent2">IP</span> <span className="text-slate-400">; instruction pointer</span></div>
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      </ScrollArea>
    </div>
  );

  return (
    <div className="h-full">
      <div className="p-4 border-b border-edge/50">
        <GlowTabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </div>
      
      <div className="flex-1 min-h-0">
        {activeTab === 'debugger' ? (
          <DebuggerBusProvider>
            <AsmDebugger
              initialCode={code}
              readonly={readonly}
              theme={theme}
            />
          </DebuggerBusProvider>
        ) : (
          renderInstructions()
        )}
      </div>
    </div>
  );
};

export default DebuggerStandalone;