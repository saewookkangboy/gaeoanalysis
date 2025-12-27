export type ModificationType = 
  | 'meta-description'
  | 'meta-title'
  | 'h1-tag'
  | 'h2-tag'
  | 'image-alt'
  | 'structured-data'
  | 'keyword-optimization'
  | 'content-structure'
  | 'other';

export interface ContentModification {
  id: string;
  type: ModificationType;
  title: string;
  before: string;
  after: string;
  reason: string;
  expectedImpact: string;
  selector?: string; // HTML 요소 선택자 (적용 시 사용)
  applied: boolean;
}

export interface ModificationHistory {
  analysisId: string;
  url: string;
  modifications: ContentModification[];
  createdAt: number;
  lastUpdated: number;
}

