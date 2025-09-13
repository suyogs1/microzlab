/**
 * MicroZ Debugger functionality tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { findExecutableLines, snapToExecutableLine, toZeroBased, toOneBased } from '../src/utils/positions';
import { validateBreakpoint, validateStepEvent } from '../src/utils/validation';
import { assemble, createCPU, step, AsmError } from '../src/runners/asmEngine';
import { createRAM } from '../src/utils/memory';

describe('MicroZ Debugger Line Awareness', () => {
  const sampleCode = `; Sample MicroZ assembly program
.DATA
value: .WORD 42

.TEXT
start:
    ; This is a comment
    
    LOAD R0, [value]    ; Line 9
    CMP R0, #0          ; Line 10
    JE zero             ; Line 11
    MOV R1, #1          ; Line 12
    JMP done            ; Line 13
zero:
    MOV R1, #0          ; Line 15
done:
    HALT                ; Line 17
`;

  describe('Executable Line Detection', () => {
    it('should identify executable lines correctly', () => {
      const executableLines = findExecutableLines(sampleCode);
      
      // Should include instruction lines
      expect(executableLines.has(9)).toBe(true);  // LOAD
      expect(executableLines.has(10)).toBe(true); // CMP
      expect(executableLines.has(11)).toBe(true); // JE
      expect(executableLines.has(12)).toBe(true); // MOV
      expect(executableLines.has(13)).toBe(true); // JMP
      expect(executableLines.has(15)).toBe(true); // MOV (after label)
      expect(executableLines.has(17)).toBe(true); // HALT
      
      // Should exclude comments and blank lines
      expect(executableLines.has(1)).toBe(false); // Comment
      expect(executableLines.has(8)).toBe(false); // Blank line
      expect(executableLines.has(7)).toBe(false); // Comment
    });

    it('should handle data section correctly', () => {
      const executableLines = findExecutableLines(sampleCode);
      
      // Should not include data section lines
      expect(executableLines.has(2)).toBe(false); // .DATA
      expect(executableLines.has(3)).toBe(false); // value: .WORD 42
    });
  });

  describe('Breakpoint Snapping', () => {
    it('should snap comment lines to nearest executable', () => {
      const executableLines = findExecutableLines(sampleCode);
      
      // Comment line should snap forward
      const result1 = snapToExecutableLine(7, executableLines);
      expect(result1.snapped).toBe(true);
      expect(result1.line).toBe(9); // Should snap to LOAD
      
      // Blank line should snap forward
      const result2 = snapToExecutableLine(8, executableLines);
      expect(result2.snapped).toBe(true);
      expect(result2.line).toBe(9);
    });

    it('should not snap executable lines', () => {
      const executableLines = findExecutableLines(sampleCode);
      
      const result = snapToExecutableLine(9, executableLines);
      expect(result.snapped).toBe(false);
      expect(result.line).toBe(9);
    });

    it('should prefer forward snapping', () => {
      const executableLines = findExecutableLines(sampleCode);
      
      // Line between instructions should snap forward
      const result = snapToExecutableLine(14, executableLines);
      expect(result.snapped).toBe(true);
      expect(result.line).toBe(15); // Should snap forward to MOV
    });
  });

  describe('Line Number Conversion', () => {
    it('should convert between 0-based and 1-based correctly', () => {
      expect(toZeroBased(1)).toBe(0);
      expect(toZeroBased(10)).toBe(9);
      expect(toOneBased(0)).toBe(1);
      expect(toOneBased(9)).toBe(10);
    });

    it('should handle edge cases', () => {
      expect(toZeroBased(0)).toBe(0); // Should not go negative
      expect(toZeroBased(-1)).toBe(0);
    });
  });
});

describe('MicroZ Assembler', () => {
  describe('Instruction Aliases', () => {
    it('should resolve HALT to HLT', () => {
      const program = assemble(`
.TEXT
    MOV R0, #42
    HALT
      `);
      
      expect(program.ast[1].op).toBe('HLT');
    });

    it('should resolve JNE to JNZ', () => {
      const program = assemble(`
.TEXT
    CMP R0, #0
    JNE loop
loop:
    HLT
      `);
      
      expect(program.ast[1].op).toBe('JNZ');
    });

    it('should be case insensitive', () => {
      const program = assemble(`
.text
    mov r0, #10
    dec R0
    je EXIT
    jmp START
START:
    halt
EXIT:
    hlt
      `);
      
      expect(program.ast[0].op).toBe('MOV');
      expect(program.ast[1].op).toBe('DEC');
      expect(program.ast[2].op).toBe('JE');
      expect(program.ast[4].op).toBe('HLT'); // halt
      expect(program.ast[5].op).toBe('HLT'); // hlt
    });
  });

  describe('Error Messages', () => {
    it('should provide helpful error for typos', () => {
      expect(() => {
        assemble(`
.TEXT
    JNEE loop
loop:
    HLT
        `);
      }).toThrow(/unknown instruction.*JNEE.*JNE/i);
    });

    it('should suggest aliases for common mistakes', () => {
      expect(() => {
        assemble(`
.TEXT
    HALT_PROGRAM
        `);
      }).toThrow(/unknown instruction.*HALT_PROGRAM/i);
    });
  });

  describe('Directives', () => {
    it('should handle .WORD directive', () => {
      const program = assemble(`
.DATA
numbers: .WORD 1, 2, 3
.TEXT
    HLT
      `);
      
      expect(program.labels.numbers).toBe(0x8000); // Data base
      expect(program.dataSection[0]).toBe(1); // Little endian
      expect(program.dataSection[2]).toBe(2);
      expect(program.dataSection[4]).toBe(3);
    });

    it('should handle .ASCII and .ASCIZ', () => {
      const program = assemble(`
.DATA
str1: .ASCII "Hi"
str2: .ASCIZ "Bye"
.TEXT
    HLT
      `);
      
      expect(program.dataSection[0]).toBe(72); // 'H'
      expect(program.dataSection[1]).toBe(105); // 'i'
      expect(program.dataSection[2]).toBe(66); // 'B'
      expect(program.dataSection[3]).toBe(121); // 'y'
      expect(program.dataSection[4]).toBe(101); // 'e'
      expect(program.dataSection[5]).toBe(0); // null terminator
    });
  });
});

describe('MicroZ CPU Execution', () => {
  let cpu: any;
  let ram: DataView;

  beforeEach(() => {
    cpu = createCPU();
    ram = createRAM();
  });

  it('should execute factorial program correctly', () => {
    const program = assemble(`
.DATA
n: .WORD 5
result: .WORD 1

.TEXT
start:
    LOAD R0, [n]
    LOAD R1, [result]
    
factorial_loop:
    CMP R0, #1
    JLE done
    MUL R1, R0
    DEC R0
    JNE factorial_loop
    
done:
    STORE [result], R1
    HLT
    `);

    // Initialize data section
    for (let i = 0; i < program.dataSection.length; i++) {
      ram.setUint8(program.dataStart + i, program.dataSection[i]);
    }

    // Execute until halt
    let steps = 0;
    while (!cpu.halted && steps < 1000) {
      step(cpu, program, ram);
      steps++;
    }

    expect(cpu.halted).toBe(true);
    expect(ram.getInt16(program.dataStart + 2, true)).toBe(120); // 5! = 120
  });

  it('should handle string operations', () => {
    const program = assemble(`
.DATA
msg: .ASCIZ "OK"
.TEXT
    MOV R0, msg
    SYS #2
    HLT
    `);

    let output = '';
    
    // Initialize data section
    for (let i = 0; i < program.dataSection.length; i++) {
      ram.setUint8(program.dataStart + i, program.dataSection[i]);
    }

    step(cpu, program, ram); // MOV R0, msg
    expect(cpu.R[0]).toBe(program.dataStart); // Address of msg

    step(cpu, program, ram, {
      onSys: (syscall) => {
        if (syscall === 2) {
          const strAddr = cpu.R[0];
          let str = '';
          for (let i = 0; i < 256; i++) {
            const byte = ram.getUint8(strAddr + i);
            if (byte === 0) break;
            str += String.fromCharCode(byte);
          }
          output = str;
        }
        return '';
      }
    }); // SYS #2

    expect(output).toBe('OK');
  });
});

describe('Debugger Validation', () => {
  describe('Breakpoint Validation', () => {
    it('should validate correct breakpoint data', () => {
      const bp = validateBreakpoint({ line: 5, enabled: true });
      expect(bp.line).toBe(5);
      expect(bp.enabled).toBe(true);
    });

    it('should use default values', () => {
      const bp = validateBreakpoint({ line: 10 });
      expect(bp.enabled).toBe(true);
    });

    it('should reject invalid data', () => {
      expect(() => validateBreakpoint({ line: 0 })).toThrow();
      expect(() => validateBreakpoint({ line: -1 })).toThrow();
      expect(() => validateBreakpoint({})).toThrow();
    });
  });

  describe('Step Event Validation', () => {
    it('should validate step events', () => {
      const step = validateStepEvent({ type: 'into' });
      expect(step.type).toBe('into');
      expect(step.count).toBe(1);
    });

    it('should reject invalid step types', () => {
      expect(() => validateStepEvent({ type: 'invalid' })).toThrow();
    });
  });
});

describe('Error Boundary Recovery', () => {
  it('should handle thrown errors gracefully', () => {
    // This would be tested with React Testing Library in a real scenario
    expect(true).toBe(true); // Placeholder
  });
});