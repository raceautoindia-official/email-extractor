const express = require("express");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const xlsx = require("xlsx");
const { validate } = require("email-validator");

const app = express();
const port = 5000;
app.use(cors());

// Configure Multer for file uploads
const upload = multer({ dest: "uploads/" });

// Utility function to extract emails from text
const extractEmails = (text) => {
    const emailRegex = /:?([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}),?/g;
    const matches = [...text.matchAll(emailRegex)];
    return matches.map(match => match[1].trim());
};

// Process uploaded PDF(s)
app.post("/upload", upload.array("pdfs"), async (req, res) => {
    try {
        console.log("Upload initiated");
        const files = req.files;
        let validEmails = new Set();
        let invalidEmails = new Set();

        console.log("Files fetched from request");

        for (const file of files) {
            const dataBuffer = fs.readFileSync(file.path);
            const pdfData = await pdfParse(dataBuffer);
            const emails = extractEmails(pdfData.text);
            
            emails.forEach((email) => {
                if (validate(email)) {
                    validEmails.add(email);
                } else {
                    invalidEmails.add(email);
                }
            });

            fs.unlinkSync(file.path); // Delete file after processing
        }
        console.log("File processed and deleted");

        // Convert email lists to Excel
        const createExcelFile = (emails, fileName) => {
            const workbook = xlsx.utils.book_new();
            const worksheet = xlsx.utils.aoa_to_sheet([["Emails"], ...Array.from(emails).map(email => [email])]);
            xlsx.utils.book_append_sheet(workbook, worksheet, "Emails");
            const filePath = path.join("uploads", fileName);
            xlsx.writeFile(workbook, filePath);
            return filePath;
        };

        const validFilePath = createExcelFile(validEmails, "valid_emails.xlsx");
        const invalidFilePath = createExcelFile(invalidEmails, "invalid_emails.xlsx");
        
        console.log("Excel files created successfully");

        res.json({
            message: "Emails processed successfully",
            validEmails: "/download/valid",
            invalidEmails: "/download/invalid"
        });
    } catch (error) {
        console.error("Error processing PDFs:", error);
        res.status(500).json({ error: "Error processing PDF(s)" });
    }
});

// Endpoint to download valid emails file
app.get("/download/valid", (req, res) => {
    const filePath = path.join(__dirname, "uploads", "valid_emails.xlsx");
    res.download(filePath, "valid_emails.xlsx", () => {
        fs.unlinkSync(filePath);
    });
});

// Endpoint to download invalid emails file
app.get("/download/invalid", (req, res) => {
    const filePath = path.join(__dirname, "uploads", "invalid_emails.xlsx");
    res.download(filePath, "invalid_emails.xlsx", () => {
        fs.unlinkSync(filePath);
    });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});


// const express = require("express");
// const multer = require("multer");
// const pdfParse = require("pdf-parse");
// const cors = require('cors');
// const fs = require("fs");
// const path = require("path");
// const xlsx = require("xlsx");



// const app = express();
// const port = 5000;
// app.use(cors());

// // Configure Multer for file uploads
// const upload = multer({ dest: "uploads/" });

// // Utility function to extract emails from text
// const extractEmails = (text) => {
//   const emailRegex = /:?([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}),?/g;
//   const matches = [...text.matchAll(emailRegex)];
//   return matches.map(match => match[1].trim()); // Trim spaces before returning emails
// };
 
// // Process uploaded PDF(s)
// app.post("/upload", upload.array("pdfs"), async (req, res) => {
//   try {
//     console.log("upload initiated");
//     const files = req.files;
//     let allEmails = new Set();
//     console.log("files fetched from request");

//     for (const file of files) {
//       const dataBuffer = fs.readFileSync(file.path);
//       const pdfData = await pdfParse(dataBuffer);
//       const emails = extractEmails(pdfData.text);
//       emails.forEach((email) => allEmails.add(email));
//       fs.unlinkSync(file.path); // Delete file after processing
//     }
//     console.log("file processed and deleted");

//     // Convert email list to Excel
//     const workbook = xlsx.utils.book_new();
//     const worksheet = xlsx.utils.aoa_to_sheet([["Emails"], ...Array.from(allEmails).map((email) => [email])]);
//     xlsx.utils.book_append_sheet(workbook, worksheet, "Extracted Emails");
//     console.log("excel data is created");
//     // const filePath = path.join(__dirname, "output", "emails.xlsx");
//     const filePath = "uploads/emails.xlsx";
//     console.log("file path created:" + filePath);
//     try {
//       xlsx.writeFile(workbook, filePath);
//       console.log("list converted to excel file");
//     } catch (writeError) {
//       console.error("Error writing the Excel file:", writeError);
//       res.status(500).json({ error: "Error writing the Excel file" });
//     }

//     res.download(filePath, "emails.xlsx", () => {
//       fs.unlinkSync(filePath); // Delete Excel after download
//     });
//     console.log("file successfully deleted after download");
//   } catch (error) {
//     res.status(500).json({ error: "Error processing PDF(s)" });
//   }
// });

// app.listen(port, () => {
//   console.log(`Server running on port ${port}`);
// });
