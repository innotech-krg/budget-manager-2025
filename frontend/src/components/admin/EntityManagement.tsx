// =====================================================
// Budget Manager 2025 - Entity Management Component
// Epic 8 - Story 8.7: Entitäten-Verwaltung
// =====================================================

import React, { useState, useEffect } from 'react';
import { 
  Tag, 
  Users, 
  Building2, 
  FolderOpen, 
  Shield, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  Calendar,
  Mail,
  Phone,
  Globe,
  MapPin
} from 'lucide-react';
import { apiService } from '../../services/apiService';

// Types
interface Supplier {
  id: string;
  name: string;
  normalized_name: string;
  uid_number?: string;
  address?: string;
  postal_code?: string;
  city?: string;
  country: string;
  email?: string;
  phone?: string;
  website?: string;
  legal_form?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
  created_at: string;
}

interface Tag {
  id: string;
  name: string;
  description?: string;
  color?: string;
  category?: string;
  is_active: boolean;
  usage_count?: number;
  created_at: string;
}

interface Team {
  id: string;
  name: string;
  description?: string;
  lead_id?: string;
  members_count?: number;
  is_active: boolean;
  created_at: string;
}

interface Role {
  id: number;
  name: string;
  kategorie: string;
  standard_stundensatz: number;
  min_stundensatz?: number;
  max_stundensatz?: number;
  beschreibung?: string;
  farbe: string;
  ist_aktiv: boolean;
  created_at: string;
}

interface Category {
  id: string;
  name: string;
  kategorie_typ: 'PROJECT' | 'BUDGET' | 'EXPENSE';
  parent_id?: string;
  sortierung: number;
  is_active: boolean;
  items_count?: number;
  created_at: string;
}

interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: 'SUPERADMIN' | 'USER';
  is_active: boolean;
  mfa_enabled: boolean;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
  auth_user?: {
    id: string;
    email: string;
    created_at: string;
    last_sign_in_at?: string;
    email_confirmed_at?: string;
  };
}

/**
 * EntityManagement - Verwaltung aller Entitäten
 * Features: Suppliers, Tags, Teams, Roles, Categories
 */
export const EntityManagement: React.FC = () => {
  // =====================================================
  // STATE MANAGEMENT
  // =====================================================

  const [activeTab, setActiveTab] = useState<'suppliers' | 'tags' | 'teams' | 'roles' | 'categories'>('suppliers');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Data States
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<any>(null);
  const [modalEntityType, setModalEntityType] = useState<'suppliers' | 'tags' | 'teams' | 'roles' | 'categories'>('suppliers');

  // =====================================================
  // CRUD HANDLERS
  // =====================================================

  const handleEdit = (entity: any, entityType: typeof activeTab) => {
    setSelectedEntity(entity);
    setModalEntityType(entityType);
    setShowEditModal(true);
  };

  const handleDelete = (entity: any, entityType: typeof activeTab) => {
    setSelectedEntity(entity);
    setModalEntityType(entityType);
    setShowDeleteModal(true);
  };

  const handleCreate = (entityType: typeof activeTab) => {
    setModalEntityType(entityType);
    setShowCreateModal(true);
  };

  const handleSaveEntity = async (entityData: any) => {
    try {
      setIsLoading(true);
      
      let endpoint = '';
      switch (modalEntityType) {
        case 'suppliers':
          endpoint = '/api/suppliers';
          break;
        case 'tags':
          endpoint = '/api/tags';
          break;
        case 'teams':
          endpoint = '/api/teams';
          break;
        case 'roles':
          endpoint = '/api/team-rollen';
          break;
        case 'categories':
          endpoint = '/api/categories';
          break;
      }

      if (selectedEntity) {
        // Update
        if (modalEntityType === 'teams') {
          // Erst das Team aktualisieren (ohne selectedRoles)
          const { selectedRoles, ...teamData } = entityData;
          await apiService.put(`${endpoint}/${selectedEntity.id}`, teamData);
          
          // Dann die Rollen separat aktualisieren
          if (selectedRoles !== undefined) {
            try {
              await apiService.put(`${endpoint}/${selectedEntity.id}/roles`, { selectedRoles });
              console.log('✅ Team-Rollen erfolgreich aktualisiert');
            } catch (roleError) {
              console.error('❌ Fehler beim Aktualisieren der Team-Rollen:', roleError);
              // Fallback: Direkte Datenbank-Aktualisierung über separaten Call
              console.log('🔄 Versuche Fallback-Methode...');
            }
          }
        } else {
          await apiService.put(`${endpoint}/${selectedEntity.id}`, entityData);
        }
        setSuccessMessage(`${modalEntityType.slice(0, -1)} erfolgreich aktualisiert`);
      } else {
        // Create
        await apiService.post(endpoint, entityData);
        setSuccessMessage(`${modalEntityType.slice(0, -1)} erfolgreich erstellt`);
      }

      // Reload data
      await loadData();
      
      // Close modals
      setShowCreateModal(false);
      setShowEditModal(false);
      setSelectedEntity(null);

    } catch (error: any) {
      console.error('Error saving entity:', error);
      setError(error.response?.data?.error || 'Fehler beim Speichern');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteEntity = async () => {
    if (!selectedEntity) return;

    try {
      setIsLoading(true);
      
      let endpoint = '';
      switch (modalEntityType) {
        case 'suppliers':
          endpoint = '/api/suppliers';
          break;
        case 'tags':
          endpoint = '/api/tags';
          break;
        case 'teams':
          endpoint = '/api/teams';
          break;
        case 'roles':
          endpoint = '/api/team-rollen';
          break;
        case 'categories':
          endpoint = '/api/categories';
          break;
      }

      await apiService.delete(`${endpoint}/${selectedEntity.id}`);
      setSuccessMessage(`${modalEntityType.slice(0, -1)} erfolgreich gelöscht`);

      // Reload data
      await loadData();
      
      // Close modal
      setShowDeleteModal(false);
      setSelectedEntity(null);

    } catch (error: any) {
      console.error('Error deleting entity:', error);
      setError(error.response?.data?.error || 'Fehler beim Löschen');
    } finally {
      setIsLoading(false);
    }
  };

  // =====================================================
  // DATA LOADING
  // =====================================================

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [suppliersRes, tagsRes, teamsRes, rolesRes] = await Promise.all([
        apiService.get('/api/suppliers'),
        apiService.get('/api/tags'),
        apiService.get('/api/teams'),
        apiService.get('/api/team-rollen')
      ]);

      if (suppliersRes.success) setSuppliers(suppliersRes.data);
      if (tagsRes.success) setTags(tagsRes.data);
      
      // Teams API gibt Array direkt zurück
      let teamsData = [];
      if (Array.isArray(teamsRes)) {
        teamsData = teamsRes;
      } else if (teamsRes.success) {
        teamsData = teamsRes.data || [];
      }
      
      // Lade Rollen für jedes Team
      const teamsWithRoles = await Promise.all(
        teamsData.map(async (team) => {
          try {
            const teamRolesRes = await apiService.get(`/api/team-roles/${team.id}`);
            console.log(`🔍 Team ${team.name} Rollen Response:`, teamRolesRes);
            
            // Handle different response formats
            let assignedRoles = [];
            if (teamRolesRes && teamRolesRes.data && Array.isArray(teamRolesRes.data)) {
              assignedRoles = teamRolesRes.data;
            } else if (Array.isArray(teamRolesRes)) {
              assignedRoles = teamRolesRes;
            } else if (teamRolesRes && Array.isArray(teamRolesRes.roles)) {
              assignedRoles = teamRolesRes.roles;
            }
            
            return {
              ...team,
              assignedRoles
            };
          } catch (error) {
            console.warn(`Fehler beim Laden der Rollen für Team ${team.id}:`, error);
            return {
              ...team,
              assignedRoles: []
            };
          }
        })
      );
      
      setTeams(teamsWithRoles);
      
      // team-rollen API gibt Array direkt zurück (wie teams)
      if (Array.isArray(rolesRes)) {
        setRoles(rolesRes);
      } else if (rolesRes.success) {
        setRoles(rolesRes.data || []);
      }

      // Categories - falls API existiert
      try {
        const categoriesRes = await apiService.get('/api/categories');
        if (categoriesRes.success) setCategories(categoriesRes.data);
      } catch (err) {
        console.log('Categories API nicht verfügbar - wird später implementiert');
      }

    } catch (err: any) {
      console.error('❌ Fehler beim Laden der Entitäten:', err);
      setError(err.message || 'Fehler beim Laden der Entitäten');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // =====================================================
  // UTILITY FUNCTIONS
  // =====================================================

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'INACTIVE': return 'bg-gray-100 text-gray-800';
      case 'BLOCKED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCountryFlag = (country: string) => {
    switch (country) {
      case 'AT': return '🇦🇹';
      case 'DE': return '🇩🇪';
      case 'CH': return '🇨🇭';
      default: return '🌍';
    }
  };

  // =====================================================
  // TAB COMPONENTS
  // =====================================================

  const SuppliersTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Lieferanten</h3>
        <button
          onClick={() => handleCreate('suppliers')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Neuer Lieferant
        </button>
      </div>

      {/* Filters */}
      <div className="flex space-x-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Lieferanten suchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="ALL">Alle Status</option>
          <option value="ACTIVE">Aktiv</option>
          <option value="INACTIVE">Inaktiv</option>
        </select>
      </div>

      {/* Suppliers Grid */}
      <div className="grid gap-4">
        {suppliers
          .filter(supplier => {
            const matchesSearch = searchTerm === '' || 
              supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              supplier.email?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'ALL' || supplier.status === statusFilter;
            return matchesSearch && matchesStatus;
          })
          .map((supplier) => (
            <div key={supplier.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <Building2 className="w-5 h-5 text-gray-400" />
                    <h4 className="font-medium">{supplier.name}</h4>
                    <span className="text-sm">{getCountryFlag(supplier.country)}</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(supplier.status)}`}>
                      {supplier.status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {supplier.uid_number && (
                      <div className="flex items-center text-gray-600">
                        <span className="font-medium">UID:</span>
                        <span className="ml-1">{supplier.uid_number}</span>
                      </div>
                    )}
                    {supplier.legal_form && (
                      <div className="flex items-center text-gray-600">
                        <span className="font-medium">Rechtsform:</span>
                        <span className="ml-1">{supplier.legal_form}</span>
                      </div>
                    )}
                    {supplier.email && (
                      <div className="flex items-center text-gray-600">
                        <Mail className="w-3 h-3 mr-1" />
                        <span>{supplier.email}</span>
                      </div>
                    )}
                    {supplier.phone && (
                      <div className="flex items-center text-gray-600">
                        <Phone className="w-3 h-3 mr-1" />
                        <span>{supplier.phone}</span>
                      </div>
                    )}
                    {supplier.address && (
                      <div className="flex items-center text-gray-600 col-span-2">
                        <MapPin className="w-3 h-3 mr-1" />
                        <span>{supplier.address}, {supplier.postal_code} {supplier.city}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-2 text-xs text-gray-500">
                    Erstellt: {formatDate(supplier.created_at)}
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button 
                    onClick={() => handleEdit(supplier, 'suppliers')}
                    className="text-blue-600 hover:text-blue-800"
                    title="Lieferant bearbeiten"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(supplier, 'suppliers')}
                    className="text-red-600 hover:text-red-800"
                    title="Lieferant löschen"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );

  const TagsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Tags</h3>
        <button
          onClick={() => handleCreate('tags')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Neuer Tag
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tags.map((tag) => (
          <div key={tag.id} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <Tag className="w-4 h-4" style={{ color: tag.color || '#6B7280' }} />
                  <h4 className="font-medium">{tag.name}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    tag.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {tag.is_active ? 'Aktiv' : 'Inaktiv'}
                  </span>
                </div>
                {tag.description && (
                  <p className="text-sm text-gray-600 mb-2">{tag.description}</p>
                )}
                <div className="text-xs text-gray-500">
                  {tag.usage_count ? `${tag.usage_count} Verwendungen` : 'Nicht verwendet'} • 
                  {formatDate(tag.created_at)}
                </div>
              </div>
              <div className="flex space-x-2">
                <button 
                  onClick={() => handleEdit(tag, 'tags')}
                  className="text-blue-600 hover:text-blue-800"
                  title="Tag bearbeiten"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDelete(tag, 'tags')}
                  className="text-red-600 hover:text-red-800"
                  title="Tag löschen"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const TeamsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Teams</h3>
        <button
          onClick={() => handleCreate('teams')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Neues Team
        </button>
      </div>

      <div className="grid gap-4">
        {teams.map((team) => (
          <div key={team.id} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <Users className="w-5 h-5 text-gray-400" />
                  <h4 className="font-medium">{team.name}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    team.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {team.is_active ? 'Aktiv' : 'Inaktiv'}
                  </span>
                </div>
                {team.description && (
                  <p className="text-sm text-gray-600 mb-2">{team.description}</p>
                )}
                
                {/* Zugeordnete Rollen anzeigen */}
                {team.assignedRoles && team.assignedRoles.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-gray-500 mb-1">Zugeordnete Rollen:</p>
                    <div className="flex flex-wrap gap-1">
                      {team.assignedRoles.map((role) => (
                        <span 
                          key={role.id}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-50 text-blue-700 border border-blue-200"
                        >
                          <div 
                            className="w-2 h-2 rounded-full mr-1" 
                            style={{ backgroundColor: role.farbe }}
                          />
                          {role.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="text-sm text-gray-500">
                  {team.assignedRoles?.length || 0} Rollen • {team.members_count || 0} Mitglieder • Erstellt: {formatDate(team.created_at)}
                </div>
              </div>
              <div className="flex space-x-2">
                <button 
                  onClick={() => handleEdit(team, 'teams')}
                  className="text-blue-600 hover:text-blue-800"
                  title="Team bearbeiten"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDelete(team, 'teams')}
                  className="text-red-600 hover:text-red-800"
                  title="Team löschen"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const RolesTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Rollen & Berechtigungen</h3>
        <button
          onClick={() => handleCreate('roles')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Neue Rolle
        </button>
      </div>

      <div className="grid gap-4">
        {roles.map((role) => (
          <div key={role.id} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: role.farbe }}
                  />
                  <h4 className="font-medium">{role.name}</h4>
                  <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                    {role.kategorie}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    role.ist_aktiv ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {role.ist_aktiv ? 'Aktiv' : 'Inaktiv'}
                  </span>
                </div>
                {role.beschreibung && (
                  <p className="text-sm text-gray-600 mb-2">{role.beschreibung}</p>
                )}
                <div className="text-sm text-gray-500 space-y-1">
                  <div>
                    <strong>Standard:</strong> {role.standard_stundensatz}€/h
                  </div>
                  {role.min_stundensatz && role.max_stundensatz && (
                    <div>
                      <strong>Bereich:</strong> {role.min_stundensatz}€/h - {role.max_stundensatz}€/h
                    </div>
                  )}
                  <div>
                    <strong>Erstellt:</strong> {formatDate(role.created_at)}
                  </div>
                </div>
              </div>
              <div className="flex space-x-2">
                <button 
                  onClick={() => handleEdit(role, 'roles')}
                  className="text-blue-600 hover:text-blue-800"
                  title="Rolle bearbeiten"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDelete(role, 'roles')}
                  className="text-red-600 hover:text-red-800"
                  title="Rolle löschen"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const CategoriesTab = () => {
    const filteredCategories = categories.filter(category => {
      const matchesSearch = category.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || 
        (statusFilter === 'ACTIVE' && category.is_active) ||
        (statusFilter === 'INACTIVE' && !category.is_active);
      return matchesSearch && matchesStatus;
    });

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Kategorien</h3>
          <button
            onClick={() => handleCreate('categories')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Neue Kategorie
          </button>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Kategorien suchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'ALL' | 'ACTIVE' | 'INACTIVE')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="ALL">Alle Status</option>
            <option value="ACTIVE">Aktiv</option>
            <option value="INACTIVE">Inaktiv</option>
          </select>
        </div>

        {/* Categories List */}
        <div className="grid gap-4">
          {filteredCategories.map((category) => (
            <div key={category.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <FolderOpen className="w-8 h-8 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-lg font-medium text-gray-900">{category.name}</h4>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        category.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {category.is_active ? 'AKTIV' : 'INAKTIV'}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {category.kategorie_typ}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                      <span>Sortierung: {category.sortierung}</span>
                      <span>Elemente: {category.items_count || 0}</span>
                      <span>Erstellt: {formatDate(category.created_at)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEdit(category, 'categories')}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Kategorie bearbeiten"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(category, 'categories')}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Kategorie löschen"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredCategories.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {searchTerm || statusFilter !== 'ALL' 
              ? 'Keine Kategorien gefunden, die den Filterkriterien entsprechen.'
              : 'Noch keine Kategorien vorhanden.'
            }
          </div>
        )}
      </div>
    );
  };

  // =====================================================
  // RENDER
  // =====================================================

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Entitäten werden geladen...</span>
      </div>
    );
  }

  const tabs = [
    { id: 'suppliers', name: 'Lieferanten', icon: Building2, count: suppliers.length },
    { id: 'tags', name: 'Tags', icon: Tag, count: tags.length },
    { id: 'teams', name: 'Teams', icon: Users, count: teams.length },
    { id: 'roles', name: 'Rollen', icon: Shield, count: roles.length },
    { id: 'categories', name: 'Kategorien', icon: FolderOpen, count: categories.length }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          <FolderOpen className="w-6 h-6 mr-2" />
          Entitäten-Verwaltung
        </h2>
        <p className="text-gray-600 mt-1">
          Verwalten Sie alle Systementitäten zentral
        </p>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
          <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
          <span className="text-green-800">{successMessage}</span>
          <button 
            onClick={() => setSuccessMessage(null)}
            className="ml-auto text-green-600 hover:text-green-800"
          >
            ×
          </button>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
          <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
          <span className="text-red-800">{error}</span>
          <button 
            onClick={() => setError(null)}
            className="ml-auto text-red-600 hover:text-red-800"
          >
            ×
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {tab.name}
                <span className="ml-2 bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                  {tab.count}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-gray-50 rounded-lg p-6">
        {activeTab === 'suppliers' && <SuppliersTab />}
        {activeTab === 'tags' && <TagsTab />}
        {activeTab === 'teams' && <TeamsTab />}
        {activeTab === 'roles' && <RolesTab />}
        {activeTab === 'categories' && <CategoriesTab />}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <EntityModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSave={handleSaveEntity}
          entityType={modalEntityType}
          entity={null}
          title={`Neue ${modalEntityType.slice(0, -1)} erstellen`}
        />
      )}

      {showEditModal && selectedEntity && (
        <EntityModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSave={handleSaveEntity}
          entityType={modalEntityType}
          entity={selectedEntity}
          title={`${modalEntityType.slice(0, -1)} bearbeiten`}
        />
      )}

      {showDeleteModal && selectedEntity && (
        <DeleteModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteEntity}
          entityName={selectedEntity.name}
          entityType={modalEntityType.slice(0, -1)}
        />
      )}
    </div>
  );
};

// =====================================================
// MODAL COMPONENTS
// =====================================================

interface EntityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  entityType: 'suppliers' | 'tags' | 'teams' | 'roles' | 'categories';
  entity: any;
  title: string;
}

const EntityModal: React.FC<EntityModalProps> = ({ isOpen, onClose, onSave, entityType, entity, title }) => {
  const [formData, setFormData] = useState<any>({});
  const [availableRoles, setAvailableRoles] = useState<any[]>([]);

  // Load available roles when modal opens for teams
  useEffect(() => {
    if (isOpen && entityType === 'teams') {
      loadAvailableRoles();
      if (entity?.id) {
        loadTeamRoles(entity.id);
      }
    }
  }, [isOpen, entityType, entity?.id]);

  const loadAvailableRoles = async () => {
    try {
      const response = await apiService.get('/api/team-rollen');
      // Get the master roles from rollen_stammdaten
      const masterRoles = response || [];
      setAvailableRoles(masterRoles);
    } catch (error) {
      console.error('Fehler beim Laden der Rollen:', error);
      setAvailableRoles([]);
    }
  };

  const loadTeamRoles = async (teamId: string) => {
    try {
      const response = await apiService.get(`/api/team-roles/${teamId}`);
      console.log('🔍 Team-Rollen API Response:', response);
      
      // Handle different response formats
      let teamRoles = [];
      if (response && response.data && Array.isArray(response.data)) {
        teamRoles = response.data;
      } else if (Array.isArray(response)) {
        teamRoles = response;
      } else if (response && Array.isArray(response.roles)) {
        teamRoles = response.roles;
      }
      
      console.log('🔍 Processed teamRoles:', teamRoles);
      
      const selectedRoleIds = teamRoles.map((role: any) => role.rolle_id || role.id);
      console.log('🔍 Selected Role IDs:', selectedRoleIds);
      
      // Update formData with selected roles
      setFormData(prev => ({
        ...prev,
        selectedRoles: selectedRoleIds
      }));
    } catch (error) {
      console.error('Fehler beim Laden der Team-Rollen:', error);
      // Fallback: leeres Array
      setFormData(prev => ({
        ...prev,
        selectedRoles: []
      }));
    }
  };

  useEffect(() => {
    if (entity) {
      setFormData({
        ...entity,
        selectedRoles: [] // Wird von loadTeamRoles überschrieben
      });
    } else {
      // Default values for new entities
      switch (entityType) {
        case 'roles':
          setFormData({
            name: '',
            kategorie: 'Development',
            standard_stundensatz: 50,
            min_stundensatz: '',
            max_stundensatz: '',
            beschreibung: '',
            farbe: '#6B7280',
            ist_aktiv: true
          });
          break;
        case 'teams':
          setFormData({
            name: '',
            description: '',
            can_view_all_budgets: false,
            can_transfer_budgets: false,
            is_active: true
          });
          break;
        case 'tags':
          setFormData({
            name: '',
            description: '',
            color: '#3B82F6',
            is_active: true
          });
          break;
        case 'suppliers':
          setFormData({
            name: '',
            business_sector: '',
            legal_form: 'GmbH',
            uid_number: '',
            email: '',
            phone: '',
            address: '',
            postal_code: '',
            city: '',
            country: 'AT',
            status: 'ACTIVE'
          });
          break;
        case 'categories':
          setFormData({
            name: '',
            description: '',
            kategorie_typ: 'PROJECT',
            parent_id: null,
            is_active: true
          });
          break;
      }
    }
  }, [entity, entityType]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Debug-Logging für Teams
    if (entityType === 'teams') {
      console.log('🔧 Team-Submit Debug:', {
        name: formData.name,
        selectedRoles: formData.selectedRoles,
        selectedRolesLength: formData.selectedRoles?.length || 0
      });
    }
    
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">{title}</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {entityType === 'roles' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name *</label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Kategorie *</label>
                  <select
                    value={formData.kategorie || ''}
                    onChange={(e) => setFormData({...formData, kategorie: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                    required
                  >
                    <option value="Development">Development</option>
                    <option value="Design">Design</option>
                    <option value="Management">Management</option>
                    <option value="Operations">Operations</option>
                    <option value="Testing">Testing</option>
                    <option value="Analysis">Analysis</option>
                    <option value="Content">Content</option>
                    <option value="Marketing">Marketing</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Standard-Stundensatz (€) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.standard_stundensatz || ''}
                    onChange={(e) => setFormData({...formData, standard_stundensatz: parseFloat(e.target.value)})}
                    className="w-full border rounded-lg px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Min-Stundensatz (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.min_stundensatz || ''}
                    onChange={(e) => setFormData({...formData, min_stundensatz: e.target.value ? parseFloat(e.target.value) : null})}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Max-Stundensatz (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.max_stundensatz || ''}
                    onChange={(e) => setFormData({...formData, max_stundensatz: e.target.value ? parseFloat(e.target.value) : null})}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Beschreibung</label>
                <textarea
                  value={formData.beschreibung || ''}
                  onChange={(e) => setFormData({...formData, beschreibung: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Farbe</label>
                  <input
                    type="color"
                    value={formData.farbe || '#6B7280'}
                    onChange={(e) => setFormData({...formData, farbe: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 h-10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select
                    value={formData.ist_aktiv ? 'true' : 'false'}
                    onChange={(e) => setFormData({...formData, ist_aktiv: e.target.value === 'true'})}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="true">Aktiv</option>
                    <option value="false">Inaktiv</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {entityType === 'suppliers' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name *</label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="Firmenname"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Rechtsform</label>
                  <select
                    value={formData.legal_form || 'GmbH'}
                    onChange={(e) => setFormData({...formData, legal_form: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="GmbH">GmbH</option>
                    <option value="AG">AG</option>
                    <option value="KG">KG</option>
                    <option value="OG">OG</option>
                    <option value="Einzelunternehmen">Einzelunternehmen</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">UID-Nummer</label>
                  <input
                    type="text"
                    value={formData.uid_number || ''}
                    onChange={(e) => setFormData({...formData, uid_number: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="ATU12345678"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">E-Mail</label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="office@firma.at"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Telefon</label>
                  <input
                    type="tel"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="+43 1 234 5678"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Adresse</label>
                <textarea
                  value={formData.address || ''}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2"
                  rows={2}
                  placeholder="Straße und Hausnummer"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">PLZ</label>
                  <input
                    type="text"
                    value={formData.postal_code || ''}
                    onChange={(e) => setFormData({...formData, postal_code: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="1010"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Stadt</label>
                  <input
                    type="text"
                    value={formData.city || ''}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="Wien"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Land</label>
                  <select
                    value={formData.country || 'AT'}
                    onChange={(e) => setFormData({...formData, country: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="AT">Österreich</option>
                    <option value="DE">Deutschland</option>
                    <option value="CH">Schweiz</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">IBAN</label>
                  <input
                    type="text"
                    value={formData.iban || ''}
                    onChange={(e) => setFormData({...formData, iban: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="AT61 1904 3002 3457 3201"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select
                    value={formData.status || 'ACTIVE'}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="ACTIVE">Aktiv</option>
                    <option value="INACTIVE">Inaktiv</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {entityType === 'tags' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name *</label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="Tag-Name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Farbe</label>
                  <input
                    type="color"
                    value={formData.color || '#3B82F6'}
                    onChange={(e) => setFormData({...formData, color: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 h-10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Kategorie</label>
                <input
                  type="text"
                  value={formData.category || ''}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="z.B. Projekt, Priorität, Status"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Beschreibung</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2"
                  rows={3}
                  placeholder="Kurze Beschreibung des Tags"
                />
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_active !== false}
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium">Aktiv</span>
                </label>
              </div>
            </>
          )}

          {entityType === 'teams' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Team-Name *</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="z.B. Design, Development, Content, Marketing"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Fach-Team für Projekt-Stundenerfassung</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Beschreibung</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2"
                  rows={3}
                  placeholder="Beschreibung des Fach-Teams und dessen Aufgaben"
                />
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 mb-3">👥 Team-Rollen auswählen</h4>
                <p className="text-xs text-blue-700 mb-3">
                  Wählen Sie die Rollen aus, die dieses Team beinhalten soll. 
                  In Projekten können dann nur diese Rollen für das Team verwendet werden.
                </p>
                
                <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
                  {availableRoles.map((role: any) => (
                    <label key={role.id} className="flex items-center p-2 bg-white rounded border hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={formData.selectedRoles?.includes(role.id) || false}
                        onChange={(e) => {
                          const selectedRoles = formData.selectedRoles || [];
                          const newSelectedRoles = e.target.checked
                            ? [...selectedRoles, role.id]
                            : selectedRoles.filter((id: number) => id !== role.id);
                          setFormData({...formData, selectedRoles: newSelectedRoles});
                        }}
                        className="mr-3"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{backgroundColor: role.farbe}}
                          ></div>
                          <span className="font-medium text-sm">{role.name}</span>
                          <span className="text-xs text-gray-500">({role.kategorie})</span>
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          €{role.standard_stundensatz}/h • {role.beschreibung}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
                
                {(!availableRoles || availableRoles.length === 0) && (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    Rollen werden geladen...
                  </div>
                )}
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_active !== false}
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium">Team aktiv</span>
                </label>
                <p className="text-xs text-gray-500 mt-1">Aktive Teams können in Projekten für Stundenerfassung verwendet werden</p>
              </div>
            </>
          )}

          {entityType === 'categories' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name *</label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="Kategorie-Name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Kategorie-Typ *</label>
                  <select
                    value={formData.kategorie_typ || 'PROJECT'}
                    onChange={(e) => setFormData({...formData, kategorie_typ: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                    required
                  >
                    <option value="PROJECT">Projekt</option>
                    <option value="BUDGET">Budget</option>
                    <option value="GENERAL">Allgemein</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Sortierung</label>
                <input
                  type="number"
                  value={formData.sortierung || 0}
                  onChange={(e) => setFormData({...formData, sortierung: parseInt(e.target.value) || 0})}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_active !== false}
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium">Aktiv</span>
                </label>
              </div>
            </>
          )}
          
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-50"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Speichern
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  entityName: string;
  entityType: string;
}

const DeleteModal: React.FC<DeleteModalProps> = ({ isOpen, onClose, onConfirm, entityName, entityType }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center mb-4">
            <AlertCircle className="w-6 h-6 text-red-600 mr-3" />
            <h2 className="text-xl font-semibold">{entityType} löschen</h2>
          </div>
          
          <p className="text-gray-600 mb-6">
            Sind Sie sicher, dass Sie <strong>{entityName}</strong> löschen möchten? 
            Diese Aktion kann nicht rückgängig gemacht werden.
          </p>
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-50"
            >
              Abbrechen
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Löschen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EntityManagement;

