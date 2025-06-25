'use client';

import React, { useState, useEffect, useMemo } from 'react';

interface ParsedFileInfo {
  directory: string;
  filename: string;
  layerNum?: string; 
  assetNum?: string; 
  type?: string; 
  name?: string; 
  character?: string;
  genes?: string;
  rarity?: string;
  filenameParts: string[];
  separators: string[];
}

interface GroupedFiles {
  [directory: string]: ParsedFileInfo[];
}

// <<< Define Tab Type >>>
type FilenameTab = 'current' | 'refactor';

export default function FilenamesPage() {
  const [fileList, setFileList] = useState<ParsedFileInfo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  // <<< Add State for Active Tab >>>
  const [activeTab, setActiveTab] = useState<FilenameTab>('current'); 
  // <<< Add State for Checkboxes >>>
  const [checkedFiles, setCheckedFiles] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchFiles = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/asset-files');
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({})); // Try to parse error
          throw new Error(errorData.error || `API Error: ${response.statusText}`);
        }
        const result = await response.json();

        if (!result.success || !Array.isArray(result.data)) {
          throw new Error('Invalid data format from asset files API.');
        }

        setFileList(result.data);

      } catch (err: any) {
        console.error("Failed to fetch asset file list:", err);
        setError(err.message || 'Could not load file list.');
        setFileList([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFiles();
  }, []); // Run only once on mount

  // Group files by directory using useMemo for efficiency
  const groupedFiles = useMemo(() => {
    if (!fileList || fileList.length === 0) {
      return {} as GroupedFiles;
    }
    return fileList.reduce<GroupedFiles>((acc, file) => {
      const dir = file.directory || 'Uncategorized'; // Group files without directory
      if (!acc[dir]) {
        acc[dir] = [];
      }
      acc[dir].push(file);
      // Sort files within the directory group by filename
      acc[dir].sort((a, b) => a.filename.localeCompare(b.filename)); 
      return acc;
    }, {});
  }, [fileList]);

  // <<< Calculate sortedDirectories (restore useMemo) >>>
  const sortedDirectories = useMemo(() => Object.keys(groupedFiles).sort((a, b) => {
    // Extract leading numbers for sorting (e.g., "01 Logo" -> 1)
    const numA = parseInt(a.split(' ')[0], 10);
    const numB = parseInt(b.split(' ')[0], 10);
    if (!isNaN(numA) && !isNaN(numB)) {
      return numA - numB;
    }
    // Fallback to localeCompare if numbers aren't present or parsing fails
    return a.localeCompare(b);
  }), [groupedFiles]);
  // const sortedDirectories: string[] = []; // <<< Remove temporary empty array >>>

  // Calculate Proportional Counts for Type B files (Layers 07-25)
  // <<< Restore useMemo and add try...catch >>>
  const typeBCounts = useMemo(() => {
    try {
      const targetTotal = 3333;
      const typeBFilesList = fileList.filter(file => {
        const layerNumStr = file.filenameParts[0];
        const layerNum = layerNumStr ? parseInt(layerNumStr, 10) : NaN;
        return !isNaN(layerNum) && layerNum >= 7 && layerNum <= 25;
      });
      const numTypeBFiles = typeBFilesList.length;
      if (numTypeBFiles === 0) return new Map<string, number>();

      const averageCount = Math.floor(targetTotal / numTypeBFiles); // Base count
      const remainder = targetTotal % numTypeBFiles; // How many files get +1

      // Sort the files deterministically *before* assigning counts
      const sortedTypeBFiles = [...typeBFilesList].sort((a, b) => a.filename.localeCompare(b.filename));

      const counts = new Map<string, number>();
      sortedTypeBFiles.forEach((file, index) => {
        // Assign averageCount + 1 to the first 'remainder' files in the sorted list
        const count = index < remainder ? averageCount + 1 : averageCount; 
        counts.set(file.filename, count);
      });

      return counts;
    } catch (error: any) {
      // Error case: return empty map
      return new Map<string, number>(); 
    }
  }, [fileList]);
  // const typeBCounts = (() => { ... })(); // Remove IIFE version

  // Define the number of columns to display for PARTS
  const MAX_PART_COLUMNS = 20;
  // Total columns will be parts + separators
  const PARTS_AND_SEPARATORS_COLUMNS = MAX_PART_COLUMNS + (MAX_PART_COLUMNS - 1); 
  // <<< Add 1 for the checkbox column >>>
  const TOTAL_TABLE_COLUMNS = PARTS_AND_SEPARATORS_COLUMNS + 1; 

  // Define inferred subtitles for the columns, adjusted based on feedback
  const inferredSubtitles: { [key: number]: string } = {
    0: "Layer #",
    1: "Asset #",
    2: "Type",
    3: "Name",
    4: "Char?",
    5: "Gene?",
    6: "RGB?",
    7: "Rarity?",
    8: "Stat1 Name?",
    9: "Stat1 Val?",
    10: "Stat2 Name?",
    11: "Stat2 Val?",
    12: "Stat3 Name?",
    13: "Stat3 Val?",
    14: "Stat4 Name?",
    15: "Stat4 Val?",
    16: "Stat5 Name?",
    17: "Stat5 Val?",
    18: "Stat6 Name?",
    19: "Stat6 Val?"
  };

  // <<< Checkbox Handler >>>
  const handleFileCheckChange = (filename: string, isChecked: boolean) => {
    setCheckedFiles(prev => {
      const newSet = new Set(prev);
      if (isChecked) {
        newSet.add(filename);
      } else {
        newSet.delete(filename);
      }
      return newSet;
    });
  };

  // <<< Abstract Table Renderer Base >>>
  const renderTableStructure = (keyPrefix: string, renderCellContent: (file: ParsedFileInfo, partIndex: number) => React.ReactNode) => {
    // <<< Log the type of renderCellContent received >>>
    console.log(`[Render Table Structure - ${keyPrefix}] Received renderCellContent type: ${typeof renderCellContent}`);
    
    // <<< Ensure return statement is correct >>>
    return (
      <table className="w-full table-auto border-collapse border border-gray-700 text-xs">
        <thead className="sticky top-0 bg-gray-800 z-10">
          {/* Header Row 1 */}
          <tr>
            {/* Checkbox Header */}
            <th rowSpan={2} className="border-b-2 border-gray-600 px-2 py-1 text-left text-green-300 w-10">
              {/* Optional: Select All Checkbox */}
               <input type="checkbox" disabled title="Select All (Not Implemented)" className="form-checkbox h-4 w-4 text-pink-600 bg-gray-700 border-gray-600 rounded focus:ring-pink-500" />
            </th>
            {/* Part Headers */}
            {Array.from({ length: MAX_PART_COLUMNS }, (_, i) => (
              <React.Fragment key={`${keyPrefix}-header-frag-${i}`}>
                <th className="border-b-2 border-gray-600 px-2 pt-2 pb-1 text-left text-green-300 whitespace-nowrap">
                  Part {i + 1}
                </th>
                {i < MAX_PART_COLUMNS - 1 && <th className="border-b-2 border-gray-600 px-1 pt-2 pb-1 w-1"></th>}
              </React.Fragment>
            ))}
          </tr>
          {/* Header Row 2 (Subtitles) */}
          <tr>
            {Array.from({ length: MAX_PART_COLUMNS }, (_, i) => (
              <React.Fragment key={`${keyPrefix}-subtitle-frag-${i}`}>
                <th className="border-b border-gray-600 px-2 pb-2 pt-0 text-left text-gray-400 whitespace-nowrap font-normal text-[10px]">
                  {inferredSubtitles[i] || ''}
                </th>
                {i < MAX_PART_COLUMNS - 1 && <th className="border-b border-gray-600 px-1 pb-2 pt-0 w-1"></th>}
              </React.Fragment>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedDirectories.map(directory => (
            <React.Fragment key={`${keyPrefix}-${directory}`}>
              {/* Directory Header Row */}
              <tr className="bg-gray-700/50">
                {/* Update colspan for Directory Header */}
                <td colSpan={TOTAL_TABLE_COLUMNS} className="border border-gray-600 px-2 py-1.5 text-green-300 font-semibold text-sm">
                  {directory}
                </td>
              </tr>
              {/* Files within the directory */}
              {groupedFiles[directory].map((file, index) => (
                <tr 
                  key={`${keyPrefix}-${file.directory}-${file.filename}-${index}`}
                  className={'hover:bg-gray-700/50'}
                >
                  {/* Checkbox Cell */}
                  <td className="border border-gray-600 px-2 py-1 text-center">
                     <input 
                        type="checkbox" 
                        checked={checkedFiles.has(file.filename)}
                        onChange={(e) => handleFileCheckChange(file.filename, e.target.checked)}
                        className="form-checkbox h-4 w-4 text-pink-600 bg-gray-700 border-gray-600 rounded focus:ring-pink-500 cursor-pointer"
                      />
                  </td>
                  {/* Parts and Separator Cells */}
                  {Array.from({ length: MAX_PART_COLUMNS }, (_, i) => (
                     <React.Fragment key={`${keyPrefix}-cell-frag-${index}-${i}`}>
                        <td className="border border-gray-600 px-2 py-1 text-gray-300 font-mono whitespace-nowrap">
                          {renderCellContent(file, i)}
                        </td>
                        {i < MAX_PART_COLUMNS - 1 && (
                          <td className="border border-gray-600 px-1 py-1 text-gray-500 font-mono w-1 text-center">
                            {file.separators[i] || ''}
                          </td>
                        )}
                     </React.Fragment>
                  ))}
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    );
  };

  // Cell Content Renderers for Tabs
  const renderCurrentViewContent = (file: ParsedFileInfo, partIndex: number) => {
    return file.filenameParts[partIndex] || '';
  }

  const renderRefactorViewContent = (file: ParsedFileInfo, partIndex: number) => {
    const originalPart = file.filenameParts[partIndex] || '';
    const layerNumStr = file.filenameParts[0];
    const layerNum = layerNumStr ? parseInt(layerNumStr, 10) : NaN;
    const isTypeB = !isNaN(layerNum) && layerNum >= 7 && layerNum <= 25;

    if (partIndex === 7 && isTypeB) { // Rarity column for Type B
      const filenameKey = file.filename;
      const count = typeBCounts.get(filenameKey);
      return count !== undefined ? String(count) : 'Err'; // Show 'Err' if count is missing
    }
    return originalPart; // Other columns or non-Type B rows
  };

  // --- Main JSX Return ---
  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-full mx-auto px-4">
        <h1 className="text-3xl font-bold text-green-400 mb-6 text-center">
          Asset Filenames & Raw Parts
        </h1>
        
        <div className="mb-4 border-b border-gray-700 flex">
           <button 
              onClick={() => setActiveTab('current')}
              className={`py-2 px-4 text-sm font-medium transition-colors ${activeTab === 'current' ? 'border-b-2 border-green-400 text-green-300' : 'text-gray-500 hover:text-gray-300'}`}
            > Current View </button>
            <button 
              onClick={() => setActiveTab('refactor')}
              className={`py-2 px-4 text-sm font-medium transition-colors ${activeTab === 'refactor' ? 'border-b-2 border-orange-400 text-orange-300' : 'text-gray-500 hover:text-gray-300'}`}
            > Rarity Refactor </button>
        </div>

        {!isLoading && !error && (
           <p className="text-sm text-gray-400 mb-4">Total Files Found: {fileList.length}</p>
        )}

        {/* Conditional Content Area */}
        <div className="bg-gray-900 p-4 rounded-lg shadow-lg overflow-x-auto">
          {isLoading && <p className="text-center text-gray-400 animate-pulse py-4">Loading...</p>}
          {error && <p className="text-center text-red-500 py-4">Error: {error}</p>}
          
          {/* Render based on active tab */}
          {!isLoading && !error && sortedDirectories.length > 0 && (
              <> 
                {activeTab === 'current' && renderTableStructure('current', renderCurrentViewContent)}
                {activeTab === 'refactor' && renderTableStructure('refactor', renderRefactorViewContent)}
              </>
          )}

          {!isLoading && !error && sortedDirectories.length === 0 && (
            <p className="text-center text-gray-500 py-4">No asset files found.</p>
          )}
        </div>
      </div>
    </div>
  );
} 