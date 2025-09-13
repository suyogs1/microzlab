; Reverse String - Demonstrate character manipulation
; This program demonstrates character operations and array reversal

.TEXT
start:
    ; Store "HELLO" as character codes in memory (starting at 15000)
    MOV R0, #15000              ; Base address
    MOV R1, #72                 ; 'H'
    STORE [R0], R1
    MOV R1, #69                 ; 'E'
    STORE [R0+2], R1
    MOV R1, #76                 ; 'L'
    STORE [R0+4], R1
    MOV R1, #76                 ; 'L'
    STORE [R0+6], R1
    MOV R1, #79                 ; 'O'
    STORE [R0+8], R1
    
    ; Reverse the character array
    MOV R1, #15000              ; Left pointer (start)
    MOV R2, #15008              ; Right pointer (end)
    
reverse_loop:
    CMP R1, R2                  ; Check if pointers meet or cross
    JGE done                    ; Done if left >= right
    
    ; Swap characters at R1 and R2
    LOAD R3, [R1]               ; Load left character
    LOAD R4, [R2]               ; Load right character
    STORE [R1], R4              ; Store right char at left position
    STORE [R2], R3              ; Store left char at right position
    
    ADD R1, #2                  ; Move left pointer right
    SUB R2, #2                  ; Move right pointer left
    JMP reverse_loop            ; Continue
    
done:
    ; Print reversed string: "OLLEH"
    MOV R0, #15000              ; Start of reversed string
    MOV R1, #5                  ; Number of characters
    
print_loop:
    CMP R1, #0                  ; Check if done
    JZ exit                     ; Exit if no more characters
    
    LOAD R2, [R0]               ; Load character
    PUSH R0                     ; Save address
    MOV R0, R2                  ; Move to R0 for printing
    SYS #1                      ; Print character code
    POP R0                      ; Restore address
    
    ADD R0, #2                  ; Move to next character
    DEC R1                      ; Decrement counter
    JMP print_loop              ; Continue
    
exit:
    MOV R0, #0                  ; Exit code 0
    SYS #3                      ; Exit program
    HALT