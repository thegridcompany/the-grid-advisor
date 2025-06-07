'use client';

import React from 'react';
import { usePDF, PDFViewer, DocumentProps } from '@react-pdf/renderer';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';

interface ProposalPreviewProps {
    document: React.ReactElement<DocumentProps>;
}

export const ProposalPreview: React.FC<ProposalPreviewProps> = ({ document }) => {
    const [instance, updateInstance] = usePDF({ document });

    React.useEffect(() => {
        updateInstance(document);
    }, [document, updateInstance]);

    return (
        <div className="space-y-4">
            {/* Download Button */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    {instance.loading ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Generating PDF...</span>
                        </>
                    ) : (
                        <span>PDF ready for download</span>
                    )}
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    disabled={instance.loading || !instance.url}
                    className="flex items-center gap-2"
                    asChild
                >
                    <a
                        href={instance.url || '#'}
                        download="proposal.pdf"
                        className={instance.loading || !instance.url ? 'pointer-events-none' : ''}
                    >
                        <Download className="h-4 w-4" />
                        Download PDF
                    </a>
                </Button>
            </div>

            {/* PDF Viewer */}
            <div className="border rounded-lg overflow-hidden bg-gray-50">
                <div className="w-full h-[600px] relative">
                    {instance.loading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-gray-400" />
                                <p className="text-gray-500 text-sm">Rendering PDF preview...</p>
                                <p className="text-gray-400 text-xs mt-1">This may take a few moments</p>
                            </div>
                        </div>
                    ) : (
                        <PDFViewer 
                            width="100%" 
                            height="100%"
                            style={{ border: 'none' }}
                            showToolbar={true}
                        >
                            {document}
                        </PDFViewer>
                    )}
                </div>
            </div>
        </div>
    );
}; 