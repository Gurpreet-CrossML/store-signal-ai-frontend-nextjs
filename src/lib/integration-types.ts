export type IntegrationCategory = "support" | "chat" | string;

export type IntegrationAttribute = {
  id: number;
  code: string;
  display_name: string;
  type: "text" | "url" | string;
  is_required: boolean;
};

export type CoreIntegration = {
  id: number;
  name: string;
  logo: string | null;
  description: string;
  is_active: boolean;
  category: {
    id: number | null;
    category: IntegrationCategory;
  };
  category_label: string;
  steps_for_creds: string;
  scope: string | string[] | null;
  attributes?: IntegrationAttribute[];
};

export type IntegrationCatalogItem = CoreIntegration & {
  attributes: IntegrationAttribute[];
};
