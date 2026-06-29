from fastapi.testclient import TestClient
from app.main import app


USER_ID = "00000000-0000-0000-0000-000000000001"


def main():
    client = TestClient(app)
    payload = {
        "user_id": USER_ID,
        "name": "Teste Cofrinho",
        "description": "Validacao automatica",
        "initial_amount": 1000,
        "monthly_contribution": 300,
        "interest_type": "compound",
        "interest_rate": 0.85,
        "interest_period": "monthly",
        "start_month": "2026-06",
        "end_month": None,
    }

    checks = [
        ("GET investments", client.get("/api/savings/investments", params={"user_id": USER_ID})),
        ("POST investment", client.post("/api/savings/investments", json=payload)),
    ]
    investment_id = checks[-1][1].json().get("id") if checks[-1][1].status_code < 400 else None
    checks.extend([
        ("GET dashboard", client.get("/api/savings/dashboard", params={"user_id": USER_ID, "months": 12})),
        ("GET projection", client.get("/api/savings/projection", params={"user_id": USER_ID, "months": 12})),
    ])
    if investment_id:
        checks.append(("DELETE investment", client.delete(f"/api/savings/investments/{investment_id}")))

    for label, response in checks:
        print(label, response.status_code, response.text[:180])


if __name__ == "__main__":
    main()
