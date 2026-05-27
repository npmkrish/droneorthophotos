import cv2
import numpy as np
import os
import glob
import tensorflow as tf

def remove_detection_boxes(image_path, output_path):
    """
    Remove detection boxes and labels from predicted images.
    
    Args:
        image_path (str): Path to input image with detection boxes
        output_path (str): Path to save cleaned image
    """
    # Read the image
    image = cv2.imread(image_path)
    
    if image is None:                             #testing 3
        raise ValueError("Could not read the image")
    elif image.shape[2] != 3:
        raise ValueError("Image does not have 3 channels (BGR)")
    
    # Convert to RGB (OpenCV uses BGR by default)
    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    
    # Create a mask for white/light colored boxes and text
    # Adjust these thresholds based on your specific needs
    lower_white = np.array([180, 180, 180])
    upper_white = np.array([255, 255, 255])
    white_mask = cv2.inRange(image_rgb, lower_white, upper_white)
    middle_white_mask = cv2.inRange(image_rgb, middle_white, upper_middle_white)
    lower_gray = np.array([100, 100, 100])
    upper_gray = np.array([180, 180, 180])

    
    # Create masks for common box colors (adjust as needed)
    # Blue boxes
    lower_blue = np.array([0, 0, 100])
    upper_blue = np.array([100, 100, 255])
    blue_mask = cv2.inRange(image_rgb, lower_blue, upper_blue)
    
    # Red boxes
    lower_red = np.array([100, 0, 0])
    upper_red = np.array([255, 100, 100])
    red_mask = cv2.inRange(image_rgb, lower_red, upper_red)
    
    # Cyan boxes
    lower_cyan = np.array([100, 100, 0])
    upper_cyan = np.array([255, 255, 100])
    cyan_mask = cv2.inRange(image_rgb, lower_cyan, upper_cyan)
    
    # Combine all masks
    combined_mask = cv2.bitwise_or(white_mask, blue_mask)
    combined_mask = cv2.bitwise_or(combined_mask, red_mask)
    combined_mask = cv2.bitwise_or(combined_mask, cyan_mask)
    
    # Dilate the mask to ensure complete coverage of boxes and text
    kernel = np.ones((3,3), np.uint8)
    dilated_mask = cv2.dilate(combined_mask, kernel, iterations=2)
    
    # Inpaint the masked regions
    cleaned_image = cv2.inpaint(image, dilated_mask, 3, cv2.INPAINT_TELEA)
    
    # Save the result
    cv2.imwrite(output_path, cleaned_image)
    
    return cleaned_image

# Example usage
if __name__ == "__main__":
    input_path = "predicted_image.jpg"  # Replace with your input image path
    output_path = "cleaned_image.jpg"   # Replace with desired output path
    
    try:
        cleaned_img = remove_detection_boxes(input_path, output_path)
        print(f"Successfully cleaned image and saved to {output_path}")
    except Exception as e:
        print(f"Error processing image: {str(e)}")
        print("Please check the input image path and ensure the image exists.")
if __name__ == "__main__":
    input_path = "predicted_image.jpg"  # Replace with your input image path
    output_path = "cleaned_image.jpg"   # Replace with desired output path
    
    try:
        cleaned_img = remove_detection_boxes(input_path, output_path)
        print(f"Successfully cleaned image and saved to {output_path}")
    except Exception as e:
        print(f"Error processing image: {str(e)}")
        print("Please check the input image path and ensure the image exists.")
