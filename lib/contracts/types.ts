import type { ThaiResidentialLeaseDocumentProps } from "@/components/contracts/ThaiResidentialLeaseDocument";
export type LeaseClause = { id: string; title: string; body: string };
export type LeaseContent = { version: 1; title: string; clauses: LeaseClause[] };
export type LeaseDocumentVersion = {
  id: string;
  created_at: string;
  content: LeaseContent;
  snapshot: ThaiResidentialLeaseDocumentProps;
};
export type LeaseDocumentState = {
  storageReady: boolean;
  versions: LeaseDocumentVersion[];
  template: LeaseContent | null;
  templateId: string | null;
  initialTemplate: LeaseContent | null;
  canSaveTemplate: boolean;
};
