'use client'

import React, { useState } from 'react';
import { Editor, EditorState } from 'draft-js';
import 'draft-js/dist/Draft.css';

const BlueprintEditor = () => {
  const [editorState, setEditorState] = useState(() => EditorState.createEmpty());

  return (
    <div className="bg-white p-4 border rounded">
      <h3 className="text-lg font-bold mb-2">Editor</h3>
      <div className="min-h-[200px] border p-2 rounded">
        <Editor editorState={editorState} onChange={setEditorState} />
      </div>
    </div>
  );
};

export default BlueprintEditor; 