#!/usr/bin/env python3

import requests
import sys
import json
import asyncio
from datetime import datetime, timedelta

class PapillonAPITester:
    def __init__(self, base_url="https://interactive-platform-5.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.user_data = {
            "email": f"test_student_{datetime.now().strftime('%H%M%S')}@papillon.test",
            "password": "TestPass123!",
            "first_name": "Jean",
            "last_name": "Testeur",
            "role": "student",
            "class_id": "class-6a"
        }

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return True, response.json() if response.content else {}
                except:
                    return True, {"raw_response": response.text}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_api_root(self):
        """Test API root endpoint"""
        success, response = self.run_test("API Root", "GET", "", 200)
        return success and "Papillon ENT" in str(response.get("message", ""))

    def test_seed_data(self):
        """Test seeding demo data"""
        print("\n📦 Seeding demo data...")
        success, _ = self.run_test("Seed Demo Data", "POST", "seed", 200)
        return success

    def test_register(self):
        """Test user registration"""
        success, response = self.run_test(
            "User Registration",
            "POST", 
            "auth/register",
            200,  # Registration typically returns 200 with token
            data=self.user_data
        )
        
        if success:
            self.token = response.get('token')
            user = response.get('user', {})
            self.user_id = user.get('id')
            print(f"   ✓ Token received: {self.token is not None}")
            print(f"   ✓ User ID: {self.user_id}")
            return True
        return False

    def test_login(self):
        """Test user login"""
        login_data = {
            "email": self.user_data["email"],
            "password": self.user_data["password"]
        }
        
        success, response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data=login_data
        )
        
        if success:
            self.token = response.get('token')
            user = response.get('user', {})
            self.user_id = user.get('id')
            return True
        return False

    def test_auth_me(self):
        """Test getting current user info"""
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200
        )
        
        if success:
            print(f"   ✓ User: {response.get('first_name')} {response.get('last_name')}")
            print(f"   ✓ Role: {response.get('role')}")
            return True
        return False

    def test_subjects(self):
        """Test subjects endpoint"""
        success, response = self.run_test(
            "Get Subjects",
            "GET",
            "subjects",
            200
        )
        
        if success:
            subjects = response if isinstance(response, list) else []
            print(f"   ✓ Found {len(subjects)} subjects")
            return True
        return False

    def test_classes(self):
        """Test classes endpoint"""
        success, response = self.run_test(
            "Get Classes",
            "GET",
            "classes",
            200
        )
        
        if success:
            classes = response if isinstance(response, list) else []
            print(f"   ✓ Found {len(classes)} classes")
            return True
        return False

    def test_timetable(self):
        """Test timetable endpoint"""
        success, response = self.run_test(
            "Get Timetable",
            "GET",
            "timetable",
            200
        )
        
        if success:
            slots = response if isinstance(response, list) else []
            print(f"   ✓ Found {len(slots)} timetable slots")
            return True
        return False

    def test_homework(self):
        """Test homework endpoints"""
        # Get homework
        success, response = self.run_test(
            "Get Homework (with AI prioritization)",
            "GET",
            "homework?prioritize=true",
            200
        )
        
        if success:
            homework = response if isinstance(response, list) else []
            print(f"   ✓ Found {len(homework)} homework assignments")
            return True
        return False

    def test_grades(self):
        """Test grades endpoint"""
        success, response = self.run_test(
            "Get Grades",
            "GET",
            "grades",
            200
        )
        
        if success:
            grades = response if isinstance(response, list) else []
            print(f"   ✓ Found {len(grades)} grades")
            return True
        return False

    def test_student_stats(self):
        """Test student statistics"""
        success, response = self.run_test(
            "Get Student Stats",
            "GET",
            "stats/student",
            200
        )
        
        if success:
            print(f"   ✓ Average: {response.get('average', 'N/A')}/20")
            print(f"   ✓ Homework: {response.get('homework_completed', 0)}/{response.get('homework_total', 0)}")
            print(f"   ✓ XP Points: {response.get('xp_points', 0)}")
            return True
        return False

    def test_messages(self):
        """Test messages endpoint"""
        success, response = self.run_test(
            "Get Messages",
            "GET",
            "messages",
            200
        )
        
        if success:
            messages = response if isinstance(response, list) else []
            print(f"   ✓ Found {len(messages)} messages")
            return True
        return False

    def test_resources(self):
        """Test resources endpoint"""
        success, response = self.run_test(
            "Get Resources",
            "GET",
            "resources",
            200
        )
        
        if success:
            resources = response if isinstance(response, list) else []
            print(f"   ✓ Found {len(resources)} resources")
            return True
        return False

    def test_quizzes(self):
        """Test quizzes endpoint"""
        success, response = self.run_test(
            "Get Quizzes",
            "GET",
            "quizzes",
            200
        )
        
        if success:
            quizzes = response if isinstance(response, list) else []
            print(f"   ✓ Found {len(quizzes)} quizzes")
            return True
        return False

    def test_ai_chat(self):
        """Test AI chat functionality"""
        chat_message = {
            "message": "Bonjour ! Peux-tu m'expliquer les fractions en mathématiques ?",
            "context": "L'étudiant demande de l'aide en mathématiques niveau 6ème"
        }
        
        print(f"\n🤖 Testing AI Chat...")
        print(f"   Message: {chat_message['message']}")
        
        success, response = self.run_test(
            "AI Chat Response",
            "POST",
            "ai/chat",
            200,
            data=chat_message
        )
        
        if success:
            ai_response = response.get('response', '')
            print(f"   ✓ AI Response length: {len(ai_response)} characters")
            print(f"   ✓ Response preview: {ai_response[:100]}...")
            
            # Test getting chat history
            success2, history = self.run_test(
                "Get Chat History",
                "GET",
                "ai/chat/history?limit=10",
                200
            )
            
            if success2:
                messages = history if isinstance(history, list) else []
                print(f"   ✓ Chat history: {len(messages)} messages")
            
            return success and success2
        return False

    def test_quiz_generation(self):
        """Test AI quiz generation"""
        quiz_request = {
            "subject": "Mathématiques",
            "topic": "Fractions",
            "class_level": "6eme",
            "num_questions": 3,
            "difficulty": "medium"
        }
        
        print(f"\n🧠 Testing Quiz Generation...")
        print(f"   Subject: {quiz_request['subject']}")
        print(f"   Topic: {quiz_request['topic']}")
        
        success, response = self.run_test(
            "Generate AI Quiz",
            "POST",
            "quizzes/generate",
            200,
            data=quiz_request
        )
        
        if success:
            quiz = response
            print(f"   ✓ Quiz title: {quiz.get('title', 'N/A')}")
            questions = quiz.get('questions', [])
            print(f"   ✓ Generated {len(questions)} questions")
            if questions:
                print(f"   ✓ Sample question: {questions[0].get('question', '')[:60]}...")
            return True
        return False

    def test_curriculum(self):
        """Test curriculum endpoint"""
        success, response = self.run_test(
            "Get Full Curriculum",
            "GET",
            "curriculum",
            200
        )
        
        if success:
            curriculum = response if isinstance(response, dict) else {}
            print(f"   ✓ Found curriculum for {len(curriculum)} class levels")
            return True
        return False

    def test_forum(self):
        """Test forum endpoint"""
        success, response = self.run_test(
            "Get Forum Posts",
            "GET",
            "forum",
            200
        )
        
        if success:
            posts = response if isinstance(response, list) else []
            print(f"   ✓ Found {len(posts)} forum posts")
            return True
        return False

    def test_notifications(self):
        """Test notifications endpoint"""
        success, response = self.run_test(
            "Get Notifications",
            "GET",
            "notifications",
            200
        )
        
        if success:
            notifications = response if isinstance(response, list) else []
            print(f"   ✓ Found {len(notifications)} notifications")
            return True
        return False

def main():
    print("🧪 Starting Papillon ENT API Tests")
    print("=" * 50)
    
    tester = PapillonAPITester()
    
    # Core API tests
    tests = [
        ("API Root", tester.test_api_root),
        ("Seed Demo Data", tester.test_seed_data),
        ("User Registration", tester.test_register),
        ("User Login", tester.test_login),
        ("Auth Me", tester.test_auth_me),
        ("Subjects", tester.test_subjects),
        ("Classes", tester.test_classes),
        ("Timetable", tester.test_timetable),
        ("Homework", tester.test_homework),
        ("Grades", tester.test_grades),
        ("Student Stats", tester.test_student_stats),
        ("Messages", tester.test_messages),
        ("Resources", tester.test_resources),
        ("Quizzes", tester.test_quizzes),
        ("Forum", tester.test_forum),
        ("Notifications", tester.test_notifications),
        ("Curriculum", tester.test_curriculum),
        ("AI Chat", tester.test_ai_chat),
        ("Quiz Generation", tester.test_quiz_generation),
    ]
    
    # Run all tests
    passed_tests = []
    failed_tests = []
    
    for test_name, test_func in tests:
        try:
            if test_func():
                passed_tests.append(test_name)
            else:
                failed_tests.append(test_name)
        except Exception as e:
            print(f"❌ {test_name} - Exception: {str(e)}")
            failed_tests.append(test_name)
    
    # Print results
    print(f"\n" + "="*50)
    print(f"📊 Test Results")
    print(f"📊 Tests passed: {tester.tests_passed}/{tester.tests_run}")
    print(f"📊 Success rate: {(tester.tests_passed/tester.tests_run*100):.1f}%" if tester.tests_run > 0 else "📊 No tests run")
    
    print(f"\n✅ Passed Tests ({len(passed_tests)}):")
    for test in passed_tests:
        print(f"   • {test}")
    
    if failed_tests:
        print(f"\n❌ Failed Tests ({len(failed_tests)}):")
        for test in failed_tests:
            print(f"   • {test}")
    
    return 0 if len(failed_tests) == 0 else 1

if __name__ == "__main__":
    sys.exit(main())