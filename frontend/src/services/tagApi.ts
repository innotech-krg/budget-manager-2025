// =====================================================
// Tag Management API Service
// Story 1.6: Centralized Tag Management
// =====================================================

const API_BASE_URL = 'http://localhost:3001/api';

export interface Tag {
  id: string;
  name: string;
  color?: string;
  category?: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateTagRequest {
  name: string;
  color?: string;
  category?: string;
  description?: string;
}

export interface UpdateTagRequest {
  name?: string;
  color?: string;
  category?: string;
  description?: string;
  is_active?: boolean;
}

export interface ProjectTag {
  id: string;
  project_id: string;
  tag_id: string;
  created_at: string;
}

class TagApiService {
  /**
   * Get all active tags
   */
  async getTags(category?: string): Promise<Tag[]> {
    const url = new URL(`${API_BASE_URL}/tags`);
    if (category) {
      url.searchParams.append('category', category);
    }

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Failed to fetch tags: ${response.statusText}`);
    }
    const result = await response.json();
    return result.data || result;
  }

  /**
   * Get all tag categories
   */
  async getTagCategories(): Promise<string[]> {
    const response = await fetch(`${API_BASE_URL}/tags/categories`);
    if (!response.ok) {
      throw new Error(`Failed to fetch tag categories: ${response.statusText}`);
    }
    return response.json();
  }

  /**
   * Create a new tag
   */
  async createTag(tagData: CreateTagRequest): Promise<Tag> {
    const response = await fetch(`${API_BASE_URL}/tags`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tagData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Failed to create tag: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Update a tag
   */
  async updateTag(id: string, tagData: UpdateTagRequest): Promise<Tag> {
    const response = await fetch(`${API_BASE_URL}/tags/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tagData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Failed to update tag: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Delete a tag (soft delete)
   */
  async deleteTag(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/tags/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Failed to delete tag: ${response.statusText}`);
    }
  }

  /**
   * Get tags for a specific project
   */
  async getProjectTags(projectId: string): Promise<Tag[]> {
    const response = await fetch(`${API_BASE_URL}/tags/projects/${projectId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch project tags: ${response.statusText}`);
    }
    return response.json();
  }

  /**
   * Add tags to a project
   */
  async addTagsToProject(projectId: string, tagIds: string[]): Promise<ProjectTag[]> {
    const response = await fetch(`${API_BASE_URL}/tags/projects/${projectId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tagIds }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Failed to add tags to project: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Remove a tag from a project
   */
  async removeTagFromProject(projectId: string, tagId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/tags/projects/${projectId}/${tagId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Failed to remove tag from project: ${response.statusText}`);
    }
  }
}

export const tagApi = new TagApiService();
export default tagApi;
