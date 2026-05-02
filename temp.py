from ultralytics import YOLO
import cv2
import matplotlib.pyplot as plt
import numpy as np
import os

# Load the pretrained YOLO model (adjust the path if you have a custom trained model)
model = YOLO("best (5).pt")  # Replace with your model path

# Load the image you want to run predictions on
image_path = "24.jpeg"  # Replace with your image path
image = cv2.imread(image_path)

# Run YOLO predictions with masks
results = model(image_path, save=True, conf=0.25)

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
    for i, mask in enumerate(pred_masks.data):  # Iterate over all predicted masks
        # Convert the mask from PyTorch tensor to NumPy array
        mask_np = mask.cpu().numpy()

        # Convert mask to a binary mask (mask is in float, so we convert it to 0 and 255)
        binary_mask = (mask_np * 255).astype(np.uint8)
        
        # Resize the mask to match the image dimensions (sometimes required for mask alignment)
        binary_mask = cv2.resize(binary_mask, (image.shape[1], image.shape[0]))
        
        # Create a mask with the same size as the image, color it with a darker blue or any other dark color
        colored_mask = np.zeros_like(image, dtype=np.uint8)
        colored_mask[binary_mask == 255] = (0, 0, 150)  # Darker blue mask

        # Blend the colored mask with the original image (use 0.7 for darker mask effect)
        mask_image = cv2.addWeighted(mask_image, 1, colored_mask, 1, 0)

        # Find the position for the class label by finding the bounding box around the mask
        contours, _ = cv2.findContours(binary_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        if len(contours) > 0:
            x, y, w, h = cv2.boundingRect(contours[0])  # Bounding box of the mask

            # Get class label (no score here)
            class_id = int(pred_class_ids[i])
            label = class_names[class_id]  # Use the class ID to get the name

            # Overlay class label with bright white text for better visibility
            cv2.putText(mask_image, f"{label}", (x, y - 10), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 0), 3)  # Yellow with thicker text

    # Blend the original image with the mask image
    blended_image = cv2.addWeighted(image, 0.8, mask_image, 0.5, 0)

    # Define the output path inside the predictions folder
    output_image_path = os.path.join(output_dir, image_path)

    # Save the final blended image to disk
    cv2.imwrite(output_image_path, blended_image)

    # Display the final image with masks
    plt.imshow(cv2.cvtColor(blended_image, cv2.COLOR_BGR2RGB))
    plt.axis('off')
    plt.show()

print(f"Final image saved to {output_image_path}")

#print(f"Final image saved to {output_image_path}") 
#print(f"Final image saved to {output_image_path}1111")
#/////////////////////////////////////////////////////////////////////dddddddddddddS