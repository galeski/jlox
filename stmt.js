class Stmt {
  accept(visitor) { }
}

class Expression extends Stmt {
  constructor(expr) {
    super();
    this.expression = expr;
  }

  accept(visitor) {
    return visitor.visitExpressionStmt(this);
  }
}

class Print extends Stmt {
  constructor(expr) {
    super();
    this.expression = expr;
  }

  accept(visitor) {
    return visitor.visitPrintStmt(this);
  }
}

class StmtVisitor {
  visitExpressionStmt(expr) { }
  visitPrintStmt(expr) { }
}

module.exports = {
  Stmt,
  Expression,
  Print,
  StmtVisitor
}