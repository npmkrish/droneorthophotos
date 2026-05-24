from flask import Flask, render_template, request, send_file, jsonify, send_from_directory, session, redirect, url_for
from fpdf import FPDF
from PIL import Image
import os
import torch
from ultralytics import YOLO
import logging
from pymongo import MongoClient
from flask import send_from_directory
import uuid
from PIL import Image
import piexif
import cv2
import numpy as np

#////////////////
app = Flask(__name__)
app.secret_key = 'deepanshu1234'


UPLOAD_FOLDER = 'static/uploads'
PREDICTION_FOLDER = 'static/predictions'
REPORT_FOLDER = 'static/reports'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['PREDICTION_FOLDER'] = PREDICTION_FOLDER
app.config['REPORT_FOLDER'] = REPORT_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(PREDICTION_FOLDER, exist_ok=True)
os.makedirs(REPORT_FOLDER, exist_ok=True)

# Disable decompression bomb error for large images
Image.MAX_IMAGE_PIXELS = None
Image.warnings.simplefilter('ignore', Image.DecompressionBombWarning)
#ll

# MongoDB connection
client = MongoClient("mongodb+srv://mukulpersonal2003:WAWL0bC3hZi8KvSG@cluster0.s79lu.mongodb.net/")
db = client['DeepanshuPro']
users_collection = db['users']
upload_files_collection = db['uploads']

# YOLO models
model = YOLO('best4.pt')
torch_model = torch.hub.load('ultralytics/yolov5', 'yolov5s', force_reload=True)

# Set up logging
logging.basicConfig(level=logging.DEBUG)

def convert_to_dms(decimal):
    """Convert decimal coordinates to degrees, minutes, and seconds."""
    degrees = int(decimal)
    minutes = int((decimal - degrees) * 60)
    seconds = int(((decimal - degrees) * 60 - minutes) * 60 * 100)
    return [(degrees, 1), (minutes, 1), (seconds, 100)]

def extract_geolocation(image_path):
    try:
        # Open the image
        image = Image.open(image_path)
        exif_data = image._getexif()  # Extract EXIF metadata

        if not exif_data:
            print("No EXIF data found.")
            return None

        # Log EXIF data for debugging
        print("EXIF data:", exif_data)

        # Extract GPSInfo tag (34853 is the GPS tag ID)
        gps_info = exif_data.get(34853)
        if not gps_info:
            print("No GPSInfo found in EXIF data.")
            return None

        # Log GPS data for debugging
        print("GPSInfo:", gps_info)

        # Convert GPS data to decimal format
        def convert_to_decimal(values, ref):
            degrees = values[0][0] / values[0][1]
            minutes = values[1][0] / values[1][1]
            seconds = values[2][0] / values[2][1] if len(values) > 2 else 0
            decimal = degrees + (minutes / 60.0) + (seconds / 3600.0)
            if ref in ['S', 'W']:
                decimal = -decimal
            return decimal

        latitude = convert_to_decimal(gps_info[2], gps_info[1])
        longitude = convert_to_decimal(gps_info[4], gps_info[3])

        return latitude, longitude

    except Exception as e:
        print(f"Error extracting geolocation: {e}")
        return None

@app.route('/upload_metadata_image', methods=['POST'])
def upload_metadata_image():
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file provided"}), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "No file selected"}), 400

        # Save the uploaded file temporarily
        file_path = os.path.join(UPLOAD_FOLDER, file.filename)
        file.save(file_path)

        # Extract geolocation metadata
        geolocation = extract_geolocation(file_path)
        if not geolocation:
            return jsonify({
                "error": "No geolocation metadata found in the image. "
                         "Ensure the image contains EXIF geolocation data."
            }), 400

        latitude, longitude = geolocation
        return jsonify({"latitude": latitude, "longitude": longitude})

    except Exception as e:
        logging.exception("An error occurred while processing the metadata image.")
        return jsonify({"error": str(e)}), 500


def add_geolocation(image_path, latitude, longitude):
    try:
        # Open the image
        image = Image.open(image_path)

        # Check if EXIF exists, if not create it
        exif_data = image.info.get("exif", None)
        if exif_data:
            exif_dict = piexif.load(exif_data)
        else:
            exif_dict = {"0th": {}, "Exif": {}, "GPS": {}, "Interop": {}, "1st": {}, "thumbnail": None}

        # Prepare GPS data
        exif_dict["GPS"] = {
            piexif.GPSIFD.GPSLatitudeRef: b'N' if latitude >= 0 else b'S',
            piexif.GPSIFD.GPSLatitude: convert_to_dms(abs(latitude)),
            piexif.GPSIFD.GPSLongitudeRef: b'E' if longitude >= 0 else b'W',
            piexif.GPSIFD.GPSLongitude: convert_to_dms(abs(longitude)),
        }

        # Convert EXIF data back to bytes
        exif_bytes = piexif.dump(exif_dict)


        # Save the image as JPEG if it is not already
        image = image.convert("RGB")  # Convert to RGB if not already (for saving as JPEG)
        image.save(image_path, "JPEG", exif=exif_bytes)
        print(f"Geolocation metadata added to image: {image_path}")

    except Exception as e:
        print(f"Error: {e}")

# Example to test with your downloaded image
add_geolocation("path_to_your_downloaded_image.jpg", 51.5074, -0.1278)


@app.route('/')
def index():
    return render_template('landing.html')


# User Authentication Routes
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']
        user = users_collection.find_one({"email": email})
        if user and user['password'] == password:
            session['email'] = email
            session['name'] = user.get('name')
            return redirect(url_for('dashboard'))
        return render_template('login.html', alert_message="Invalid email or password")
    return render_template('login.html')


@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        name = request.form['name']
        email = request.form['email']
        password = request.form['password']
        existing_user = users_collection.find_one({"email": email})
        if existing_user:
            return render_template('login.html', alert_message="Email already exists!")
        users_collection.insert_one({"name": name, "email": email, "password": password})
        return redirect(url_for('login'))
    return render_template('register.html')


@app.route('/dashboard')
def dashboard():
    if 'email' in session:
        user_name = session['name']
        return render_template('dashboard.html', user_name=user_name)
    return redirect(url_for('login'))



# Object Detection and PDF Report Generation
@app.route('/generate_report', methods=['POST'])
def generate_report():
    if 'image' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files['image']
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400

    image_path = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(image_path)

    try:
        image = Image.open(image_path).convert('RGB')
        if max(image.size) > 1024:
            image = image.resize((1024, int(1024 * image.size[1] / image.size[0])))

        results = torch_model(image)
        labels = results.names
        boxes = results.xywh[0].tolist()
        object_counts = {}

        for box in boxes:
            label = labels[int(box[5])]
            object_counts[label] = object_counts.get(label, 0) + 1
    except Exception as e:
        return jsonify({"error": f"Error processing image: {str(e)}"}), 400

    report_path = os.path.join(REPORT_FOLDER, "image_analysis_report.pdf")
    generate_pdf_report(report_path, object_counts, image_path)
    return send_file(report_path, as_attachment=True, mimetype='application/pdf')


def generate_pdf_report(report_path, object_counts, image_path):
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", size=16)
    pdf.cell(200, 10, txt="Object Detection Report", ln=True, align='C')
    pdf.ln(10)
    pdf.set_font("Arial", size=12)
    pdf.cell(0, 10, txt="Uploaded Image:", ln=True)
    pdf.image(image_path, x=10, y=30, w=190)
    pdf.ln(80)
    pdf.cell(0, 10, txt="Detected Objects:", ln=True)
    for label, count in object_counts.items():
        pdf.cell(0, 10, txt=f"- {label}: {count}", ln=True)
    pdf.output(report_path)


@app.route('/predict', methods=['POST'])
def predict():
    try:
        if 'file' not in request.files or not request.form.get('latitude') or not request.form.get('longitude'):
            return jsonify({"error": "Please provide an image and geolocation data"}), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "No selected file"}), 400

        latitude = float(request.form['latitude'])
        longitude = float(request.form['longitude'])

        # Generate a unique filename for the upload
        unique_filename = f"{uuid.uuid4().hex}_{file.filename}"
        upload_path = os.path.join(UPLOAD_FOLDER, unique_filename)
        file.save(upload_path)
        logging.info(f"Uploaded image saved to {upload_path}")

        # Run YOLO predictions
        image = cv2.imread(upload_path)

        # Run YOLO predictions with masks
        results = model.predict(source=upload_path, conf=0.25, save=True)

        # Define the output directory and ensure it's created
        output_dir = "predictions"
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)

        # Loop through the results to extract masks, class, and score
        for result in results:
            pred_masks = result.masks  # Extract predicted masks
            pred_class_ids = result.boxes.cls  # Class IDs
            pred_scores = result.boxes.conf  # Confidence scores
            class_names = model.names  # Class names

            # Create a mask image the same size as the original image
            mask_image = np.zeros_like(image, dtype=np.uint8)

            # Iterate over each detection and apply the mask
            for i, mask in enumerate(pred_masks.data):
                # Convert the mask from PyTorch tensor to NumPy array
                mask_np = mask.cpu().numpy()

                # Convert mask to a binary mask
                binary_mask = (mask_np * 255).astype(np.uint8)

                # Resize the mask to match the image dimensions
                binary_mask = cv2.resize(binary_mask, (image.shape[1], image.shape[0]))

                # Create a colored mask (dark blue in this case)
                colored_mask = np.zeros_like(image, dtype=np.uint8)
                colored_mask[binary_mask == 255] = (0, 0, 150)

                # Blend the colored mask with the original image
                mask_image = cv2.addWeighted(mask_image, 1, colored_mask, 1, 0)

                # Find the contours for the binary mask to get bounding box
                contours, _ = cv2.findContours(binary_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
                
                # Set a minimum area threshold to ignore small portions
                min_area_threshold = 500  # Adjust this threshold based on detection size
                valid_contours = [contour for contour in contours if cv2.contourArea(contour) > min_area_threshold]

                if len(valid_contours) > 0:
                    # Find the bounding box around the largest valid contour
                    largest_contour = max(valid_contours, key=cv2.contourArea)
                    x, y, w, h = cv2.boundingRect(largest_contour)

                    class_id = int(pred_class_ids[i])
                    label = class_names[class_id]

                    # Calculate font scale based on the size of the detected region (bounding box)
                    font = cv2.FONT_HERSHEY_SIMPLEX

                    # Set the font size to be between 16 and 18
                    calculated_font_size = min(18, max(16, min(w, h) / 15))  # Ensures the size is between 16 and 18
                    font_scale = calculated_font_size / 30  # Scale factor for OpenCV font
                    font_thickness = max(2, int(font_scale * 2))  # Set thickness proportional to font scale

                    # Get text size to properly place the label within the detected portion
                    text_size = cv2.getTextSize(label, font, font_scale, font_thickness)[0]
                    
                    # Calculate the center of the bounding box
                    center_x = x + w // 2
                    center_y = y + h // 2

                    # Adjust the text position to be centered on the object
                    label_x = center_x - text_size[0] // 2  # Center text horizontally
                    label_y = center_y + text_size[1] // 2  # Center text vertically

                    # Draw a solid black rectangle as the background for the label
                    cv2.rectangle(mask_image, 
                                  (label_x - 5, label_y - text_size[1] - 5),  # Top-left corner of rectangle
                                  (label_x + text_size[0] + 5, label_y + 5),  # Bottom-right corner of rectangle
                                  (0, 0, 0),  # Solid black color for the background
                                  -1)  # Thickness = -1 means filled rectangle

                    # Overlay class label with dynamically sized text in the center of detection
                    cv2.putText(mask_image, label, (label_x, label_y), font, font_scale, (255, 255, 0), font_thickness)

            # Blend the original image with the mask image
            blended_image = cv2.addWeighted(image, 0.8, mask_image, 0.5, 0)

            # Define the output path inside the predictions folder
            output_image_path = os.path.join(output_dir, f"{uuid.uuid4().hex}_{file.filename}")
            cv2.imwrite(output_image_path, blended_image)

        # Inspect results for debugging
        logging.info(f"YOLO results: {results}")

        # Check for the predicted image path
        predicted_img = output_image_path if os.path.exists(output_image_path) else None

        if not predicted_img:
            logging.error("No predicted image found in YOLO output.")
            return jsonify({"error": "Prediction failed"}), 500

        # Move the predicted image to the PREDICTION_FOLDER
        final_prediction_path = os.path.join(PREDICTION_FOLDER, os.path.basename(predicted_img))
        os.rename(predicted_img, final_prediction_path)
        logging.info(f"Predicted image moved to: {final_prediction_path}")

        # Add geolocation metadata
        add_geolocation(final_prediction_path, latitude, longitude)

        


        return jsonify({
            "image_url": f"/static/predictions/{os.path.basename(final_prediction_path)}?t={uuid.uuid4().hex}",
            "latitude": latitude,
            "longitude": longitude,
            "redirect_url": "/scanning"
        })
    
        

    except Exception as e:
        logging.exception("An error occurred during prediction.")
        return jsonify({"error": str(e)}), 500
    

@app.route('/predict_image', methods=['GET'])
def predict_image():
    predicted_files = sorted(
        os.listdir(PREDICTION_FOLDER),
        key=lambda x: os.path.getmtime(os.path.join(PREDICTION_FOLDER, x)),
        reverse=True
    )
    
    latest_image = predicted_files[0] if predicted_files else None
    if latest_image:
        image_url = f"/static/predictions/{latest_image}"  # URL for frontend
        return jsonify({"image_url": image_url})  # Return JSON response
    else:
        return jsonify({"error": "No predictions found"}), 404


@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    if file:
        filename = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
        file.save(filename)
        image_path = filename

        try:
            # Perform object detection
            results = model(image_path)
            if not results or len(results) == 0:
                return jsonify({"error": "No detection results"}), 400

            result = results[0]
            labels = result.names

            # Count occurrences of each object
            object_counts = {}
            for box in result.boxes:
                label = labels[int(box.cls)]
                object_counts[label] = object_counts.get(label, 0) + 1

            # Save annotated image
            annotated_image = result.plot()
            output_path = os.path.join(app.config['UPLOAD_FOLDER'], f"annotated_{file.filename}")
            Image.fromarray(annotated_image).save(output_path)

            return render_template('report.html', object_counts=object_counts)

        except Exception as e:
            return jsonify({"error": f"Error processing image: {str(e)}"}), 400

# Serve Uploaded and Predicted Images
@app.route('/static/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)


@app.route('/static/predictions/<filename>')
def prediction_file(filename):
    return send_from_directory(PREDICTION_FOLDER, filename)

@app.route('/maptest')
def maptest_page():
    # Get the latest predicted image
    predicted_files = sorted(
        os.listdir(PREDICTION_FOLDER),
        key=lambda x: os.path.getmtime(os.path.join(PREDICTION_FOLDER, x)),
        reverse=True
    )
    latest_image = predicted_files[0] if predicted_files else None
    return render_template('maptest.html', image=latest_image)



# @app.route('/maptest')
# def method_not_allowed(e):
#     if 'email' in session:
#         user_name = session['name']
#         print(user_name)
#         return render_template('maptest.html', user_name=user_name)
#     # return render_template('maptest.html'), maptest
#     return redirect(url_for('maptest.html',user_name="NARENDRA MODI"))

    
    

    



@app.errorhandler(405)
def method_not_allowed(e):
    if 'email' in session:
        user_name = session['name']
        print(user_name)
        return render_template('405.html', user_name=user_name)
    # return render_template('405.html'), 405
    return redirect(url_for('405.html',user_name="NARENDRA MODI"))

@app.route('/uploaded_images')
def uploaded_images():
    # List all files in the UPLOAD_FOLDER directory
    image_files = os.listdir(UPLOAD_FOLDER)
    image_files = [file for file in image_files if file.endswith(('jpg', 'jpeg', 'png'))]  # Filter for image files
    return render_template('uploaded_images.html', images=image_files)

@app.route('/predicted_images')
def predicted_images():
    # List all files in the PREDICTION_FOLDER directory
    predicted_files = os.listdir(PREDICTION_FOLDER)
    predicted_files = [file for file in predicted_files if file.endswith(('jpg', 'jpeg', 'png'))]  # Filter for image files
    return render_template('predicted_images.html', images=predicted_files)



@app.route('/chat')
def chat_report():
    return render_template('chat.html')


# @app.route('/report_nlp', methods=['POST'])
# def generate_report_nlp():
#     data = request.get_json()  # Get JSON data from the request
#     if not data or 'object_counts' not in data:
#         return jsonify({'error': 'Invalid data'}), 400

#     object_counts = data['object_counts']
#     font_path = os.path.join(app.root_path, 'static', 'fonts', 'DejaVuSans.ttf')  # Correct font path
#     pdf = FPDF()
#     pdf.add_page()
#     pdf.add_font('DejaVu', '', font_path, uni=True)
#     pdf.set_font("DejaVu", size=12)

#     # Title
#     pdf.cell(200, 10, txt="Image Analysis Report", ln=True, align='C')
#     pdf.ln(10)

#     # Detected Objects
#     pdf.cell(0, 10, txt="Objects Detected:", ln=True)
#     for label, count in object_counts.items():
#         pdf.cell(0, 10, txt=f"    • {label}: {count} detected", ln=True)
#     pdf.ln(10)

#     # Findings
#     pdf.cell(0, 10, txt="Findings:", ln=True)
#     findings_text = (
#         "Upon analyzing the provided image, the following objects were detected: " +
#         ", ".join(object_counts.keys()) + ". Each object was classified based on its "
#         "visual characteristics. This analysis provides insight into the distribution "
#         "of objects within the image."
#     )
#     pdf.multi_cell(0, 10, txt=findings_text)
#     pdf.ln(10)

#     # Conclusion
#     pdf.cell(0, 10, txt="Conclusion:", ln=True)
#     conclusion_text = (
#         "The report provides detailed insights into the objects detected in the image. "
#         "The analysis can be applied to areas such as surveillance, automated systems, and "
#         "environmental monitoring. Further investigation into the spatial distribution "
#         "and relationships among objects could enhance understanding and decision-making."
#     )
#     pdf.multi_cell(0, 10, txt=conclusion_text)

#     report_path = os.path.join(app.config['REPORT_FOLDER'], 'report.pdf')
#     pdf.output(report_path)

#     return send_file(report_path, as_attachment=True)

@app.route('/report_nlp', methods=['POST'])
def generate_report_nlp():
    # Extract and validate JSON data
    data = request.get_json()
    if not data or 'object_counts' not in data:
        return jsonify({'error': 'Invalid data'}), 400

    object_counts = data['object_counts']
    if not isinstance(object_counts, dict):
        return jsonify({'error': 'Invalid object_counts format'}), 400

    # Font setup: Use absolute path for the font
    font_path = r"C:/Users\DEEPANSHU/OneDrive\Desktop\sih\static/fonts\DejaVuSans.ttf"

    # Debugging: Check if the font path is accessible
    if not os.path.exists(font_path):
        return jsonify({'error': f"Font file not found at {font_path}"}), 500

    try:
        # PDF creation
        pdf = FPDF()
        pdf.add_page()
        pdf.add_font('DejaVu', '', font_path, uni=True)
        pdf.set_font("DejaVu", size=12)

        # Title
        pdf.cell(200, 10, txt="Analysis Report", ln=True, align='C')
        pdf.ln(10)

        # Detected Objects
        pdf.cell(0, 10, txt="Objects Detected:", ln=True)
        for label, count in object_counts.items():
            pdf.cell(0, 10, txt=f"    • {label}: {count} detected", ln=True)
        pdf.ln(10)

        # Findings Section
        findings_text = (
            "Upon analyzing the provided image, the following objects were detected: " +
            ", ".join(object_counts.keys()) + ". Each object was classified based on its "
            "visual characteristics. This analysis provides insight into the distribution "
            "of objects within the image."
        )
        pdf.multi_cell(0, 10, txt="Findings:")
        pdf.multi_cell(0, 10, txt=findings_text)
        pdf.ln(10)

        # Conclusion Section
        conclusion_text = (
            "The report provides detailed insights into the objects detected in the image. "
            "The analysis can be applied to areas such as surveillance, automated systems, and "
            "environmental monitoring. Further investigation into the spatial distribution "
            "and relationships among objects could enhance understanding and decision-making."
        )
        pdf.multi_cell(0, 10, txt="Conclusion:")
        pdf.multi_cell(0, 10, txt=conclusion_text)

        # Save the PDF
        report_folder = app.config.get('REPORT_FOLDER', os.path.join(app.root_path, 'static', 'reports'))
        os.makedirs(report_folder, exist_ok=True)
        report_path = os.path.join(report_folder, 'report.pdf')
        pdf.output(report_path)
    except Exception as e:
        return jsonify({'error': f"Failed to generate report: {str(e)}"}), 500

    # Return the generated PDF
    return send_file(report_path, as_attachment=True)


@app.route('/download/previs')
def download_previs():
    return send_from_directory(
        directory='static/files', 
        path='FUSIONAI.pdf',
        as_attachment=True
    )

@app.route('/route')
def route():
    if 'email' in session:
        user_name = session['name']
        print(user_name)
        return render_template('route.html', user_name=user_name)
    # return render_template('405.html'), 405
    return redirect(url_for('route.html',user_name="NARENDRA MODI"))

@app.route('/video')
def video_rep():
    return render_template('video.html')

@app.route('/scanning')
def scanning():
     # Get the latest predicted image
    predicted_files = sorted(
        os.listdir(PREDICTION_FOLDER),
        key=lambda x: os.path.getmtime(os.path.join(PREDICTION_FOLDER, x)),
        reverse=True
    )
    latest_image = predicted_files[0] if predicted_files else None

    uploaded_file = sorted(
        os.listdir(UPLOAD_FOLDER),
        key=lambda x: os.path.getmtime(os.path.join(UPLOAD_FOLDER, x)),
        reverse=True
    )
    latest1_image = uploaded_file[0] if uploaded_file else None
    latest_image_url = f"/static/predictions/{latest_image}" if latest_image else None
    latest1_image_url = f"/static/uploads/{latest1_image}" if latest1_image else None
    latest_image = latest_image_url if latest_image else None
    latest1_image = latest1_image_url if latest1_image else None
    latest_image = latest_image if latest_image else None
    global latest1_image
    if latest_image and latest1_image:
        

    
    

    return render_template('scanning.html', image=latest_image, image1=latest1_image)
    return render_template('scanning.html')

def method_not_allowed(e):
    if 'email' in session:
        user_name = session['name']
        print(user_name)
        return render_template('405.html', user_name=user_name)
    # return render_template('405.html'), 405
    return redirect(url_for('405.html',user_name="alex bae"))
def method_not_allowed(e):
    if 'email' in session:
        user_name = session['name']
        print(user_name)
        return render_template('405.html', user_name=user_name)
    # return render_template('405.html'), 405
    return redirect(url_for('405.html',user_name="MICHAEL JACKSON"))
def method_not_allowed(e):
    if 'email' in session:
        user_name = session['name']
        print(user_name)
        return render_template('405.html', user_name=user_name)
    # return render_template('405.html'), 405
    return redirect(url_for('405.html',user_name="Nsfcsdvdf"))
def not_found(e):
    if 'email' in session:
        user_name = session['name']
        print(user_name)
        return render_template('404.html', user_name=user_name)
    # return render_template('404.html'), 404
    return redirect(url_for('404.html',user_name="irowhskkgjs"))
def method_not_allowed(e):
    render_template('405.html'), 405
    render_template('406.html'), 406        









@app.errorhandler(405)
def method_not_allowed(e):
    if 'email' in session:
        user_name = session['name']
        print(user_name)
        return render_template('405.html', user_name=user_name)
    # return render_template('405.html'), 405
    return redirect(url_for('405.html',user_name="NARENDRA MODI"))
def method_not_allowed(e):
    if 'email' in session:
        user_name = session['name']
        print(user_name)
        return render_template('405.html', user_name=user_name)
    # return render_template('405.html'), 405
    return redirect(url_for('405.html',user_name="NARENDRA MODI"))


if __name__ == '__main__':
    app.run(debug=True)
    app.run(host='0@13i8.0.1', port=5000)
    app.run(host='0eopppe.0.1', port=5001)