import { useState } from 'react';
import './App.css';
const uuid = require('uuid');

function App() {
  const [images, setImages] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [authResults, setAuthResults] = useState([]);

  async function sendImages(e) {
    e.preventDefault();
    if (images.length === 0) {
      setAuthResults([{ message: "No images selected. Please upload images." }]);
      return;
    }

    setAuthResults([]); // Clear previous results

    for (const image of images) {
      const studentImageName = uuid.v4();
      
      try {
        const uploadResponse = await fetch(
          `https://sv72kax1v2.execute-api.ap-southeast-1.amazonaws.com/host/utar-authentication-images/${studentImageName}.jpeg`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'image/jpeg' },
            body: image,
          }
        );

        if (!uploadResponse.ok) {
          throw new Error(`Upload Failed: ${uploadResponse.statusText}`);
        }

        console.log(`Image ${studentImageName} uploaded successfully`);

        // Call authentication after successful upload
        const authResponse = await authenticate(studentImageName);

        if (authResponse?.Message?.toLowerCase() === 'success') {
          setAuthResults(prevResults => [
            ...prevResults,
            { message: `Hi ${authResponse.firstName} ${authResponse.lastName}, you are authenticated!`, success: true }
          ]);
        } else {
          setAuthResults(prevResults => [
            ...prevResults,
            { message: "Authentication Failed", success: false }
          ]);
        }
      } catch (error) {
        setAuthResults(prevResults => [
          ...prevResults,
          { message: "Error in authentication process, try again later.", success: false }
        ]);
        console.error("Upload/Authentication Error:", error);
      }
    }
  }

  async function authenticate(studentImageName) {
  const requestUrl = `https://sv72kax1v2.execute-api.ap-southeast-1.amazonaws.com/host/students?${new URLSearchParams({
      objectKey: `${studentImageName}.jpeg`
  })}`;

  console.log("Requesting authentication:", requestUrl);

  try {
    const response = await fetch(requestUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    console.log("Response status:", response.status);

    if (!response.ok) {
      console.error("API Error:", response.statusText);
      return [];  // Return empty array if API call fails
    }

    const rawData = await response.json();
    console.log("Raw Response Data:", rawData);

    if (!rawData.body) {
      console.error("Invalid response format: Missing 'body' field");
      return [];
    }

    const data = JSON.parse(rawData.body);
    console.log("Parsed Response Data:", data);

    // Check if 'faces' key exists
    if (!data.faces || !Array.isArray(data.faces)) {
      console.error("Invalid response format: 'faces' key is missing or not an array");
      return [];
    }

    return data.faces;
  } catch (error) {
    console.error("API Fetch Error:", error);
    return [];
  }
}



  function handleImageChange(e) {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setImages(files);
      setPreviewUrls(files.map(file => URL.createObjectURL(file))); // Generate temporary URLs for preview
    }
  }

  return (
    <div className="App">
      <h2>FACIAL RECOGNITION ATTENDANCE SYSTEM</h2>
      <form onSubmit={sendImages}>
        <input type='file' name='images' accept="image/*" multiple onChange={handleImageChange} />
        <button type='submit'>Record Attendance</button>
      </form>

    <div>
      {authResults.length > 0 ? (
        authResults.map((result, index) => (
          <div key={index} className={result.success ? 'success' : 'failure'}>
            {result.message}
          </div>
        ))
      ) : (
        <div>No students recognized</div>
      )}
    </div>


      {/* Display uploaded image previews */}
      <div className="preview-container">
        {previewUrls.map((url, index) => (
          <img key={index} src={url} alt={`Uploaded Preview ${index}`} height={150} width={150} />
        ))}
      </div>
    </div>
  );
}

export default App;
