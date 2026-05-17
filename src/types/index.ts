import { Timestamp } from "firebase/firestore";

export interface User {
  uid: string;
  email?: string;
  name?: string;
  age?: number;
  gender?: "male" | "female" | "non-binary" | "prefer-not-to-say";
  bio?: string;
  interests?: string[];
  photoURL?: string;
  onboardingCompleted: boolean;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  isActive?: boolean;
  blockedUsers?: string[];
  sameGenderMode?: boolean;
}

export interface Session {
  id?: string;
  userId: string;
  from: string;
  to: string;
  active: boolean;
  timestamp: Timestamp;
  expiresAt: Timestamp;
  userName?: string;
  userPhoto?: string;
}

export interface Like {
  id?: string;
  fromUserId: string;
  toUserId: string;
  timestamp: Timestamp;
}

export interface Match {
  id?: string;
  users: [string, string];
  userDetails: {
    [uid: string]: {
      name: string;
      photoURL?: string;
      email?: string;
    };
  };
  createdAt: Timestamp;
  lastMessage?: string;
  lastMessageAt?: Timestamp;
}

export interface Message {
  id?: string;
  matchId: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: Timestamp;
  read: boolean;
}

export interface Report {
  id?: string;
  reporterId: string;
  reportedUserId: string;
  reason: string;
  description?: string;
  timestamp: Timestamp;
}

export interface SwipeCard {
  uid: string;
  name: string;
  age: number;
  bio?: string;
  interests?: string[];
  photoURL?: string;
  from: string;
  to: string;
  gender?: string;
}

export const INTEREST_OPTIONS = [
  "Music", "Tech", "Books", "Sports", "Gaming",
  "Travel", "Food", "Art", "Movies", "Fitness",
  "Photography", "Coding", "Design", "Business",
  "Startups", "Finance", "Politics", "Science",
  "Yoga", "Cooking", "Fashion", "Dance", "Writing",
  "Podcasts", "Coffee", "Cycling", "Hiking", "Cars",
];

export const METRO_STATIONS = {
  "Bengaluru": [
    "Byappanahalli", "Swami Vivekananda Road", "Indiranagar",
    "Halasuru", "Trinity", "Mahatma Gandhi Road", "Cubbon Park",
    "Vidhana Soudha", "Sir M Visvesvaraya", "City Railway Station",
    "Magadi Road", "Hosahalli", "Vijayanagar", "Attiguppe",
    "Deepanjali Nagar", "Mysore Road", "Baiyappanahalli",
    "Whitefield", "Mahadevapura", "KR Puram", "Tin Factory",
    "Benniganahalli", "Nagawara", "Thanisandra", "Gottigere",
    "Bannerghatta Road", "JP Nagar", "Jayanagar", "Rashtriya Vidyalaya Road",
    "Lalbagh", "South End Circle", "Chickpete", "Kempegowda",
    "Peenya", "Yeshwanthpur", "Sandal Soap Factory", "Jalahalli",
    "Dasarahalli", "Nagasandra",
  ],
  "Delhi": [
    "Rajiv Chowk", "Kashmere Gate", "Central Secretariat",
    "Hauz Khas", "HUDA City Centre", "Dwarka", "Noida City Centre",
    "Botanical Garden", "Saket", "Nehru Place", "Connaught Place",
    "New Delhi", "Indraprastha", "Akshardham",
  ],
  "Mumbai": [
    "Versova", "Gundavali", "Azad Nagar", "DN Nagar",
    "Andheri", "Western Express Highway", "Chakala",
    "Airport Road", "Marol Naka", "SEEPZ", "Saki Naka",
    "Ghatkopar", "Jagruti Nagar", "Vikhroli",
  ],
};
