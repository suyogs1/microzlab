; Instruction Aliases Test - MicroZ Assembly
; Tests instruction aliases without .DATA sections

.TEXT
start:
    ; Test instruction aliases with factorial (max 7! for 16-bit)
    MOV R0, #5
    MOV R1, #1
    
loop:
    MUL R1, R0          ; result *= N
    DEC R0              ; N--
    CMP R0, #0
    JNE loop            ; JNE alias for JNZ
    
    ; Test other aliases
    CMP R1, #120
    JE success          ; Jump if equal
    JE success          ; Jump if equal (same as JZ)
    
    MOV R0, #1          ; Error code
    JMP exit
    
success:
    MOV R0, #0          ; Success code
    
exit:
    SYS #1              ; Print result
    HALT                ; HALT alias for HLT