; Test assembler features without .DATA sections
.TEXT
start:
    ; Test immediate values and character literals
    MOV R0, #42
    CMP R0, #50
    JB below_50    ; Jump if below (carry flag set)
    MOV R1, #1
    JMP end
below_50:
    MOV R1, #0
    ADD R1, #0x10  ; Test hex immediate
end:
    MOV R2, #'Z'   ; Test character literal
    PUSH R0
    POP R3
    HLT