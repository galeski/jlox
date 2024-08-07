const { Interpreter } = require('./eval.js');
const { AstPrinter } = require('./expr.js');
const { RuntimeError } = require('./helper.js');
const { Parser } = require('./parser.js');
const { Scanner } = require('./scanner.js');
const { TokenType } = require('./token.js');

const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');

// TODO:
// [done ?] FIX LEXEME reading
// [] Add support to Lox’s scanner for C-style /* ... */ block comments
// [wip] Extract scanner to a new source file
// [x] Create AST Printer class from:
// https://craftinginterpreters.com/representing-code.html

// NOTES
// Currently we can parse 4 types of expressions
// Literal expressions (for example, the string “Hallo!”, the number 3, or the boolean true)
// Unary expressions with a symbol and one operand (for example, the number -3 or the boolean !true)
// Binary expressions with a symbol and two operands (like 3 <= 3 or "Polly " + " wanna")
// Grouping expressions that combine the above expressions (like (-1 + 4) < (10 * 2))
// https://chelseatroy.com/2021/05/01/building-an-interpreter-the-visitor-pattern/

// Currently at:
// https://craftinginterpreters.com/evaluating-expressions.html#hooking-up-the-interpreter
// in eval.js

// TODO:
// Error handling is borked, there is some issue with ASTPrinter probably - using a message print for now
// TODO:
// EQUAL_EQUAL == null, Operands must be numbers. for "a" == "a"

class Lox {
  constructor() {
    const args = process.argv.slice(2);

    console.log(args.length ? `current argument: ${args}` : `running repl`);

    if (args.length > 1) console.log("Usage: jlox [script]");
    if (args.length === 1) this.runFile(args[0]);

    this.runPrompt();
  }

  static hadError = false;
  static hadRuntimeError = false;
  static interpreter = new Interpreter();

  async runFile(filePath) {
    try {
      const data = await fs.readFile(path.resolve(filePath), 'utf8');
      this.run(data);
      if (this.hadError) process.exit(1);
    } catch (error) {
      console.error('Error reading file:', error);
    }
  }

  runPrompt() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.setPrompt('> ');
    rl.prompt();

    rl.on('line', (line) => {
      if (line.trim() === '') {
        rl.close();
        return;
      }
      this.run(line);
      this.hadError = false;
      rl.prompt();
    });

    rl.on('close', () => {
      console.log('Exiting...');
      process.exit(0);
    });
  }

  run(source) {
    const scanner = new Scanner(source);
    const tokens = scanner.scanTokens();

    const parser = new Parser(tokens);
    const expression = parser.parse();

    parser.print();

    if (this.hadError) return;

    console.log(new AstPrinter().print(expression));
    // in JS we can't access interpreter instance directly
    // either we need to use this or or go through Class.interpreter
    Lox.interpreter.interpret(expression);

    for (let token of tokens) {
      console.log(token);
    }
  };

  static error(line, message) {
    this.#report(line, "", message);
  }

  static parseError(token, message) {
    if (token.type === TokenType.EOF) {
      this.#report(token.line, " at end", message);
    } else {
      this.#report(token.line, " at '" + token.lexeme + "'", message);
    }
  }

  static #report(line, where, message) {
    console.error("[line " + line + "] Error" + where + ": " + message);
    this.hadError = true;
  }

  static runtimeError(error) {
    this.hadRuntimeError = true;

    return new RuntimeError(error);
  }
}

const lox = new Lox();