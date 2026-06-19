export type NormalizedTicketDetail = {
  subject: string;
  description: string;
  status: string;
  priority: string;
  requester: {
    name?: string;
    email?: string;
  } | null;
  conversation: {
    author?: string;
    body: string;
    created_at: string;
  }[];
  attachments: {
    name: string;
    url: string;
  }[];
  created_at: string;
  updated_at: string;
};
