from flask import Flask, render_template, request, jsonify
import numpy as np
import tensorflow as tf
from PIL import Image
import io
import base64

app = Flask(__name__)

# Load the trained CNN model
model = tf.keras.models.load_model('best_cnn_model(1).h5')

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def predict():
    try:
        # Get the data from the request
        data = request.get_json()

        if 'image' not in data:
            return jsonify({'error': 'No image data provided'}), 400

        # Decode the base64 image
        image_data = data['image'].split(",")[1]
        image = Image.open(io.BytesIO(base64.b64decode(image_data))).convert("L")
        
        # Resize the image and normalize it
        image = image.resize((28, 28))
        image = np.array(image)

        # Check the shape and min/max values
        print(f"Image shape: {image.shape}")
        print(f"Image min/max: {image.min()}, {image.max()}")

        # Skip inversion if the background is black (no need to invert here)
        image = image / 255.0  # Normalize to 0-1

        # Reshape the image to match input shape for the model
        image = image.reshape(1, 28, 28, 1).astype(np.float32)

        # Check the image before prediction
        print(f"Image shape for prediction: {image.shape}")

        # Run prediction
        prediction = model.predict(image)
        predicted_label = int(np.argmax(prediction))
        confidence_scores = prediction[0].tolist()  # Convert numpy array to list

        return jsonify({
            'prediction': predicted_label,
            'confidences': [round(float(score), 4) for score in confidence_scores]
        })


    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
