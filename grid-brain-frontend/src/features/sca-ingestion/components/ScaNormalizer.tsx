'use client';

import React, { useState } from 'react';
import { GridBrief, GridBriefSchema } from '../types';

interface ScaNormalizerProps {
  rawData: unknown;
  onNormalized: (normalizedData: GridBrief) => void;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const ScaNormalizer: React.FC<ScaNormalizerProps> = ({ rawData, onNormalized }) => {
  const [error, setError] = useState<string | null>(null);

  const normalizeData = () => {
    try {
      // This is a placeholder for the actual normalization logic.
      // In a real implementation, this would involve mapping the rawData
      // fields to the GridBriefSchema fields.
      const placeholderNormalizedData: GridBrief = {
        version: '1.0',
        clientName: 'Placeholder Client',
        assessmentDate: new Date(),
        quadrants: [],
      };

      const result = GridBriefSchema.safeParse(placeholderNormalizedData);
      if (result.success) {
        onNormalized(result.data);
        setError(null);
      } else {
        setError(result.error.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred during normalization.');
    }
  };

  return (
    <div>
      <button onClick={normalizeData} className="bg-blue-500 text-white p-2 rounded">
        Normalize Data
      </button>
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </div>
  );
}; 