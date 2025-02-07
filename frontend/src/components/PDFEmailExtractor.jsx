import { useState } from "react";
import axios from "axios";

function PDFEmailExtractor() {
  const [selectedFiles, setSelectedFiles] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [downloadLink, setDownloadLink] = useState(null);

  const handleFileChange = (event) => {
    setSelectedFiles(event.target.files);
  };

  const handleUpload = async () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      setError("Please select at least one PDF file.");
      return;
    }
    setUploading(true);
    setError(null);
    setDownloadLink(null);
    
    const formData = new FormData();
    Array.from(selectedFiles).forEach((file) => formData.append("pdfs", file));
    
    try {
      const response = await axios.post("http://localhost:5000/upload", formData, {
        responseType: "blob", // Expect binary file response
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      // Create a URL for the file download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      setDownloadLink(url);
    } catch (err) {
        console.log(err);
      setError("Failed to process PDF files. Please try again.");
    }
    setUploading(false);
  };

  return (
    <div className="flex flex-col items-center p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">PDF Email Extractor</h1>
      <input type="file" multiple accept=".pdf" onChange={handleFileChange} className="mb-4 border p-2" />
      <button 
        onClick={handleUpload} 
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
        disabled={uploading}
      >
        {uploading ? "Uploading..." : "Upload PDF(s)"}
      </button>
      {error && <p className="text-red-500 mt-2">{error}</p>}
      {downloadLink && (
        <a 
          href={downloadLink} 
          download="emails.xlsx" 
          className="mt-4 bg-green-500 text-white px-4 py-2 rounded inline-block"
        >
          Download Extracted Emails
        </a>
      )}
    </div>
  );
}

export default PDFEmailExtractor;
