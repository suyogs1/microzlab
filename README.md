# MicroZ Lab — Assembly Learning Platform

MicroZ Lab is an interactive web-based platform for learning assembly programming using the MicroZ instruction set architecture, featuring a comprehensive debugger with line awareness and resizable UI.

## Features

### 🎓 Learn Tab
- Interactive lessons covering MicroZ assembly fundamentals
- Step-by-step tutorials with code examples
- Progress tracking and completion status
- "Open in Debugger" functionality for hands-on practice

### 🔧 Debug Tab
- Full-featured assembly debugger with advanced debugging capabilities
- Monaco editor with MicroZ syntax highlighting and intelligent code completion
- Real-time register and memory visualization with hex/decimal views
- Smart breakpoint system with automatic snapping to executable lines
- Multi-panel interface: Registers, Memory, Watches, Console, Trace, Performance
- Console output for system calls with formatted display
- Watch expressions for registers, memory locations, and labels
- Execution trace with instruction history and program flow analysis
- Performance controls with adjustable speed and batch execution
- Sample programs and comprehensive debugger showcase
- Resizable/dockable layout (right, bottom, fullscreen) with persistent preferences
- Comprehensive error handling with actionable messages and suggestions
- Keyboard shortcuts for efficient debugging workflow

## MicroZ Instruction Set

### Registers
- **R0-R15**: General purpose registers (16-bit)
- **SP**: Stack Pointer
- **BP**: Base Pointer  
- **IP**: Instruction Pointer

### Flags
- **ZF**: Zero Flag
- **NF**: Negative Flag
- **CF**: Carry Flag
- **OF**: Overflow Flag

### Memory
- 64KB address space (TEXT at 0x0000, DATA at 0x8000)
- Little-endian byte order
- Stack grows downward from high addresses

### Instructions

#### Data Movement
- `MOV dst, src` - Move data between registers or load immediate
- `LOAD Rd, [addr]` - Load 16-bit word from memory to register
- `STORE [addr], Rs` - Store register to memory

#### Arithmetic
- `ADD Rd, src` - Addition with flag updates
- `SUB Rd, src` - Subtraction with flag updates
- `MUL Rd, src` - Multiplication
- `DIV Rd, src` - Division
- `INC Rn` - Increment register
- `DEC Rn` - Decrement register

#### Logic & Bitwise
- `AND Rd, src` - Bitwise AND
- `OR Rd, src` - Bitwise OR
- `XOR Rd, src` - Bitwise XOR
- `NOT Rn` - Bitwise NOT
- `SHL Rd, count` - Shift left
- `SHR Rd, count` - Shift right

#### Control Flow
- `CMP Ra, Rb` - Compare and set flags
- `JMP label` - Unconditional jump
- `JE label` - Jump if equal (Z flag set)
- `JNE label` - Jump if not equal (alias for JNZ)
- `JNZ label` - Jump if not zero
- `JG/JGE/JL/JLE label` - Signed comparisons
- `CALL label` - Function call
- `RET` - Return from function

#### Stack Operations
- `PUSH Rn` - Push register to stack
- `POP Rn` - Pop from stack to register

#### System
- `NOP` - No operation  
- `HLT` - Stop execution (alias: HALT)
- `SYS #n` - System call (alias: SYSCALL)
  - `SYS #1` - Print integer in R0
  - `SYS #2` - Print string at address in R0
  - `SYS #3` - Exit with code in R0

### Addressing Modes
- **Immediate**: `#123`, `#0x7B`, `#0b1010`, `#'A'` - Constants
- **Register**: `R0-R15`, `SP`, `BP` - Register contents
- **Direct**: `[1000]`, `[label]` - Memory at address
- **Indirect**: `[R0]` - Memory at address in register
- **Indexed**: `[R0+4]`, `[label+offset]` - Base + offset


### Number Formats
- **Decimal**: `123`
- **Hexadecimal**: `0x7B`, `0X7b`
- **Binary**: `0b1111011`, `0B1111011`
- **Character**: `'A'` (ASCII value 65)

## Debugger Usage Guide

### Getting Started

1. **Load a Program**: Use the Monaco editor to write assembly code or load an example
2. **Set Breakpoints**: Click the gutter margin or press F9 on any line
3. **Start Debugging**: Click Run or press Ctrl+Enter to begin execution
4. **Step Through Code**: Use F10 (step over) or F11 (step into) for line-by-line execution

### Debugger Commands & Features

#### Execution Control
```
Run (Ctrl+Enter)     - Execute until breakpoint or halt
Step Over (F10)      - Execute current line, skip function calls
Step Into (F11)      - Execute current line, enter function calls  
Step Out (Shift+F11) - Execute until return from current function
Reset                - Reset CPU and memory to initial state
Pause                - Stop execution (when running)
```

#### Breakpoint Management
```
Toggle (F9)          - Set/remove breakpoint on current line
Click Gutter         - Set/remove breakpoint by clicking line number area
Smart Snapping       - Breakpoints automatically move to executable lines
Visual Feedback      - Toast notification when breakpoint location changes
```

#### Panel Navigation
```
Registers (Ctrl+B)   - View R0-R15, SP, BP, IP, and CPU flags
Memory               - Inspect RAM contents in hex/decimal format
Watches              - Monitor expressions: R0, [1000], [label_name]
Console              - View system call output and program messages
Trace                - See execution history and instruction flow
Performance          - Control execution speed and batch size
```

#### Watch Expressions
Add expressions to monitor values during execution:
- **Registers**: `R0`, `R15`, `SP`, `BP`, `IP`
- **Memory**: `[1000]`, `[0x8000]`, `[label_name]`
- **Indirect**: `[R0]`, `[SP+4]`, `[label+offset]`

#### System Calls
The debugger supports MicroZ system calls for I/O:
```assembly
SYS #1    ; Print integer in R0
SYS #2    ; Print string at address in R0  
SYS #3    ; Exit with code in R0
```

#### Memory Layout
- **TEXT Section**: 0x0000-0x7FFF (code and instructions)

### Example Debugging Session

```assembly
.TEXT
main:
    MOV R0, #42        
    MOV R1, R0         
    
    ADD R1, #10        
    
    MOV R0, R1         
    SYS #1            
    
    MOV R0, #0        
    SYS #3             
    HLT             
```

**Debugging Steps:**
1. Set breakpoint on `MOV R0, #42`
2. Add watches for `R1` and `R0`
3. Run program - execution stops at breakpoint
4. Step through each instruction with F10/F11
5. Observe register changes in real-time
6. Check console output for system call results

### Troubleshooting

**Common Issues:**
- **Breakpoint not hit**: Ensure line contains executable instruction
- **Invalid memory access**: Check address bounds (0x0000-0xFFFF)
- **Undefined label**: Verify label is declared and spelled correctly
- **Stack overflow**: Monitor SP register, ensure balanced PUSH/POP

**Error Messages:**
The debugger provides detailed error information with:
- Line and column numbers
- Specific error descriptions  
- Suggestions for common mistakes
- Syntax highlighting for problematic code

### Quick Reference

**Watch Expression Examples:**
- `R0` - Register R0 value
- `[1000]` - Memory at address 1000
- `[msg_hello]` - Memory at label address
- `[R0]` - Memory at address in R0
- `[SP+4]` - Memory at SP + 4 offset

**System Call Reference:**
- `SYS #1` - Print integer in R0 to console
- `SYS #2` - Print null-terminated string at address in R0
- `SYS #3` - Exit program with code in R0

**Try the Showcase:**
Load `examples/debugger-showcase.asm` for a comprehensive demonstration of all debugger features including breakpoints, stepping, watches, memory inspection, and system calls.

## Development

### Prerequisites
- Node.js 18+
- npm or yarn

### Setup
```bash
npm install
npm run dev
```

### Standalone Debugger

The MicroZ debugger can be used independently of the learning platform:

```bash
# Run standalone debugger
npm run dev:debugger

# Test debugger functionality  
npm run test:debugger

# Run smoke tests
npm run smoke:debugger
```

#### Embedding the Debugger

```tsx
import { DebuggerStandalone } from '@microz/debugger';

<DebuggerStandalone 
  initialFile="examples/hello.asm"
  theme="system"
  readonly={false}
  initialBreakpoints={[{ path: 'main.asm', line: 5 }]}
/>
```

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `initialFile` | `string` | - | Load example file on mount |
| `readonly` | `boolean` | `false` | Disable code editing |
| `theme` | `'light'\|'dark'\|'system'` | `'dark'` | Editor theme |
| `initialBreakpoints` | `Array<{path:string; line:number}>` | `[]` | Set breakpoints on load |

#### Debugger Features

**Core Debugging:**
- **Smart Breakpoints**: Click gutter or F9 to toggle, automatic snapping to executable lines
- **Step Execution**: F10 (step over), F11 (step into), Shift+F11 (step out)
- **Run Control**: Run until breakpoint/halt, pause execution, reset CPU state
- **Line Awareness**: Visual feedback when breakpoints snap to nearest executable line

**Multi-Panel Interface:**
- **Registers Panel**: R0-R15 general purpose, SP/BP/IP special registers, CPU flags (ZF/NF/CF/OF)
- **Memory Viewer**: Hex/decimal display, navigate to addresses, inspect data section
- **Watch Expressions**: Monitor registers (`R0`), memory (`[1000]`), labels (`[msg_hello]`)
- **Console Output**: System call results, string/integer prints, program messages
- **Trace Panel**: Execution history, instruction sequence, program flow analysis
- **Performance Controls**: Adjustable speed, batch execution, execution statistics

**Advanced Features:**
- **Resizable Layout**: Dock right (40%), bottom (30%), or fullscreen with persistent preferences
- **Keyboard Shortcuts**: F9 (breakpoint), F10 (step over), F11 (step into), Ctrl+B (focus registers), Ctrl+Enter (run)
- **Error Recovery**: Robust error boundaries with copy stack and reset functionality
- **Source Mapping**: Accurate line mapping between editor and runtime with position utilities
- **Instruction Aliases**: HALT→HLT, JNE→JNZ, SYSCALL→SYS with case-insensitive parsing
- **Comprehensive ISA**: 16 registers (R0-R15), multiple addressing modes, full directive support
- **Actionable Errors**: Line/column precision with suggestions for typos and common mistakes
- **Memory Layout**: Separate TEXT (0x0000) and DATA (0x8000) sections with configurable bases

**Example Programs:**
- `examples/hello.asm` - Basic program structure and system calls
- `examples/controlflow.asm` - Loops, conditionals, and jumps
- `examples/directives.asm` - Data section and assembler directives
- `examples/debugger-showcase.asm` - Comprehensive feature demonstration

### Testing

```bash
# Run all tests
npm test

# Test debugger functionality
npm run test:debugger

# Test example programs
npm run test:showcase

# Run smoke tests
npm run smoke:debugger
```

### Build
```bash
npm run build
```

### Technologies
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **Monaco Editor** - Code editor
- **Web Workers** - Off-main-thread execution

## Architecture

### Performance Optimizations
- Monaco editor lazy-loaded
- Code execution in Web Workers
- Component code-splitting
- Efficient memory visualization
- Debounced localStorage saves

### Accessibility
- Keyboard shortcuts (F9, F10, F11, Ctrl+Enter)
- High contrast mode support
- Screen reader friendly
- Large touch targets for mobile

### Mobile Support
- Responsive design
- Touch-friendly controls
- Collapsible panels
- Optimized for small screens


## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Roadmap

- [ ] Complete Web Worker implementation
- [ ] Advanced debugging features
- [ ] More interactive lessons
- [ ] Challenge system with grading
- [ ] Export/import programs
- [ ] Collaborative features
- [ ] Performance profiling tools
