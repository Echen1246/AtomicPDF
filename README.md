# AtomicPDF

**Professional PDF Editor** - A modern, privacy-focused PDF editing application built with React and TypeScript.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18.3.1-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-4.9.5-blue.svg)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.0-blue.svg)

## ✨ Features

### 📝 **Annotation Tools**
- **Text Tool**: Add formatted text boxes with customizable fonts, sizes, and colors
- **Highlight Tool**: Multiple colors with adjustable thickness (10-25px)
- **Draw Tool**: Free-hand drawing with various colors and pen sizes (1-8px)
- **Eraser Tool**: Precise annotation removal with 15px threshold

### 📄 **Page Operations**
- **Rotate Pages**: 360° rotation (0° → 90° → 180° → 270°) while staying on current page
- **Move Pages**: Relocate pages to any position within the document
- **Merge PDFs**: Combine multiple PDF files into one document
- **Collate PDF**: Extract specific page ranges as new documents

### 💾 **Export Options**
- **PDF Export**: With or without annotations embedded
- **Image Export**: Convert pages to PNG format
- **Word Export**: Extract content to text format
- **Excel Export**: Generate CSV files with page and annotation data
- **Configurable Settings**: Toggle annotations, formatting, and web optimization

### 🔒 **Privacy & Security**
- **Local-only Processing**: All PDF operations happen in your browser
- **No Server Uploads**: Your documents never leave your device
- **Client-side Annotations**: Annotations stored locally until export

## 🚀 Getting Started

### Prerequisites
- Node.js 16.x or higher
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Echen1246/AtomicPDF.git
   cd AtomicPDF
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Open in browser**
   Navigate to `http://localhost:3000`

### Build for Production
```bash
npm run build
```

## 🎯 Usage

### Basic Workflow
1. **Upload PDF**: Click the upload area or drag & drop a PDF file
2. **Select Tool**: Choose from text, highlight, draw, or eraser tools
3. **Annotate**: Click and interact with the PDF to add annotations
4. **Page Operations**: Use the Pages tab for rotation, moving, merging, or collating
5. **Export**: Save your work using the Export tab with customizable settings

### Tool-Specific Instructions

#### Text Tool
- Drag to create a text box
- Type your content
- Use sidebar controls for font, size, color, and formatting
- Press Ctrl+Enter to save or Esc to cancel

#### Highlight Tool
- Choose color and thickness from sidebar
- Click and drag to highlight text areas
- Supports multiple colors: yellow, green, magenta, cyan, orange

#### Draw Tool
- Select pen color and size
- Click and drag to draw freehand
- Available colors: red, black, blue, green, magenta, orange, purple

#### Eraser Tool
- Click on annotations to remove them
- 15px threshold for easy selection
- Drag to continuously erase multiple annotations

## 🛠️ Technology Stack

### Frontend
- **React 18.3.1**: Modern React with hooks and functional components
- **TypeScript**: Type-safe development
- **Tailwind CSS 3.4.0**: Utility-first CSS framework
- **Lucide React**: Modern icon library

### PDF Processing
- **react-pdf 10.0.1**: PDF rendering and display
- **pdfjs-dist 5.3.31**: Core PDF.js functionality
- **pdf-lib**: PDF manipulation and operations

### Build Tools
- **Create React App**: Project foundation
- **CRACO**: Webpack configuration customization
- **PostCSS**: CSS processing

## 📁 Project Structure

```
src/
├── components/
│   ├── AnnotationLayer.tsx    # Canvas overlay for annotations
│   ├── PDFViewer.tsx          # Main PDF display component
│   └── Sidebar.tsx            # Tool and settings sidebar
├── utils/
│   ├── pdfExport.ts           # PDF export with annotations
│   ├── pdfOperations.ts       # Page operations (rotate, merge, etc.)
│   └── exportUtils.ts         # Multi-format export utilities
├── App.tsx                    # Main application component
└── index.tsx                  # Application entry point
```

## 🔧 Configuration

### PDF.js Worker Setup
The application uses a local PDF.js worker for offline functionality:
- Worker files located in `/public/pdf.worker.min.js`
- CRACO configuration handles webpack integration
- No CDN dependencies for improved reliability

### Tailwind CSS
Custom configuration with:
- Extended color palette for annotations
- Responsive design utilities
- Custom animation classes

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm install -g vercel
vercel --prod
```

### Netlify
```bash
npm run build
# Upload build/ folder to Netlify
```

### GitHub Pages
```bash
npm install --save-dev gh-pages
npm run build
npm run deploy
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📋 Roadmap

- [ ] **Advanced Text Editing**: Rich text formatting, tables, and lists
- [ ] **Collaborative Editing**: Real-time multi-user annotations
- [ ] **Cloud Storage**: Optional integration with Google Drive, Dropbox
- [ ] **Mobile App**: React Native version for iOS/Android
- [ ] **OCR Integration**: Text recognition and extraction
- [ ] **Digital Signatures**: Secure document signing
- [ ] **Form Filling**: Interactive PDF form support

## 🐛 Known Issues

- Large PDFs (>50MB) may experience slower rendering
- Text extraction for Word export is placeholder-based
- Mobile touch events need optimization for drawing tools

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [PDF.js](https://github.com/mozilla/pdf.js) - PDF rendering engine
- [pdf-lib](https://github.com/Hopding/pdf-lib) - PDF manipulation library
- [React PDF](https://github.com/wojtekmaj/react-pdf) - React PDF integration
- [Tailwind CSS](https://tailwindcss.com) - CSS framework
- [Lucide](https://lucide.dev) - Icon library

## 📧 Contact

**Project Link**: [https://github.com/Echen1246/AtomicPDF](https://github.com/Echen1246/AtomicPDF)

---

**AtomicPDF** - Professional PDF editing, reimagined for the modern web. 🚀
