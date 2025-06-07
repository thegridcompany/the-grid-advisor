'use client'

import React from 'react';
import { Editor } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/tooltip';
import { Dropdown, DropdownItem, DropdownSeparator, DropdownLabel } from '@/components/ui/dropdown';
import {
  Bold,
  Strikethrough,
  Italic,
  List,
  ListOrdered,
  Heading2,
  PlusSquare,
  Map,
  Code,
  Clock,
  Undo,
  Redo,
  MessageSquarePlus,
  FileJson,
  FileCode,
  ChevronDown,
  Type,
  Download
} from 'lucide-react';

type Props = {
  editor: Editor | null;
};

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  tooltip: string;
  variant?: 'default' | 'outline' | 'ghost';
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({ 
  onClick, 
  isActive = false, 
  disabled = false, 
  children, 
  tooltip,
  variant = 'ghost'
}) => (
  <Tooltip content={tooltip} side="bottom" delay={300}>
    <Button
      onClick={onClick}
      disabled={disabled}
      variant={isActive ? 'default' : variant}
      size="sm"
      className={`h-8 w-8 p-0 ${isActive ? 'bg-blue-500 text-white hover:bg-blue-600' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
    >
      {children}
    </Button>
  </Tooltip>
);

const ToolbarSeparator = () => (
  <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />
);

export function Toolbar({ editor }: Props) {
  if (!editor) {
    return null;
  }

  const addSection = (type: 'roadmap' | 'tech_stack' | 'estimates' | 'generic') => {
    let content = '';
    switch (type) {
      case 'roadmap':
        content = '<section data-section-type="roadmap"><h2>🗺️ Roadmap del Progetto</h2><ul><li>Fase 1: Analisi e Pianificazione</li><li>Fase 2: Sviluppo</li><li>Fase 3: Testing e Deploy</li></ul></section>';
        break;
      case 'tech_stack':
        content = '<section data-section-type="tech_stack"><h2>🛠️ Stack Tecnologico</h2><ul><li><strong>Frontend:</strong> React, Next.js, Tailwind</li><li><strong>Backend:</strong> Node.js, Express</li><li><strong>Database:</strong> PostgreSQL</li></ul></section>';
        break;
      case 'estimates':
        content = '<section data-section-type="estimates"><h2>⏱️ Stime e Tempi</h2><p><strong>Durata totale:</strong> 8-12 settimane</p><p><strong>Ore stimate:</strong> 320-480 ore</p><p><strong>Team:</strong> 2-3 sviluppatori</p></section>';
        break;
      default:
        content = '<section data-section-type="generic"><h2>📝 Nuova Sezione</h2><p>Aggiungi qui il contenuto della sezione...</p></section>';
    }
    editor.chain().focus().insertContent(content).run();
  }

  const exportJSON = () => {
    const json = editor.getJSON();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(json, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "blueprint.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }

  const exportHTML = () => {
    const html = editor.getHTML();
    const dataStr = "data:text/html;charset=utf-8," + encodeURIComponent(html);
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "blueprint.html");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }

  return (
    <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-3">
          {/* History Controls */}
          <div className="flex items-center gap-1">
            <ToolbarButton
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              tooltip="Annulla ultima azione (Ctrl+Z)"
            >
              <Undo className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              tooltip="Ripeti ultima azione (Ctrl+Y)"
            >
              <Redo className="w-4 h-4" />
            </ToolbarButton>
          </div>

          <ToolbarSeparator />

          {/* Text Formatting Menu */}
          <Dropdown 
            trigger={
              <Tooltip content="Menu formattazione testo" side="bottom" delay={300}>
                <Button variant="ghost" size="sm" className="h-8 px-2 gap-1">
                  <Type className="w-4 h-4" />
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </Tooltip>
            }
          >
            <DropdownLabel>Formattazione</DropdownLabel>
            <DropdownItem 
              onClick={() => editor.chain().focus().toggleBold().run()}
              icon={<Bold className="w-4 h-4" />}
            >
              Grassetto (Ctrl+B)
            </DropdownItem>
            <DropdownItem 
              onClick={() => editor.chain().focus().toggleItalic().run()}
              icon={<Italic className="w-4 h-4" />}
            >
              Corsivo (Ctrl+I)
            </DropdownItem>
            <DropdownItem 
              onClick={() => editor.chain().focus().toggleStrike().run()}
              icon={<Strikethrough className="w-4 h-4" />}
            >
              Barrato
            </DropdownItem>
            <DropdownSeparator />
            <DropdownLabel>Struttura</DropdownLabel>
            <DropdownItem 
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              icon={<Heading2 className="w-4 h-4" />}
            >
              Titolo H2
            </DropdownItem>
            <DropdownItem 
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              icon={<List className="w-4 h-4" />}
            >
              Elenco puntato
            </DropdownItem>
            <DropdownItem 
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              icon={<ListOrdered className="w-4 h-4" />}
            >
              Elenco numerato
            </DropdownItem>
          </Dropdown>

          <ToolbarSeparator />

          {/* Quick Format Buttons */}
          <div className="flex items-center gap-1">
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              isActive={editor.isActive('bold')}
              tooltip="Grassetto (Ctrl+B)"
            >
              <Bold className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              isActive={editor.isActive('italic')}
              tooltip="Corsivo (Ctrl+I)"
            >
              <Italic className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              isActive={editor.isActive('bulletList')}
              tooltip="Elenco puntato"
            >
              <List className="w-4 h-4" />
            </ToolbarButton>
          </div>

          <ToolbarSeparator />

          {/* Comments */}
          <ToolbarButton
            onClick={() => {
              const id = `comment-${Math.random().toString(36).substr(2, 9)}`;
              editor.chain().focus().setComment(id).run();
            }}
            tooltip="Aggiungi commento alla selezione corrente"
          >
            <MessageSquarePlus className="w-4 h-4" />
          </ToolbarButton>
        </div>

        <div className="flex items-center gap-3">
          {/* Sections Menu */}
          <Dropdown 
            align="right"
            trigger={
              <Tooltip content="Aggiungi sezioni al blueprint" side="bottom" delay={300}>
                <Button variant="outline" size="sm" className="h-8 px-3 gap-2">
                  <PlusSquare className="w-4 h-4" />
                  <span className="hidden sm:inline">Sezioni</span>
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </Tooltip>
            }
          >
            <DropdownLabel>Sezioni Blueprint</DropdownLabel>
            <DropdownItem 
              onClick={() => addSection('roadmap')}
              icon={<Map className="w-4 h-4" />}
            >
              🗺️ Roadmap Progetto
            </DropdownItem>
            <DropdownItem 
              onClick={() => addSection('tech_stack')}
              icon={<Code className="w-4 h-4" />}
            >
              🛠️ Stack Tecnologico
            </DropdownItem>
            <DropdownItem 
              onClick={() => addSection('estimates')}
              icon={<Clock className="w-4 h-4" />}
            >
              ⏱️ Stime e Tempi
            </DropdownItem>
            <DropdownSeparator />
            <DropdownItem 
              onClick={() => addSection('generic')}
              icon={<PlusSquare className="w-4 h-4" />}
            >
              📝 Sezione Personalizzata
            </DropdownItem>
          </Dropdown>

          <ToolbarSeparator />

          {/* Export Menu */}
          <Dropdown 
            align="right"
            trigger={
              <Tooltip content="Esporta blueprint in vari formati" side="bottom" delay={300}>
                <Button variant="outline" size="sm" className="h-8 px-3 gap-2">
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Esporta</span>
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </Tooltip>
            }
          >
            <DropdownLabel>Formati Export</DropdownLabel>
            <DropdownItem 
              onClick={exportJSON}
              icon={<FileJson className="w-4 h-4" />}
            >
              📄 Esporta JSON
            </DropdownItem>
            <DropdownItem 
              onClick={exportHTML}
              icon={<FileCode className="w-4 h-4" />}
            >
              🌐 Esporta HTML
            </DropdownItem>
          </Dropdown>
        </div>
      </div>
    </div>
  );
} 