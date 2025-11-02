"""
Test script for Rice Disease Detection API
"""
import requests
import sys
import os

# Configuration
API_URL = os.getenv('API_URL', 'http://localhost:5000')

def test_health():
    """Test health check endpoint"""
    print("🔍 Testing health check...")
    try:
        response = requests.get(f"{API_URL}/health")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_info():
    """Test API info endpoint"""
    print("\n🔍 Testing API info...")
    try:
        response = requests.get(f"{API_URL}/")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_predict(image_path):
    """Test prediction endpoint"""
    print(f"\n🔍 Testing prediction with image: {image_path}")
    
    if not os.path.exists(image_path):
        print(f"❌ Image file not found: {image_path}")
        return False
    
    try:
        with open(image_path, 'rb') as f:
            files = {'image': f}
            response = requests.post(f"{API_URL}/predict", files=files, timeout=30)
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Prediction successful!")
            print(f"   Class: {result['prediction']['classVi']}")
            print(f"   Confidence: {result['prediction']['confidence']:.2f}%")
            print(f"   All predictions:")
            for cls, conf in result['prediction']['allPredictions'].items():
                print(f"      - {cls}: {conf:.2f}%")
            return True
        else:
            print(f"❌ Error: {response.json()}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def main():
    """Run all tests"""
    print("=" * 60)
    print("🌾 Rice Disease Detection API - Test Suite")
    print("=" * 60)
    print(f"API URL: {API_URL}\n")
    
    # Test health
    health_ok = test_health()
    
    # Test info
    info_ok = test_info()
    
    # Test prediction (if image provided)
    predict_ok = True
    if len(sys.argv) > 1:
        image_path = sys.argv[1]
        predict_ok = test_predict(image_path)
    else:
        print("\n⚠️  No image provided, skipping prediction test")
        print("   Usage: python test_api.py <image_path>")
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 Test Results:")
    print(f"   Health Check: {'✅ PASS' if health_ok else '❌ FAIL'}")
    print(f"   API Info: {'✅ PASS' if info_ok else '❌ FAIL'}")
    if len(sys.argv) > 1:
        print(f"   Prediction: {'✅ PASS' if predict_ok else '❌ FAIL'}")
    print("=" * 60)
    
    # Exit code
    all_pass = health_ok and info_ok and predict_ok
    sys.exit(0 if all_pass else 1)

if __name__ == '__main__':
    main()

