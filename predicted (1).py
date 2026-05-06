import os

# Set the path to the 'runs/detect' folder
folder_path = r"runs/detect"

# List directories in the 'runs/detect' folder
directories = [folder for folder in os.listdir(folder_path) if os.path.isdir(os.path.join(folder_path, folder))]

# Check if there are any directories and get the last one.
if directories:
    # Get the last directory
    last_directory = directories[-1]
    last_directory_path = os.path.join(folder_path, last_directory)

    # List all file paths in the last directory
    file_paths = [os.path.join(last_directory_path, file) for file in os.listdir(last_directory_path) if os.path.isfile(os.path.join(last_directory_path, file))]
    
    # Print file paths
    for file_path in file_paths:
        print(file_path)
else:
    print("No directories found.")