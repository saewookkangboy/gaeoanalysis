import { ChecklistItem as ChecklistItemType } from '@/types/checklist';

interface ChecklistItemProps {
  item: ChecklistItemType;
  onToggle: (id: string, checked: boolean) => void;
}

export default function ChecklistItem({ item, onToggle }: ChecklistItemProps) {
  return (
    <li className="flex items-start gap-2 p-2 rounded-md hover:bg-white transition-colors">
      <input
        type="checkbox"
        id={item.id}
        checked={item.checked}
        onChange={(e) => onToggle(item.id, e.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500 flex-shrink-0"
      />
      <label
        htmlFor={item.id}
        className={`flex-1 text-xs text-gray-700 cursor-pointer leading-relaxed ${
          item.checked ? 'line-through text-gray-500' : ''
        }`}
      >
        {item.text}
      </label>
    </li>
  );
}

