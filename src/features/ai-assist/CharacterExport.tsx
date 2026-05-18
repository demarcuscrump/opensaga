/**
 * Character Export/Import — JSON-based character draft portability
 *
 * Users can export their character drafts as JSON files and re-import
 * them later or share with collaborators.
 */

import React, { useRef } from 'react';
import { Download, Upload } from 'lucide-react';

interface CharacterDraft {
  name: string;
  aliases: string;
  archetype: string;
  species: string;
  age: string;
  pronouns: string;
  appearance: string;
  distinguishingFeatures: string;
  attire: string;
  backstory: string;
  formativeEvents: string;
  secrets: string;
  powers: string;
  limitations: string;
  fears: string;
  desires: string;
  quirks: string;
  speechPattern: string;
}

interface Props {
  character: CharacterDraft;
  onImport: (character: CharacterDraft) => void;
  imagePreview?: string | null;
}

export function CharacterExport({ character, onImport, imagePreview }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      platform: 'OpenSaga Creator Studio',
      character,
      imagePreview: imagePreview || null,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${character.name || 'character'}-opensaga.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (data.character) {
          onImport(data.character);
        }
      } catch {
        alert('Invalid character file. Please use a JSON file exported from OpenSaga.');
      }
    };
    reader.readAsText(file);
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleExport}
        disabled={!character.name}
        className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] text-text-secondary border border-border rounded-lg hover:border-accent-primary/30 hover:text-text-primary transition-colors disabled:opacity-40"
        title="Export character as JSON"
      >
        <Download size={11} />
        Export
      </button>
      <button
        onClick={() => fileInputRef.current?.click()}
        className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] text-text-secondary border border-border rounded-lg hover:border-accent-primary/30 hover:text-text-primary transition-colors"
        title="Import character from JSON"
      >
        <Upload size={11} />
        Import
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleImport}
        className="hidden"
      />
    </div>
  );
}
