import sys
import unittest
import uuid
from pathlib import Path
from fastapi.testclient import TestClient

sys.path.append(str(Path(__file__).parent.parent))

from app.main import app

class TestMockInterviewFeatures(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        # Register and login test user
        uid = str(uuid.uuid4())[:8]
        self.username = f"interview_user_{uid}"
        self.email = f"{self.username}@example.com"
        self.password = "pass123"

        self.client.post("/api/v1/auth/register", json={
            "username": self.username,
            "email": self.email,
            "password": self.password
        })

        login_res = self.client.post("/api/v1/auth/token", data={
            "username": self.username,
            "password": self.password
        })
        self.token = login_res.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}

    def test_custom_question_bank_and_hint(self):
        custom_qs = [
            "Explain Java Garbage Collection and memory management.",
            "How does Spring Boot auto-configuration work?"
        ]

        # 1. Start Interview Session with Custom Questions
        start_res = self.client.post("/api/v1/interview/start", headers=self.headers, json={
            "type": "Technical",
            "role": "Java Developer",
            "difficulty": "Hard",
            "round": "Technical Round 1",
            "mode": "custom_questions",
            "custom_questions": custom_qs
        })
        self.assertEqual(start_res.status_code, 200)
        session_data = start_res.json()
        session_id = session_data["id"]
        self.assertEqual(len(session_data["messages"]), 1)
        self.assertEqual(session_data["messages"][0]["text"], custom_qs[0])

        # 2. Request AI Hint for the current question
        hint_res = self.client.post(f"/api/v1/interview/{session_id}/hint", headers=self.headers, json={
            "question": custom_qs[0],
            "user_draft": "Java memory is divided into Heap and Heap Stack."
        })
        self.assertEqual(hint_res.status_code, 200)
        hint_json = hint_res.json()
        self.assertIn("hint", hint_json)
        self.assertIsInstance(hint_json.get("key_concepts"), list)

        # 3. Send Answer and verify next question from custom queue
        msg_res = self.client.post(f"/api/v1/interview/{session_id}/message", headers=self.headers, json={
            "text": "Java Garbage Collection uses Young and Old generation heaps. Minor GC cleans Young gen and Major GC cleans Old gen."
        })
        self.assertEqual(msg_res.status_code, 200)

        # Fetch session to check updated messages
        session_res = self.client.get(f"/api/v1/interview/{session_id}", headers=self.headers)
        updated_msgs = session_res.json()["messages"]
        # Should have 3 messages: [AI Q1, User Answer 1, AI Q2]
        self.assertGreaterEqual(len(updated_msgs), 3)
        self.assertEqual(updated_msgs[2]["text"], custom_qs[1])
