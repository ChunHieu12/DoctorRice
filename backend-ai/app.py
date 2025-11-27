"""
Rice Leaf Disease Detection API
Flask microservice for TFLite model inference
"""
import os
import logging
import time
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
import numpy as np
import tensorflow as tf
from tensorflow.keras.preprocessing import image
from PIL import Image
import io

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Configuration
MODEL_PATH = os.getenv('MODEL_PATH', 'model/model.tflite')
PORT = int(os.getenv('PORT', 5000))
MAX_CONTENT_LENGTH = 10 * 1024 * 1024  # 10MB max upload
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp'}

app.config['MAX_CONTENT_LENGTH'] = MAX_CONTENT_LENGTH

# Disease class mapping
CLASS_NAMES = ['bacterial_leaf_blight', 'blast', 'brown_spot', 'healthy']
CLASS_NAMES_VI = {
    'bacterial_leaf_blight': 'Bệnh cháy bìa lá',
    'blast': 'Bệnh đạo ôn',
    'brown_spot': 'Bệnh đốm nâu',
    'healthy': 'Lá khỏe mạnh'
}

# Load TFLite model
interpreter = None

def load_model():
    """Load TFLite interpreter"""
    global interpreter
    try:
        logger.info(f"Loading TFLite model from {MODEL_PATH}")
        start_time = time.time()
        interpreter = tf.lite.Interpreter(model_path=MODEL_PATH)
        interpreter.allocate_tensors()
        load_time = time.time() - start_time
        logger.info(f"✅ Model loaded successfully in {load_time:.2f}s")
        return True
    except Exception as e:
        logger.error(f"❌ Failed to load model: {str(e)}")
        return False

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def preprocess_image(img_bytes, target_size=(224, 224)):
    """
    Preprocess image for EfficientNet model
    
    Args:
        img_bytes: Image bytes from upload
        target_size: Target size for model input
        
    Returns:
        Preprocessed numpy array
    """
    try:
        start_time = time.time()
        
        # Load image from bytes
        img = Image.open(io.BytesIO(img_bytes))
        
        # Convert to RGB if needed
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        # Resize to target size
        img = img.resize(target_size, Image.LANCZOS)
        
        # Convert to numpy array
        img_array = np.array(img)
        
        # Add batch dimension
        img_array = np.expand_dims(img_array, axis=0)
        
        # Preprocess for EfficientNet
        img_array = tf.keras.applications.efficientnet.preprocess_input(img_array)
        
        preprocess_time = time.time() - start_time
        logger.info(f"⏱️ Image preprocessed in {preprocess_time:.3f}s")
        
        return img_array.astype(np.float32)
    
    except Exception as e:
        logger.error(f"Error preprocessing image: {str(e)}")
        raise

def predict_disease(img_array):
    """
    Run inference on preprocessed image
    
    Args:
        img_array: Preprocessed numpy array
        
    Returns:
        Dictionary with prediction results
    """
    try:
        if interpreter is None:
            raise Exception("Model not loaded")
        
        start_time = time.time()
        
        # Get input and output details
        input_details = interpreter.get_input_details()
        output_details = interpreter.get_output_details()
        
        # Set input tensor
        interpreter.set_tensor(input_details[0]['index'], img_array)
        
        # Run inference
        interpreter.invoke()
        
        # Get output tensor
        predictions = interpreter.get_tensor(output_details[0]['index'])
        
        inference_time = time.time() - start_time
        logger.info(f"⏱️ Inference completed in {inference_time:.3f}s")
        
        # Get prediction results
        pred_idx = np.argmax(predictions, axis=1)[0]
        pred_class = CLASS_NAMES[pred_idx]
        confidence = float(np.max(predictions)) * 100
        
        # Get all class probabilities
        all_predictions = {
            CLASS_NAMES[i]: float(predictions[0][i] * 100)
            for i in range(len(CLASS_NAMES))
        }
        
        return {
            'class': pred_class,
            'classVi': CLASS_NAMES_VI[pred_class],
            'confidence': round(confidence, 2),
            'allPredictions': all_predictions
        }
        
    except Exception as e:
        logger.error(f"Error during prediction: {str(e)}")
        raise

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model_loaded': interpreter is not None,
        'service': 'rice-disease-detection'
    }), 200

@app.route('/predict', methods=['POST'])
def predict():
    """
    Predict rice leaf disease from uploaded image
    
    Expected form-data:
        - image: Image file
        
    Returns:
        JSON with prediction results
    """
    total_start_time = time.time()
    
    try:
        # Check if image file is present
        if 'image' not in request.files:
            return jsonify({
                'error': 'No image file provided',
                'code': 'NO_IMAGE'
            }), 400
        
        file = request.files['image']
        
        # Check if file is valid
        if file.filename == '':
            return jsonify({
                'error': 'Empty filename',
                'code': 'EMPTY_FILENAME'
            }), 400
        
        if not allowed_file(file.filename):
            return jsonify({
                'error': 'Invalid file type. Allowed: png, jpg, jpeg, webp',
                'code': 'INVALID_FILE_TYPE'
            }), 400
        
        # Read image bytes
        img_bytes = file.read()
        file_size_kb = len(img_bytes) / 1024
        
        logger.info(f"📥 Processing image: {file.filename} ({file_size_kb:.1f} KB)")
        
        # Preprocess image
        img_array = preprocess_image(img_bytes)
        
        # Run prediction
        result = predict_disease(img_array)
        
        total_time = time.time() - total_start_time
        logger.info(f"✅ Prediction: {result['classVi']} ({result['confidence']:.2f}%)")
        logger.info(f"⏱️ Total processing time: {total_time:.2f}s")
        
        return jsonify({
            'success': True,
            'prediction': result,
            'processingTime': round(total_time, 2)
        }), 200
        
    except Exception as e:
        logger.error(f"❌ Prediction error: {str(e)}")
        return jsonify({
            'error': str(e),
            'code': 'PREDICTION_ERROR'
        }), 500

@app.route('/', methods=['GET'])
def index():
    """API info endpoint"""
    return jsonify({
        'service': 'Rice Leaf Disease Detection API',
        'version': '1.0.0',
        'endpoints': {
            'health': '/health',
            'predict': '/predict (POST with image file)'
        },
        'model': {
            'classes': CLASS_NAMES_VI,
            'input_size': '224x224',
            'format': 'TFLite',
            'loaded': interpreter is not None
        }
    }), 200

@app.errorhandler(413)
def file_too_large(e):
    """Handle file too large error"""
    return jsonify({
        'error': 'File too large (max 10MB)',
        'code': 'FILE_TOO_LARGE'
    }), 413

# Load model immediately when module is imported (for gunicorn workers)
logger.info("=" * 60)
logger.info("🌾 Rice Leaf Disease Detection API Starting...")
logger.info(f"📁 Model path: {MODEL_PATH}")
logger.info(f"🔌 Port: {PORT}")
logger.info("=" * 60)

if not load_model():
    logger.error("❌ CRITICAL: Failed to load model on startup!")
    logger.error(f"❌ Make sure {MODEL_PATH} exists and is a valid TFLite model")
else:
    logger.info("✅ Model loaded successfully, API ready!")

if __name__ == '__main__':
    # Start server (for development only)
    logger.info(f"🚀 Starting development server on port {PORT}")
    app.run(host='0.0.0.0', port=PORT, debug=False)
