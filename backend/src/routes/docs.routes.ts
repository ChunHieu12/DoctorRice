import express from 'express';
import { getApiDocs, getSystemArchitecture } from '../controllers/docs.controller';

const router = express.Router();

/**
 * @swagger
 * /api/docs:
 *   get:
 *     summary: Get API documentation info
 *     tags: [Documentation]
 *     description: Returns information about available documentation
 *     responses:
 *       200:
 *         description: Documentation info retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                     swaggerUI:
 *                       type: string
 *                     systemArchitecture:
 *                       type: string
 *                     formats:
 *                       type: object
 */
router.get('/', getApiDocs);

/**
 * @swagger
 * /api/docs/detail:
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
 *       - `/api/docs/detail` - Returns raw markdown
 *       - `/api/docs/detail?format=html` - Returns formatted HTML
 *       - `/api/docs/detail?format=json` - Returns JSON with metadata
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
router.get('/detail', getSystemArchitecture);

export default router;

