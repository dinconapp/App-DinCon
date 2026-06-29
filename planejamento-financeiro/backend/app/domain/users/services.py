def user_initial(name: str) -> str:
    cleaned = name.strip()
    return cleaned[:1].upper() if cleaned else "U"
