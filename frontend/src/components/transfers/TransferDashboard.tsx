// =====================================================
// Budget Manager 2025 - Transfer Dashboard
// Story 1.4: Budget-Transfer-System - Haupt-Dashboard
// =====================================================

import React, { useState, useEffect } from 'react';
import TransferCard from './TransferCard';
import TransferRequestForm from './TransferRequestForm';
import TransferStatusBadge from './TransferStatusBadge';
import { formatGermanCurrency } from '../../utils/currency';

interface Transfer {
  id: string;
  from_project_name: string;
  from_project_number: string;
  to_project_name: string;
  to_project_number: string;
  transfer_amount: number;
  transfer_amount_formatted: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  status_label: string;
  reason: string;
  requested_at: string;
  requested_at_formatted: string;
  reviewed_at?: string;
  reviewed_at_formatted?: string;
  executed_at?: string;
  executed_at_formatted?: string;
  review_comment?: string;
}

interface Project {
  id: string;
  name: string;
  project_number?: string;
  allocated_budget: number;
  consumed_budget: number;
}

interface TransferSummary {
  total_transfers: number;
  pending: number;
  approved: number;
  rejected: number;
  cancelled: number;
  total_amount_pending: number;
  total_amount_pending_formatted: string;
  total_amount_approved: number;
  total_amount_approved_formatted: string;
}

// Echte Projekte laden für Transfer-Auswahl
const loadRealProjects = async (): Promise<Project[]> => {
  try {
    const response = await fetch('/api/projects');
    if (!response.ok) {
      throw new Error('Fehler beim Laden der Projekte');
    }
    const data = await response.json();
    const projects = data.projects || data;
    
    return projects.map((project: any) => ({
      id: project.id,
      name: project.name,
      project_number: project.project_number || `PRJ-${project.id.slice(0, 8)}`,
      allocated_budget: project.planned_budget || 0,
      consumed_budget: project.consumed_budget || 0
    }));
  } catch (error) {
    console.error('Fehler beim Laden der Projekte:', error);
    return [];
  }
};

const TransferDashboard: React.FC = () => {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Transfer-Zusammenfassung berechnen
  const summary: TransferSummary = {
    total_transfers: transfers.length,
    pending: transfers.filter(t => t.status === 'PENDING').length,
    approved: transfers.filter(t => t.status === 'APPROVED').length,
    rejected: transfers.filter(t => t.status === 'REJECTED').length,
    cancelled: transfers.filter(t => t.status === 'CANCELLED').length,
    total_amount_pending: transfers
      .filter(t => t.status === 'PENDING')
      .reduce((sum, t) => sum + t.transfer_amount, 0),
    total_amount_pending_formatted: formatGermanCurrency(
      transfers
        .filter(t => t.status === 'PENDING')
        .reduce((sum, t) => sum + t.transfer_amount, 0)
    ),
    total_amount_approved: transfers
      .filter(t => t.status === 'APPROVED')
      .reduce((sum, t) => sum + t.transfer_amount, 0),
    total_amount_approved_formatted: formatGermanCurrency(
      transfers
        .filter(t => t.status === 'APPROVED')
        .reduce((sum, t) => sum + t.transfer_amount, 0)
    )
  };

  // Gefilterte Transfers
  const filteredTransfers = transfers.filter(transfer => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'pending') return transfer.status === 'PENDING';
    if (statusFilter === 'approved') return transfer.status === 'APPROVED';
    if (statusFilter === 'rejected') return transfer.status === 'REJECTED';
    if (statusFilter === 'cancelled') return transfer.status === 'CANCELLED';
    return true;
  });

  // Daten laden
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Echte Projekte laden
        const realProjects = await loadRealProjects();
        setProjects(realProjects);
        
        // Transfers sind noch nicht implementiert - leere Liste
        setTransfers([]);
        
      } catch (error) {
        console.error('Fehler beim Laden der Transfer-Daten:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const handleTransferRequest = (transferData: any) => {
    console.log('Transfer-Antrag:', transferData);
    // TODO: API-Aufruf für Transfer-Erstellung
    setShowForm(false);
  };

  const handleCancelTransfer = (transferId: string) => {
    console.log('Transfer stornieren:', transferId);
    // TODO: API-Aufruf für Transfer-Stornierung
  };

  const handleApproveTransfer = (transferId: string) => {
    console.log('Transfer genehmigen:', transferId);
    // TODO: API-Aufruf für Transfer-Genehmigung
  };

  const handleRejectTransfer = (transferId: string, reason: string) => {
    console.log('Transfer ablehnen:', transferId, reason);
    // TODO: API-Aufruf für Transfer-Ablehnung
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">Transfer-System wird geladen...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
                <span>🔄</span>
                <span>Budget-Transfer-System</span>
              </h1>
              <p className="text-gray-600 mt-1">
                Verwalten Sie Budget-Transfers zwischen Projekten mit Genehmigungs-Workflow
              </p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <span>➕</span>
              <span>Neuer Transfer-Antrag</span>
            </button>
          </div>
        </div>

        {/* Statistiken */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-3 rounded-lg">
                <span className="text-xl">📊</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Gesamt</p>
                <p className="text-2xl font-bold text-gray-900">{summary.total_transfers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center space-x-3">
              <div className="bg-yellow-100 p-3 rounded-lg">
                <TransferStatusBadge status="PENDING" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Ausstehend</p>
                <p className="text-2xl font-bold text-gray-900">{summary.pending}</p>
                <p className="text-sm text-yellow-600">{summary.total_amount_pending_formatted}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center space-x-3">
              <div className="bg-green-100 p-3 rounded-lg">
                <TransferStatusBadge status="APPROVED" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Genehmigt</p>
                <p className="text-2xl font-bold text-gray-900">{summary.approved}</p>
                <p className="text-sm text-green-600">{summary.total_amount_approved_formatted}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center space-x-3">
              <div className="bg-red-100 p-3 rounded-lg">
                <span className="text-xl">🚫</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Abgelehnt/Storniert</p>
                <p className="text-2xl font-bold text-gray-900">{summary.rejected + summary.cancelled}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">Filter nach Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Alle Status ({summary.total_transfers})</option>
              <option value="pending">Ausstehend ({summary.pending})</option>
              <option value="approved">Genehmigt ({summary.approved})</option>
              <option value="rejected">Abgelehnt ({summary.rejected})</option>
              <option value="cancelled">Storniert ({summary.cancelled})</option>
            </select>
          </div>
        </div>

        {/* Transfer-Liste */}
        <div className="space-y-4">
          {filteredTransfers.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
              <div className="text-6xl mb-4">🔄</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Keine Budget-Transfers vorhanden
              </h3>
              <p className="text-gray-600 mb-6">
                Das Budget-Transfer-System ist bereit für Ihren ersten Transfer-Antrag.
                <br />
                Verfügbare Projekte: <strong>{projects.length}</strong>
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg inline-flex items-center space-x-2 transition-colors"
              >
                <span>➕</span>
                <span>Ersten Transfer-Antrag erstellen</span>
              </button>
              
              {/* Verfügbare Projekte anzeigen */}
              {projects.length > 0 && (
                <div className="mt-8 text-left">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Verfügbare Projekte für Transfers:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {projects.map((project) => (
                      <div key={project.id} className="bg-gray-50 rounded-lg p-4">
                        <h5 className="font-semibold text-gray-900">{project.name}</h5>
                        <p className="text-sm text-gray-600">{project.project_number}</p>
                        <div className="mt-2 space-y-1">
                          <p className="text-sm">
                            <span className="text-gray-600">Budget:</span>{' '}
                            <span className="font-medium">{formatGermanCurrency(project.allocated_budget)}</span>
                          </p>
                          <p className="text-sm">
                            <span className="text-gray-600">Verbraucht:</span>{' '}
                            <span className="font-medium">{formatGermanCurrency(project.consumed_budget)}</span>
                          </p>
                          <p className="text-sm">
                            <span className="text-gray-600">Verfügbar:</span>{' '}
                            <span className="font-medium text-green-600">
                              {formatGermanCurrency(project.allocated_budget - project.consumed_budget)}
                            </span>
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            filteredTransfers.map((transfer) => (
              <TransferCard
                key={transfer.id}
                transfer={transfer}
                onCancel={handleCancelTransfer}
                onApprove={handleApproveTransfer}
                onReject={handleRejectTransfer}
              />
            ))
          )}
        </div>

        {/* Transfer-Formular Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Neuer Transfer-Antrag</h2>
                  <button
                    onClick={() => setShowForm(false)}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ×
                  </button>
                </div>
                <TransferRequestForm
                  projects={projects}
                  onSubmit={handleTransferRequest}
                  onCancel={() => setShowForm(false)}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransferDashboard;