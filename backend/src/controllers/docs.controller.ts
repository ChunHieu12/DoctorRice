import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';

/**
 * Get system architecture documentation
 */
export const getSystemArchitecture = async (_req: Request, res: Response) => {
  try {
    // Path to SYSTEM_ARCHITECTURE.md in project root
    const docPath = path.join(__dirname, '../../../SYSTEM_ARCHITECTURE.md');
    
    // Check if file exists
    if (!fs.existsSync(docPath)) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Documentation file not found',
        },
      });
    }

    // Read markdown file
    const markdownContent = fs.readFileSync(docPath, 'utf-8');

    // Get format from query parameter (default: markdown)
    const format = _req.query.format || 'markdown';

    if (format === 'html') {
      // Return as HTML (we'll use a simple markdown to HTML converter)
      const htmlContent = convertMarkdownToHTML(markdownContent);
      
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(htmlContent);
    } else if (format === 'json') {
      // Return as JSON
      return res.json({
        success: true,
        data: {
          title: 'Bác sĩ Lúa - System Architecture Documentation',
          content: markdownContent,
          format: 'markdown',
          lastModified: fs.statSync(docPath).mtime,
        },
      });
    } else {
      // Return raw markdown (default)
      res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
      return res.send(markdownContent);
    }
  } catch (error: any) {
    logger.error('Error serving documentation:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to load documentation',
      },
    });
  }
};

/**
 * Simple Markdown to HTML converter
 * For production, consider using a library like 'marked'
 */
function convertMarkdownToHTML(markdown: string): string {
  // Basic HTML template with styling
  const htmlTemplate = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bác sĩ Lúa - System Architecture</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #f5f5f5;
      padding: 20px;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    
    h1 {
      color: #4CAF50;
      font-size: 2.5em;
      margin-bottom: 0.5em;
      border-bottom: 3px solid #4CAF50;
      padding-bottom: 0.3em;
    }
    
    h2 {
      color: #2E7D32;
      font-size: 2em;
      margin-top: 1.5em;
      margin-bottom: 0.5em;
      border-bottom: 2px solid #E8F5E9;
      padding-bottom: 0.3em;
    }
    
    h3 {
      color: #388E3C;
      font-size: 1.5em;
      margin-top: 1.2em;
      margin-bottom: 0.5em;
    }
    
    h4 {
      color: #43A047;
      font-size: 1.2em;
      margin-top: 1em;
      margin-bottom: 0.5em;
    }
    
    p {
      margin-bottom: 1em;
    }
    
    code {
      background: #f4f4f4;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
      font-size: 0.9em;
      color: #c7254e;
    }
    
    pre {
      background: #2d2d2d;
      color: #f8f8f2;
      padding: 20px;
      border-radius: 5px;
      overflow-x: auto;
      margin: 1em 0;
      line-height: 1.5;
    }
    
    pre code {
      background: none;
      color: #f8f8f2;
      padding: 0;
    }
    
    ul, ol {
      margin-left: 2em;
      margin-bottom: 1em;
    }
    
    li {
      margin-bottom: 0.5em;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1em 0;
    }
    
    table th, table td {
      border: 1px solid #ddd;
      padding: 12px;
      text-align: left;
    }
    
    table th {
      background: #4CAF50;
      color: white;
      font-weight: bold;
    }
    
    table tr:nth-child(even) {
      background: #f9f9f9;
    }
    
    blockquote {
      border-left: 4px solid #4CAF50;
      padding-left: 1em;
      margin: 1em 0;
      color: #666;
      font-style: italic;
    }
    
    a {
      color: #4CAF50;
      text-decoration: none;
    }
    
    a:hover {
      text-decoration: underline;
    }
    
    .toc {
      background: #E8F5E9;
      padding: 20px;
      border-radius: 5px;
      margin-bottom: 2em;
    }
    
    .toc h2 {
      margin-top: 0;
      border: none;
    }
    
    .badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 3px;
      font-size: 0.85em;
      font-weight: bold;
      margin-left: 5px;
    }
    
    .badge-success { background: #4CAF50; color: white; }
    .badge-warning { background: #FF9800; color: white; }
    .badge-danger { background: #F44336; color: white; }
    .badge-info { background: #2196F3; color: white; }
    
    @media (max-width: 768px) {
      .container {
        padding: 20px;
      }
      
      h1 { font-size: 2em; }
      h2 { font-size: 1.5em; }
      h3 { font-size: 1.3em; }
      
      pre {
        padding: 10px;
        font-size: 0.85em;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <pre>${escapeHtml(markdown)}</pre>
  </div>
  
  <script>
    // Add syntax highlighting for code blocks if needed
    document.addEventListener('DOMContentLoaded', function() {
      console.log('Documentation loaded successfully');
    });
  </script>
</body>
</html>
  `;

  return htmlTemplate;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}


