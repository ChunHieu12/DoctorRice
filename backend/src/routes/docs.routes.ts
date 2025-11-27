import express from 'express';
import { getSystemArchitecture } from '../controllers/docs.controller';

const router = express.Router();

/**
 * @swagger
 * /api/detail:
 *   get:
 *     summary: Get system architecture documentation
 *     tags: [Documentation]
 *     description: |
 *       Returns the complete system architecture documentation in various formats.
 *       
 *       Supported formats:
 *       - `markdown` (default): Raw markdown text
 *       - `html`: Formatted HTML with styling
 *       - `json`: JSON object with metadata
 *       
 *       Usage:
 *       - `/api/detail` - Returns raw markdown
 *       - `/api/detail?format=html` - Returns formatted HTML
 *       - `/api/detail?format=json` - Returns JSON with metadata
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [markdown, html, json]
 *         description: Output format (default markdown)
 *     responses:
 *       200:
 *         description: Documentation retrieved successfully
 *         content:
 *           text/markdown:
 *             schema:
 *               type: string
 *           text/html:
 *             schema:
 *               type: string
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: string
 *                     content:
 *                       type: string
 *                     format:
 *                       type: string
 *                     lastModified:
 *                       type: string
 *                       format: date-time
 *       404:
 *         description: Documentation file not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: object
 */
router.get('/', getSystemArchitecture);

export default router;

