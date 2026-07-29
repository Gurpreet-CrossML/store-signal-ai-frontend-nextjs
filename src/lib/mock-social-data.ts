
export type SocialPlatform = "facebook" | "instagram";

export interface SocialAccount {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  platform: SocialPlatform;
}

export interface SocialPost {
  id: string;
  title: string;
  date: string;
  commentsCount: number;
  image: string;
  reach?: string;
  impressions?: string;
  likes?: string;
  shares?: string;
  engagement: string;
  postType?: string;
  labels?: string[];
  moderationSummary?: { positive: number; neutral: number; negative: number; spam: number };
  topQuestions?: string[];
  relatedProducts?: { id: string; name: string; price: string; image: string; inStock: boolean }[];
}

export interface SocialReply {
  id: string;
  author: string;
  role: "customer" | "agent";
  timeAgo: string;
  content: string;
  avatar?: string;
  reactions?: number;
}

export interface SocialComment {
  id: string;
  postId: string;
  author: string;
  handle?: string; // used for IG
  timeAgo: string;
  content: string;
  avatar: string;
  tags: { label: string; type: "question" | "feedback" | "positive" | "negative" | "neutral" }[];
  replies?: SocialReply[];
  internalNotes?: {
    id: string;
    content: string;
    author: string;
    time: string;
  }[];
  aiIntent?: string;
  aiConfidence?: number;
}

export interface SocialContact {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  localTime: string;
  followedSince?: string;
  likedPage?: string;
  totalMessages: number;
  tags: string[];
  previousOrders: {
    id: string;
    date: string;
    amount: string;
    status: string;
    image: string;
  }[];
  customFields: {
    customerType: string;
    preferredCategory: string;
  };
}

export interface SocialMessage {
  id: string;
  sender: "customer" | "agent";
  content: string;
  time: string;
  isRead?: boolean;
  reaction?: string;
}

export interface SocialConversation {
  id: string;
  contact: SocialContact;
  lastMessage: string;
  timeAgo: string;
  unreadCount: number;
  messages: SocialMessage[];
}

export const MOCK_FB_ACCOUNTS: SocialAccount[] = [
  { id: "fb1", name: "Safarnest Fashion", handle: "@safarnestfashion", avatar: "/fb-avatar-1.jpg", platform: "facebook" },
  { id: "fb2", name: "Safarnest Home", handle: "@safarnesthome", avatar: "/fb-avatar-2.jpg", platform: "facebook" },
];

export const MOCK_IG_ACCOUNTS: SocialAccount[] = [
  { id: "ig1", name: "Safarnest Fashion", handle: "@safarnest.fashion", avatar: "/ig-avatar-1.jpg", platform: "instagram" },
  { id: "ig2", name: "Safarnest Home", handle: "@safarnest.home", avatar: "/ig-avatar-2.jpg", platform: "instagram" },
];

export const MOCK_POSTS: SocialPost[] = [
  {
    id: "p1",
    title: "Summer collection is here ☀️",
    date: "May 16, 2024 at 10:30 AM",
    commentsCount: 23,
    image: "/post-1.jpg",
    reach: "12.4K",
    impressions: "15.2K",
    likes: "1.2K",
    shares: "86",
    engagement: "8.7%",
    postType: "Image",
    labels: ["Product Launch", "Summer Collection", "Top Performing", "Organic"],
    moderationSummary: { positive: 81, neutral: 15, negative: 4, spam: 2 },
    topQuestions: ["Available sizes", "Blue colour option", "Delivery time", "Fabric material"],
    relatedProducts: [{ id: "prod1", name: "Summer Floral Dress", price: "₹1,599", image: "/post-1.jpg", inStock: true }]
  },
  {
    id: "p2",
    title: "New arrivals just landed! ✨",
    date: "May 15, 2024 at 4:20 PM",
    commentsCount: 18,
    image: "/post-2.jpg",
    reach: "10.1K",
    likes: "950",
    engagement: "7.2%"
  },
  {
    id: "p3",
    title: "Minimalist design, maximum impact.",
    date: "May 14, 2024 at 11:15 AM",
    commentsCount: 12,
    image: "/post-3.jpg",
    reach: "8.5K",
    likes: "700",
    engagement: "5.4%"
  }
];

export const MOCK_COMMENTS: SocialComment[] = [
  {
    id: "c1",
    postId: "p1",
    author: "Priya Sharma",
    handle: "priyasharma_",
    timeAgo: "2m",
    content: "Love the yellow dress! 💛 Is it available in size M?",
    avatar: "/user-1.jpg",
    tags: [
      { label: "Question", type: "question" },
      { label: "Product inquiry", type: "neutral" },
      { label: "Positive", type: "positive" }
    ],
    replies: [
      { id: "r1", author: "Agent (You)", role: "agent", timeAgo: "Just now", content: "Yes, we do! Size M is available.\nYou can order it from here:\n[product link]" },
      { id: "r2", author: "Priya Sharma", role: "customer", timeAgo: "Just now", content: "Thanks! 😍" }
    ],
    internalNotes: [
      { id: "n1", content: "Customer asked about size M availability. Responded with product link.", author: "Added by you", time: "May 16, 10:31 AM" }
    ],
    aiIntent: "Product inquiry",
    aiConfidence: 92
  },
  {
    id: "c2",
    postId: "p2",
    author: "Rohit Verma",
    handle: "rohit.verma23",
    timeAgo: "5m",
    content: "Price seems a bit high compared to other brands.",
    avatar: "/user-2.jpg",
    tags: [
      { label: "Feedback", type: "feedback" },
      { label: "Price concern", type: "negative" }
    ],
    replies: [],
    internalNotes: [],
    aiIntent: "Price concern",
    aiConfidence: 85
  },
  {
    id: "c3",
    postId: "p1",
    author: "Sneha Iyer",
    handle: "snehalayer",
    timeAgo: "8m",
    content: "Do you offer international shipping?",
    avatar: "/user-3.jpg",
    tags: [
      { label: "Question", type: "question" },
      { label: "Shipping", type: "neutral" }
    ],
    replies: [],
    aiIntent: "Shipping inquiry",
    aiConfidence: 95
  }
];

export const MOCK_CONTACT: SocialContact = {
  id: "contact1",
  name: "Priya Sharma",
  handle: "@priya.sharma",
  avatar: "/user-1.jpg",
  localTime: "10:35 AM (GMT +5:30)",
  followedSince: "Apr 12, 2024",
  likedPage: "Apr 12, 2024",
  totalMessages: 7,
  tags: ["New customer", "Product inquiry", "Interested"],
  previousOrders: [
    {
      id: "SNF10234",
      date: "May 5, 2024",
      amount: "₹1,599.00",
      status: "Delivered",
      image: "/post-1.jpg" // reusing post image for simplicity
    }
  ],
  customFields: {
    customerType: "New",
    preferredCategory: "Women Dresses"
  }
};

export const MOCK_CONVERSATIONS: SocialConversation[] = [
  {
    id: "conv1",
    contact: MOCK_CONTACT,
    lastMessage: "Awesome, thanks!",
    timeAgo: "2m",
    unreadCount: 1,
    messages: [
      { id: "m1", sender: "customer", content: "Hey! Do you have this dress in size M?", time: "10:30 AM" },
      { id: "m2", sender: "agent", content: "Yes, we do have it in size M. Would you like me to share more details or help you place an order?", time: "10:31 AM", isRead: true },
      { id: "m3", sender: "customer", content: "Great! What is the fabric like?", time: "10:32 AM" },
      { id: "m4", sender: "agent", content: "It's made from 100% organic cotton. Very soft and breathable, perfect for summer.", time: "10:33 AM", isRead: true },
      { id: "m5", sender: "customer", content: "Sounds good. Do you offer cash on delivery?", time: "10:34 AM" },
      { id: "m6", sender: "agent", content: "Yes, we do offer cash on delivery across India.", time: "10:34 AM", isRead: true },
      { id: "m7", sender: "customer", content: "Awesome, thanks!", time: "10:35 AM", reaction: "❤️" }
    ]
  },
  {
    id: "conv2",
    contact: { ...MOCK_CONTACT, id: "contact2", name: "Rahul Verma", handle: "@rahul_v" },
    lastMessage: "Can you help me track my order?",
    timeAgo: "15m",
    unreadCount: 2,
    messages: []
  },
  {
    id: "conv3",
    contact: { ...MOCK_CONTACT, id: "contact3", name: "Ananya Iyer", handle: "@ananya" },
    lastMessage: "Do you ship internationally?",
    timeAgo: "1h",
    unreadCount: 0,
    messages: []
  }
];
