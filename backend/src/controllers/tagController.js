// =====================================================
// Budget Manager 2025 - Tag Controller
// Phase 3: Centralized Tag Management
// =====================================================

import { supabaseAdmin } from '../config/database.js'

/**
 * Alle Tags abrufen
 */
export const getAllTags = async (req, res) => {
  try {
    console.log('📥 GET /api/tags')
    
    const { active_only = 'true' } = req.query
    
    let query = supabaseAdmin
      .from('tags')
      .select('*')
      .order('name')
    
    if (active_only === 'true') {
      query = query.eq('is_active', true)
    }
    
    const { data: tags, error } = await query
    
    if (error) {
      console.error('❌ Database error:', error)
      return res.status(500).json({
        error: 'Database error',
        message: 'Failed to fetch tags',
        code: 'DATABASE_ERROR'
      })
    }
    
    console.log(`✅ ${tags.length} Tags loaded`)
    
    res.json({
      success: true,
      data: tags,
      count: tags.length
    })
  } catch (error) {
    console.error('❌ Error fetching tags:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch tags',
      code: 'INTERNAL_ERROR'
    })
  }
}

/**
 * Tag erstellen
 */
export const createTag = async (req, res) => {
  try {
    console.log('📥 POST /api/tags')
    
    const { name, description, color = '#3B82F6' } = req.body
    
    // Prüfe ob Tag bereits existiert
    const { data: existingTag } = await supabaseAdmin
      .from('tags')
      .select('id')
      .eq('name', name)
      .single()
    
    if (existingTag) {
      return res.status(400).json({
        error: 'Tag already exists',
        message: `Tag with name "${name}" already exists`,
        code: 'DUPLICATE_TAG'
      })
    }
    
    const { data: newTag, error } = await supabaseAdmin
      .from('tags')
      .insert([{
        name,
        description,
        color,
        is_active: true
      }])
      .select('*')
      .single()
    
    if (error) {
      console.error('❌ Database error:', error)
      return res.status(500).json({
        error: 'Database error',
        message: 'Failed to create tag',
        code: 'DATABASE_ERROR'
      })
    }
    
    console.log(`✅ Tag created: ${newTag.name}`)
    
    res.status(201).json({
      success: true,
      data: newTag,
      message: 'Tag created successfully'
    })
  } catch (error) {
    console.error('❌ Error creating tag:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create tag',
      code: 'INTERNAL_ERROR'
    })
  }
}

/**
 * Tag aktualisieren
 */
export const updateTag = async (req, res) => {
  try {
    const { id } = req.params
    const { name, description, color, is_active } = req.body
    
    console.log(`📥 PUT /api/tags/${id}`)
    
    // Prüfe ob anderer Tag mit gleichem Namen existiert
    if (name) {
      const { data: existingTag } = await supabaseAdmin
        .from('tags')
        .select('id')
        .eq('name', name)
        .neq('id', id)
        .single()
      
      if (existingTag) {
        return res.status(400).json({
          error: 'Tag name already exists',
          message: `Another tag with name "${name}" already exists`,
          code: 'DUPLICATE_TAG_NAME'
        })
      }
    }
    
    const updateData = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (color !== undefined) updateData.color = color
    if (is_active !== undefined) updateData.is_active = is_active
    
    const { data: updatedTag, error } = await supabaseAdmin
      .from('tags')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single()
    
    if (error) {
      console.error('❌ Database error:', error)
      return res.status(500).json({
        error: 'Database error',
        message: 'Failed to update tag',
        code: 'DATABASE_ERROR'
      })
    }
    
    if (!updatedTag) {
      return res.status(404).json({
        error: 'Tag not found',
        message: `Tag with ID ${id} not found`,
        code: 'TAG_NOT_FOUND'
      })
    }
    
    console.log(`✅ Tag updated: ${updatedTag.name}`)
    
    res.json({
      success: true,
      data: updatedTag,
      message: 'Tag updated successfully'
    })
  } catch (error) {
    console.error('❌ Error updating tag:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update tag',
      code: 'INTERNAL_ERROR'
    })
  }
}

/**
 * Tag löschen (soft delete)
 */
export const deleteTag = async (req, res) => {
  try {
    const { id } = req.params
    
    console.log(`📥 DELETE /api/tags/${id}`)
    
    // Prüfe ob Tag in Projekten verwendet wird
    const { data: projectTags, error: projectTagsError } = await supabaseAdmin
      .from('project_tags')
      .select('project_id')
      .eq('tag_id', id)
      .limit(1)
    
    if (projectTagsError) {
      console.error('❌ Database error:', projectTagsError)
      return res.status(500).json({
        error: 'Database error',
        message: 'Failed to check tag usage',
        code: 'DATABASE_ERROR'
      })
    }
    
    if (projectTags && projectTags.length > 0) {
      return res.status(400).json({
        error: 'Tag in use',
        message: 'Cannot delete tag that is assigned to projects',
        code: 'TAG_IN_USE'
      })
    }
    
    // Soft delete - setze is_active auf false
    const { data: deletedTag, error } = await supabaseAdmin
      .from('tags')
      .update({ is_active: false })
      .eq('id', id)
      .select('*')
      .single()
    
    if (error) {
      console.error('❌ Database error:', error)
      return res.status(500).json({
        error: 'Database error',
        message: 'Failed to delete tag',
        code: 'DATABASE_ERROR'
      })
    }
    
    if (!deletedTag) {
      return res.status(404).json({
        error: 'Tag not found',
        message: `Tag with ID ${id} not found`,
        code: 'TAG_NOT_FOUND'
      })
    }
    
    console.log(`✅ Tag deactivated: ${deletedTag.name}`)
    
    res.json({
      success: true,
      message: 'Tag deactivated successfully'
    })
  } catch (error) {
    console.error('❌ Error deleting tag:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to delete tag',
      code: 'INTERNAL_ERROR'
    })
  }
}

/**
 * Projekt-Tags verwalten
 */
export const updateProjectTags = async (req, res) => {
  try {
    const { projectId } = req.params
    const { tag_ids } = req.body
    
    console.log(`📥 PUT /api/tags/projects/${projectId}`)
    
    // Prüfe ob Projekt existiert
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .single()
    
    if (projectError || !project) {
      return res.status(404).json({
        error: 'Project not found',
        message: `Project with ID ${projectId} not found`,
        code: 'PROJECT_NOT_FOUND'
      })
    }
    
    // Entferne alle existierenden Tags für das Projekt
    const { error: deleteError } = await supabaseAdmin
      .from('project_tags')
      .delete()
      .eq('project_id', projectId)
    
    if (deleteError) {
      console.error('❌ Database error:', deleteError)
      return res.status(500).json({
        error: 'Database error',
        message: 'Failed to update project tags',
        code: 'DATABASE_ERROR'
      })
    }
    
    // Füge neue Tags hinzu
    if (tag_ids && tag_ids.length > 0) {
      const projectTags = tag_ids.map(tag_id => ({
        project_id: projectId,
        tag_id
      }))
      
      const { error: insertError } = await supabaseAdmin
        .from('project_tags')
        .insert(projectTags)
      
      if (insertError) {
        console.error('❌ Database error:', insertError)
        return res.status(500).json({
          error: 'Database error',
          message: 'Failed to assign tags to project',
          code: 'DATABASE_ERROR'
        })
      }
    }
    
    // Lade aktualisierte Tags
    const { data: updatedTags, error: tagsError } = await supabaseAdmin
      .from('project_tags')
      .select(`
        tag_id,
        tags (
          id,
          name,
          description,
          color
        )
      `)
      .eq('project_id', projectId)
    
    if (tagsError) {
      console.error('❌ Database error:', tagsError)
      return res.status(500).json({
        error: 'Database error',
        message: 'Failed to fetch updated tags',
        code: 'DATABASE_ERROR'
      })
    }
    
    const tags = updatedTags.map(pt => pt.tags)
    
    console.log(`✅ Project tags updated: ${tags.length} tags assigned`)
    
    res.json({
      success: true,
      data: tags,
      message: 'Project tags updated successfully'
    })
  } catch (error) {
    console.error('❌ Error updating project tags:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update project tags',
      code: 'INTERNAL_ERROR'
    })
  }
}

export default {
  getAllTags,
  createTag,
  updateTag,
  deleteTag,
  updateProjectTags
}
