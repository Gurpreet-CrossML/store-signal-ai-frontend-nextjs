import type {
  KnowledgeType,
  ProductOption,
} from "@/redux/api-slice/knowledge-rag-slice";

export type SourceStepProps = {
  knowledgeType: KnowledgeType;
  product: ProductOption | null;
  onBack: () => void;
  onDone: () => void;
};
