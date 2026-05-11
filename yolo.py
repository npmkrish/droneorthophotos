from ultralytics import YOLO 
model = YOLO('C:\Users\DEEPANSHU\OneDrive\Desktop\sih\yolov5s.pt')  # load a pretrained model (recommended for training)


# Run inference with the YOLOv8n model on the 'bus.jpg' image
results = model.predict(source='skin cancer.v1i.yolov8/valid/images/ISIC_0034214_jpg.rf.c662acf83f37ecba610c93bdbdf517d8.jpg',conf=0.25,save=True)
print(results)

model.show(results)
print(results[0].boxes.xyxy)  # print bounding box coordinates (xyxy format)
print(results[0].boxes.conf)   # print confidence scores
print(results[0].boxes.cls)    # print class labels
print(results[0].boxes)        # print all box attributes
print(results[0].masks)       # print segmentation masks (if available)
print(results[0].probs)       # print class probabilities (if available)
print(results[0].keypoints)   # print keypoints (if available)