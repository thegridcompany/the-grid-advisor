'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import React from 'react'
import { Toolbar } from './Toolbar'
import { SectionNode } from '../editor/SectionNode'
import History from '@tiptap/extension-history'
import * as Y from 'yjs'
import Collaboration from '@tiptap/extension-collaboration'
import CollaborationCursor from '@tiptap/extension-collaboration-cursor'
import { WebrtcProvider } from 'y-webrtc'

const ydoc = new Y.Doc()
const provider = new WebrtcProvider('tiptap-collaboration-demo', ydoc)

const Tiptap = () => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: false, // Will be handled by Y.js
      }),
      SectionNode,
      History,
      Collaboration.configure({
        document: ydoc,
      }),
      CollaborationCursor.configure({
        provider: provider,
        user: {
          name: 'Local User',
          color: '#f7d002',
        },
      }),
    ],
    content: `
      <section data-section-type="title">
        <h1>Blueprint Title</h1>
      </section>
      <section data-section-type="roadmap">
        <h2>Phase 1: Discovery & Planning</h2>
        <p>This is the first phase of the project. We will gather requirements, define scope, and create a project plan.</p>
        <ul>
          <li>Stakeholder interviews</li>
          <li>Requirements gathering</li>
          <li>Technical specification</li>
        </ul>
      </section>
      <section data-section-type="roadmap">
        <h2>Phase 2: Design & Prototyping</h2>
        <p>In this phase, we will create wireframes, mockups, and interactive prototypes.</p>
      </section>
    `,
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert prose-sm sm:prose-base lg:prose-lg xl:prose-2xl p-4 focus:outline-none border border-gray-300 dark:border-gray-700 rounded-b-lg',
      },
    },
  })

  return (
    <div>
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  )
}

export const BlueprintEditor = () => {
  return (
    <div className="w-full h-full">
      <Tiptap />
    </div>
  )
} 