import copy
import pytest
from fastapi.testclient import TestClient

import src.app as app_module
from src.app import app

client = TestClient(app)

_original_activities = copy.deepcopy(app_module.activities)


@pytest.fixture(autouse=True)
def reset_activities():
    app_module.activities.clear()
    app_module.activities.update(copy.deepcopy(_original_activities))


# ---------------------------------------------------------------------------
# GET /
# ---------------------------------------------------------------------------

def test_root_redirects_to_index():
    # Arrange — no pre-conditions needed

    # Act
    response = client.get("/", follow_redirects=False)

    # Assert
    assert response.status_code == 307
    assert response.headers["location"] == "/static/index.html"


# ---------------------------------------------------------------------------
# GET /activities
# ---------------------------------------------------------------------------

def test_get_activities_returns_all_activities():
    # Arrange
    expected_activities = [
        "Chess Club",
        "Soccer Club",
        "Basketball Club",
        "Programming Class",
        "Art Club",
        "Drama Club",
        "Debate Club",
        "Robotics Club",
        "Gym Class",
    ]

    # Act
    response = client.get("/activities")

    # Assert
    assert response.status_code == 200
    data = response.json()
    for name in expected_activities:
        assert name in data


def test_get_activities_each_has_required_fields():
    # Arrange — no pre-conditions needed

    # Act
    response = client.get("/activities")

    # Assert
    data = response.json()
    for activity in data.values():
        assert "description" in activity
        assert "schedule" in activity
        assert "max_participants" in activity
        assert "participants" in activity


# ---------------------------------------------------------------------------
# POST /activities/{activity_name}/signup
# ---------------------------------------------------------------------------

def test_signup_adds_participant():
    # Arrange
    activity_name = "Chess Club"
    new_email = "newstudent@mergington.edu"

    # Act
    response = client.post(f"/activities/{activity_name}/signup?email={new_email}")

    # Assert
    assert response.status_code == 200
    assert new_email in app_module.activities[activity_name]["participants"]


def test_signup_returns_confirmation_message():
    # Arrange
    activity_name = "Art Club"
    new_email = "artist@mergington.edu"

    # Act
    response = client.post(f"/activities/{activity_name}/signup?email={new_email}")

    # Assert
    assert response.status_code == 200
    assert "message" in response.json()


def test_signup_duplicate_returns_400():
    # Arrange — michael is already enrolled in Chess Club
    activity_name = "Chess Club"
    existing_email = "michael@mergington.edu"

    # Act
    response = client.post(f"/activities/{activity_name}/signup?email={existing_email}")

    # Assert
    assert response.status_code == 400
    assert response.json()["detail"] == "Student already signed up for this activity"


def test_signup_unknown_activity_returns_404():
    # Arrange
    activity_name = "Nonexistent Club"
    email = "student@mergington.edu"

    # Act
    response = client.post(f"/activities/{activity_name}/signup?email={email}")

    # Assert
    assert response.status_code == 404
    assert response.json()["detail"] == "Activity not found"


# ---------------------------------------------------------------------------
# DELETE /activities/{activity_name}/participants/{email}
# ---------------------------------------------------------------------------

def test_remove_participant_succeeds():
    # Arrange — michael is enrolled in Chess Club
    activity_name = "Chess Club"
    email = "michael@mergington.edu"

    # Act
    response = client.delete(f"/activities/{activity_name}/participants/{email}")

    # Assert
    assert response.status_code == 200
    assert email not in app_module.activities[activity_name]["participants"]


def test_remove_participant_returns_confirmation_message():
    # Arrange
    activity_name = "Soccer Club"
    email = "liam@mergington.edu"

    # Act
    response = client.delete(f"/activities/{activity_name}/participants/{email}")

    # Assert
    assert response.status_code == 200
    assert "message" in response.json()


def test_remove_participant_unknown_activity_returns_404():
    # Arrange
    activity_name = "Nonexistent Club"
    email = "student@mergington.edu"

    # Act
    response = client.delete(f"/activities/{activity_name}/participants/{email}")

    # Assert
    assert response.status_code == 404
    assert response.json()["detail"] == "Activity not found"


def test_remove_participant_not_enrolled_returns_404():
    # Arrange — email is not in Chess Club
    activity_name = "Chess Club"
    email = "notamember@mergington.edu"

    # Act
    response = client.delete(f"/activities/{activity_name}/participants/{email}")

    # Assert
    assert response.status_code == 404
    assert response.json()["detail"] == "Participant not found in this activity"
