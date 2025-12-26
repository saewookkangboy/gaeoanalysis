import { ChecklistSection as ChecklistSectionType } from '@/types/checklist';
import ChecklistItem from './ChecklistItem';

interface ChecklistSectionProps {
  section: ChecklistSectionType;
  sectionIndex: number;
  onItemToggle: (id: string, checked: boolean) => void;
}

export default function ChecklistSection({
  section,
  sectionIndex,
  onItemToggle,
}: ChecklistSectionProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-600';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-600';
      case 'Low':
        return 'bg-gray-100 text-gray-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const completedCount = section.items.filter(item => item.checked).length;
  const totalCount = section.items.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-100 text-sky-600 text-xs font-bold">
            {sectionIndex + 1}
          </span>
          <h3 className="text-sm font-semibold text-gray-900">{section.category}</h3>
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${getPriorityColor(section.priority)}`}>
            {section.priority}
          </span>
        </div>
        <div className="text-xs text-gray-600">
          {completedCount}/{totalCount}
        </div>
      </div>
      
      {/* 진행률 바 */}
      <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <ul className="space-y-1">
        {section.items.map((item) => (
          <ChecklistItem
            key={item.id}
            item={item}
            onToggle={onItemToggle}
          />
        ))}
      </ul>
    </div>
  );
}

