import { Router } from 'express';
import {
    approveReopen,
    completeConversation,
    deleteConversation,
    getConversations,
    getMessages,
    getOrCreateConversation,
    getUnreadCount,
    markMessagesAsRead,
    requestReopen,
    sendMessage,
    updateConversationStatus,
} from '../controllers/conversation.controller';
import { auth } from '../middleware/auth.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Conversation
 *   description: User-Expert conversation endpoints
 */

/**
 * @swagger
 * /api/conversations:
 *   get:
 *     summary: Get user conversations with experts
 *     tags: [Conversation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, answered, completed]
 *         description: Filter by conversation status
 *     responses:
 *       200:
 *         description: Conversations retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/', auth, getConversations);

/**
 * @swagger
 * /api/conversations/create:
 *   post:
 *     summary: Get or create conversation with an expert
 *     tags: [Conversation]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - expertId
 *             properties:
 *               expertId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Conversation retrieved/created successfully
 *       400:
 *         description: Expert ID required
 *       404:
 *         description: Expert not found
 */
router.post('/create', auth, getOrCreateConversation);

/**
 * @swagger
 * /api/conversations/unread-count:
 *   get:
 *     summary: Get total unread message count
 *     tags: [Conversation]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unread count retrieved
 */
router.get('/unread-count', auth, getUnreadCount);

/**
 * @swagger
 * /api/conversations/{conversationId}/messages:
 *   get:
 *     summary: Get messages for a conversation
 *     tags: [Conversation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Messages retrieved successfully
 *       404:
 *         description: Conversation not found
 */
router.get('/:conversationId/messages', auth, getMessages);

/**
 * @swagger
 * /api/conversations/{conversationId}/messages:
 *   post:
 *     summary: Send a message in conversation
 *     tags: [Conversation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [text, image]
 *                 default: text
 *     responses:
 *       201:
 *         description: Message sent successfully
 *       400:
 *         description: Content required
 *       404:
 *         description: Conversation not found
 */
router.post('/:conversationId/messages', auth, sendMessage);

/**
 * @swagger
 * /api/conversations/{conversationId}/status:
 *   put:
 *     summary: Update conversation status
 *     tags: [Conversation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, answered, completed]
 *     responses:
 *       200:
 *         description: Status updated successfully
 *       400:
 *         description: Invalid status
 *       404:
 *         description: Conversation not found
 */
router.put('/:conversationId/status', auth, updateConversationStatus);

/**
 * @swagger
 * /api/conversations/{conversationId}/complete:
 *   post:
 *     summary: Complete conversation with rating (farmer only)
 *     tags: [Conversation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rating
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *     responses:
 *       200:
 *         description: Conversation completed successfully
 */
router.post('/:conversationId/complete', auth, completeConversation);

/**
 * @swagger
 * /api/conversations/{conversationId}/reopen-request:
 *   post:
 *     summary: Request to reopen conversation (farmer only)
 *     tags: [Conversation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Reopen request sent successfully
 */
router.post('/:conversationId/reopen-request', auth, requestReopen);

/**
 * @swagger
 * /api/conversations/{conversationId}/reopen-approve:
 *   post:
 *     summary: Approve/reject reopen request (expert only)
 *     tags: [Conversation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - approved
 *             properties:
 *               approved:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Reopen request processed
 */
router.post('/:conversationId/reopen-approve', auth, approveReopen);

/**
 * @swagger
 * /api/conversations/{conversationId}/mark-read:
 *   post:
 *     summary: Mark messages as read
 *     tags: [Conversation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Messages marked as read
 */
router.post('/:conversationId/mark-read', auth, markMessagesAsRead);

/**
 * @swagger
 * /api/conversations/{conversationId}:
 *   delete:
 *     summary: Delete conversation and all its messages
 *     tags: [Conversation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Conversation deleted successfully
 *       404:
 *         description: Conversation not found
 */
router.delete('/:conversationId', auth, deleteConversation);

export default router;

