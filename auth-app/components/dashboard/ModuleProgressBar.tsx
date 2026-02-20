/**
 * Module Progress Bar Component
 *
 * Displays a progress bar with percentage for a module
 */

'use client';

interface ModuleProgressBarProps {
  moduleId: string;
  moduleName: string;
  completedChapters: number;
  totalChapters: number;
  progressPercentage: number;
}

export default function ModuleProgressBar({
  moduleId,
  moduleName,
  completedChapters,
  totalChapters,
  progressPercentage,
}: ModuleProgressBarProps) {
  // Format module name from ID (e.g., "part-2-markdown-prompt-context" -> "Part 2: Markdown & Prompt Context")
  const formatModuleName = (id: string): string => {
    if (moduleName) return moduleName;

    const parts = id.split('-');
    if (parts[0] === 'part' && parts[1]) {
      const partNum = parts[1];
      const name = parts.slice(2).join(' ');
      return `Part ${partNum}: ${name.charAt(0).toUpperCase() + name.slice(1).replace(/-/g, ' ')}`;
    }
    return id.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  const displayName = formatModuleName(moduleId);

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-sm font-medium text-gray-700">{displayName}</h4>
        <span className="text-sm text-gray-600">
          {completedChapters}/{totalChapters} chapters
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div
          className="bg-gradient-to-r from-green-400 to-blue-500 h-3 rounded-full transition-all duration-300"
          style={{ width: `${progressPercentage}%` }}
        >
          <span className="sr-only">{progressPercentage}% complete</span>
        </div>
      </div>
      <p className="text-xs text-gray-500 mt-1 text-right">{progressPercentage}% complete</p>
    </div>
  );
}
