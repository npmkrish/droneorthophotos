// Pie Chart Initialization
const pieCtx = document.getElementById('pieChart').getContext('2d');
new Chart(pieCtx, {
  type: 'pie',
  data: {
    labels: ['Buildings', 'Roads', 'Vegetation'],
    datasets: [
      {
        data: [8, 4, 3],
        backgroundColor: ['#ff6f61', '#f7c948', '#5bc0de'],
        borderWidth: 1,
      },
    ],
  },
  options: {
    plugins: {
      legend: {
        position: 'top',
      },
    },
    responsive: true,
    maintainAspectRatio: false,
  },
});

// Bar Chart Initialization
const barCtx = document.getElementById('barChart').getContext('2d');
new Chart(barCtx, {
  type: 'bar',
  data: {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Total Uploads',
        data: [120, 150, 200, 250, 270, 300],
        backgroundColor: '#ff6f61',
        borderWidth: 1,
      },
      {
        label: 'Successful Detections',
        data: [110, 140, 190, 240, 260, 290],
        backgroundColor: '#5bc0de',
        borderWidth: 1,
      },
    ],
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  },
});

// Image Upload and Backend Interaction
document.getElementById('upload-form').addEventListener('submit', async (event) => {
  event.preventDefault();

  const formData = new FormData();
  const fileInput = document.getElementById('file-input');

  // Check if a file is selected
  if (!fileInput.files.length) {
    alert('Please select an image to upload.');
    return;
  }

  formData.append('image', fileInput.files[0]);

  try {
    // Send image to backend
    const response = await fetch('http://127.0.0.1:5000/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Server returned status ${response.status}`);
    }

    const data = await response.json();

    // Dynamically update UI with backend response data
    document.getElementById('confidence-score').innerText = `${data.confidence_score}%`;
    document.getElementById('objects-detected').innerText = data.objects_detected;
    document.getElementById('processing-time').innerText = `${data.processing_time} sec`;

    const warningsList = document.getElementById('warnings-list');
    warningsList.innerHTML = ''; // Clear old warnings
    data.warnings.forEach((warning) => {
      const li = document.createElement('li');
      li.innerText = `${warning.type}: ${warning.confidence}%`;
      warningsList.appendChild(li);
    });

    document.getElementById('total-images').innerText = data.total_images;
    document.getElementById('pending-images').innerText = data.pending;
    document.getElementById('success-rate').innerText = `${data.success_rate}%`;

  } catch (error) {
    console.error('Error uploading image:', error);
    alert('An error occurred while uploading the image. Please try again.');
  }
});
