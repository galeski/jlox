const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');

// console.log(process.argv);
const args = process.argv.slice(2);

// TODO: eeee....
const hadError;

const runFile = async (filePath) => {
  try {
    const data = await fs.readFile(path.resolve(filePath), 'utf8');
    run(data);
  } catch (error) {
    console.error('Error reading file:', error);
  }
}

const runPrompt = () => {
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
    run(line);
    rl.prompt();
  });

  rl.on('close', () => {
    console.log('Exiting...');
    process.exit(0);
  });
}


const run = (source) => { 
  const scanner = new Scanner(source);
  const tokens = scanner.scanTokens();

  for (let token of tokens) {
    console.log(token);
  }
};

const error = (line, message) => {
  report(line, "", message);
}

const report = (line, where, message) => {
  console.error("[line" + line + "] Error" + where + ": " + message);
  hadError = false;
}

const lox = () => {
  if (args.length > 1) {
    console.log("Usage: jlox [script]");
  } else if (args.length === 1) {
    runFile(args[2]);
  } else {
    runPrompt();
  }
}
lox();