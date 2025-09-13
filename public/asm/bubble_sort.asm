; Bubble Sort - Sort an array using bubble sort algorithm
; This program demonstrates nested loops and array manipulation

.TEXT
start:
    ; Initialize array values in memory (starting at address 15000)
    MOV R4, #15000              ; Array base address
    MOV R5, #64                 ; Store array values
    STORE [R4], R5
    MOV R5, #34
    STORE [R4+2], R5
    MOV R5, #25
    STORE [R4+4], R5
    MOV R5, #12
    STORE [R4+6], R5
    MOV R5, #22
    STORE [R4+8], R5
    MOV R5, #11
    STORE [R4+10], R5
    MOV R5, #90
    STORE [R4+12], R5
    
    MOV R0, #7                  ; Array length
    MOV R1, R0                  ; Outer loop counter (n)
    
outer_loop:
    CMP R1, #1                  ; Check if outer loop done
    JLE sort_done               ; Exit if counter <= 1
    
    MOV R2, #0                  ; Inner loop index (i = 0)
    MOV R3, R1                  ; Inner loop limit (n-1)
    DEC R3                      ; Adjust for 0-based indexing
    
inner_loop:
    CMP R2, R3                  ; Check if inner loop done
    JGE inner_done              ; Exit inner loop if i >= n-1
    
    ; Calculate addresses for array[i] and array[i+1]
    MOV R4, R2                  ; Copy index i
    MUL R4, #2                  ; Convert to byte offset (i * 2)
    ADD R4, #15000              ; Add base address
    
    MOV R6, R4                  ; Copy address
    ADD R6, #2                  ; Address of array[i+1]
    
    ; Load values to compare
    LOAD R7, [R4]               ; array[i]
    LOAD R0, [R6]               ; array[i+1]
    
    ; Compare and swap if needed
    CMP R7, R0                  ; Compare array[i] with array[i+1]
    JLE no_swap                 ; Skip swap if array[i] <= array[i+1]
    
    ; Swap elements
    STORE [R4], R0              ; array[i] = array[i+1]
    STORE [R6], R7              ; array[i+1] = original array[i]
    
no_swap:
    INC R2                      ; i++
    JMP inner_loop              ; Continue inner loop
    
inner_done:
    DEC R1                      ; Decrement outer counter
    JMP outer_loop              ; Continue outer loop
    
sort_done:
    ; Print sorted array
    MOV R1, #0                  ; Index for printing
    MOV R2, #7                  ; Array length
    
print_loop:
    CMP R1, R2                  ; Check if done printing
    JGE done                    ; Exit if all printed
    
    MOV R3, R1                  ; Copy index
    MUL R3, #2                  ; Convert to byte offset
    ADD R3, #15000              ; Add base address
    LOAD R0, [R3]               ; Load element value
    
    SYS #1                      ; Print element
    INC R1                      ; Next element
    JMP print_loop              ; Continue
    
done:
    MOV R0, #0                  ; Exit code 0
    SYS #3                      ; Exit program
    HALT