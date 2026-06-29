from datetime import date

MESES = ["Janeiro", "Fevereiro", "Marco", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]
MES_CURTO = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]


def month_label(month_key: str) -> str:
    year, month = month_key.split("-")
    return f"{MESES[int(month) - 1]} {year}"


def month_short(month_key: str) -> str:
    year, month = month_key.split("-")
    return f"{MES_CURTO[int(month) - 1]}/{year[-2:]}"


def current_month_key() -> str:
    today = date.today()
    return f"{today.year}-{today.month:02d}"


def shift_month(month_key: str, delta: int) -> str:
    year, month = [int(x) for x in month_key.split("-")]
    index = year * 12 + month - 1 + delta
    return f"{index // 12}-{index % 12 + 1:02d}"


def month_in_range(month_key: str, start_month: str | None, end_month: str | None) -> bool:
    if start_month and month_key < start_month:
        return False
    if end_month and month_key > end_month:
        return False
    return True


def date_range_for_month(month_key: str) -> tuple[date, date]:
    start = date.fromisoformat(f"{month_key}-01")
    next_month = date.fromisoformat(f"{shift_month(month_key, 1)}-01")
    return start, next_month


def due_date(month_key: str, due_day: int | None) -> date:
    day = max(1, min(int(due_day or 1), 28))
    return date.fromisoformat(f"{month_key}-{day:02d}")
