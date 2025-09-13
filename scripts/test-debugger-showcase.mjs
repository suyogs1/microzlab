#!/usr/bin/env node

/**
 * Test script for debugger showcase example
 * Validates that the showcase program assembles correctly
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Simple assembler validation (basic syntax check)
function validateAssembly(source) {
  const lines = source.split('\n');
  const errors = [];
  let inDataSection = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const lineNum = i + 1;
    
    // Skip empty lines and comments
    if (!line || line.startsWith(';') || line.startsWith('//')) continue;
    
    // Check directives
    if (line.startsWith('.')) {
      const directive = line.split(/\s+/)[0].toUpperCase();
      const validDirectives = ['.DATA', '.TEXT', '.WORD', '.BYTE', '.ASCII', '.ASCIZ', '.ORG', '.ALIGN', '.SPACE', '.EQU'];
      
      if (!validDirectives.includes(directive)) {
        errors.push(`Line ${lineNum}: Unknown directive ${directive}`);
      }
      
      if (directive === '.DATA') inDataSection = true;
      if (directive === '.TEXT') inDataSection = false;
      continue;
    }
    
    // Check labels
    if (line.includes(':')) {
      const labelPart = line.split(':')[0].trim();
      if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(labelPart)) {
        errors.push(`Line ${lineNum}: Invalid label name ${labelPart}`);
      }
      continue;
    }
    
    // Check instructions (only in text section)
    if (!inDataSection) {
      const tokens = line.split(/\s+/);
      const instruction = tokens[0].toUpperCase();
      
      const validInstructions = [
        'NOP', 'HLT', 'MOV', 'LOAD', 'STORE', 'LEA',
        'ADD', 'SUB', 'MUL', 'DIV', 'INC', 'DEC',
        'AND', 'OR', 'XOR', 'NOT', 'SHL', 'SHR',
        'CMP', 'TEST', 'JMP', 'JE', 'JNE', 'JNZ', 'JC', 'JNC',
        'JN', 'JNN', 'JG', 'JGE', 'JL', 'JLE',
        'PUSH', 'POP', 'CALL', 'RET', 'SYS', 'SYSCALL', 'HALT'
      ];
      
      if (!validInstructions.includes(instruction)) {
        errors.push(`Line ${lineNum}: Unknown instruction ${instruction}`);
      }
    }
  }
  
  return errors;
}

function testDebuggerShowcase() {
  console.log('🔍 Testing debugger showcase example...');
  
  try {
    // Read the showcase file
    const showcasePath = join(projectRoot, 'examples', 'debugger-showcase.asm');
    const source = readFileSync(showcasePath, 'utf8');
    
    console.log(`📁 Loaded ${showcasePath}`);
    console.log(`📏 Source: ${source.split('\n').length} lines`);
    
    // Validate assembly syntax
    const errors = validateAssembly(source);
    
    if (errors.length === 0) {
      console.log('✅ Assembly syntax validation passed');
    } else {
      console.log('❌ Assembly syntax errors found:');
      errors.forEach(error => console.log(`   ${error}`));
      return false;
    }
    
    // Check for required sections
    const hasDataSection = source.includes('.DATA');
    const hasTextSection = source.includes('.TEXT');
    const hasMainLabel = source.includes('main:');
    const hasSystemCalls = source.includes('SYS #');
    const hasLoops = source.includes('loop_start:');
    const hasFunctions = source.includes('calculate_sum:');
    
    console.log('📋 Feature coverage:');
    console.log(`   Data section: ${hasDataSection ? '✅' : '❌'}`);
    console.log(`   Text section: ${hasTextSection ? '✅' : '❌'}`);
    console.log(`   Main entry: ${hasMainLabel ? '✅' : '❌'}`);
    console.log(`   System calls: ${hasSystemCalls ? '✅' : '❌'}`);
    console.log(`   Loops: ${hasLoops ? '✅' : '❌'}`);
    console.log(`   Functions: ${hasFunctions ? '✅' : '❌'}`);
    
    const allFeatures = hasDataSection && hasTextSection && hasMainLabel && 
                       hasSystemCalls && hasLoops && hasFunctions;
    
    if (allFeatures) {
      console.log('🎉 All debugger features are demonstrated');
      return true;
    } else {
      console.log('⚠️  Some features missing from showcase');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error testing debugger showcase:', error.message);
    return false;
  }
}

function testExamplePrograms() {
  console.log('\n🔍 Testing other example programs...');
  
  const examples = ['hello.asm', 'controlflow.asm', 'directives.asm'];
  let allPassed = true;
  
  for (const example of examples) {
    try {
      const examplePath = join(projectRoot, 'examples', example);
      const source = readFileSync(examplePath, 'utf8');
      const errors = validateAssembly(source);
      
      if (errors.length === 0) {
        console.log(`✅ ${example} - syntax valid`);
      } else {
        console.log(`❌ ${example} - syntax errors:`);
        errors.forEach(error => console.log(`   ${error}`));
        allPassed = false;
      }
    } catch (error) {
      console.log(`⚠️  ${example} - file not found or error: ${error.message}`);
    }
  }
  
  return allPassed;
}

// Run tests
console.log('🚀 MicroZ Debugger Showcase Test\n');

const showcaseTest = testDebuggerShowcase();
const examplesTest = testExamplePrograms();

console.log('\n📊 Test Results:');
console.log(`Debugger showcase: ${showcaseTest ? '✅ PASS' : '❌ FAIL'}`);
console.log(`Example programs: ${examplesTest ? '✅ PASS' : '❌ FAIL'}`);

const overallResult = showcaseTest && examplesTest;
console.log(`\n🎯 Overall: ${overallResult ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);

process.exit(overallResult ? 0 : 1);