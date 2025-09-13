// MicroZ Assembly Engine - Robust two-pass assembler

export interface Flags {
  ZF: boolean; // Zero flag
  NF: boolean; // Negative flag  
  CF: boolean; // Carry flag
  OF: boolean; // Overflow flag
}

export interface CPU {
  R: Int32Array; // R0-R15 general purpose registers
  SP: number;    // Stack pointer
  BP: number;    // Base pointer
  IP: number;    // Instruction pointer
  F: Flags;      // Flags register
  halted: boolean;
}

export interface Operand {
  type: 'reg' | 'imm' | 'mem' | 'label';
  value: number | string;
  offset?: number;
  indirect?: boolean;
}

export interface Instruction {
  op: string;
  operands: Operand[];
  line: number;
  column: number;
  source: string;
  address: number;
}

export interface Program {
  lines: string[];
  ast: Instruction[];
  labels: Record<string, number>;
  dataSection: Uint8Array;
  textStart: number;
  dataStart: number;
  lineMap: Map<number, number>;
}

export class AsmError extends Error {
  constructor(
    public line: number,
    public column: number,
    message: string,
    public token?: string,
    public suggestion?: string
  ) {
    super(`Line ${line}:${column}: ${message}${suggestion ? ` — ${suggestion}` : ''}`);
    this.name = 'AsmError';
  }
}

export const RAM_SIZE = 65536;
const STACK_START = RAM_SIZE - 4;
const MAX_REGISTERS = 16;

// Instruction aliases
const INSTRUCTION_ALIASES: Record<string, string> = {
  'HALT': 'HLT',
  'JNE': 'JNZ',
  'JEQ': 'JE',
  'JZ': 'JE',
  'JAE': 'JGE',
  'JBE': 'JLE',
  'JB': 'JC',
  'JNB': 'JNC',
  'JA': 'JG',
  'JNA': 'JLE',
  'SYSCALL': 'SYS',
  'LOADB': 'LOAD',
  'STOREB': 'STORE'
};

// Core instruction set
const VALID_INSTRUCTIONS = new Set([
  'NOP', 'HLT', 'MOV', 'LOAD', 'STORE', 'LEA',
  'ADD', 'SUB', 'MUL', 'DIV', 'INC', 'DEC',
  'AND', 'OR', 'XOR', 'NOT', 'SHL', 'SHR',
  'CMP', 'TEST', 'JMP', 'JE', 'JNZ', 'JC', 'JNC',
  'JN', 'JNN', 'JG', 'JGE', 'JL', 'JLE',
  'PUSH', 'POP', 'CALL', 'RET', 'SYS'
]);

// Assembler directives
const VALID_DIRECTIVES = new Set([
  '.DATA', '.TEXT', '.BYTE', '.ASCIZ', '.ASCII', '.SPACE', '.ALIGN', '.ORG', '.EQU'
]);

const DATA_ONLY_DIRECTIVES = new Set([
  '.BYTE', '.ASCIZ', '.ASCII', '.SPACE', '.ALIGN'
]);

// Register mapping
const REGISTERS: Record<string, number> = {};
for (let i = 0; i < MAX_REGISTERS; i++) REGISTERS[`R${i}`] = i;
REGISTERS['SP'] = -1;
REGISTERS['BP'] = -2;

/** Initialize CPU */
export function createCPU(): CPU {
  return {
    R: new Int32Array(MAX_REGISTERS),
    SP: STACK_START,
    BP: STACK_START,
    IP: 0,
    F: { ZF: false, NF: false, CF: false, OF: false },
    halted: false
  };
}

/** Reset CPU to initial state */
export function resetCPU(cpu: CPU): void {
  cpu.R.fill(0);
  cpu.SP = STACK_START;
  cpu.BP = STACK_START;
  cpu.IP = 0;
  cpu.F.ZF = cpu.F.NF = cpu.F.CF = cpu.F.OF = false;
  cpu.halted = false;
}

/** Calculate Levenshtein distance */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/** Suggest similar instruction for typos */
function suggestInstruction(invalid: string): string | undefined {
  const upper = invalid.toUpperCase();
  const candidates = [...Object.keys(INSTRUCTION_ALIASES), ...VALID_INSTRUCTIONS];

  // Exact substring match
  for (const candidate of candidates) {
    if (candidate.includes(upper) || upper.includes(candidate)) {
      return candidate;
    }
  }

  // Levenshtein distance
  let bestMatch = '';
  let bestDistance = Infinity;
  for (const candidate of candidates) {
    const distance = levenshteinDistance(upper, candidate);
    if (distance < bestDistance && distance <= 2) {
      bestDistance = distance;
      bestMatch = candidate;
    }
  }

  return bestMatch || undefined;
}

/** Suggest similar directive */
function suggestDirective(invalid: string): string | undefined {
  const upper = invalid.toUpperCase();
  const directives = Array.from(VALID_DIRECTIVES);

  for (const directive of directives) {
    if (directive.includes(upper) || upper.includes(directive.slice(1))) {
      return directive;
    }
  }

  let bestMatch = '';
  let bestDistance = Infinity;
  for (const directive of directives) {
    const distance = levenshteinDistance(upper, directive);
    if (distance < bestDistance && distance <= 2) {
      bestDistance = distance;
      bestMatch = directive;
    }
  }

  return bestMatch || undefined;
}

/** Parse numeric literal with robust error handling */
function parseNumberLiteral(raw: string): number {
  const s = raw.trim();
  if (!s) throw new Error('Empty number literal');

  // Hexadecimal: 0x1A, 0X1A, $1A
  if (/^[-+]?(0x|0X|\$)[0-9a-f]+$/i.test(s)) {
    let hexStr = s;
    if (s.includes('$')) hexStr = s.replace('$', '0x');
    const result = parseInt(hexStr, 16);
    if (isNaN(result)) throw new Error(`Invalid hex: ${raw}`);
    return result;
  }

  // Binary: 0b1010, %1010
  if (/^[-+]?(0b|%)[01]+$/i.test(s)) {
    const sign = s.startsWith('-') ? -1 : 1;
    const binaryPart = s.replace(/^[-+]?(0b|%)/i, '');
    const result = parseInt(binaryPart, 2);
    if (isNaN(result)) throw new Error(`Invalid binary: ${raw}`);
    return sign * result;
  }

  // Character: 'A', '\n', '\t'
  if (/^'(\\.|.)'$/.test(s)) {
    const char = s.slice(1, -1);
    if (char.startsWith('\\')) {
      switch (char[1]) {
        case 'n': return 10;
        case 't': return 9;
        case 'r': return 13;
        case '\\': return 92;
        case '\'': return 39;
        case '"': return 34;
        case '0': return 0;
        default: return char.charCodeAt(1);
      }
    }
    return char.charCodeAt(0);
  }

  // Decimal
  if (/^[-+]?\d+$/.test(s)) {
    const n = parseInt(s, 10);
    if (isNaN(n)) throw new Error(`Invalid decimal: ${raw}`);
    return n;
  }

  throw new Error(`Invalid number: ${raw}`);
}

/** Parse string literals with escape sequences */
function parseQuotedString(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) throw new Error('Empty string');

  // Match quoted strings
  const match = trimmed.match(/^(['"])(.*?)\1$/);
  if (!match) throw new Error(`String must be quoted: ${raw}`);

  const str = match[2];
  return str
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\0/g, '\0')
    .replace(/\\\\/g, '\\')
    .replace(/\\'/g, "'")
    .replace(/\\"/g, '"');
}

/** Parse operand with robust error handling */
function parseOperand(token: string, labels: Record<string, number>, lineNum: number, colNum: number): Operand {
  token = token.replace(/,$/, '').trim();
  if (!token) throw new AsmError(lineNum, colNum, 'Empty operand');

  // Immediate value: #123, #0x1A, #'A'
  if (token.startsWith('#')) {
    try {
      const value = parseNumberLiteral(token.slice(1));
      return { type: 'imm', value };
    } catch (error) {
      throw new AsmError(lineNum, colNum, `Invalid immediate: ${token}`, token, 'Use #123, #0x1A, #\'A\'');
    }
  }

  // Memory reference: [addr], [Rk], [Rk+offset]
  if (token.startsWith('[') && token.endsWith(']')) {
    const inner = token.slice(1, -1).trim();
    if (!inner) throw new AsmError(lineNum, colNum, 'Empty memory reference');

    // Register with offset: [R1+4], [SP-8]
    const offsetMatch = inner.match(/^(R\d+|SP|BP)\s*([+-])\s*(\d+)$/i);
    if (offsetMatch) {
      const reg = offsetMatch[1].toUpperCase();
      const sign = offsetMatch[2];
      const offsetValue = parseInt(offsetMatch[3], 10);

      if (!(reg in REGISTERS)) {
        throw new AsmError(lineNum, colNum, `Invalid register: ${reg}`);
      }

      const offset = sign === '+' ? offsetValue : -offsetValue;
      return { type: 'mem', value: REGISTERS[reg], offset, indirect: true };
    }

    // Direct register: [R1], [SP]
    const upperInner = inner.toUpperCase();
    if (upperInner in REGISTERS) {
      return { type: 'mem', value: REGISTERS[upperInner], indirect: true };
    }

    // Direct address: [1000], [0x400]
    try {
      const addr = parseNumberLiteral(inner);
      if (addr < 0 || addr >= RAM_SIZE) {
        throw new AsmError(lineNum, colNum, `Address out of bounds: ${addr}`);
      }
      return { type: 'mem', value: addr };
    } catch {
      // Label reference: [data_label]
      if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(inner)) {
        return { type: 'mem', value: inner };
      }
    }

    throw new AsmError(lineNum, colNum, `Invalid memory reference: ${token}`);
  }

  // Register: R0, R15, SP, BP
  const upperToken = token.toUpperCase();
  if (upperToken in REGISTERS) {
    return { type: 'reg', value: REGISTERS[upperToken] };
  }

  // Numeric immediate (bare number)
  try {
    const num = parseNumberLiteral(token);
    return { type: 'imm', value: num };
  } catch {
    // Label reference
    if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(token)) {
      return { type: 'label', value: token };
    }
  }

  throw new AsmError(lineNum, colNum, `Invalid operand: ${token}`);
}

/** Validate instruction operands */
function validateInstructionOperands(op: string, operands: Operand[], lineNum: number, colNum: number): void {
  const expectedCounts: Record<string, number> = {
    'NOP': 0, 'HLT': 0, 'RET': 0,
    'MOV': 2, 'LOAD': 2, 'STORE': 2, 'LEA': 2,
    'ADD': 2, 'SUB': 2, 'MUL': 2, 'DIV': 2,
    'AND': 2, 'OR': 2, 'XOR': 2, 'SHL': 2, 'SHR': 2,
    'INC': 1, 'DEC': 1, 'NOT': 1, 'PUSH': 1, 'POP': 1,
    'CMP': 2, 'TEST': 2, 'SYS': 1, 'CALL': 1,
    'JMP': 1, 'JE': 1, 'JNZ': 1, 'JC': 1, 'JNC': 1,
    'JN': 1, 'JNN': 1, 'JG': 1, 'JGE': 1, 'JL': 1, 'JLE': 1
  };

  const expected = expectedCounts[op];
  if (expected === undefined) {
    throw new AsmError(lineNum, colNum, `Unknown instruction: ${op}`);
  }

  if (operands.length !== expected) {
    throw new AsmError(lineNum, colNum,
      `${op} expects ${expected} operand(s), got ${operands.length}`);
  }

  // Additional validation for specific instructions
  switch (op) {
    case 'MOV':
    case 'ADD':
    case 'SUB':
    case 'MUL':
    case 'DIV':
    case 'AND':
    case 'OR':
    case 'XOR':
    case 'SHL':
    case 'SHR':
      if (operands[0].type !== 'reg') {
        throw new AsmError(lineNum, colNum, `${op} destination must be register`);
      }
      break;

    case 'STORE':
      if (operands[0].type !== 'mem') {
        throw new AsmError(lineNum, colNum, 'STORE destination must be memory reference');
      }
      break;

    case 'POP':
      if (operands[0].type !== 'reg') {
        throw new AsmError(lineNum, colNum, 'POP destination must be register');
      }
      break;
  }
}

/** Resolve operand value */
function resolveOperand(operand: Operand, cpu: CPU, ram: DataView, labels: Record<string, number>): number {
  switch (operand.type) {
    case 'imm':
      return operand.value as number;

    case 'reg': {
      const regIndex = operand.value as number;
      if (regIndex === -1) return cpu.SP;
      if (regIndex === -2) return cpu.BP;
      if (regIndex < 0 || regIndex >= MAX_REGISTERS) {
        throw new Error(`Invalid register: ${regIndex}`);
      }
      return cpu.R[regIndex];
    }

    case 'mem': {
      let addr: number;

      if (typeof operand.value === 'string') {
        const key = operand.value.toLowerCase();
        addr = labels[key];
        if (addr === undefined) throw new Error(`Undefined label: ${operand.value}`);
      } else if (operand.indirect) {
        const regIndex = operand.value as number;
        let baseAddr: number;
        if (regIndex === -1) baseAddr = cpu.SP;
        else if (regIndex === -2) baseAddr = cpu.BP;
        else baseAddr = cpu.R[regIndex];
        addr = baseAddr + (operand.offset || 0);
      } else {
        addr = operand.value as number;
      }

      if (addr < 0 || addr >= RAM_SIZE - 1) {
        throw new Error(`Memory address out of bounds: ${addr}`);
      }

      return ram.getInt16(addr, true);
    }

    case 'label': {
      const key = operand.value.toString().toLowerCase();
      const addr = labels[key];
      if (addr === undefined) throw new Error(`Undefined label: ${operand.value}`);
      return addr;
    }

    default:
      throw new Error(`Invalid operand type`);
  }
}

/** Set CPU flags based on result */
function setFlags(cpu: CPU, result: number, a?: number, b?: number, operation: 'add' | 'sub' | 'cmp' | 'logic' = 'logic'): void {
  // Convert to 16-bit signed
  const result16 = ((result & 0xFFFF) << 16) >> 16;

  cpu.F.ZF = result16 === 0;
  cpu.F.NF = result16 < 0;

  switch (operation) {
    case 'add':
      if (a !== undefined && b !== undefined) {
        const sum = a + b;
        cpu.F.CF = sum > 0xFFFF || sum < -0x8000;
        cpu.F.OF = ((a ^ result16) & (b ^ result16) & 0x8000) !== 0;
      }
      break;

    case 'sub':
    case 'cmp':
      if (a !== undefined && b !== undefined) {
        cpu.F.CF = a < b;
        cpu.F.OF = ((a ^ b) & (a ^ result16) & 0x8000) !== 0;
      }
      break;

    default:
      cpu.F.CF = false;
      cpu.F.OF = false;
  }
}

/** Write to register */
function writeRegister(cpu: CPU, regIndex: number, value: number): void {
  const val16 = ((value & 0xFFFF) << 16) >> 16; // Sign extend to 16-bit

  if (regIndex === -1) cpu.SP = val16;
  else if (regIndex === -2) cpu.BP = val16;
  else if (regIndex >= 0 && regIndex < MAX_REGISTERS) cpu.R[regIndex] = val16;
  else throw new Error(`Invalid register index: ${regIndex}`);
}

/** Write to memory */
function writeMemory(ram: DataView, addr: number, value: number): void {
  if (addr < 0 || addr >= RAM_SIZE - 1) {
    throw new Error(`Memory write out of bounds: ${addr}`);
  }
  ram.setInt16(addr, value, true);
}

/** Robust two-pass assembler */
export function assemble(source: string): Program {
  const lines = source.split('\n');
  const ast: Instruction[] = [];
  const labels: Record<string, number> = {};
  const dataSection = new Uint8Array(8192);
  const lineMap = new Map<number, number>();
  const constants: Record<string, number> = {};

  let currentAddress = 0;
  let inDataSection = false;
  let dataPtr = 0;
  let textStart = 0;
  let dataStart = 0x8000;

  // Pass 1: Process labels, directives, build instruction skeleton
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    const lineNum = i + 1;

    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith(';') || trimmed.startsWith('//')) continue;

    // Handle directives
    if (trimmed.startsWith('.')) {
      const parts = trimmed.split(/\s+/);
      const directive = parts[0].toUpperCase();

      if (!VALID_DIRECTIVES.has(directive)) {
        const suggestion = suggestDirective(parts[0]);
        throw new AsmError(lineNum, 1, `Unknown directive: ${parts[0]}`, parts[0],
          suggestion ? `Did you mean '${suggestion}'?` : undefined);
      }

      // Check if data-only directive is in text section
      if (!inDataSection && DATA_ONLY_DIRECTIVES.has(directive)) {
        throw new AsmError(lineNum, 1, `${directive} only valid in .DATA section`);
      }

      switch (directive) {
        case '.DATA':
          inDataSection = true;
          break;

        case '.TEXT':
          inDataSection = false;
          textStart = currentAddress;
          break;

        case '.ORG':
          if (parts.length < 2) throw new AsmError(lineNum, 1, '.ORG requires address');
          const orgAddr = parseNumberLiteral(parts[1]);
          if (inDataSection) dataStart = orgAddr;
          else currentAddress = orgAddr;
          break;

        case '.EQU':
          if (parts.length < 3) throw new AsmError(lineNum, 1, '.EQU requires name and value');
          const constName = parts[1].toLowerCase();
          const constValue = parseNumberLiteral(parts[2]);
          constants[constName] = constValue;
          break;



        case '.BYTE':
          if (parts.length < 2) throw new AsmError(lineNum, 1, '.BYTE requires values');
          const byteValues = parts.slice(1).join(' ').split(',').map(v => v.trim());
          for (const val of byteValues) {
            if (dataPtr >= dataSection.length) throw new AsmError(lineNum, 1, 'Data overflow');
            const num = parseNumberLiteral(val);
            dataSection[dataPtr++] = num & 0xFF;
          }
          break;

        case '.ASCII':
          const asciiMatch = trimmed.match(/^\.ASCII\s+(.+)$/i);
          if (!asciiMatch) throw new AsmError(lineNum, 1, `Invalid ${directive} format`);
          const str = parseQuotedString(asciiMatch[1]);
          for (let j = 0; j < str.length; j++) {
            if (dataPtr >= dataSection.length) throw new AsmError(lineNum, 1, 'Data overflow');
            dataSection[dataPtr++] = str.charCodeAt(j) & 0xFF;
          }
          break;

        case '.ASCIZ':
          const ascizMatch = trimmed.match(/^\.ASCIZ\s+(.+)$/i);
          if (!ascizMatch) throw new AsmError(lineNum, 1, 'Invalid .ASCIZ format');
          const ascizStr = parseQuotedString(ascizMatch[1]);
          for (let j = 0; j < ascizStr.length; j++) {
            if (dataPtr >= dataSection.length) throw new AsmError(lineNum, 1, 'Data overflow');
            dataSection[dataPtr++] = ascizStr.charCodeAt(j) & 0xFF;
          }
          if (dataPtr >= dataSection.length) throw new AsmError(lineNum, 1, 'Data overflow');
          dataSection[dataPtr++] = 0; // null terminator
          break;

        case '.SPACE':
          if (parts.length < 2) throw new AsmError(lineNum, 1, '.SPACE requires size');
          const spaceSize = parseNumberLiteral(parts[1]);
          for (let k = 0; k < spaceSize; k++) {
            if (dataPtr >= dataSection.length) throw new AsmError(lineNum, 1, 'Data overflow');
            dataSection[dataPtr++] = 0;
          }
          break;

        case '.ALIGN':
          if (parts.length < 2) throw new AsmError(lineNum, 1, '.ALIGN requires alignment');
          const alignment = parseNumberLiteral(parts[1]);
          if ((alignment & (alignment - 1)) !== 0) throw new AsmError(lineNum, 1, 'Alignment must be power of 2');
          while (dataPtr % alignment !== 0) {
            if (dataPtr >= dataSection.length) break;
            dataSection[dataPtr++] = 0;
          }
          break;
      }
      continue;
    }

    // Handle labels
    if (trimmed.includes(':')) {
      const colonIndex = trimmed.indexOf(':');
      const labelName = trimmed.slice(0, colonIndex).trim();

      if (!labelName) throw new AsmError(lineNum, 1, 'Empty label name');
      if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(labelName)) {
        throw new AsmError(lineNum, 1, `Invalid label name: ${labelName}`);
      }

      const key = labelName.toLowerCase();
      if (labels[key] !== undefined) throw new AsmError(lineNum, 1, `Duplicate label: ${labelName}`);

      labels[key] = inDataSection ? (dataStart + dataPtr) : currentAddress;

      // Check for instruction after label
      const afterColon = trimmed.slice(colonIndex + 1).trim();
      if (afterColon && !afterColon.startsWith(';') && !afterColon.startsWith('//')) {
        if (inDataSection) throw new AsmError(lineNum, colonIndex + 1, 'Instructions not allowed in .DATA');

        const tokens = afterColon.split(/\s+/);
        let op = tokens[0].toUpperCase();
        if (op in INSTRUCTION_ALIASES) op = INSTRUCTION_ALIASES[op];

        if (!VALID_INSTRUCTIONS.has(op)) {
          const suggestion = suggestInstruction(tokens[0]);
          throw new AsmError(lineNum, colonIndex + 1, `Unknown instruction: ${tokens[0]}`, tokens[0], suggestion);
        }

        ast.push({
          op,
          operands: [],
          line: lineNum,
          column: colonIndex + 1,
          source: afterColon,
          address: currentAddress
        });
        lineMap.set(currentAddress, lineNum);
        currentAddress++;
      }
      continue;
    }

    // Handle instructions (only in text section)
    if (!inDataSection) {
      const tokens = trimmed.split(/\s+/);
      let op = tokens[0].toUpperCase();
      if (op in INSTRUCTION_ALIASES) op = INSTRUCTION_ALIASES[op];

      if (!VALID_INSTRUCTIONS.has(op)) {
        const suggestion = suggestInstruction(tokens[0]);
        throw new AsmError(lineNum, 1, `Unknown instruction: ${tokens[0]}`, tokens[0], suggestion);
      }

      ast.push({
        op,
        operands: [],
        line: lineNum,
        column: 1,
        source: trimmed,
        address: currentAddress
      });
      lineMap.set(currentAddress, lineNum);
      currentAddress++;
    } else {
      throw new AsmError(lineNum, 1, 'Unexpected content in .DATA section');
    }
  }

  // Pass 2: Parse operands and validate
  let astIndex = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    const lineNum = i + 1;

    if (!trimmed || trimmed.startsWith(';') || trimmed.startsWith('//') || trimmed.startsWith('.')) continue;

    let instructionPart = trimmed;
    let colOffset = 0;

    if (trimmed.includes(':')) {
      const colonIndex = trimmed.indexOf(':');
      const afterColon = trimmed.slice(colonIndex + 1).trim();
      if (afterColon && !afterColon.startsWith(';') && !afterColon.startsWith('//')) {
        instructionPart = afterColon;
        colOffset = colonIndex + 1;
      } else {
        continue;
      }
    }

    if (astIndex >= ast.length) continue;

    const instruction = ast[astIndex];
    const tokens = instructionPart.split(/\s+/);
    const operands: Operand[] = [];

    if (tokens.length > 1) {
      const operandStr = instructionPart.slice(instructionPart.indexOf(tokens[1]));
      const operandTokens = operandStr.split(',').map(t => t.trim()).filter(Boolean);

      for (const tok of operandTokens) {
        const tokenCol = colOffset + instructionPart.indexOf(tok) + 1;
        operands.push(parseOperand(tok, { ...labels, ...constants }, lineNum, tokenCol));
      }
    }

    validateInstructionOperands(instruction.op, operands, lineNum, colOffset + 1);
    instruction.operands = operands;
    astIndex++;
  }

  // Pass 3: Validate label references
  for (const ins of ast) {
    for (const operand of ins.operands) {
      if (operand.type === 'label') {
        const key = operand.value.toString().toLowerCase();
        if (labels[key] === undefined && constants[key] === undefined) {
          throw new AsmError(ins.line, ins.column, `Undefined label: ${operand.value}`);
        }
      }
      if (operand.type === 'mem' && typeof operand.value === 'string') {
        const key = operand.value.toLowerCase();
        if (labels[key] === undefined && constants[key] === undefined) {
          throw new AsmError(ins.line, ins.column, `Undefined label: ${operand.value}`);
        }
      }
    }
  }

  return { lines, ast, labels: { ...labels, ...constants }, dataSection, textStart, dataStart, lineMap };
}

/** Execute single instruction */
export function step(
  cpu: CPU,
  program: Program,
  ram: DataView,
  hooks?: { onSys?: (syscall: number, cpu: CPU, ram: DataView) => string }
): void {
  if (cpu.halted || cpu.IP < 0 || cpu.IP >= program.ast.length) {
    cpu.halted = true;
    return;
  }

  const instruction = program.ast[cpu.IP];
  const { op, operands } = instruction;

  try {
    switch (op) {
      case 'NOP':
        break;

      case 'HLT':
        cpu.halted = true;
        return;

      case 'MOV': {
        const src = operands[1].type === 'label'
          ? program.labels[operands[1].value.toString().toLowerCase()]
          : resolveOperand(operands[1], cpu, ram, program.labels);
        writeRegister(cpu, operands[0].value as number, src);
        break;
      }

      case 'LOAD': {
        const value = resolveOperand(operands[1], cpu, ram, program.labels);
        writeRegister(cpu, operands[0].value as number, value);
        break;
      }

      case 'STORE': {
        const value = resolveOperand(operands[1], cpu, ram, program.labels);
        let addr: number;

        if (typeof operands[0].value === 'string') {
          addr = program.labels[operands[0].value.toLowerCase()];
        } else if (operands[0].indirect) {
          const regIndex = operands[0].value as number;
          const baseAddr = regIndex === -1 ? cpu.SP : regIndex === -2 ? cpu.BP : cpu.R[regIndex];
          addr = baseAddr + (operands[0].offset || 0);
        } else {
          addr = operands[0].value as number;
        }

        writeMemory(ram, addr, value);
        break;
      }

      case 'LEA': {
        let addr: number;
        if (typeof operands[1].value === 'string') {
          addr = program.labels[operands[1].value.toLowerCase()];
        } else if (operands[1].indirect) {
          const regIndex = operands[1].value as number;
          const baseAddr = regIndex === -1 ? cpu.SP : regIndex === -2 ? cpu.BP : cpu.R[regIndex];
          addr = baseAddr + (operands[1].offset || 0);
        } else {
          addr = operands[1].value as number;
        }
        writeRegister(cpu, operands[0].value as number, addr);
        break;
      }

      case 'ADD': {
        const regIndex = operands[0].value as number;
        const a = regIndex === -1 ? cpu.SP : regIndex === -2 ? cpu.BP : cpu.R[regIndex];
        const b = resolveOperand(operands[1], cpu, ram, program.labels);
        const result = a + b;
        writeRegister(cpu, regIndex, result);
        setFlags(cpu, result, a, b, 'add');
        break;
      }

      case 'SUB': {
        const regIndex = operands[0].value as number;
        const a = regIndex === -1 ? cpu.SP : regIndex === -2 ? cpu.BP : cpu.R[regIndex];
        const b = resolveOperand(operands[1], cpu, ram, program.labels);
        const result = a - b;
        writeRegister(cpu, regIndex, result);
        setFlags(cpu, result, a, b, 'sub');
        break;
      }

      case 'MUL': {
        const regIndex = operands[0].value as number;
        const a = regIndex === -1 ? cpu.SP : regIndex === -2 ? cpu.BP : cpu.R[regIndex];
        const b = resolveOperand(operands[1], cpu, ram, program.labels);
        const result = a * b;
        
        // Check for overflow in 16-bit signed range
        if (result > 32767 || result < -32768) {
          // Set overflow flag and clamp to max/min values
          cpu.F.OF = true;
          const clampedResult = result > 32767 ? 32767 : -32768;
          writeRegister(cpu, regIndex, clampedResult);
          setFlags(cpu, clampedResult);
        } else {
          cpu.F.OF = false;
          writeRegister(cpu, regIndex, result);
          setFlags(cpu, result);
        }
        break;
      }

      case 'DIV': {
        const regIndex = operands[0].value as number;
        const a = regIndex === -1 ? cpu.SP : regIndex === -2 ? cpu.BP : cpu.R[regIndex];
        const b = resolveOperand(operands[1], cpu, ram, program.labels);
        if (b === 0) throw new Error('Division by zero');
        const result = Math.floor(a / b);
        writeRegister(cpu, regIndex, result);
        setFlags(cpu, result);
        break;
      }

      case 'INC': {
        const regIndex = operands[0].value as number;
        const current = regIndex === -1 ? cpu.SP : regIndex === -2 ? cpu.BP : cpu.R[regIndex];
        const result = current + 1;
        writeRegister(cpu, regIndex, result);
        setFlags(cpu, result);
        break;
      }

      case 'DEC': {
        const regIndex = operands[0].value as number;
        const current = regIndex === -1 ? cpu.SP : regIndex === -2 ? cpu.BP : cpu.R[regIndex];
        const result = current - 1;
        writeRegister(cpu, regIndex, result);
        setFlags(cpu, result);
        break;
      }

      case 'AND': {
        const regIndex = operands[0].value as number;
        const a = regIndex === -1 ? cpu.SP : regIndex === -2 ? cpu.BP : cpu.R[regIndex];
        const b = resolveOperand(operands[1], cpu, ram, program.labels);
        const result = a & b;
        writeRegister(cpu, regIndex, result);
        setFlags(cpu, result);
        break;
      }

      case 'OR': {
        const regIndex = operands[0].value as number;
        const a = regIndex === -1 ? cpu.SP : regIndex === -2 ? cpu.BP : cpu.R[regIndex];
        const b = resolveOperand(operands[1], cpu, ram, program.labels);
        const result = a | b;
        writeRegister(cpu, regIndex, result);
        setFlags(cpu, result);
        break;
      }

      case 'XOR': {
        const regIndex = operands[0].value as number;
        const a = regIndex === -1 ? cpu.SP : regIndex === -2 ? cpu.BP : cpu.R[regIndex];
        const b = resolveOperand(operands[1], cpu, ram, program.labels);
        const result = a ^ b;
        writeRegister(cpu, regIndex, result);
        setFlags(cpu, result);
        break;
      }

      case 'NOT': {
        const regIndex = operands[0].value as number;
        const current = regIndex === -1 ? cpu.SP : regIndex === -2 ? cpu.BP : cpu.R[regIndex];
        const result = ~current;
        writeRegister(cpu, regIndex, result);
        setFlags(cpu, result);
        break;
      }

      case 'SHL': {
        const regIndex = operands[0].value as number;
        const a = regIndex === -1 ? cpu.SP : regIndex === -2 ? cpu.BP : cpu.R[regIndex];
        const b = resolveOperand(operands[1], cpu, ram, program.labels);
        const result = a << b;
        writeRegister(cpu, regIndex, result);
        setFlags(cpu, result);
        break;
      }

      case 'SHR': {
        const regIndex = operands[0].value as number;
        const a = regIndex === -1 ? cpu.SP : regIndex === -2 ? cpu.BP : cpu.R[regIndex];
        const b = resolveOperand(operands[1], cpu, ram, program.labels);
        const result = a >> b;
        writeRegister(cpu, regIndex, result);
        setFlags(cpu, result);
        break;
      }

      case 'CMP': {
        const a = resolveOperand(operands[0], cpu, ram, program.labels);
        const b = resolveOperand(operands[1], cpu, ram, program.labels);
        const result = a - b;
        setFlags(cpu, result, a, b, 'cmp');
        break;
      }

      case 'TEST': {
        const a = resolveOperand(operands[0], cpu, ram, program.labels);
        const b = resolveOperand(operands[1], cpu, ram, program.labels);
        const result = a & b;
        setFlags(cpu, result);
        break;
      }

      // Jump instructions
      case 'JMP': {
        const target = resolveOperand(operands[0], cpu, ram, program.labels);
        cpu.IP = target;
        return;
      }

      case 'JE': {
        if (cpu.F.ZF) {
          const target = resolveOperand(operands[0], cpu, ram, program.labels);
          cpu.IP = target;
          return;
        }
        break;
      }

      case 'JNZ': {
        if (!cpu.F.ZF) {
          const target = resolveOperand(operands[0], cpu, ram, program.labels);
          cpu.IP = target;
          return;
        }
        break;
      }

      case 'JC': {
        if (cpu.F.CF) {
          const target = resolveOperand(operands[0], cpu, ram, program.labels);
          cpu.IP = target;
          return;
        }
        break;
      }

      case 'JNC': {
        if (!cpu.F.CF) {
          const target = resolveOperand(operands[0], cpu, ram, program.labels);
          cpu.IP = target;
          return;
        }
        break;
      }

      case 'JN': {
        if (cpu.F.NF) {
          const target = resolveOperand(operands[0], cpu, ram, program.labels);
          cpu.IP = target;
          return;
        }
        break;
      }

      case 'JNN': {
        if (!cpu.F.NF) {
          const target = resolveOperand(operands[0], cpu, ram, program.labels);
          cpu.IP = target;
          return;
        }
        break;
      }

      case 'JG': {
        if (!cpu.F.ZF && !cpu.F.NF) {
          const target = resolveOperand(operands[0], cpu, ram, program.labels);
          cpu.IP = target;
          return;
        }
        break;
      }

      case 'JGE': {
        if (!cpu.F.NF) {
          const target = resolveOperand(operands[0], cpu, ram, program.labels);
          cpu.IP = target;
          return;
        }
        break;
      }

      case 'JL': {
        if (cpu.F.NF) {
          const target = resolveOperand(operands[0], cpu, ram, program.labels);
          cpu.IP = target;
          return;
        }
        break;
      }

      case 'JLE': {
        if (cpu.F.ZF || cpu.F.NF) {
          const target = resolveOperand(operands[0], cpu, ram, program.labels);
          cpu.IP = target;
          return;
        }
        break;
      }

      // Stack operations
      case 'PUSH': {
        const value = resolveOperand(operands[0], cpu, ram, program.labels);
        cpu.SP -= 2;
        writeMemory(ram, cpu.SP, value);
        break;
      }

      case 'POP': {
        const value = ram.getInt16(cpu.SP, true);
        cpu.SP += 2;
        writeRegister(cpu, operands[0].value as number, value);
        break;
      }

      case 'CALL': {
        const target = resolveOperand(operands[0], cpu, ram, program.labels);
        cpu.SP -= 2;
        writeMemory(ram, cpu.SP, cpu.IP + 1);
        cpu.IP = target;
        return;
      }

      case 'RET': {
        const returnAddr = ram.getInt16(cpu.SP, true);
        cpu.SP += 2;
        cpu.IP = returnAddr;
        return;
      }

      case 'SYS': {
        const syscall = resolveOperand(operands[0], cpu, ram, program.labels);
        if (hooks?.onSys) {
          hooks.onSys(syscall, cpu, ram);
        }
        break;
      }

      default:
        throw new Error(`Unimplemented instruction: ${op}`);
    }

    cpu.IP++;
  } catch (error) {
    throw new Error(`Execution error at line ${instruction.line}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/** Run program with breakpoints and step limit */
export function run(
  cpu: CPU,
  program: Program,
  ram: DataView,
  options: {
    maxSteps?: number;
    breakpoints?: Set<number>;
    onSys?: (syscall: number, cpu: CPU, ram: DataView) => string;
  } = {}
): { steps: number; reason: 'halted' | 'breakpoint' | 'maxSteps' | 'error'; error?: string } {
  const { maxSteps = 10000, breakpoints = new Set(), onSys } = options;
  let steps = 0;

  try {
    while (!cpu.halted && steps < maxSteps) {
      // Check breakpoint
      if (breakpoints.has(cpu.IP)) {
        return { steps, reason: 'breakpoint' };
      }

      step(cpu, program, ram, { onSys });
      steps++;
    }

    if (cpu.halted) {
      return { steps, reason: 'halted' };
    } else {
      return { steps, reason: 'maxSteps' };
    }
  } catch (error) {
    return {
      steps,
      reason: 'error',
      error: error instanceof Error ? error.message : String(error)
    };
  }
}