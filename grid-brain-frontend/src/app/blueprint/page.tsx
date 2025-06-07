'use client'

import { BlueprintEditor } from '@/features/blueprint/components';
import React from 'react';

const BlueprintEditorPage = () => {
  return (
    <div className="h-screen bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100">
      <BlueprintEditor />
    </div>
  );
};

export default BlueprintEditorPage; 