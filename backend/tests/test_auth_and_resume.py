import sys
import unittest
import uuid
from pathlib import Path
from fastapi.testclient import TestClient

sys.path.append(str(Path(__file__).parent.parent))

from app.main import app

class TestAuthAndAPI(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_auth_flow(self):
        uid = str(uuid.uuid4())[:8]
        username = f"user_{uid}"
        email = f"user_{uid}@example.com"
        password = "password123"

        # Register
        reg_resp = self.client.post("/api/v1/auth/register", json={
            "username": username,
            "email": email,
            "password": password
        })
        self.assertEqual(reg_resp.status_code, 200)
        self.assertEqual(reg_resp.json()["username"], username)

        # Login
        login_resp = self.client.post("/api/v1/auth/token", data={
            "username": username,
            "password": password
        })
        self.assertEqual(login_resp.status_code, 200)
        token = login_resp.json()["access_token"]

        # Fetch Me
        me_resp = self.client.get("/api/v1/auth/me", headers={
            "Authorization": f"Bearer {token}"
        })
        self.assertEqual(me_resp.status_code, 200)
        self.assertEqual(me_resp.json()["username"], username)

    def test_coding_evaluation(self):
        uid = str(uuid.uuid4())[:8]
        username = f"coder_{uid}"
        login_resp = self.client.post("/api/v1/auth/register", json={
            "username": username,
            "email": f"{username}@example.com",
            "password": "pass"
        })
        token_resp = self.client.post("/api/v1/auth/token", data={
            "username": username,
            "password": "pass"
        })
        token = token_resp.json()["access_token"]

        eval_resp = self.client.post("/api/v1/coding/evaluate", json={
            "language": "python",
            "problem_statement": "Two Sum",
            "code": "def two_sum(nums, target): return []"
        }, headers={"Authorization": f"Bearer {token}"})

        self.assertEqual(eval_resp.status_code, 200)
        eval_data = eval_resp.json()
        self.assertIn("score", eval_data)
        self.assertIn("verdict", eval_data)

if __name__ == "__main__":
    unittest.main()
