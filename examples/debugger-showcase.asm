; MicroZ Complete Instruction Set Showcase
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

    RET