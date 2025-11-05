# PDF / Image Text Extractor

A web application for extracting text from PDF or image files, with support for Optical Character Recognition (OCR) using Tesseract.js. The extracted text can also be translated into English using the LibreTranslate API.

## Features

- **Extract text from PDFs**: Handles both text-based PDFs and image-based PDFs using OCR.
- **Extract text from Images**: Supports image files for OCR text extraction.
- **Translation**: Translates the extracted text into English using the LibreTranslate API.
- **Progress Bar**: Displays the progress of the extraction process.

## Tech Stack

- **React**: JavaScript library for building user interfaces.
- **Tesseract.js**: OCR (Optical Character Recognition) for extracting text from images or scanned PDFs.
- **pdf.js**: PDF rendering library to extract text from PDF documents.
- **LibreTranslate API**: For translating extracted text into English.
- **Tailwind CSS**: Utility-first CSS framework for styling.
- **Radix UI**: Component library used for UI elements like progress bars.

## Installation

### Prerequisites

Make sure you have [Node.js](https://nodejs.org/) installed.

### Steps to Install

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/pdf-image-text-extractor.git
   cd pdf-image-text-extractor
   ```

2. Install the required dependencies:

   ```bash
   npm install
   ```

3. Run the application in development mode:

   ```bash
   npm run dev
   ```

4. Navigate to [http://localhost:3000](http://localhost:3000) in your browser to access the app.
