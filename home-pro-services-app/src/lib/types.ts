export type AppRoute = '/' | '/login' | '/dashboard' | '/admin';

export type UserRole = 'admin' | 'user';

export type BookingStatus = 'upcoming' | 'completed' | 'cancelled';

export type ServiceIconName = 'sparkles' | 'home' | 'wrench' | 'paintbrush' | 'droplets';

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type AddressRecord = {
  label: string;
  fullAddress: string;
  coordinates: Coordinates | null;
};

export type UserRecord = {
  id: string;
  name: string;
  email: string;
  password: string;
  phone: string;
  role: UserRole;
  address: AddressRecord | null;
  createdAt: string;
};

export type ServiceRecord = {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: ServiceIconName;
  image: string;
  subServices: string[];
  price: number;
  active: boolean;
};

export type ProfessionalRecord = {
  id: string;
  name: string;
  role: string;
  rating: number;
  reviews: number;
  experience: number;
  services: number;
  image: string;
  price: number;
  serviceIds: string[];
};

export type BookingRecord = {
  id: string;
  userId: string;
  serviceId: string;
  serviceName: string;
  professionalId?: string;
  professionalName?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  date: string;
  time: string;
  status: BookingStatus;
  address: AddressRecord;
  createdAt: string;
};

export type ReviewRecord = {
  id: string;
  bookingId: string;
  userId: string;
  serviceId: string;
  rating: number;
  comment: string;
  createdAt: string;
};

export type SessionRecord = {
  userId: string | null;
};

export type AppDatabase = {
  users: UserRecord[];
  services: ServiceRecord[];
  professionals: ProfessionalRecord[];
  bookings: BookingRecord[];
  reviews: ReviewRecord[];
  session: SessionRecord;
};

export type CartItem = {
  id: string;
  label: string;
  description: string;
  image: string;
  serviceId: string;
  professionalId?: string;
  quantity: number;
  date: string;
  time: string;
  unitPrice: number;
  address: AddressRecord;
};

export type ChatMessage = {
  id: string;
  role: 'user' | 'bot';
  text: string;
  timestamp: string;
};

export type ReviewVote = {
  reviewId: string;
  userId: string;
  helpful: boolean;
};

export type AppTheme = 'light' | 'dark' | 'system';
