'use client';

import React from 'react';
import { GridBrief } from '../types';

interface ScaReviewerProps {
  normalizedData: GridBrief;
  onConfirm: () => void;
  onReject: () => void;
}

export const ScaReviewer: React.FC<ScaReviewerProps> = ({ normalizedData, onConfirm, onReject }) => {
  return (
    <div className="p-4 border rounded-lg">
      <h2 className="text-xl font-bold mb-4">Review SCA Data</h2>
      <div>
        <p><strong>Client:</strong> {normalizedData.clientName}</p>
        <p><strong>Date:</strong> {normalizedData.assessmentDate.toLocaleDateString()}</p>
      </div>
      <div className="mt-4">
        {normalizedData.quadrants.map(quadrant => (
          <div key={quadrant.id} className="mb-4">
            <h3 className="text-lg font-semibold">{quadrant.name} - Score: {quadrant.score}</h3>
            <ul className="list-disc list-inside">
              {quadrant.recommendations.map(rec => (
                <li key={rec.id}>{rec.text} ({rec.priority})</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mt-4 flex justify-end space-x-2">
        <button onClick={onReject} className="bg-red-500 text-white p-2 rounded">
          Reject
        </button>
        <button onClick={onConfirm} className="bg-green-500 text-white p-2 rounded">
          Confirm
        </button>
      </div>
    </div>
  );
}; 