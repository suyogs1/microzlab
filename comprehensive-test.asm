; Comprehensive MicroZ Assembly Test
; Tests all major features: instructions, addressing modes (no .DATA sections)

.TEXT
start:
    ; Test basic MOV with immediate values
    MOV R0, #42
    MOV R1, #0x100
    MOV R2, #0b1010
    MOV R3, #'X'
    
    ; Test memory operations using high memory addresses
    MOV R4, #100
    STORE [15000], R4       ; Store to memory
    LOAD R5, [15000]        ; Load from memory
    
    ; Test LEA (Load Effective Address) with memory addresses
    LEA R6, 15000
    LEA R7, 15100
    
    ; Test arithmetic operations
    ADD R0, #10
    SUB R1, #50
    MUL R2, #3
    DIV R3, #2
    
    ; Test bitwise operations
    AND R4, #0xFF
    OR R5, #0x0F
    XOR R6, #0xAA
    NOT R7
    
    ; Test shift operations
    SHL R0, #1
    SHR R1, #2
    
    ; Test increment/decrement
    INC R2
    DEC R3
    
    ; Test comparison and conditional jumps
    CMP R0, #50
    JE equal_50
    JG greater_50
    JL less_50
    
equal_50:
    MOV R8, #1
    JMP test_carry
    
greater_50:
    MOV R8, #2
    JMP test_carry
    
less_50:
    MOV R8, #3
    
test_carry:
    ; Test carry flag with JB (Jump if Below)
    CMP R0, #100
    JB below_100
    MOV R9, #0
    JMP test_stack
    
below_100:
    MOV R9, #1
    
test_stack:
    ; Test stack operations
    PUSH R0
    PUSH R1
    POP R10
    POP R11
    
    ; Test memory addressing modes
    MOV R12, #15100
    STORE [R12], R0         ; Store to memory
    STORE [R12+2], R1       ; Store to memory+2
    LOAD R13, [R12]         ; Load from memory
    LOAD R14, [R12+2]       ; Load from memory+2
    
    ; Test system call
    MOV R0, #42
    SYS #1                  ; Print number
    
    ; Test function call
    CALL function
    
    ; End program
    HLT

function:
    ; Simple function that doubles R0
    ADD R0, R0
    RET