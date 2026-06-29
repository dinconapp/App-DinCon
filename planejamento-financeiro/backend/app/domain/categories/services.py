import unicodedata


def ensure_category_type(category, expected_type: str) -> None:
    if category and category.type != expected_type:
        raise ValueError("Categoria incompativel com o tipo informado.")


def normalize_category_name(name: str | None) -> str:
    value = (name or "").strip().lower()
    normalized = unicodedata.normalize("NFKD", value)
    return "".join(char for char in normalized if not unicodedata.combining(char))
