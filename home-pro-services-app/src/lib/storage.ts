import type {
  AddressRecord,
  AppDatabase,
  BookingRecord,
  BookingStatus,
  CartItem,
  ChatMessage,
  Coordinates,
  ProfessionalRecord,
  ReviewRecord,
  ReviewVote,
  ServiceRecord,
  UserRecord,
} from './types';

const STORAGE_KEY = 'homepro-db-v2';
const CHAT_KEY = 'homepro-chat-v1';
const VOTES_KEY = 'homepro-votes-v1';

const nowIso = () => new Date().toISOString();

const createId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 10)}`;

const defaultAddress = (fullAddress: string, coordinates: Coordinates | null = null): AddressRecord => ({
  label: 'Primary',
  fullAddress,
  coordinates,
});

const seededServices: ServiceRecord[] = [
  {
    id: 'service-cleaning',
    title: 'Home Cleaning',
    description: 'Deep cleaning for kitchens, bedrooms, bathrooms, and complete homes.',
    category: 'Cleaning',
    icon: 'home',
    image: '/service-cleaning.jpg',
    subServices: ['Deep home cleaning', 'Kitchen sanitization', 'Bathroom cleaning'],
    price: 899,
    active: true,
  },
  {
    id: 'service-ac',
    title: 'Appliance Repair',
    description: 'AC, washing machine, and refrigerator servicing by verified experts.',
    category: 'Repair',
    icon: 'wrench',
    image: '/service-appliance.jpg',
    subServices: ['AC repair', 'Washing machine service', 'Refrigerator repair'],
    price: 1299,
    active: true,
  },
  {
    id: 'service-beauty',
    title: 'Beauty & Wellness',
    description: 'Salon-quality grooming and wellness appointments at home.',
    category: 'Beauty',
    icon: 'sparkles',
    image: '/service-beauty.jpg',
    subServices: ['Facial', 'Hair spa', 'Manicure & pedicure'],
    price: 699,
    active: true,
  },
  {
    id: 'service-painting',
    title: 'Painting & Decor',
    description: 'Trusted painters for touch-ups, full room repainting, and decor refreshes.',
    category: 'Painting',
    icon: 'paintbrush',
    image: '/service-painting.jpg',
    subServices: ['Wall painting', 'Texture design', 'Minor repairs before painting'],
    price: 1599,
    active: true,
  },
  {
    id: 'service-plumbing',
    title: 'Plumbing Services',
    description: 'Leak fixes, bathroom fittings, and emergency plumbing support.',
    category: 'Plumbing',
    icon: 'droplets',
    image: '/service-cleaning.jpg',
    subServices: ['Leak fixing', 'Tap replacement', 'Bathroom fittings'],
    price: 799,
    active: true,
  },
];

const seededProfessionals: ProfessionalRecord[] = [
  {
    id: 'pro-1',
    name: 'Rohit Verma',
    role: 'Senior Cleaning Expert',
    rating: 4.9,
    reviews: 1240,
    experience: 6,
    services: 450,
    image: '/professional-1.jpg',
    price: 899,
    serviceIds: ['service-cleaning'],
  },
  {
    id: 'pro-2',
    name: 'Aisha Khan',
    role: 'Beauty Specialist',
    rating: 4.8,
    reviews: 980,
    experience: 5,
    services: 380,
    image: '/professional-2.jpg',
    price: 699,
    serviceIds: ['service-beauty'],
  },
  {
    id: 'pro-3',
    name: 'Nitin Sharma',
    role: 'AC Repair Technician',
    rating: 4.7,
    reviews: 860,
    experience: 7,
    services: 510,
    image: '/professional-3.jpg',
    price: 1299,
    serviceIds: ['service-ac'],
  },
];

const seededUsers = (): UserRecord[] => [
  {
    id: 'user-admin',
    name: 'Admin User',
    email: 'admin@homepro.com',
    password: 'admin123',
    phone: '+91 90000 00000',
    role: 'admin',
    address: defaultAddress('Homepro HQ, Bengaluru, India'),
    createdAt: nowIso(),
  },
  {
    id: 'user-demo',
    name: 'Demo User',
    email: 'demo@homepro.com',
    password: 'demo123',
    phone: '+91 98765 43210',
    role: 'user',
    address: defaultAddress('221B Residency, Mumbai, India', {
      latitude: 19.076,
      longitude: 72.8777,
    }),
    createdAt: nowIso(),
  },
];

const seededBookings = (): BookingRecord[] => [
  {
    id: 'booking-demo-1',
    userId: 'user-demo',
    serviceId: 'service-cleaning',
    serviceName: 'Home Cleaning',
    professionalId: 'pro-1',
    professionalName: 'Rohit Verma',
    quantity: 1,
    unitPrice: 899,
    totalPrice: 899,
    date: '2026-04-10',
    time: '10:00 AM',
    status: 'completed',
    address: defaultAddress('221B Residency, Mumbai, India', {
      latitude: 19.076,
      longitude: 72.8777,
    }),
    createdAt: nowIso(),
  },
  {
    id: 'booking-demo-2',
    userId: 'user-demo',
    serviceId: 'service-ac',
    serviceName: 'Appliance Repair',
    professionalId: 'pro-3',
    professionalName: 'Nitin Sharma',
    quantity: 1,
    unitPrice: 1299,
    totalPrice: 1299,
    date: '2026-04-20',
    time: '02:00 PM',
    status: 'upcoming',
    address: defaultAddress('221B Residency, Mumbai, India', {
      latitude: 19.076,
      longitude: 72.8777,
    }),
    createdAt: nowIso(),
  },
];

const seededReviews = (): ReviewRecord[] => [
  {
    id: 'review-demo-1',
    bookingId: 'booking-demo-1',
    userId: 'user-demo',
    serviceId: 'service-cleaning',
    rating: 5,
    comment: 'Excellent deep cleaning service. The team was punctual and very professional.',
    createdAt: nowIso(),
  },
];

export const createInitialDatabase = (): AppDatabase => ({
  users: seededUsers(),
  services: seededServices,
  professionals: seededProfessionals,
  bookings: seededBookings(),
  reviews: seededReviews(),
  session: { userId: null },
});

export const loadDatabase = (): AppDatabase => {
  if (typeof window === 'undefined') {
    return createInitialDatabase();
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const seed = createInitialDatabase();
    saveDatabase(seed);
    return seed;
  }

  try {
    const parsed = JSON.parse(raw) as AppDatabase;
    return {
      ...createInitialDatabase(),
      ...parsed,
      session: parsed.session ?? { userId: null },
    };
  } catch {
    const seed = createInitialDatabase();
    saveDatabase(seed);
    return seed;
  }
};

export const saveDatabase = (db: AppDatabase) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
};

export const getCurrentUser = (db: AppDatabase): UserRecord | null =>
  db.users.find((user) => user.id === db.session.userId) ?? null;

export const signIn = (db: AppDatabase, email: string, password: string) => {
  const user = db.users.find(
    (candidate) => candidate.email.toLowerCase() === email.toLowerCase() && candidate.password === password
  );

  if (!user) {
    return { db, user: null, error: 'Invalid email or password.' };
  }

  return {
    db: { ...db, session: { userId: user.id } },
    user,
    error: null,
  };
};

export const signUp = (
  db: AppDatabase,
  payload: {
    name: string;
    email: string;
    password: string;
    phone: string;
  }
) => {
  const exists = db.users.some((user) => user.email.toLowerCase() === payload.email.toLowerCase());
  if (exists) {
    return { db, user: null, error: 'An account with this email already exists.' };
  }

  const user: UserRecord = {
    id: createId('user'),
    name: payload.name,
    email: payload.email,
    password: payload.password,
    phone: payload.phone,
    role: 'user',
    address: null,
    createdAt: nowIso(),
  };

  const nextDb = {
    ...db,
    users: [...db.users, user],
    session: { userId: user.id },
  };

  return { db: nextDb, user, error: null };
};

export const signOut = (db: AppDatabase): AppDatabase => ({
  ...db,
  session: { userId: null },
});

export const updateUserProfile = (
  db: AppDatabase,
  userId: string,
  payload: Partial<Pick<UserRecord, 'name' | 'phone'>> & { address?: AddressRecord | null }
): AppDatabase => ({
  ...db,
  users: db.users.map((user) =>
    user.id === userId
      ? {
          ...user,
          ...payload,
        }
      : user
  ),
});

export const createBookingsFromCart = (
  db: AppDatabase,
  userId: string,
  items: CartItem[]
): { db: AppDatabase; bookings: BookingRecord[] } => {
  const bookings = items.map((item) => ({
    id: createId('booking'),
    userId,
    serviceId: item.serviceId,
    serviceName: item.label,
    professionalId: item.professionalId,
    professionalName: item.description.startsWith('Professional:')
      ? item.description.replace('Professional: ', '')
      : undefined,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    totalPrice: item.quantity * item.unitPrice,
    date: item.date,
    time: item.time,
    status: 'upcoming' as BookingStatus,
    address: item.address,
    createdAt: nowIso(),
  }));

  return {
    db: {
      ...db,
      bookings: [...bookings, ...db.bookings],
    },
    bookings,
  };
};

export const updateBookingStatus = (
  db: AppDatabase,
  bookingId: string,
  status: BookingStatus
): AppDatabase => ({
  ...db,
  bookings: db.bookings.map((booking) => (booking.id === bookingId ? { ...booking, status } : booking)),
});

export const submitReview = (
  db: AppDatabase,
  payload: {
    bookingId: string;
    userId: string;
    serviceId: string;
    rating: number;
    comment: string;
  }
): { db: AppDatabase; error: string | null } => {
  const existingReview = db.reviews.find((review) => review.bookingId === payload.bookingId);
  if (existingReview) {
    return { db, error: 'A review for this booking has already been submitted.' };
  }

  const review: ReviewRecord = {
    id: createId('review'),
    bookingId: payload.bookingId,
    userId: payload.userId,
    serviceId: payload.serviceId,
    rating: payload.rating,
    comment: payload.comment,
    createdAt: nowIso(),
  };

  return {
    db: {
      ...db,
      reviews: [review, ...db.reviews],
    },
    error: null,
  };
};

export const updateService = (
  db: AppDatabase,
  serviceId: string,
  payload: Partial<Pick<ServiceRecord, 'title' | 'description' | 'price' | 'active'>>
): AppDatabase => ({
  ...db,
  services: db.services.map((service) => (service.id === serviceId ? { ...service, ...payload } : service)),
});

export const getServiceAverageRatings = (reviews: ReviewRecord[]) => {
  const totals = new Map<string, { total: number; count: number }>();

  for (const review of reviews) {
    const current = totals.get(review.serviceId) ?? { total: 0, count: 0 };
    totals.set(review.serviceId, {
      total: current.total + review.rating,
      count: current.count + 1,
    });
  }

  return totals;
};

export const getReviewForBooking = (reviews: ReviewRecord[], bookingId: string) =>
  reviews.find((review) => review.bookingId === bookingId) ?? null;

export const formatCoordinates = (coordinates: Coordinates | null) => {
  if (!coordinates) {
    return 'Not captured';
  }

  return `${coordinates.latitude.toFixed(4)}, ${coordinates.longitude.toFixed(4)}`;
};

// Chat history helpers
export const loadChatHistory = (): ChatMessage[] => {
  if (typeof window === 'undefined') return [];
  const raw = window.localStorage.getItem(CHAT_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as ChatMessage[];
  } catch {
    return [];
  }
};

export const saveChatHistory = (messages: ChatMessage[]) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(CHAT_KEY, JSON.stringify(messages));
};

// Review vote helpers
export const loadReviewVotes = (): ReviewVote[] => {
  if (typeof window === 'undefined') return [];
  const raw = window.localStorage.getItem(VOTES_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as ReviewVote[];
  } catch {
    return [];
  }
};

export const saveReviewVotes = (votes: ReviewVote[]) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(VOTES_KEY, JSON.stringify(votes));
};

export const toggleReviewVote = (
  votes: ReviewVote[],
  reviewId: string,
  userId: string,
  helpful: boolean
): ReviewVote[] => {
  const existingIndex = votes.findIndex(
    (v) => v.reviewId === reviewId && v.userId === userId
  );
  if (existingIndex >= 0) {
    const existing = votes[existingIndex];
    if (existing.helpful === helpful) {
      return votes.filter((_, i) => i !== existingIndex);
    }
    return votes.map((v, i) => (i === existingIndex ? { ...v, helpful } : v));
  }
  return [...votes, { reviewId, userId, helpful }];
};

export const getReviewVoteCount = (votes: ReviewVote[], reviewId: string) => {
  const reviewVotes = votes.filter((v) => v.reviewId === reviewId);
  return {
    helpful: reviewVotes.filter((v) => v.helpful).length,
    total: reviewVotes.length,
  };
};

export const getUserVoteForReview = (votes: ReviewVote[], reviewId: string, userId: string) => {
  return votes.find((v) => v.reviewId === reviewId && v.userId === userId)?.helpful ?? null;
};


