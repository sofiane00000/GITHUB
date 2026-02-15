"""
Test ENT API endpoints for Papillon ENT Aggregator
Tests: /api/ents endpoint, ENT list validation, ENT78 presence
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL')

class TestENTsAPI:
    """Tests for /api/ents endpoint"""
    
    def test_ents_endpoint_returns_200(self):
        """API should return 200 status"""
        response = requests.get(f"{BASE_URL}/api/ents")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ /api/ents returns 200 OK")
    
    def test_ents_returns_43_ents(self):
        """API should return exactly 43 ENTs as expected"""
        response = requests.get(f"{BASE_URL}/api/ents")
        data = response.json()
        
        assert "ents" in data, "Response should contain 'ents' key"
        ent_count = len(data["ents"])
        assert ent_count == 43, f"Expected 43 ENTs, got {ent_count}"
        print(f"✓ /api/ents returns {ent_count} ENTs")
    
    def test_ent78_present(self):
        """ENT78 (Yvelines / e-Collège 78) should be present"""
        response = requests.get(f"{BASE_URL}/api/ents")
        data = response.json()
        
        ent78 = next((e for e in data["ents"] if e["id"] == "ent_ecollege78"), None)
        
        assert ent78 is not None, "ENT78 (ent_ecollege78) should be present"
        assert "78" in ent78["name"] or "Yvelines" in ent78["name"], "ENT78 name should contain '78' or 'Yvelines'"
        assert ent78["requires_url"] == False, "ENT78 should not require URL (requires_url: false)"
        
        print(f"✓ ENT78 found: {ent78}")
    
    def test_direct_connection_requires_url(self):
        """Direct connection (sans ENT) should require URL"""
        response = requests.get(f"{BASE_URL}/api/ents")
        data = response.json()
        
        direct = next((e for e in data["ents"] if e["id"] == "direct"), None)
        
        assert direct is not None, "'direct' ENT should be present"
        assert direct["requires_url"] == True, "Direct connection should require URL"
        
        print(f"✓ Direct connection requires URL: {direct}")
    
    def test_all_non_direct_ents_dont_require_url(self):
        """All ENTs except 'direct' should not require URL"""
        response = requests.get(f"{BASE_URL}/api/ents")
        data = response.json()
        
        non_direct_with_url = [
            e for e in data["ents"] 
            if e["id"] != "direct" and e.get("requires_url", False) == True
        ]
        
        assert len(non_direct_with_url) == 0, f"Non-direct ENTs should not require URL: {non_direct_with_url}"
        print("✓ All non-direct ENTs do not require URL")
    
    def test_ent_structure(self):
        """Each ENT should have required fields"""
        response = requests.get(f"{BASE_URL}/api/ents")
        data = response.json()
        
        for ent in data["ents"]:
            assert "id" in ent, f"ENT missing 'id': {ent}"
            assert "name" in ent, f"ENT missing 'name': {ent}"
            assert "requires_url" in ent, f"ENT missing 'requires_url': {ent}"
            assert isinstance(ent["id"], str), f"ENT id should be string: {ent}"
            assert isinstance(ent["name"], str), f"ENT name should be string: {ent}"
            assert isinstance(ent["requires_url"], bool), f"ENT requires_url should be boolean: {ent}"
        
        print("✓ All ENTs have correct structure (id, name, requires_url)")


class TestAuthAPI:
    """Tests for /api/auth/login endpoint structure"""
    
    def test_login_missing_url_for_direct(self):
        """Login with direct connection without URL should return 400"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "provider": "pronote",
                "username": "test_user",
                "password": "test_pass",
                "ent_id": "direct",
                "pronote_url": None
            }
        )
        
        # Should return 400 (Bad Request) because URL is required for direct
        assert response.status_code == 400, f"Expected 400 for direct without URL, got {response.status_code}"
        print("✓ Direct connection without URL returns 400")
    
    def test_login_with_ent_no_url_required(self):
        """Login with ENT (not direct) should not require URL - will fail auth but not 400"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "provider": "pronote",
                "username": "fake_user",
                "password": "fake_pass",
                "ent_id": "ent_ecollege78",  # ENT78
                "pronote_url": None
            }
        )
        
        # Should NOT return 400 (might return 401 for invalid credentials)
        # The important thing is it doesn't require URL
        assert response.status_code != 400, f"ENT login should not return 400 for missing URL"
        print(f"✓ ENT78 login does not require URL (status: {response.status_code})")
    
    def test_ecoledirecte_login_structure(self):
        """EcoleDirecte login should work without ENT selection"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "provider": "ecoledirecte",
                "username": "fake_user",
                "password": "fake_pass"
            }
        )
        
        # Should not return 400 or 422 (validation error)
        assert response.status_code not in [400, 422], f"EcoleDirecte login should accept basic credentials, got {response.status_code}"
        print(f"✓ EcoleDirecte login structure valid (status: {response.status_code})")


class TestRootAPI:
    """Tests for root API endpoint"""
    
    def test_root_endpoint(self):
        """Root should return API info"""
        response = requests.get(f"{BASE_URL}/api/")
        
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert data["message"] == "Papillon API"
        print(f"✓ Root API: {data}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
