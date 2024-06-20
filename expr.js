class Expr {
  accept(visitor) { }
}

class ExprBinary extends Expr {
  constructor(left, operator, right) {
    super();
    this.left = left;
    this.operator = operator;
    this.right = right;
  }

  accept(visitor) {
    return visitor.visitBinaryExpr(this);
  }
}

class ExprUnary extends Expr {
  constructor(operator, right) {
    super();
    this.operator = operator;
    this.right = right;
  }

  accept(visitor) {
    return visitor.visitUnaryExpr(this);
  }
}

class ExprLiteral extends Expr {
  constructor(value) {
    super();
    this.value = value;
  }

  accept(visitor) {
    return visitor.visitLiteralExpr(this);
  }
}

class ExprGrouping extends Expr {
  constructor(expression) {
    super();
    this.expression = expression;
  }

  accept(visitor) {
    return visitor.visitGroupingExpr(this);
  }
}

// Extend for statements
class Expression extends Expr {
  constructor(expr) {
    super();
    this.expression = expr;
  }

  accept(visitor) {
    return visitor.visitExpressionStmt(this);
  }
}

class Print extends Expr {
  constructor(expr) {
    super();
    this.expression = expr;
  }

  accept(visitor) {
    return visitor.visitPrintStmt(this);
  }
}

// an "interface" for visitor class
class ExprVisitor {
  // Expressions
  visitBinaryExpr(expr) { }
  visitUnaryExpr(expr) { }
  visitLiteralExpr(expr) { }
  visitGroupingExpr(expr) { }

  // Statements
  visitExpressionStmt(expr) { }
  visitPrintStmt(expr) { }
}

class AstPrinter extends ExprVisitor {
  print(expr) {
    return expr !== undefined
      ? expr.accept(this)
      : console.log("Received undefined, have you properly terminated statement?");
  }

  visitBinaryExpr(expr) {
    return this.parenthesize(expr.operator.lexeme, expr.left, expr.right);
  }

  visitUnaryExpr(expr) {
    return this.parenthesize(expr.operator.lexeme, expr.right);
  }

  visitLiteralExpr(expr) {
    if (expr.value == null) return "nil";
    return expr.value.toString();
  }

  visitGroupingExpr(expr) {
    return this.parenthesize("group", expr.expression);
  }

  parenthesize(name, ...exprs) {
    let builder = [];
    builder.push("(");
    builder.push(name);
    for (let expr of exprs) {
      builder.push(" ");
      builder.push((expr?.accept(this)) ?? "null");
    }
    builder.push(")");
    return builder.join("");
  }
}

module.exports = {
  Expr,
  ExprBinary,
  ExprGrouping,
  ExprLiteral,
  ExprUnary,
  ExprVisitor,
  AstPrinter,

  Expression,
  Print
}