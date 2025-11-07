from fastapi.testclient import TestClient
import urllib.parse

from src.app import app

client = TestClient(app)


def test_get_activities():
    res = client.get("/activities")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, dict)
    # sanity check: known activity exists
    assert "Chess Club" in data


def test_signup_and_unregister_flow():
    activity = "Chess Club"
    email = "testuser@example.com"

    # ensure clean state by removing if present
    client.delete(f"/activities/{urllib.parse.quote(activity)}/participants?email={urllib.parse.quote(email)}")

    # signup
    res = client.post(f"/activities/{urllib.parse.quote(activity)}/signup?email={urllib.parse.quote(email)}")
    assert res.status_code == 200
    assert "Signed up" in res.json().get("message", "")

    # verify participant present
    res = client.get("/activities")
    assert email in res.json()[activity]["participants"]

    # unregister
    res = client.delete(f"/activities/{urllib.parse.quote(activity)}/participants?email={urllib.parse.quote(email)}")
    assert res.status_code == 200
    assert "Unregistered" in res.json().get("message", "")

    # verify removed
    res = client.get("/activities")
    assert email not in res.json()[activity]["participants"]


def test_signup_duplicate_returns_400():
    activity = "Chess Club"
    email = "dup@example.com"

    # cleanup
    client.delete(f"/activities/{urllib.parse.quote(activity)}/participants?email={urllib.parse.quote(email)}")

    # first signup should succeed
    res1 = client.post(f"/activities/{urllib.parse.quote(activity)}/signup?email={urllib.parse.quote(email)}")
    assert res1.status_code == 200

    # second signup should fail with 400
    res2 = client.post(f"/activities/{urllib.parse.quote(activity)}/signup?email={urllib.parse.quote(email)}")
    assert res2.status_code == 400

    # cleanup
    client.delete(f"/activities/{urllib.parse.quote(activity)}/participants?email={urllib.parse.quote(email)}")
