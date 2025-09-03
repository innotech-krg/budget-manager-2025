// =====================================================
// Budget Manager 2025 - Tag Routes
// Phase 3: Centralized Tag Management API
// =====================================================

import express from 'express';
import { body, param, query } from 'express-validator';
import { validateRequest } from '../middleware/validateRequest.js';
import { rateLimitGeneral as rateLimiter } from '../middleware/rateLimiter.js';
import { performanceMonitoring } from '../middleware/advancedValidation.js';
import {
  getAllTags,
  createTag,
  updateTag,
  deleteTag,
  updateProjectTags
} from '../controllers/tagController.js';

const router = express.Router();

// =====================================================
// MIDDLEWARE CHAIN
// =====================================================

// Apply rate limiting to all tag routes
router.use(rateLimiter);

// Apply performance monitoring to all tag routes
router.use(performanceMonitoring);

// =====================================================
// VALIDATION RULES
// =====================================================

const createTagValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Tag name must be between 2 and 100 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be max 500 characters'),
  
  body('color')
    .optional()
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage('Color must be a valid hex color code (e.g., #3B82F6)')
];

const updateTagValidation = [
  param('id')
    .isUUID()
    .withMessage('Tag ID must be a valid UUID'),
  
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Tag name must be between 2 and 100 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be max 500 characters'),
  
  body('color')
    .optional()
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage('Color must be a valid hex color code'),
  
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be a boolean')
];

const deleteTagValidation = [
  param('id')
    .isUUID()
    .withMessage('Tag ID must be a valid UUID')
];

const updateProjectTagsValidation = [
  param('projectId')
    .isUUID()
    .withMessage('Project ID must be a valid UUID'),
  
  body('tag_ids')
    .isArray()
    .withMessage('tag_ids must be an array'),
  
  body('tag_ids.*')
    .isUUID()
    .withMessage('Each tag ID must be a valid UUID')
];

const getTagsValidation = [
  query('active_only')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('active_only must be true or false')
];

// =====================================================
// ROUTES
// =====================================================

/**
 * @route   GET /api/tags
 * @desc    Alle Tags abrufen
 * @access  Public
 */
router.get('/', getTagsValidation, validateRequest, getAllTags);

/**
 * @route   POST /api/tags
 * @desc    Neuen Tag erstellen
 * @access  Private
 */
router.post('/', createTagValidation, validateRequest, createTag);

/**
 * @route   PUT /api/tags/:id
 * @desc    Tag aktualisieren
 * @access  Private
 */
router.put('/:id', updateTagValidation, validateRequest, updateTag);

/**
 * @route   DELETE /api/tags/:id
 * @desc    Tag löschen (soft delete)
 * @access  Private
 */
router.delete('/:id', deleteTagValidation, validateRequest, deleteTag);

/**
 * @route   PUT /api/tags/projects/:projectId
 * @desc    Projekt-Tags verwalten
 * @access  Private
 */
router.put('/projects/:projectId', updateProjectTagsValidation, validateRequest, updateProjectTags);

// =====================================================
// ERROR HANDLING
// =====================================================

router.use((error, req, res, next) => {
  console.error('❌ Tag routes error:', error);
  res.status(500).json({
    error: 'Tag system error',
    message: 'An error occurred in the tag management system',
    code: 'TAG_SYSTEM_ERROR'
  });
});

export default router;