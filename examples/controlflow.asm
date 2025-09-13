; Control Flow Example - Factorial with aliases
; Demonstrates loops, conditionals, and instruction aliases

.DATA
n: .WORD 5
result: .WORD 1

.TEXT
start:
    LOAD R0, [n]        ; Load N into R0
    LOAD R1, [result]   ; Load initial result (1)
    
factorial_loop:
    CMP R0, #1          ; Compare N with 1
    JLE done            ; Jump if N <= 1
    
    MUL R1, R0          ; result = result * N
    DEC R0              ; N = N - 1
    JNE factorial_loop  ; Continue if N != 0 (JNE alias for JNZ)
    
done:
    STORE [result], R1  ; Save final result
    MOV R0, R1          ; Move result to R0 for printing
    SYS #1              ; Print integer
    MOV R0, #0          ; Exit code 0
    SYS #3              ; Exit program
    HALT                ; Stop execution (HALT alias for HLT)