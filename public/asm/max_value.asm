; Find Maximum Value - Find the largest value in an array
; This program demonstrates comparison operations and conditional logic

.TEXT
start:
    ; Initialize array values in memory (starting at address 15000)
    MOV R1, #15000              ; Array base address
    MOV R0, #3                  ; Store array values
    STORE [R1], R0
    MOV R0, #7
    STORE [R1+2], R0
    MOV R0, #2
    STORE [R1+4], R0
    MOV R0, #9
    STORE [R1+6], R0
    MOV R0, #1
    STORE [R1+8], R0
    
    ; Find maximum value
    LOAD R0, [R1]               ; Load first element as initial max
    MOV R2, #4                  ; Remaining elements to check
    ADD R1, #2                  ; Move to second element
    
loop:
    CMP R2, #0                  ; Check if we're done
    JZ done                     ; Jump if no more elements
    
    LOAD R3, [R1]               ; Load current element
    CMP R3, R0                  ; Compare with current max
    JLE skip                    ; Jump if current <= max
    MOV R0, R3                  ; Update max if current > max
    
skip:
    ADD R1, #2                  ; Move to next element
    DEC R2                      ; Decrement counter
    JMP loop                    ; Continue loop
    
done:
    ; R0 now contains the maximum value (9)
    SYS #1                      ; Print the result
    MOV R0, #0                  ; Exit code 0
    SYS #3                      ; Exit program
    HALT