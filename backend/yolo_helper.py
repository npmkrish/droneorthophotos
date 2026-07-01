import sys
import os
import uuid
import cv2
import numpy as np
from PIL import Image
import piexif
import json
from ultralytics import YOLO

# Utility to convert decimal degrees to EXIF GPS DMS format
def convert_to_dms(decimal):
    degrees = int(decimal)
    minutes = int((decimal - decimal) * 60) # Avoid negative/truncation errors
    minutes = int((decimal - degrees) * 60)
    seconds = int(((decimal - degrees) * 60 - minutes) * 60 * 100)
    return [(degrees, 1), (minutes, 1), (seconds, 100)]

def add_geolocation(image_path, latitude, longitude):
    try:
        image = Image.open(image_path)
        exif_data = image.info.get("exif", None)
        if exif_data:
            exif_dict = piexif.load(exif_data)
        else:
            exif_dict = {"0th": {}, "Exif": {}, "GPS": {}, "Interop": {}, "1st": {}, "thumbnail": None}

        exif_dict["GPS"] = {
            piexif.GPSIFD.GPSLatitudeRef: b'N' if latitude >= 0 else b'S',
            piexif.GPSIFD.GPSLatitude: convert_to_dms(abs(latitude)),
            piexif.GPSIFD.GPSLongitudeRef: b'E' if longitude >= 0 else b'W',
            piexif.GPSIFD.GPSLongitude: convert_to_dms(abs(longitude)),
        }
        
        exif_bytes = piexif.dump(exif_dict)
        image = image.convert("RGB")
        image.save(image_path, "JPEG", exif=exif_bytes)
    except Exception as e:
        pass

def main():
    if len(sys.argv) < 4:
        print(json.dumps({"error": "Missing arguments"}))
        sys.exit(1)

    image_path = sys.argv[1]
    latitude = float(sys.argv[2])
    longitude = float(sys.argv[3])

    if not os.path.exists(image_path):
        print(json.dumps({"error": "Uploaded file not found"}))
        sys.exit(1)

    # Check for weights file, fallback to yolov8n-seg.pt if best4.pt is missing
    model_weights = 'best4.pt'
    if not os.path.exists(model_weights) and not os.path.exists(os.path.join('..', model_weights)):
        model_weights = 'yolov8n-seg.pt'

    try:
        model = YOLO(model_weights)
        image = cv2.imread(image_path)
        
        if image is None:
            print(json.dumps({"error": "OpenCV read failure"}))
            sys.exit(1)

        # Run prediction
        results = model.predict(source=image_path, conf=0.25, save=False)
        
        object_counts = {}
        has_masks = False
        
        for result in results:
            if result.masks is not None:
                has_masks = True
            
            # Count detected labels
            if result.boxes is not None:
                for box in result.boxes:
                    cls_id = int(box.cls[0].item())
                    label = model.names[cls_id]
                    object_counts[label] = object_counts.get(label, 0) + 1

        output_filename = f"pred_{uuid.uuid4().hex}_{os.path.basename(image_path)}"
        output_dir = os.path.join(os.path.dirname(__file__), "static", "predictions")
        os.makedirs(output_dir, exist_ok=True)
        output_path = os.path.join(output_dir, output_filename)

        if not has_masks:
            cv2.imwrite(output_path, image)
            add_geolocation(output_path, latitude, longitude)
            print(json.dumps({"filename": output_filename, "object_counts": object_counts}))
            sys.exit(0)

        # Apply masks
        for result in results:
            pred_masks = result.masks
            pred_class_ids = result.boxes.cls
            class_names = model.names
            
            mask_image = np.zeros_like(image, dtype=np.uint8)

            for i, mask in enumerate(pred_masks.data):
                mask_np = mask.cpu().numpy()
                binary_mask = (mask_np * 255).astype(np.uint8)
                binary_mask = cv2.resize(binary_mask, (image.shape[1], image.shape[0]))

                # Color the mask dark blue
                colored_mask = np.zeros_like(image, dtype=np.uint8)
                colored_mask[binary_mask == 255] = (150, 0, 0) # BGR
                mask_image = cv2.addWeighted(mask_image, 1, colored_mask, 1, 0)

                # Text label drawing
                contours, _ = cv2.findContours(binary_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
                valid_contours = [c for c in contours if cv2.contourArea(c) > 500]
                
                if len(valid_contours) > 0:
                    largest_contour = max(valid_contours, key=cv2.contourArea)
                    x, y, w, h = cv2.boundingRect(largest_contour)

                    class_id = int(pred_class_ids[i])
                    label = class_names[class_id]

                    font = cv2.FONT_HERSHEY_SIMPLEX
                    calculated_font_size = min(18, max(16, min(w, h) / 15))
                    font_scale = calculated_font_size / 30
                    font_thickness = max(2, int(font_scale * 2))

                    text_size = cv2.getTextSize(label, font, font_scale, font_thickness)[0]
                    center_x = x + w // 2
                    center_y = y + h // 2

                    label_x = center_x - text_size[0] // 2
                    label_y = center_y + text_size[1] // 2

                    # Solid black label background
                    cv2.rectangle(mask_image, 
                                  (label_x - 5, label_y - text_size[1] - 5),
                                  (label_x + text_size[0] + 5, label_y + 5),
                                  (0, 0, 0),
                                  -1)
                    # Yellow text
                    cv2.putText(mask_image, label, (label_x, label_y), font, font_scale, (255, 255, 0), font_thickness)
                    cv2.putText(mask_image, label, (label_x, label_y), font, font_scale, (0, 0, 0), font_thickness + 1)

            blended_image = cv2.addWeighted(image, 0.8, mask_image, 0.5, 0)
            cv2.imwrite(output_path, blended_image)
            add_geolocation(output_path, latitude, longitude)
            
            print(json.dumps({"filename": output_filename, "object_counts": object_counts}))
            sys.exit(0)

    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == '__main__':
    main()   
