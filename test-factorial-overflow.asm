; Test factorial overflow handling
; This should demonstrate the overflow fix for 16!

.TEXT
start:
    ; Calculate 16! which should overflow
    MOV R0, #16     ; Calculate 16!
    MOV R1, #1      ; Result accumulator
    
factorial_loop:
    CMP R0, #1
    JLE done
    MUL R1, R0      ; This should trigger overflow protection
    DEC R0
    JNE factorial_loop
    
done:
    ; R1 should contain the clamped result (32767) instead of -32768
    MOV R0, R1
    SYS #1          ; Print result
    HALT