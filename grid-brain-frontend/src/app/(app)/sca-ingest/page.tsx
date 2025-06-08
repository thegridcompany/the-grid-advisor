'use client';

import React, { useState } from 'react';
import { ScaNormalizer } from '@/features/sca-ingestion/components/ScaNormalizer';
import { ScaReviewer } from '@/features/sca-ingestion/components/ScaReviewer';
import { GridBrief } from '@/features/sca-ingestion/types';

export default function ScaIngestPage() {
  const [normalizedData, setNormalizedData] = useState<GridBrief | null>(null);

  const handleNormalized = (data: GridBrief) => {
    setNormalizedData(data);
  };

  const handleConfirm = async () => {
    if (!normalizedData) return;
    try {
      const response = await fetch('/api/sca-ingest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(normalizedData),
      });

      if (response.ok) {
        alert('Data confirmed and sent to server!');
        setNormalizedData(null);
      } else {
        const errorData = await response.json();
        alert(`Failed to confirm data: ${errorData.error}`);
      }
    } catch (error) {
      alert(`An error occurred: ${error}`);
    }
  };

  const handleReject = () => {
    setNormalizedData(null);
  };

  const mockRawData = {
    // This is where you would put the raw data from the SCA tool
    // For now, it's just a placeholder.
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">SCA Ingestion</h1>
      {!normalizedData ? (
        <ScaNormalizer rawData={mockRawData} onNormalized={handleNormalized} />
      ) : (
        <ScaReviewer
          normalizedData={normalizedData}
          onConfirm={handleConfirm}
          onReject={handleReject}
        />
      )}
    </div>
  );
} 