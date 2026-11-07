"""
Defines the Mini-C++ context-free grammar used for
FIRST/FOLLOW computation and LL(1) grammar analysis.
"""

START_SYMBOL = "Program"

GRAMMAR: dict[str, list[list[str]]] = {

    # Program structure
    "Program": [
        ["KW_INT", "IDENTIFIER", "LPAREN", "RPAREN", "Block", "EOF"]
    ],
    "Block": [
        ["LBRACE", "StmtList", "RBRACE"]
    ],
    "StmtList": [
        ["Stmt", "StmtList"],
        []
    ],

    # Statements
    "Stmt": [
        ["Decl", "SEMI"],
        ["Assign", "SEMI"],
        ["IfStmt"],
        ["WhileStmt"],
        ["ForStmt"],
        ["ReturnStmt"],
        ["Block"],
        ["SEMI"]
    ],

    # Declarations
    "Decl": [
        ["Type", "IDENTIFIER", "DeclInit"]
    ],
    "DeclInit": [
        ["ASSIGN", "Expr"],
        []
    ],
    "Type": [
        ["KW_INT"],
        ["KW_FLOAT"],
        ["KW_BOOL"],
        ["KW_CHAR"]
    ],

    # Assignment
    "Assign": [
        ["IDENTIFIER", "ASSIGN", "Expr"]
    ],

    # Conditional statements
    "IfStmt": [
        ["KW_IF", "LPAREN", "Expr", "RPAREN", "Stmt", "ElsePart"]
    ],
    "ElsePart": [
        ["KW_ELSE", "Stmt"],
        []
    ],

    # While loop
    "WhileStmt": [
        ["KW_WHILE", "LPAREN", "Expr", "RPAREN", "Stmt"]
    ],

        # For loop
    "ForStmt": [
        ["KW_FOR", "LPAREN", "ForInit", "SEMI",
         "ForCond", "SEMI", "ForStep", "RPAREN", "Stmt"]
    ],
    "ForInit": [
        ["Decl"],
        ["Assign"],
        []
    ],
    "ForCond": [
        ["Expr"],
        []
    ],
    "ForStep": [
        ["Assign"],
        []
    ],

        # Return statement
    "ReturnStmt": [
        ["KW_RETURN", "ReturnVal", "SEMI"]
    ],
    "ReturnVal": [
        ["Expr"],
        []
    ],

        # Logical and comparison expressions
    "Expr": [
        ["OrExpr"]
    ],

    "OrExpr": [
        ["AndExpr", "OrTail"]
    ],
    "OrTail": [
        ["OR", "AndExpr", "OrTail"],
        []
    ],

    "AndExpr": [
        ["EqExpr", "AndTail"]
    ],
    "AndTail": [
        ["AND", "EqExpr", "AndTail"],
        []
    ],

    "EqExpr": [
        ["RelExpr", "EqTail"]
    ],
    "EqTail": [
        ["EqOp", "RelExpr", "EqTail"],
        []
    ],
    "EqOp": [
        ["EQ"],
        ["NEQ"]
    ],

    "RelExpr": [
        ["AddExpr", "RelTail"]
    ],
    "RelTail": [
        ["RelOp", "AddExpr", "RelTail"],
        []
    ],
    "RelOp": [
        ["LT"],
        ["GT"],
        ["LE"],
        ["GE"]
    ],

        # Arithmetic expressions
    "AddExpr": [
        ["MulExpr", "AddTail"]
    ],
    "AddTail": [
        ["AddOp", "MulExpr", "AddTail"],
        []
    ],
    "AddOp": [
        ["PLUS"],
        ["MINUS"]
    ],

    "MulExpr": [
        ["Unary", "MulTail"]
    ],
    "MulTail": [
        ["MulOp", "Unary", "MulTail"],
        []
    ],
    "MulOp": [
        ["STAR"],
        ["SLASH"],
        ["PERCENT"]
    ],

    # Unary and primary expressions
    "Unary": [
        ["NOT", "Unary"],
        ["MINUS", "Unary"],
        ["Primary"]
    ],
    "Primary": [
        ["IDENTIFIER"],
        ["INT_LITERAL"],
        ["FLOAT_LITERAL"],
        ["CHAR_LITERAL"],
        ["KW_TRUE"],
        ["KW_FALSE"],
        ["LPAREN", "Expr", "RPAREN"]
    ],
}


def symbols_used() -> set[str]:
    return {
        sym
        for prods in GRAMMAR.values()
        for prod in prods
        for sym in prod
    }


def terminals() -> set[str]:
    return {
        s
        for s in symbols_used()
        if s.isupper()
    }


def undefined_nonterminals() -> set[str]:
    return {
        s
        for s in symbols_used()
        if not s.isupper() and s not in GRAMMAR
    }


if __name__ == "__main__":
    print(f"{len(GRAMMAR)} non-terminals defined, {len(terminals())} terminals used")

    missing = sorted(undefined_nonterminals())

    print(
        "Still to define:",
        ", ".join(missing) if missing else "nothing, grammar is complete"
    )
