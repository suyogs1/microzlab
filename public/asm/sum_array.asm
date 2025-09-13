; Sum Array - Calculate sum of integers in an array
; This program demonstrates array iteration and accumulation

.TEXT
start:
    ; Initialize array values in memory (starting at address 15000)
    MOV R1, #15000              ; Array base address
    MOV R3, #1                  ; Store array values
    STORE [R1], R3
    MOV R3, #2
    STORE [R1+2], R3
    MOV R3, #3
    STORE [R1+4], R3
    MOV R3, #4
    STORE [R1+6], R3
    MOV R3, #5
    STORE [R1+8], R3
    
    ; Calculate sum
    MOV R0, #0                  ; Initialize sum to 0
    MOV R2, #5                  ; Array length
    
loop:
    CMP R2, #0                  ; Check if counter is zero
    JZ done                     ; Jump to done if finished
    
    LOAD R3, [R1]               ; Load current array element
    ADD R0, R3                  ; Add to sum
    ADD R1, #2                  ; Move to next element (2 bytes per WORD)
    DEC R2                      ; Decrement counter
    JMP loop                    ; Continue loop
    
done:
    ; R0 now contains the sum (15)
    SYS #1                      ; Print the result
    MOV R0, #0                  ; Exit code 0
    SYS #3                      ; Exit program
    HALT