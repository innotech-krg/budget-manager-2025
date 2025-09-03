// =====================================================
// Tag Selector Component
// Story 1.6: Centralized Tag Management
// =====================================================

import React, { useState, useEffect } from 'react';
import { Tag, tagApi } from '../../services/tagApi';

interface TagSelectorProps {
  selectedTags: Tag[];
  onTagsChange: (tags: Tag[]) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

const TagSelector: React.FC<TagSelectorProps> = ({
  selectedTags,
  onTagsChange,
  disabled = false,
  placeholder = "Tags auswählen...",
  className = ""
}) => {
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load available tags
  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      setLoading(true);
      setError(null);
      const tags = await tagApi.getTags();
      setAvailableTags(tags);
    } catch (err) {
      console.error('Error loading tags:', err);
      setError('Fehler beim Laden der Tags');
    } finally {
      setLoading(false);
    }
  };

  // Filter tags based on search term
  const filteredTags = availableTags.filter(tag =>
    tag.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !selectedTags.some(selected => selected.id === tag.id)
  );

  // Group tags by category
  const groupedTags = filteredTags.reduce((groups, tag) => {
    const category = tag.category || 'Andere';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(tag);
    return groups;
  }, {} as Record<string, Tag[]>);

  const handleTagSelect = (tag: Tag) => {
    const newSelectedTags = [...selectedTags, tag];
    onTagsChange(newSelectedTags);
    setSearchTerm('');
  };

  const handleTagRemove = (tagId: string) => {
    const newSelectedTags = selectedTags.filter(tag => tag.id !== tagId);
    onTagsChange(newSelectedTags);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Selected Tags Display */}
      <div className="flex flex-wrap gap-2 mb-2">
        {selectedTags.map(tag => (
          <span
            key={tag.id}
            className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
            style={{
              backgroundColor: tag.color ? `${tag.color}20` : undefined,
              color: tag.color || undefined
            }}
          >
            {tag.name}
            {!disabled && (
              <button
                type="button"
                onClick={() => handleTagRemove(tag.id)}
                className="ml-2 text-blue-600 hover:text-blue-800"
              >
                ×
              </button>
            )}
          </span>
        ))}
      </div>

      {/* Tag Input/Dropdown */}
      {!disabled && (
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          {/* Dropdown */}
          {isOpen && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
              {loading && (
                <div className="px-3 py-2 text-gray-500">
                  Lade Tags...
                </div>
              )}

              {error && (
                <div className="px-3 py-2 text-red-500">
                  {error}
                  <button
                    onClick={loadTags}
                    className="ml-2 text-blue-500 hover:text-blue-700"
                  >
                    Erneut versuchen
                  </button>
                </div>
              )}

              {!loading && !error && Object.keys(groupedTags).length === 0 && (
                <div className="px-3 py-2 text-gray-500">
                  {searchTerm ? 'Keine Tags gefunden' : 'Keine verfügbaren Tags'}
                </div>
              )}

              {!loading && !error && Object.entries(groupedTags).map(([category, tags]) => (
                <div key={category}>
                  <div className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase bg-gray-50">
                    {category}
                  </div>
                  {tags.map(tag => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => handleTagSelect(tag)}
                      className="w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none flex items-center"
                    >
                      {tag.color && (
                        <span
                          className="w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: tag.color }}
                        />
                      )}
                      <span className="flex-1">{tag.name}</span>
                      {tag.description && (
                        <span className="text-xs text-gray-500 ml-2">
                          {tag.description}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default TagSelector;

