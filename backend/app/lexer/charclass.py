# label every character with a class for the lexer to use

SYMBOL_CLASSES = {
    "+": "plus", "-": "minus", "*": "star", "/": "slash", "%": "percent",
    "=": "eq", "!": "bang", "<": "lt", ">": "gt", "&": "amp", "|": "pipe",
    "(": "lparen", ")": "rparen", "{": "lbrace", "}": "rbrace", ";": "semi",
    ".": "dot", "'": "quote", "\\": "backslash"
}

def classify(ch: str) -> str:
    if ch in SYMBOL_CLASSES:
        return SYMBOL_CLASSES[ch]
    
    if ch.isalpha() or ch == "_":
        return "letter"
    
    if ch in "0123456789":
        return "digit"
    
    if ch in "\t" or ch == " ":
        return "space"
    
    if ch in "\r\n":
        return "newline"
    
    return "other"