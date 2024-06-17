const { Token, Keywords, TokenType } = require('./token.js');

class Scanner {
  // source;
  #tokens = [];
  #start = 0;
  #current = 0;
  #line = 1;

  constructor(source) {
    this.source = source;
  }

  scanTokens() {
    while (!this.isAtEnd()) {
      this.#start = this.#current;
      this.scanToken();
    }

    this.#tokens.push(new Token(TokenType.EOF, "", null, this.#line))
    return this.#tokens;
  }

  scanToken() {
    let c = this.advance();

    switch (c) {
      case '(': this.addToken(TokenType.LEFT_PAREN); break;
      case ')': this.addToken(TokenType.RIGHT_PAREN); break;
      case '{': this.addToken(TokenType.LEFT_BRACE); break;
      case '}': this.addToken(TokenType.RIGHT_BRACE); break;
      case ',': this.addToken(TokenType.COMMA); break;
      case '.': this.addToken(TokenType.DOT); break;
      case '-': this.addToken(TokenType.MINUS); break;
      case '+': this.addToken(TokenType.PLUS); break;
      case ';': this.addToken(TokenType.SEMICOLON); break;
      case '*': this.addToken(TokenType.STAR); break;

      case '!':
        this.addToken(this.match('=') ? TokenType.BANG_EQUAL : TokenType.BANG);
        break;
      case '=':
        this.addToken(this.match('=') ? TokenType.EQUAL_EQUAL : TokenType.EQUAL);
        break;
      case '<':
        this.addToken(this.match('=') ? TokenType.LESS_EQUAL : TokenType.LESS);
        break;
      case '>':
        this.addToken(this.match('=') ? TokenType.GREATER_EQUAL : TokenType.GREATER);
        break;

      // Special case:
      // We need to take into account that division "/"
      // differs from "//" ie. comment.
      case '/':
        if (match('/')) {
          // A comment goes until the end of the line.
          while (this.peek() != '\n' && !this.isAtEnd()) this.advance();
        } else {
          this.addToken(TokenType.SLASH);
        }
        break;

      // Ignore whitespace.
      case ' ':
      case '\r':
      case '\t':
        break;

      case '\n':
        this.#line++;
        break;

      // String literals.
      case '"': this.string(); break;

      // Keywords and identifiers,
      // numbers and fractional numbers
      // and error otherwise.
      default:
        if (this.isDigit(c)) {
          this.number();
        } else if (this.isAlpha(c)) {
          this.identifier();
        } else {
          Lox.error(this.#line, "Unexpected character.");
        }
        break;
    }
  }

  isAtEnd() {
    return this.#current >= this.source.length;
  }

  // according to the book, this is for data input
  advance() {
    return this.source.charAt(this.#current++);
  }

  // and this is for output
  addToken(type, literal = null) {
    const text = this.source.substring(this.#start, this.#current);
    this.#tokens.push(new Token(type, text, literal, this.#line));
  }

  match(expected) {
    if (this.isAtEnd()) return false;
    if (this.source.charAt(this.#current) !== expected) return false;

    this.#current++;
    return true;
  }

  peek() {
    if (this.isAtEnd()) return '\0';
    return this.source.charAt(this.#current);
  }

  peekNext() {
    if (this.#current + 1 >= this.source.length) return '\0';
    return this.source.charAt(this.#current + 1);
  }

  string() {
    while (this.peek() !== '"' && !this.isAtEnd()) {
      if (this.peek() === "\n") line++;
      this.advance();
    }

    if (this.isAtEnd()) {
      Lox.error(this.#line, "Unterminated string.");
      return;
    }

    // we have "
    this.advance();

    const value = this.source.substring(this.#start + 1, this.#current - 1);
    this.addToken(TokenType.STRING, value);
  }

  isDigit(c) {
    return c >= '0' && c <= '9';
  }

  number() {
    while (this.isDigit(this.peek())) this.advance();

    // Look for a fractional part.
    if (this.peek() === '.' && this.isDigit(this.peekNext())) {
      // Consume the "."
      this.advance();

      while (this.isDigit(this.peek())) this.advance();
    }

    this.addToken(TokenType.NUMBER,
      parseFloat(this.source.substring(this.#start, this.#current)));
  }

  identifier() {
    while (this.isAlphaNumeric(this.peek())) this.advance();

    const text = this.source.substring(this.#start, this.#current);

    // TODO: see if this is correct
    let type = Keywords[text]
      ? Keywords[text]
      : TokenType.IDENTIFIER;

    this.addToken(type);
  }

  isAlpha(c) {
    return (c >= 'a' && c <= 'z') ||
      (c >= 'A' && c <= 'Z') ||
      c === '_';
  }

  isAlphaNumeric(c) {
    return this.isAlpha(c) || this.isDigit(c);
  }
}

module.exports = { Scanner };