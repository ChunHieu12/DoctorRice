# Model Directory

Place your trained TFLite model here:

```
model/
└── model.tflite  ← Your TFLite model file
```

## Model Requirements

- **Format**: TensorFlow Lite (.tflite)
- **Input Shape**: (1, 224, 224, 3)
- **Output Shape**: (1, 4) - 4 classes
- **Classes Order**:
  1. bacterial_leaf_blight
  2. blast
  3. brown_spot
  4. healthy

## Model Info

- **Architecture**: EfficientNet (or similar)
- **Preprocessing**: `tf.keras.applications.efficientnet.preprocess_input`
- **Input Size**: 224x224 RGB
- **Max Size**: < 100MB recommended for faster deployment

---

**Note**: The model file is not included in the repository due to size limitations.
You must add your own trained model before running the service.

