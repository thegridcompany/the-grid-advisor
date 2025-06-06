'use client'

import { BlueprintEditor } from '@/features/blueprint/components';
import React from 'react';

const BlueprintEditorPage = () => {
  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100">
      {/* Live Streaming Display */}
      <div className="w-1/3 bg-white dark:bg-gray-900 p-4 overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Live Generation</h2>
        <div className="prose dark:prose-invert">
          {/* Mock streaming content */}
          <p>Phase 1: Discovery & Planning...</p>
          <p>Milestone 1.1: Project Kick-off...</p>
        </div>
      </div>

      {/* Edit Interface */}
      <div className="w-1/3 border-l border-r border-gray-200 dark:border-gray-700 p-4 overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Blueprint Editor</h2>
        <BlueprintEditor />
      </div>

      {/* Export Controls */}
      <div className="w-1/3 bg-white dark:bg-gray-900 p-4">
        <h2 className="text-xl font-bold mb-4">Export Options</h2>
        <div className="space-y-4">
          <button className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded">Export as PDF</button>
          <button className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded">Export as Markdown</button>
          <button className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-2 rounded">Export as JSON</button>
        </div>
      </div>
    </div>
  );
};

export default BlueprintEditorPage; 