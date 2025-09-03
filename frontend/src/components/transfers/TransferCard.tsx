// =====================================================
// Budget Manager 2025 - Transfer Card
// Story 1.4: Budget-Transfer-System - Transfer-Anzeige
// =====================================================

import React from 'react';
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

interface TransferCardProps {
  transfer: Transfer;
  onReview?: (transferId: string, action: 'APPROVE' | 'REJECT', comment?: string) => void;
  onCancel?: (transferId: string, reason?: string) => void;
  onViewDetails?: (transferId: string) => void;
  showActions?: boolean;
  currentUserId?: string;
}

const TransferCard: React.FC<TransferCardProps> = ({
  transfer,
  onReview,
  onCancel,
  onViewDetails,
  showActions = true,
  currentUserId
}) => {
  const [showReviewModal, setShowReviewModal] = React.useState(false);
  const [showCancelModal, setShowCancelModal] = React.useState(false);
  const [reviewAction, setReviewAction] = React.useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [reviewComment, setReviewComment] = React.useState('');
  const [cancelReason, setCancelReason] = React.useState('');

  const canReview = transfer.status === 'PENDING' && onReview;
  const canCancel = transfer.status === 'PENDING' && onCancel;

  const handleReviewSubmit = () => {
    if (onReview) {
      onReview(transfer.id, reviewAction, reviewComment.trim() || undefined);
    }
    setShowReviewModal(false);
    setReviewComment('');
  };

  const handleCancelSubmit = () => {
    if (onCancel) {
      onCancel(transfer.id, cancelReason.trim() || undefined);
    }
    setShowCancelModal(false);
    setCancelReason('');
  };

  const getStatusIcon = () => {
    switch (transfer.status) {
      case 'PENDING': return '⏳';
      case 'APPROVED': return '✅';
      case 'REJECTED': return '❌';
      case 'CANCELLED': return '🚫';
      default: return '❓';
    }
  };

  const getAmountColor = () => {
    switch (transfer.status) {
      case 'APPROVED': return 'text-green-600';
      case 'REJECTED': return 'text-red-600';
      case 'CANCELLED': return 'text-gray-500';
      default: return 'text-blue-600';
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{getStatusIcon()}</span>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Budget-Transfer #{transfer.id.slice(0, 8)}
              </h3>
              <p className="text-sm text-gray-500">
                Beantragt am {transfer.requested_at_formatted}
              </p>
            </div>
          </div>
          <TransferStatusBadge status={transfer.status} />
        </div>

        {/* Transfer-Details */}
        <div className="space-y-4">
          {/* Projekt-Transfer */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600">Von</p>
                <p className="text-sm font-semibold text-gray-900">{transfer.from_project_name}</p>
                <p className="text-xs text-gray-500">{transfer.from_project_number}</p>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-2xl">→</span>
                <div className={`text-xl font-bold ${getAmountColor()}`}>
                  {transfer.transfer_amount_formatted}
                </div>
                <span className="text-2xl">→</span>
              </div>
              
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600">Zu</p>
                <p className="text-sm font-semibold text-gray-900">{transfer.to_project_name}</p>
                <p className="text-xs text-gray-500">{transfer.to_project_number}</p>
              </div>
            </div>
          </div>

          {/* Begründung */}
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">📝 Begründung:</p>
            <p className="text-sm text-gray-800 bg-gray-50 p-3 rounded-md italic">
              "{transfer.reason}"
            </p>
          </div>

          {/* Status-Details */}
          {transfer.status !== 'PENDING' && (
            <div className="border-t border-gray-200 pt-4">
              {transfer.reviewed_at_formatted && (
                <p className="text-sm text-gray-600">
                  <strong>
                    {transfer.status === 'APPROVED' ? 'Genehmigt' : 
                     transfer.status === 'REJECTED' ? 'Abgelehnt' : 'Bearbeitet'}:
                  </strong> {transfer.reviewed_at_formatted}
                </p>
              )}
              
              {transfer.executed_at_formatted && (
                <p className="text-sm text-green-600 font-medium">
                  <strong>✅ Ausgeführt:</strong> {transfer.executed_at_formatted}
                </p>
              )}
              
              {transfer.review_comment && (
                <div className="mt-2">
                  <p className="text-sm font-medium text-gray-600">💬 Kommentar:</p>
                  <p className="text-sm text-gray-800 bg-gray-50 p-2 rounded-md italic">
                    "{transfer.review_comment}"
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Aktions-Buttons */}
        {showActions && (
          <div className="flex justify-end space-x-2 mt-6 pt-4 border-t border-gray-200">
            {onViewDetails && (
              <button
                onClick={() => onViewDetails(transfer.id)}
                className="px-3 py-1 text-sm font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors"
              >
                👁️ Details
              </button>
            )}
            
            {canCancel && (
              <button
                onClick={() => setShowCancelModal(true)}
                className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                🚫 Stornieren
              </button>
            )}
            
            {canReview && (
              <button
                onClick={() => setShowReviewModal(true)}
                className="px-3 py-1 text-sm font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200 transition-colors"
              >
                ⚖️ Bearbeiten
              </button>
            )}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Transfer bearbeiten
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Entscheidung
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="APPROVE"
                      checked={reviewAction === 'APPROVE'}
                      onChange={(e) => setReviewAction(e.target.value as 'APPROVE')}
                      className="mr-2"
                    />
                    ✅ Genehmigen
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="REJECT"
                      checked={reviewAction === 'REJECT'}
                      onChange={(e) => setReviewAction(e.target.value as 'REJECT')}
                      className="mr-2"
                    />
                    ❌ Ablehnen
                  </label>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kommentar {reviewAction === 'REJECT' && <span className="text-red-500">*</span>}
                </label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder={reviewAction === 'REJECT' ? 'Begründung für Ablehnung...' : 'Optionaler Kommentar...'}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowReviewModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Abbrechen
              </button>
              <button
                onClick={handleReviewSubmit}
                disabled={reviewAction === 'REJECT' && !reviewComment.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {reviewAction === 'APPROVE' ? '✅ Genehmigen' : '❌ Ablehnen'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Transfer stornieren
            </h3>
            
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Möchten Sie diesen Transfer-Antrag wirklich stornieren?
              </p>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Grund für Stornierung (optional)
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Grund für die Stornierung..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Abbrechen
              </button>
              <button
                onClick={handleCancelSubmit}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                🚫 Stornieren
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TransferCard;

