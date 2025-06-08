'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { BlueprintEditor, ProsemirrorJSON } from '@/features/blueprint/components';
import { ProposalDocument } from '@/features/proposals/components/ProposalDocument';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileText, Eye, EyeOff, Save, Loader2 } from 'lucide-react';

const ProposalPreview = dynamic(
  () => import('@/features/proposals/components/ProposalPreview').then((mod) => mod.ProposalPreview),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[600px] bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-gray-400" />
          <p className="text-gray-500">Loading PDF Preview...</p>
        </div>
      </div>
    )
  }
);

const mockRoadmap = [
    { name: 'Phase 1: Discovery & Planning', milestones: [{ name: 'Initial kickoff' }, { name: 'Stakeholder interviews' }] },
    { name: 'Phase 2: Design & Prototyping', milestones: [{ name: 'Wireframes' }, { name: 'High-fidelity mockups' }] },
    { name: 'Phase 3: Development & Testing', milestones: [{ name: 'Sprint 1' }, { name: 'User acceptance testing' }] },
];

const mockPricing = [
    { name: 'Basic', price: '$1,000' },
    { name: 'Standard', price: '$2,500' },
    { name: 'Premium', price: '$5,000' },
];

// A simple (and naive) converter from Prosemirror JSON to string
const convertContentToString = (content: ProsemirrorJSON | string): string => {
    if (typeof content === 'string') {
        return content;
    }
    if (content && Array.isArray(content.content)) {
        return content.content.map(node => 
            node.content?.map(textNode => textNode.text).join('') || ''
        ).join('\n');
    }
    return '';
};

export default function NewProposalPage() {
    const [title, setTitle] = useState('New Project Proposal');
    const [clientName, setClientName] = useState('The Grid Company');
    const [content, setContent] = useState<ProsemirrorJSON | string>('');
    const [showPreview, setShowPreview] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    const stringContent = useMemo(() => convertContentToString(content), [content]);

    const doc = useMemo(() => (
        <ProposalDocument 
            title={title} 
            clientName={clientName} 
            content={stringContent}
            roadmap={mockRoadmap}
            pricing={mockPricing}
        />
    ), [title, clientName, stringContent]);

    const handleSave = async () => {
        setIsSaving(true);
        setSaveSuccess(false);
        
        try {
            const response = await fetch('/api/v1/proposals/proposals', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title,
                    client_name: clientName,
                    content,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to save proposal');
            }

            const data = await response.json();
            console.log('Rendered Markdown:', data.markdown);
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (error) {
            console.error(error);
            // TODO: Show an error message to the user
        } finally {
            setIsSaving(false);
        }
    };

    const handlePreview = () => {
        setShowPreview(!showPreview);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center space-x-3">
                            <FileText className="h-6 w-6 text-blue-600" />
                            <h1 className="text-xl font-semibold text-gray-900">Create New Proposal</h1>
                        </div>
                        <div className="flex items-center space-x-3">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                saveSuccess 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-gray-100 text-gray-800'
                            }`}>
                                {saveSuccess ? 'Saved!' : 'Draft'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Editor Section */}
                    <div className="space-y-6">
                        {/* Proposal Details Card */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h2 className="text-lg font-medium text-gray-900">Proposal Details</h2>
                                <p className="text-sm text-gray-500 mt-1">
                                    Configure the basic information for your proposal
                                </p>
                            </div>
                            <div className="px-6 py-4 space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Proposal Title</Label>
                                    <Input
                                        id="title"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="Enter proposal title..."
                                        className="w-full"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="clientName">Client Name</Label>
                                    <Input
                                        id="clientName"
                                        value={clientName}
                                        onChange={(e) => setClientName(e.target.value)}
                                        placeholder="Enter client name..."
                                        className="w-full"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Content Card */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h2 className="text-lg font-medium text-gray-900">Content</h2>
                                <p className="text-sm text-gray-500 mt-1">
                                    Write the main content of your proposal using our rich text editor
                                </p>
                            </div>
                            <div className="px-6 py-4">
                                <div className="border rounded-lg overflow-hidden">
                                    <BlueprintEditor
                                        onUpdate={(editorContent) => setContent(editorContent)}
                                        initialContent={typeof content === 'string' ? content : undefined}
                                        showComments={false}
                                        className="border-0 shadow-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons Card */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                            <div className="px-6 py-4">
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <Button
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        className="flex items-center justify-center gap-2"
                                    >
                                        {isSaving ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Save className="h-4 w-4" />
                                        )}
                                        {isSaving ? 'Saving...' : 'Save Proposal'}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={handlePreview}
                                        className="flex items-center justify-center gap-2"
                                    >
                                        {showPreview ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                        {showPreview ? 'Hide Preview' : 'Show Preview'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Preview Section */}
                    <div className="space-y-6">
                        {showPreview ? (
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                                <div className="px-6 py-4 border-b border-gray-200">
                                    <h2 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                                        <FileText className="h-5 w-5" />
                                        PDF Preview
                                    </h2>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Live preview of your proposal as it will appear in the final PDF
                                    </p>
                                </div>
                                <div className="px-6 py-4">
                                    <ProposalPreview document={doc} />
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white rounded-lg shadow-sm border-2 border-dashed border-gray-200 h-[600px]">
                                <div className="flex flex-col items-center justify-center h-full text-center px-6">
                                    <Eye className="h-12 w-12 text-gray-300 mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">PDF Preview</h3>
                                    <p className="text-gray-500 mb-4 max-w-sm">
                                        Click &ldquo;Show Preview&rdquo; to see how your proposal will look as a PDF
                                    </p>
                                    <Button variant="outline" onClick={handlePreview}>
                                        Show Preview
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
} 