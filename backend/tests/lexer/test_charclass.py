import pytest

from app.lexer.charclass import classify


@pytest.mark.parametrize("ch,cls", [
    ("a", "letter"), ("Z", "letter"), ("_", "letter"), ("\u00e9", "letter"),
    ("\u0430", "letter"),                       # Cyrillic a: a letter, looks like Latin 'a'
    ("0", "digit"), ("9", "digit"),
    ("\u0663", "other"),                        # Arabic-Indic digit: NOT a Mini-C++ digit
    ("+", "plus"), ("{", "lbrace"), (";", "semi"), (".", "dot"), ("'", "quote"),
    ("\\", "backslash"),
    (" ", "space"), ("\t", "space"), ("\n", "newline"), ("\r", "newline"),
    ("@", "other"), ("#", "other"), ("\u200b", "other"), ("\U0001F600", "other")
    ]
)

def test_classify(ch, cls):
    assert classify(ch) == cls