export interface ChecklistItem {
  id: string;
  text: string;
  category: string;
  priority: 'High' | 'Medium' | 'Low';
  checked: boolean;
}

export interface ChecklistSection {
  category: string;
  items: ChecklistItem[];
  priority: 'High' | 'Medium' | 'Low';
}

export interface ChecklistState {
  url: string;
  checkedItems: string[]; // item IDs
  lastUpdated: number;
}

