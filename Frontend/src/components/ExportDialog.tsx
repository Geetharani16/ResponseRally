import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X } from 'lucide-react';
import { SessionState } from '@/types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  session: SessionState;
}

const ExportDialog: React.FC<ExportDialogProps> = ({ isOpen, onClose, session }) => {
  const [exportName, setExportName] = useState('ResponseRally_Export');
  const [exportFormat, setExportFormat] = useState('pdf');

  const handleExport = async () => {
    try {
      // Generate export content based on selected format
      if (exportFormat === 'json') {
        const jsonData = {
          exportedAt: new Date().toISOString(),
          sessionName: exportName,
          application: 'ResponseRally',
          data: {
            conversationHistory: session.conversationHistory,
            enabledProviders: session.enabledProviders,
            id: session.id
          }
        };
        
        const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${exportName}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else if (exportFormat === 'csv') {
        // Convert conversation history to CSV format
        let csvContent = 'Turn,Provider,Prompt,Response,Latency,Tokens,Speed\n';
        
        session.conversationHistory.forEach((turn, index) => {
          turn.allResponses.forEach(response => {
            const row = [
              index + 1,
              response.provider,
              `"${turn.userPrompt.replace(/"/g, '""')}"`,
              `"${response.response.replace(/"/g, '""')}"`,
              response.metrics?.latencyMs || '',
              response.metrics?.tokenCount || '',
              response.metrics?.tokensPerSecond || ''
            ].join(',');
            csvContent += row + '\n';
          });
        });
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${exportName}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else if (exportFormat === 'pdf') {
        // Create actual PDF with Markdown-like styling using jsPDF
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pageWidth = pdf.internal.pageSize.getWidth();
        const margin = 15;
        
        // Add title with Markdown-like styling
        pdf.setFontSize(24);
        pdf.setTextColor(79, 70, 229); // purple-600
        pdf.setFont(undefined, 'bold');
        pdf.text('# ResponseRally Export', margin, 20);
        
        pdf.setFontSize(12);
        pdf.setFont(undefined, 'normal');
        pdf.setTextColor(0, 0, 0);
        pdf.text(`**Export Name:** ${exportName}`, margin, 32);
        pdf.text(`**Exported on:** ${new Date().toLocaleString()}`, margin, 40);
        
        let yPos = 50;
        const lineHeight = 8;
        
        // Add horizontal rule
        pdf.setDrawColor(200, 200, 200);
        pdf.line(margin, yPos - 5, pageWidth - margin, yPos - 5);
        yPos += 15;
        
        // Add conversation history
        session.conversationHistory.forEach((turn, index) => {
          // Add turn header with Markdown-like styling
          pdf.setFontSize(16);
          pdf.setFont(undefined, 'bold');
          pdf.setTextColor(79, 70, 229); // purple-600
          pdf.text(`## Turn ${index + 1}`, margin, yPos);
          yPos += lineHeight * 1.5;
          
          // Add prompt header with Markdown-like styling
          pdf.setFontSize(12);
          pdf.setFont(undefined, 'bold');
          pdf.setTextColor(0, 0, 0);
          pdf.text('**Prompt:**', margin, yPos);
          yPos += lineHeight;
          
          // Split prompt into lines that fit the page
          const promptLines = pdf.splitTextToSize(turn.userPrompt, pageWidth - 2 * margin);
          promptLines.forEach(line => {
            if (yPos > 270) { // Close to bottom of page
              pdf.addPage();
              yPos = 20;
              
              // Re-add headers on new page
              pdf.setFontSize(12);
              pdf.setFont(undefined, 'normal');
              pdf.setTextColor(0, 0, 0);
              pdf.text(`**Export Name:** ${exportName}`, margin, 10);
              pdf.text(`**Page:** ${pdf.getNumberOfPages()}`, pageWidth - margin - 25, 10);
              yPos = 30;
            }
            pdf.text(line, margin, yPos);
            yPos += lineHeight;
          });
          
          yPos += lineHeight;
          
          // Add responses
          turn.allResponses.forEach(response => {
            // Add provider header with Markdown-like styling
            pdf.setFontSize(12);
            pdf.setFont(undefined, 'bold');
            pdf.setTextColor(34, 197, 94); // green-500
            pdf.text(`**${response.provider.toUpperCase()} Response:**`, margin, yPos);
            yPos += lineHeight;
            
            pdf.setFont(undefined, 'normal');
            pdf.setTextColor(0, 0, 0);
            
            // Split response into lines that fit the page
            const responseLines = pdf.splitTextToSize(response.response, pageWidth - 2 * margin);
            responseLines.forEach(line => {
              if (yPos > 270) { // Close to bottom of page
                pdf.addPage();
                yPos = 20;
                
                // Re-add headers on new page
                pdf.setFontSize(12);
                pdf.setFont(undefined, 'normal');
                pdf.setTextColor(0, 0, 0);
                pdf.text(`**Export Name:** ${exportName}`, margin, 10);
                pdf.text(`**Page:** ${pdf.getNumberOfPages()}`, pageWidth - margin - 25, 10);
                yPos = 30;
              }
              pdf.text(line, margin, yPos);
              yPos += lineHeight;
            });
            
            // Add metrics if available with Markdown-like styling
            if (response.metrics) {
              yPos += lineHeight / 2;
              pdf.setFontSize(10);
              pdf.setFont(undefined, 'italic');
              pdf.setTextColor(107, 112, 122); // gray-500
              pdf.text(`*Latency:* ${response.metrics.latencyMs}ms | *Tokens:* ${response.metrics.tokenCount} | *Speed:* ${response.metrics.tokensPerSecond} tok/s`, margin, yPos);
              pdf.setFont(undefined, 'normal');
              yPos += lineHeight;
            }
            
            yPos += lineHeight;
          });
          
          // Add separator between turns
          if (index < session.conversationHistory.length - 1) {
            pdf.setDrawColor(220, 220, 220);
            pdf.setLineWidth(0.5);
            pdf.line(margin, yPos, pageWidth - margin, yPos);
            yPos += 10;
          }
        });
        
        // Add footer
        pdf.setFontSize(8);
        pdf.setTextColor(156, 163, 175); // gray-400
        const footerText = 'Exported from ResponseRally - AI Benchmarking & Research Interface';
        const footerX = (pageWidth - pdf.getTextWidth(footerText)) / 2;
        pdf.text(footerText, footerX, 285);
        
        // Save the PDF
        pdf.save(`${exportName}.pdf`);
      }
      
      onClose();
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-0">
        <DialogHeader className="p-4 pb-2 border-b">
          <DialogTitle className="flex items-center justify-between">
            <span>Export Session</span>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose}
              className="h-6 w-6"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="p-4 space-y-4">
          <div>
            <label htmlFor="export-name" className="block text-sm font-medium mb-1">
              Export Name
            </label>
            <Input
              id="export-name"
              value={exportName}
              onChange={(e) => setExportName(e.target.value)}
              placeholder="Enter export name"
              className="w-full"
            />
          </div>
          
          <div>
            <label htmlFor="export-format" className="block text-sm font-medium mb-1">
              Export Format
            </label>
            <Select value={exportFormat} onValueChange={setExportFormat}>
              <SelectTrigger id="export-format" className="w-full">
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="text-xs text-muted-foreground">
            Export includes conversation history, metrics, and flow diagram data.
          </div>
        </div>
        
        <div className="flex justify-end gap-2 p-4 pt-2 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleExport}>
            Export
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExportDialog;