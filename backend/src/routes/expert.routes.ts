import { Router } from 'express';
import { getExpertDetail, getExperts, getFarmers } from '../controllers/expert.controller';
import { auth } from '../middleware/auth.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Experts
 *   description: Expert user management
 */

/**
 * @swagger
 * /api/experts:
 *   get:
 *     summary: Get list of expert users
 *     tags: [Experts]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by expert name
 *       - in: query
 *         name: online
 *         schema:
 *           type: boolean
 *         description: Filter by online status
 *       - in: query
 *         name: expertise
 *         schema:
 *           type: string
 *         description: Filter by expertise
 *     responses:
 *       200:
 *         description: List of experts
 */
router.get('/', getExperts);

/**
 * @swagger
 * /api/experts/{id}:
 *   get:
 *     summary: Get expert detail with suggestions
 *     tags: [Experts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Expert ID
 *     responses:
 *       200:
 *         description: Expert detail
 */
router.get('/:id', getExpertDetail);

/**
 * @swagger
 * /api/experts/farmers/list:
 *   get:
 *     summary: Get list of farmers (for experts)
 *     tags: [Experts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of farmers
 */
router.get('/farmers/list', auth, getFarmers);

export default router;

