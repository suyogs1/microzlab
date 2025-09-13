; Test file for assembler features
; This file tests directives and aliases

.DATA
; Store value 123 as bytes
value: .BYTE 123, 0
; Store multiple values as bytes (16-bit little-endian)
values: .BYTE 1, 0, 2, 0, 3, 0, 123, 0, 65, 0

; Test .BYTE directive
byte_val: .BYTE 65, 0x42, 'C'

; Test string directives
str1: .ASCII "HELLO"       ; No null terminator
str2: .ASCIZ "WORLD"       ; Null terminated
str3: .ASCII "TEST"        ; No null terminator

; Test .SPACE directive
buffer: .SPACE 10          ; Reserve 10 bytes

; Test .ALIGN directive
.ALIGN 4
aligned_data: .BYTE 0xAD, 0xDE

.TEXT
start:
    ; Test basic operations
    MOV R0, #5
    MOV R1, #1
    
    ; Test factorial loop with aliases
factorial_loop:
    MUL R1, R0              ; result *= N
    DEC R0                  ; N--
    CMP R0, #0
    JNE factorial_loop      ; JNE alias for JNZ
    
    ; Test other jump aliases
    CMP R1, #120
    JEQ success             ; JEQ alias for JE
    JZ success              ; JZ alias for JE
    
    ; Error path
    MOV R0, #1              ; Error code
    JMP exit
    
success:
    MOV R0, #0              ; Success code
    
exit:
    ; Test system call
    SYS #1                  ; Print integer
    HALT                    ; HALT alias for HLT

; This program should:
; 1. Calculate 5! = 120
; 2. Compare result with 120
; 3. Jump to success if equal
; 4. Print 0 (success code)
; 5. Halt execution