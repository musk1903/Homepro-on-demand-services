import { type FormEvent, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowUp,
  Droplets,
  Home,
  MapPin,
  Menu,
  Minus,
  Paintbrush,
  Plus,
  ShoppingCart,
  Sparkles,
  Star,
  Trash2,
  Wrench,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ServiceFilters } from '@/components/ServiceFilters';
import { ServiceDetailDialog } from '@/components/ServiceDetailDialog';
import { ReviewsSection } from '@/components/ReviewsSection';
import { SupportChatBot } from '@/components/SupportChatBot';
import { useScrollReveal } from '@/hooks/use-scroll-reveal';
import {
  createBookingsFromCart,
  formatCoordinates,
  getCurrentUser,
  getReviewForBooking,
  getServiceAverageRatings,
  loadDatabase,
  loadReviewVotes,
  saveDatabase,
  saveReviewVotes,
  signIn,
  signOut,
  signUp,
  submitReview,
  toggleReviewVote,
  updateBookingStatus,
  updateService,
  updateUserProfile,
} from '@/lib/storage';
import type {
  AddressRecord,
  AppDatabase,
  AppRoute,
  BookingRecord,
  CartItem,
  ProfessionalRecord,
  ReviewRecord,
  ReviewVote,
  ServiceIconName,
  ServiceRecord,
  UserRecord,
} from '@/lib/types';

const serviceSlotHours = [9, 11, 13, 15, 17, 19];
const visibleBookingDateCount = 4;

type Navigate = (route: AppRoute) => void;
type AddressDraft = AddressRecord & { isDetecting?: boolean };

const iconMap: Record<ServiceIconName, typeof Home> = {
  sparkles: Sparkles,
  home: Home,
  wrench: Wrench,
  paintbrush: Paintbrush,
  droplets: Droplets,
};

const resolveRoute = (): AppRoute => {
  const hash = window.location.hash.replace('#', '') || '/';
  if (hash === '/login' || hash === '/dashboard' || hash === '/admin') return hash;
  return '/';
};

const formatDateValue = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatTimeLabel = (date: Date) =>
  date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

const formatSlotLabel = (hour: number) => formatTimeLabel(new Date(2000, 0, 1, hour));

const isSameDateValue = (dateValue: string, date: Date) => dateValue === formatDateValue(date);

const getAvailableTimeSlots = (dateValue: string, current = new Date()) => {
  const slots: string[] = [];

  if (isSameDateValue(dateValue, current)) {
    slots.push(`${formatTimeLabel(current)} (Now)`);
  }

  serviceSlotHours.forEach((hour) => {
    const slotTime = new Date(current);
    slotTime.setHours(hour, 0, 0, 0);

    if (!isSameDateValue(dateValue, current) || slotTime > current) {
      const label = formatSlotLabel(hour);
      if (!slots.includes(label)) slots.push(label);
    }
  });

  return slots;
};

const getAvailableBookingDates = (current = new Date()) =>
  Array.from({ length: visibleBookingDateCount }, (_, offset) => {
    const option = new Date(current);
    option.setDate(current.getDate() + offset);
    return formatDateValue(option);
  });

const getBookingDefaults = (current = new Date()) => {
  const dates = getAvailableBookingDates(current);
  const date = dates[0] ?? formatDateValue(current);
  const times = getAvailableTimeSlots(date, current);

  return {
    dates,
    date,
    times,
    time: times[0] ?? `${formatTimeLabel(current)} (Now)`,
  };
};

const formatDisplayDate = (value: string) =>
  new Date(`${value}T00:00:00`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

const buildMapUrl = (address: AddressRecord | null) => {
  if (!address?.coordinates) return null;
  const { latitude, longitude } = address.coordinates;
  const delta = 0.01;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${longitude - delta}%2C${latitude - delta}%2C${longitude + delta}%2C${latitude + delta}&layer=mapnik&marker=${latitude}%2C${longitude}`;
};

function useHashRoute() {
  const [route, setRoute] = useState<AppRoute>(() => resolveRoute());

  useEffect(() => {
    const handler = () => setRoute(resolveRoute());
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  const navigate = (next: AppRoute) => {
    const hash = next === '/' ? '#/' : `#${next}`;
    if (window.location.hash !== hash) window.location.hash = hash;
    else setRoute(next);
  };

  return { route, navigate };
}

function LiveDateTime() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-600 shadow-sm sm:text-sm">
      {now.toLocaleString('en-IN', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })}
    </div>
  );
}

function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 320);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-5 right-5 z-50 rounded-full bg-slate-900 p-3 text-white shadow-lg"
      aria-label="Scroll to top"
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, index) => (
        <Star key={index} className={`h-4 w-4 ${index < Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
      ))}
    </div>
  );
}

function RatingInput({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: 5 }).map((_, index) => {
        const score = index + 1;
        return (
          <button key={score} type="button" onClick={() => onChange(score)} aria-label={`Rate ${score} star`}>
            <Star className={`h-6 w-6 ${score <= value ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
          </button>
        );
      })}
    </div>
  );
}
function AddressSection({ value, onChange }: { value: AddressDraft; onChange: (next: AddressDraft) => void }) {
  const mapUrl = buildMapUrl(value);

  const detectLocation = () => {
    if (!navigator.geolocation) {
      onChange({ ...value, isDetecting: false });
      return;
    }

    onChange({ ...value, isDetecting: true });
    navigator.geolocation.getCurrentPosition(
      (position) => {
        onChange({
          ...value,
          isDetecting: false,
          fullAddress: value.fullAddress || `GPS location (${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)})`,
          coordinates: { latitude: position.coords.latitude, longitude: position.coords.longitude },
        });
      },
      () => onChange({ ...value, isDetecting: false }),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-semibold text-slate-900">Service address</p>
          <p className="text-sm text-slate-500">Use GPS or enter address manually. Coordinates are saved with the booking.</p>
        </div>
        <Button type="button" variant="outline" onClick={detectLocation} disabled={value.isDetecting}>
          <MapPin className="mr-2 h-4 w-4" />
          {value.isDetecting ? 'Detecting...' : 'Use GPS'}
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="address-label">Address label</Label>
          <Input id="address-label" value={value.label} onChange={(e) => onChange({ ...value, label: e.target.value })} placeholder="Home / Office" />
        </div>
        <div className="space-y-2">
          <Label>GPS coordinates</Label>
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">{formatCoordinates(value.coordinates)}</div>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="full-address">Full address</Label>
        <Textarea id="full-address" value={value.fullAddress} onChange={(e) => onChange({ ...value, fullAddress: e.target.value })} rows={3} />
      </div>
      {mapUrl ? <iframe title="Location map" src={mapUrl} className="h-56 w-full rounded-2xl border border-slate-200 bg-white" loading="lazy" /> : null}
    </div>
  );
}

function AppNavigation({ user, cartCount, onAction, onCart, onNavigate }: { user: UserRecord | null; cartCount: number; onAction: () => void; onCart: () => void; onNavigate: Navigate }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <button type="button" onClick={() => onNavigate('/')} className="text-left text-2xl font-bold text-slate-900">Home<span className="text-sky-600">pro</span></button>
        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
          <a href="#services">Services</a>
          <a href="#professionals">Professionals</a>
          <a href="#reviews">Reviews</a>
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <LiveDateTime />
          <ThemeToggle />
          <Button variant="outline" onClick={onCart}>Cart ({cartCount})</Button>
          <Button onClick={onAction}>{user ? (user.role === 'admin' ? 'Admin Panel' : 'Dashboard') : 'Login'}</Button>
        </div>
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <Button variant="outline" size="icon" onClick={onCart}><ShoppingCart className="h-4 w-4" /></Button>
          <Button variant="outline" size="icon" onClick={() => setOpen((value) => !value)}>{open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}</Button>
        </div>
      </div>
      {open ? (
        <div className="border-t border-slate-200 bg-white px-4 py-4 md:hidden">
          <div className="mb-4"><LiveDateTime /></div>
          <div className="flex flex-col gap-3 text-sm font-medium text-slate-600">
            <a href="#services" onClick={() => setOpen(false)}>Services</a>
            <a href="#professionals" onClick={() => setOpen(false)}>Professionals</a>
            <a href="#reviews" onClick={() => setOpen(false)}>Reviews</a>
            <Button onClick={() => { setOpen(false); onAction(); }}>{user ? (user.role === 'admin' ? 'Admin Panel' : 'Dashboard') : 'Login'}</Button>
          </div>
        </div>
      ) : null}
    </header>
  );
}

function ServiceCard({ service, rating, reviews, onBook, onViewDetails }: { service: ServiceRecord; rating: number; reviews: number; onBook: (service: ServiceRecord) => void; onViewDetails?: (service: ServiceRecord) => void }) {
  const Icon = iconMap[service.icon];

  return (
    <Card className="overflow-hidden rounded-[28px] border border-slate-200 shadow-sm">
      <img src={service.image} alt={service.title} className="h-48 w-full object-cover" />
      <CardContent className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-700"><Icon className="h-5 w-5" /></div>
            <h3 className="text-xl font-semibold text-slate-900">{service.title}</h3>
            <p className="mt-2 text-sm text-slate-600">{service.description}</p>
          </div>
          <Badge variant={service.active ? 'default' : 'secondary'}>{service.active ? 'Active' : 'Paused'}</Badge>
        </div>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-lg font-bold text-sky-700">Rs {service.price}</p>
            <div className="mt-1 flex items-center gap-2 text-sm text-slate-500"><Stars rating={rating} /><span>{rating.toFixed(1)} ({reviews})</span></div>
          </div>
          <div className="flex gap-2">
            {onViewDetails && (
              <Button variant="outline" size="sm" onClick={() => onViewDetails(service)}>Details</Button>
            )}
            <Button onClick={() => onBook(service)} disabled={!service.active}>Book</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ProfessionalCard({ professional, service, onBook }: { professional: ProfessionalRecord; service: ServiceRecord | null; onBook: (service: ServiceRecord, professional: ProfessionalRecord) => void }) {
  return (
    <Card className="rounded-[28px] border border-slate-200 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-center gap-4">
          <img src={professional.image} alt={professional.name} className="h-20 w-20 rounded-2xl object-cover" />
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-slate-900">{professional.name}</h3>
            <p className="text-sm text-sky-700">{professional.role}</p>
            <div className="mt-2 flex items-center gap-2 text-sm text-slate-500"><Stars rating={professional.rating} /><span>{professional.rating.toFixed(1)} · {professional.reviews} reviews</span></div>
          </div>
        </div>
        <div className="mt-5 flex items-center justify-between gap-3">
          <div><p className="text-sm text-slate-500">Experience</p><p className="font-semibold text-slate-900">{professional.experience} years</p></div>
          <div className="text-right"><p className="text-lg font-bold text-sky-700">Rs {professional.price}</p><p className="text-sm text-slate-500">{professional.services} jobs completed</p></div>
        </div>
        <Button className="mt-5 w-full" onClick={() => service && onBook(service, professional)} disabled={!service}>Book professional</Button>
      </CardContent>
    </Card>
  );
}
function BookingDialog({ open, onOpenChange, service, professional, onAdd, defaultAddress }: { open: boolean; onOpenChange: (open: boolean) => void; service: ServiceRecord | null; professional: ProfessionalRecord | null; onAdd: (item: CartItem) => void; defaultAddress: AddressRecord | null }) {
  const [bookingNow, setBookingNow] = useState(() => new Date());
  const initialBooking = getBookingDefaults();
  const [date, setDate] = useState(initialBooking.date);
  const [time, setTime] = useState(initialBooking.time);
  const quantity = 1;

  const [address, setAddress] = useState<AddressDraft>(defaultAddress ?? { label: 'Home', fullAddress: '', coordinates: null });
  const [error, setError] = useState('');

  const bookingDates = useMemo(() => getAvailableBookingDates(bookingNow), [bookingNow]);
  const timeSlots = useMemo(() => getAvailableTimeSlots(date, bookingNow), [bookingNow, date]);

  useEffect(() => {
    if (!open) return;

    const current = new Date();
    const defaults = getBookingDefaults(current);
    setBookingNow(current);
    setDate(defaults.date);
    setTime(defaults.time);
    setAddress(defaultAddress ?? { label: 'Home', fullAddress: '', coordinates: null });
    setError('');
  }, [defaultAddress, open]);


  useEffect(() => {
    if (!open) return undefined;

    const id = window.setInterval(() => setBookingNow(new Date()), 60000);
    return () => window.clearInterval(id);
  }, [open]);

  useEffect(() => {
    if (!open || bookingDates.includes(date)) return;
    const nextDate = bookingDates[0];
    if (nextDate) setDate(nextDate);
  }, [bookingDates, date, open]);

  useEffect(() => {
    if (!open || timeSlots.includes(time)) return;
    const nextTime = timeSlots[0];
    if (nextTime) setTime(nextTime);
  }, [open, time, timeSlots]);

  if (!service) return null;

  const title = professional ? `${service.title} with ${professional.name}` : service.title;
  const price = professional?.price ?? service.price;

  const addItem = () => {

    if (!date || !time) {
      setError('Please select an available future date and time.');
      return;
    }
    if (!address.fullAddress.trim()) {
      setError('Please provide a service address or use GPS detection.');
      return;
    }
    onAdd({
      id: `${service.id}-${professional?.id ?? 'service'}-${date}-${time}`,
      label: title,
      description: professional ? `Professional: ${professional.name}` : service.description,
      image: service.image,
      serviceId: service.id,
      professionalId: professional?.id,
      quantity,
      date,
      time,
      unitPrice: price,
      address: { label: address.label, fullAddress: address.fullAddress, coordinates: address.coordinates },
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader><DialogTitle className="text-2xl font-bold">Book service</DialogTitle></DialogHeader>
        <div className="space-y-6">
          <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-4 sm:flex-row">
            <img src={service.image} alt={service.title} className="h-40 w-full rounded-2xl object-cover sm:h-28 sm:w-40" />
            <div className="flex-1 space-y-2">
              <h3 className="text-xl font-semibold text-slate-900">{title}</h3>
              <p className="text-sm text-slate-600">{service.description}</p>
              <div className="flex flex-wrap gap-2">{service.subServices.map((subService) => <Badge key={subService} variant="secondary">{subService}</Badge>)}</div>
              <p className="text-lg font-bold text-sky-700">Rs {price}</p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Select date</Label>
              <div className="grid grid-cols-2 gap-2">{bookingDates.map((option) => <button key={option} type="button" onClick={() => setDate(option)} className={`rounded-2xl border px-3 py-3 text-sm font-medium ${date === option ? 'border-sky-600 bg-sky-50 text-sky-700' : 'border-slate-200 bg-white text-slate-600'}`}>{formatDisplayDate(option)}</button>)}</div>
            </div>
            <div className="space-y-2">
              <Label>Select time</Label>
              <div className="grid grid-cols-2 gap-2">{timeSlots.map((option) => <button key={option} type="button" onClick={() => setTime(option)} className={`rounded-2xl border px-3 py-3 text-sm font-medium ${time === option ? 'border-sky-600 bg-sky-50 text-sky-700' : 'border-slate-200 bg-white text-slate-600'}`}>{option}</button>)}</div>
            </div>
          </div>
          {/* Quantity is fixed at 1 to prevent adding zero/variable quantities. */}
          <div className="space-y-2">
            <Label>Quantity</Label>
            <div className="flex w-fit items-center gap-3 rounded-full border border-slate-200 bg-white px-3 py-2">
              <span className="w-8 text-center font-semibold">{quantity}</span>
            </div>
          </div>

          <AddressSection value={address} onChange={setAddress} />
          {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}
          <div className="flex justify-end gap-3"><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={addItem}>Add to cart</Button></div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CartDialog({ open, onOpenChange, items, onUpdateQuantity, onRemove, onCheckout }: { open: boolean; onOpenChange: (open: boolean) => void; items: CartItem[]; onUpdateQuantity: (id: string, quantity: number) => void; onRemove: (id: string) => void; onCheckout: () => void }) {
  const total = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader><DialogTitle className="text-2xl font-bold">Your cart</DialogTitle></DialogHeader>
        {items.length === 0 ? <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">Your cart is empty.</div> : (
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col gap-4 sm:flex-row">
                  <img src={item.image} alt={item.label} className="h-28 w-full rounded-2xl object-cover sm:w-32" />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-3"><div><h4 className="text-lg font-semibold text-slate-900">{item.label}</h4><p className="text-sm text-slate-600">{item.description}</p></div><button type="button" onClick={() => onRemove(item.id)} className="text-rose-600"><Trash2 className="h-4 w-4" /></button></div>
                    <div className="flex flex-wrap gap-3 text-sm text-slate-500"><span>{formatDisplayDate(item.date)}</span><span>{item.time}</span><span>{item.address.fullAddress}</span></div>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex w-fit items-center gap-3 rounded-full border border-slate-200 bg-white px-3 py-2"><button type="button" onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}><Minus className="h-4 w-4" /></button><span className="w-8 text-center font-semibold">{item.quantity}</span><button type="button" onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}><Plus className="h-4 w-4" /></button></div>
                      <div className="text-lg font-bold text-sky-700">Rs {item.quantity * item.unitPrice}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <Separator />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm text-slate-500">Total</p><p className="text-2xl font-bold text-slate-900">Rs {total}</p></div><Button onClick={onCheckout}>Confirm booking</Button></div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ReviewDialog({ booking, open, onOpenChange, onSubmit }: { booking: BookingRecord | null; open: boolean; onOpenChange: (open: boolean) => void; onSubmit: (payload: { bookingId: string; serviceId: string; rating: number; comment: string }) => string | null }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setRating(5);
      setComment('');
      setError(null);
    }
  }, [open]);

  if (!booking) return null;

  const submit = () => {
    if (!comment.trim()) {
      setError('Please write your feedback before submitting.');
      return;
    }
    const nextError = onSubmit({ bookingId: booking.id, serviceId: booking.serviceId, rating, comment });
    if (nextError) {
      setError(nextError);
      return;
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader><DialogTitle className="text-2xl font-bold">Review your booking</DialogTitle></DialogHeader>
        <div className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="font-semibold text-slate-900">{booking.serviceName}</p><p className="text-sm text-slate-500">Booking ID: {booking.id}</p></div>
          <div className="space-y-2"><Label>Rating</Label><RatingInput value={rating} onChange={setRating} /></div>
          <div className="space-y-2"><Label htmlFor="review-comment">Feedback</Label><Textarea id="review-comment" value={comment} onChange={(e) => setComment(e.target.value)} rows={5} /></div>
          {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}
          <div className="flex justify-end"><Button onClick={submit}>Submit review</Button></div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function UserReviewsPanel({ bookings, reviews, onOpenReview }: { bookings: BookingRecord[]; reviews: ReviewRecord[]; onOpenReview: (booking: BookingRecord) => void }) {
  const completedBookings = bookings.filter((booking) => booking.status === 'completed');
  const pendingBookings = completedBookings.filter((booking) => !getReviewForBooking(reviews, booking.id));
  const submittedReviews = completedBookings
    .map((booking) => ({
      booking,
      review: getReviewForBooking(reviews, booking.id),
    }))
    .filter((entry): entry is { booking: BookingRecord; review: ReviewRecord } => Boolean(entry.review));

  return (
    <Card className="rounded-[28px] border-0 shadow-sm">
      <CardHeader>
        <CardTitle>Ratings & Reviews</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-base font-semibold text-slate-900">Pending feedback</h3>
            <Badge variant="secondary">{pendingBookings.length}</Badge>
          </div>
          {pendingBookings.length === 0 ? (
            <p className="text-sm text-slate-500">No pending reviews. Complete a booking to submit a rating and written feedback.</p>
          ) : (
            <div className="space-y-3">
              {pendingBookings.map((booking) => (
                <div key={booking.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{booking.serviceName}</p>
                      <p className="text-sm text-slate-500">{formatDisplayDate(booking.date)} · {booking.time}</p>
                    </div>
                    <Button onClick={() => onOpenReview(booking)}>Give rating & review</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <Separator />
        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-base font-semibold text-slate-900">Submitted feedback</h3>
            <Badge variant="secondary">{submittedReviews.length}</Badge>
          </div>
          {submittedReviews.length === 0 ? (
            <p className="text-sm text-slate-500">You have not submitted any reviews yet.</p>
          ) : (
            <div className="space-y-3">
              {submittedReviews.map(({ booking, review }) => (
                <div key={review.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{booking.serviceName}</p>
                      <p className="text-sm text-slate-500">Booking ID: {booking.id}</p>
                    </div>
                    <Stars rating={review.rating} />
                  </div>
                  <p className="text-sm text-slate-600">{review.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function AuthPage({ onNavigate, onLogin, onSignUp }: { onNavigate: Navigate; onLogin: (payload: { email: string; password: string }) => string | null; onSignUp: (payload: { name: string; email: string; password: string; phone: string }) => string | null }) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextError = mode === 'login' ? onLogin({ email, password }) : onSignUp({ name, email, password, phone });
    setError(nextError);
  };

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-12">
      <div className="mx-auto max-w-5xl overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm lg:grid lg:grid-cols-[1.1fr_0.9fr]">
        <div className="bg-slate-900 px-8 py-10 text-white">
          <Button variant="secondary" onClick={() => onNavigate('/')} className="mb-8 bg-white text-slate-900 hover:bg-slate-100"><ArrowLeft className="mr-2 h-4 w-4" />Home</Button>
          <h1 className="text-4xl font-bold">Welcome to Homepro</h1>
          <p className="mt-4 max-w-md text-slate-300">Login with proper route handling for user and admin dashboards. This project now stores users, bookings, reviews, ratings, and addresses in a persistent data layer.</p>
          <div className="mt-8 space-y-3 text-sm text-slate-300"><p><strong className="text-white">Demo user:</strong> demo@homepro.com / demo123</p><p><strong className="text-white">Admin:</strong> admin@homepro.com / admin123</p></div>
        </div>
        <div className="px-8 py-10">
          <div className="mb-6 flex gap-2 rounded-full bg-slate-100 p-1"><button type="button" onClick={() => setMode('login')} className={`flex-1 rounded-full px-4 py-2 text-sm font-medium ${mode === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Login</button><button type="button" onClick={() => setMode('signup')} className={`flex-1 rounded-full px-4 py-2 text-sm font-medium ${mode === 'signup' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Signup</button></div>
          <form onSubmit={submit} autoComplete="off" className="space-y-4">
            {mode === 'signup' ? <div className="space-y-2"><Label htmlFor="signup-name">Full name</Label><Input id="signup-name" name="signup-name" autoComplete="off" value={name} onChange={(e) => setName(e.target.value)} required /></div> : null}
            {mode === 'signup' ? <div className="space-y-2"><Label htmlFor="signup-phone">Phone</Label><Input id="signup-phone" value={phone} onChange={(e) => setPhone(e.target.value)} required /></div> : null}
            <div className="space-y-2"><Label htmlFor="auth-email">Email</Label><Input id="auth-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
            <div className="space-y-2"><Label htmlFor="auth-password">Password</Label><Input id="auth-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
            {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}
            <Button type="submit" className="w-full">{mode === 'login' ? 'Login' : 'Create account'}</Button>
          </form>
        </div>
      </div>
    </div>
  );
}
function UserDashboard({ user, bookings, reviews, onNavigate, onLogout, onUpdateProfile, onUpdateBookingStatus, onOpenReview }: { user: UserRecord; bookings: BookingRecord[]; reviews: ReviewRecord[]; onNavigate: Navigate; onLogout: () => void; onUpdateProfile: (payload: { name: string; phone: string; address: AddressRecord | null }) => void; onUpdateBookingStatus: (bookingId: string, status: BookingRecord['status']) => void; onOpenReview: (booking: BookingRecord) => void }) {
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone);
  const [address, setAddress] = useState<AddressDraft>(user.address ?? { label: 'Home', fullAddress: '', coordinates: null });

  useEffect(() => {
    setName(user.name);
    setPhone(user.phone);
    setAddress(user.address ?? { label: 'Home', fullAddress: '', coordinates: null });
  }, [user]);

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 rounded-[32px] bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div><p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-600">User Panel</p><h1 className="mt-2 text-3xl font-bold text-slate-900">Welcome back, {user.name}</h1><p className="mt-2 text-slate-500">Manage bookings, profile updates, reviews, and saved addresses.</p></div>
          <div className="flex flex-wrap gap-3"><LiveDateTime /><Button variant="outline" onClick={() => onNavigate('/')}>Home</Button><Button variant="outline" onClick={onLogout}>Logout</Button></div>
        </div>
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="rounded-[28px] border-0 shadow-sm"><CardHeader><CardTitle>Personal bookings</CardTitle></CardHeader><CardContent className="space-y-4">{bookings.length === 0 ? <p className="text-sm text-slate-500">No bookings yet.</p> : null}{bookings.map((booking) => {const review = getReviewForBooking(reviews, booking.id); return <div key={booking.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4"><div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between"><div><h3 className="text-lg font-semibold text-slate-900">{booking.serviceName}</h3><p className="text-sm text-slate-500">Booking ID: {booking.id}</p><div className="mt-2 flex flex-wrap gap-3 text-sm text-slate-500"><span>{formatDisplayDate(booking.date)}</span><span>{booking.time}</span><span>{booking.address.fullAddress}</span></div></div><div className="text-right"><Badge className={booking.status === 'completed' ? 'bg-emerald-500' : booking.status === 'cancelled' ? 'bg-rose-500' : 'bg-sky-600'}>{booking.status}</Badge><p className="mt-2 text-xl font-bold text-slate-900">Rs {booking.totalPrice}</p></div></div><div className="mt-4 flex flex-wrap gap-3">{booking.status === 'upcoming' ? <><Button variant="outline" onClick={() => onUpdateBookingStatus(booking.id, 'completed')}>Mark completed</Button><Button variant="outline" onClick={() => onUpdateBookingStatus(booking.id, 'cancelled')}>Cancel</Button></> : null}{booking.status === 'completed' && !review ? <Button onClick={() => onOpenReview(booking)}>Add review & rating</Button> : null}{review ? <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600"><div className="mb-1 flex items-center gap-2"><Stars rating={review.rating} /><span className="font-medium text-slate-900">Review submitted</span></div>{review.comment}</div> : null}</div></div>;})}</CardContent></Card>
          <div className="space-y-6"><Card className="rounded-[28px] border-0 shadow-sm"><CardHeader><CardTitle>Edit profile</CardTitle></CardHeader><CardContent className="space-y-4"><div className="space-y-2"><Label htmlFor="profile-name">Name</Label><Input id="profile-name" value={name} onChange={(e) => setName(e.target.value)} /></div><div className="space-y-2"><Label htmlFor="profile-phone">Phone</Label><Input id="profile-phone" value={phone} onChange={(e) => setPhone(e.target.value)} /></div><AddressSection value={address} onChange={setAddress} /><Button onClick={() => onUpdateProfile({ name, phone, address })}>Save profile</Button></CardContent></Card><UserReviewsPanel bookings={bookings} reviews={reviews} onOpenReview={onOpenReview} /><Card className="rounded-[28px] border-0 shadow-sm"><CardHeader><CardTitle>Quick tips</CardTitle></CardHeader><CardContent className="space-y-3 text-sm text-slate-600"><p>GPS capture stores latitude and longitude with bookings and profile address.</p><p>Completed bookings accept only one review and one rating.</p><p>The Home and dashboard navigation now use proper route handling.</p></CardContent></Card></div>
        </div>
      </div>
    </div>
  );
}

function AdminDashboard({ user, db, onNavigate, onLogout, onChangeBookingStatus, onUpdateService }: { user: UserRecord; db: AppDatabase; onNavigate: Navigate; onLogout: () => void; onChangeBookingStatus: (bookingId: string, status: BookingRecord['status']) => void; onUpdateService: (serviceId: string, payload: Partial<Pick<ServiceRecord, 'price' | 'active'>>) => void }) {
  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 rounded-[32px] border border-slate-800 bg-slate-900 p-6 md:flex-row md:items-center md:justify-between"><div><p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-400">Admin Panel</p><h1 className="mt-2 text-3xl font-bold">Hello, {user.name}</h1><p className="mt-2 text-slate-400">Manage users, bookings, reviews, and service controls from one place.</p></div><div className="flex flex-wrap gap-3"><Button variant="secondary" onClick={() => onNavigate('/')}>Home</Button><Button variant="outline" onClick={onLogout} className="border-slate-700 bg-transparent text-white hover:bg-slate-800">Logout</Button></div></div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="rounded-[28px] border border-slate-800 bg-slate-900 text-white shadow-none"><CardHeader><CardTitle>Manage users</CardTitle></CardHeader><CardContent className="space-y-3">{db.users.map((account) => <div key={account.id} className="rounded-2xl border border-slate-800 bg-slate-950 p-4"><div className="flex items-center justify-between gap-3"><div><p className="font-semibold">{account.name}</p><p className="text-sm text-slate-400">{account.email}</p></div><Badge className={account.role === 'admin' ? 'bg-sky-600' : 'bg-slate-700'}>{account.role}</Badge></div><p className="mt-3 text-sm text-slate-400">Phone: {account.phone}</p><p className="text-sm text-slate-400">Address: {account.address?.fullAddress ?? 'Not set'}</p></div>)}</CardContent></Card>
          <Card className="rounded-[28px] border border-slate-800 bg-slate-900 text-white shadow-none"><CardHeader><CardTitle>Manage bookings</CardTitle></CardHeader><CardContent className="space-y-3">{db.bookings.map((booking) => <div key={booking.id} className="rounded-2xl border border-slate-800 bg-slate-950 p-4"><div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div><p className="font-semibold">{booking.serviceName}</p><p className="text-sm text-slate-400">{booking.id} • {booking.address.fullAddress}</p></div><select value={booking.status} onChange={(e) => onChangeBookingStatus(booking.id, e.target.value as BookingRecord['status'])} className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm"><option value="upcoming">Upcoming</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></div></div>)}</CardContent></Card>
          <Card className="rounded-[28px] border border-slate-800 bg-slate-900 text-white shadow-none"><CardHeader><CardTitle>View reviews & ratings</CardTitle></CardHeader><CardContent className="space-y-3">{db.reviews.map((review) => <div key={review.id} className="rounded-2xl border border-slate-800 bg-slate-950 p-4"><div className="mb-2 flex items-center justify-between gap-3"><p className="font-semibold">Booking: {review.bookingId}</p><Stars rating={review.rating} /></div><p className="text-sm text-slate-300">{review.comment}</p></div>)}</CardContent></Card>
          <Card className="rounded-[28px] border border-slate-800 bg-slate-900 text-white shadow-none"><CardHeader><CardTitle>Control services</CardTitle></CardHeader><CardContent className="space-y-3">{db.services.map((service) => <div key={service.id} className="rounded-2xl border border-slate-800 bg-slate-950 p-4"><div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div><p className="font-semibold">{service.title}</p><p className="text-sm text-slate-400">{service.description}</p></div><div className="flex items-center gap-3"><Input type="number" value={service.price} onChange={(e) => onUpdateService(service.id, { price: Number(e.target.value || 0) })} className="w-28 border-slate-700 bg-slate-900 text-white" /><Button variant={service.active ? 'secondary' : 'outline'} onClick={() => onUpdateService(service.id, { active: !service.active })} className={service.active ? '' : 'border-slate-700 bg-transparent text-white hover:bg-slate-800'}>{service.active ? 'Active' : 'Disabled'}</Button></div></div></div>)}</CardContent></Card>
        </div>
      </div>
    </div>
  );
}

function HomePage({ user, db, cartCount, onOpenCart, onNavigate, onBookService, onBookProfessional, votes, onVote }: { user: UserRecord | null; db: AppDatabase; cartCount: number; onOpenCart: () => void; onNavigate: Navigate; onBookService: (service: ServiceRecord) => void; onBookProfessional: (service: ServiceRecord, professional: ProfessionalRecord) => void; votes: ReviewVote[]; onVote: (reviewId: string, helpful: boolean) => void }) {
  const ratingMap = useMemo(() => getServiceAverageRatings(db.reviews), [db.reviews]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [detailService, setDetailService] = useState<ServiceRecord | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const heroReveal = useScrollReveal<HTMLDivElement>();
  const servicesReveal = useScrollReveal<HTMLDivElement>();
  const prosReveal = useScrollReveal<HTMLDivElement>();

  const filteredServices = useMemo(() => {
    return db.services.filter((service) => {
      const matchesSearch =
        search === '' ||
        service.title.toLowerCase().includes(search.toLowerCase()) ||
        service.description.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = category === 'All' || service.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [db.services, search, category]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <AppNavigation user={user} cartCount={cartCount} onAction={() => onNavigate(user ? (user.role === 'admin' ? '/admin' : '/dashboard') : '/login')} onCart={onOpenCart} onNavigate={onNavigate} />
      <main>
        <section className="border-b border-slate-200 bg-white">
          <div ref={heroReveal.ref} className={`mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-24 reveal ${heroReveal.isVisible ? 'revealed' : ''}`}>
            <div className="space-y-6">
              <Badge className="bg-sky-100 text-sky-700 hover:bg-sky-100">Minimal homepage, responsive layout</Badge>
              <h1 className="max-w-2xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">Book trusted home services with proper routing, role-based panels, and verified reviews.</h1>
              <p className="max-w-2xl text-lg text-slate-600">Browse services, manage your cart, confirm bookings, store exact addresses with GPS, and submit one verified review per completed booking.</p>
              <div className="flex flex-wrap gap-3">
                <a href="#services"><Button className="h-12 px-6">Explore services</Button></a>
                <Button variant="outline" className="h-12 px-6" onClick={() => onNavigate(user ? (user.role === 'admin' ? '/admin' : '/dashboard') : '/login')}>{user ? 'Open dashboard' : 'Login'}</Button>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4"><p className="text-sm text-slate-500">Services</p><p className="mt-2 text-2xl font-bold">{db.services.filter((service) => service.active).length}+</p></div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4"><p className="text-sm text-slate-500">Bookings</p><p className="mt-2 text-2xl font-bold">{db.bookings.length}</p></div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4"><p className="text-sm text-slate-500">Reviews</p><p className="mt-2 text-2xl font-bold">{db.reviews.length}</p></div>
              </div>
            </div>
            <div className="rounded-[32px] border border-slate-200 bg-slate-900 p-6 text-white shadow-sm">
              <p className="text-sm uppercase tracking-[0.2em] text-sky-300">System workflow</p>
              <div className="mt-5 space-y-4">{['Select a service or a professional','Choose date, time, and precise address','Add one or more items to cart','Confirm booking and manage it in dashboard','Submit a single review and rating once completed'].map((item, index) => <div key={item} className="flex items-start gap-3 rounded-2xl border border-slate-800 bg-slate-950 p-4"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-500 text-sm font-semibold text-white">{index + 1}</div><p className="text-sm text-slate-200">{item}</p></div>)}</div>
            </div>
          </div>
        </section>

        <section id="services" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div ref={servicesReveal.ref} className={`reveal ${servicesReveal.isVisible ? 'revealed' : ''}`}>
            <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-600">Services</p>
                <h2 className="mt-2 text-3xl font-bold text-slate-900">Popular services</h2>
              </div>
              <p className="max-w-xl text-sm text-slate-500">Average ratings are calculated from verified booking reviews stored in the persistent app data layer.</p>
            </div>
            <ServiceFilters services={db.services} search={search} category={category} onSearchChange={setSearch} onCategoryChange={setCategory} />
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredServices.map((service) => {
                const summary = ratingMap.get(service.id);
                const rating = summary ? summary.total / summary.count : 4.5;
                const reviews = summary?.count ?? 0;
                return (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    rating={rating}
                    reviews={reviews}
                    onBook={onBookService}
                    onViewDetails={(svc) => { setDetailService(svc); setDetailOpen(true); }}
                  />
                );
              })}
            </div>
            {filteredServices.length === 0 && (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">
                <p>No services match your search.</p>
                <Button variant="outline" className="mt-3" onClick={() => { setSearch(''); setCategory('All'); }}>Clear filters</Button>
              </div>
            )}
          </div>
        </section>

        <section id="professionals" className="border-y border-slate-200 bg-white">
          <div ref={prosReveal.ref} className={`mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 reveal ${prosReveal.isVisible ? 'revealed' : ''}`}>
            <div className="mb-8">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-600">Professionals</p>
              <h2 className="mt-2 text-3xl font-bold text-slate-900">Verified experts</h2>
            </div>
            <div className="grid gap-6 lg:grid-cols-3">
              {db.professionals.map((professional) => (
                <ProfessionalCard
                  key={professional.id}
                  professional={professional}
                  service={db.services.find((service) => service.id === professional.serviceIds[0]) ?? null}
                  onBook={onBookProfessional}
                />
              ))}
            </div>
          </div>
        </section>

        <ReviewsSection
          reviews={db.reviews}
          bookings={db.bookings}
          users={db.users}
          services={db.services}
          votes={votes}
          currentUser={user}
          onVote={onVote}
        />
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>Homepro · Clean, responsive booking experience with role-based panels.</p>
          <div className="flex flex-wrap gap-4"><span>GPS address capture</span><span>Verified review system</span><span>Admin + user dashboards</span></div>
        </div>
      </footer>
      <ScrollToTopButton />
      <ServiceDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        service={detailService}
        reviews={db.reviews}
        bookings={db.bookings}
        rating={detailService ? (ratingMap.get(detailService.id)?.total ?? 0) / (ratingMap.get(detailService.id)?.count ?? 1) : 0}
        reviewCount={detailService ? (ratingMap.get(detailService.id)?.count ?? 0) : 0}
        onBook={() => { setDetailOpen(false); detailService && onBookService(detailService); }}
      />
    </div>
  );
}
function App() {
  const { route, navigate } = useHashRoute();
  const [db, setDb] = useState<AppDatabase>(() => loadDatabase());
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [bookingTarget, setBookingTarget] = useState<{ service: ServiceRecord; professional: ProfessionalRecord | null } | null>(null);
  const [reviewTarget, setReviewTarget] = useState<BookingRecord | null>(null);
  const [votes, setVotes] = useState<ReviewVote[]>(() => loadReviewVotes());

  useEffect(() => {
    saveDatabase(db);
  }, [db]);

  useEffect(() => {
    saveReviewVotes(votes);
  }, [votes]);

  const currentUser = useMemo(() => getCurrentUser(db), [db]);
  const userBookings = useMemo(() => (currentUser ? db.bookings.filter((booking) => booking.userId === currentUser.id) : []), [currentUser, db.bookings]);

  useEffect(() => {
    if (route === '/dashboard' && (!currentUser || currentUser.role !== 'user')) navigate('/login');
    if (route === '/admin' && (!currentUser || currentUser.role !== 'admin')) navigate('/login');
  }, [currentUser, navigate, route]);

  const commitDb = (updater: (current: AppDatabase) => AppDatabase) => setDb((current) => updater(current));

  const openBooking = (service: ServiceRecord, professional: ProfessionalRecord | null = null) => {
    setBookingTarget({ service, professional });
    setBookingOpen(true);
  };

  const addToCart = (item: CartItem) => {
    setCart((current) => {
      const existing = current.find((entry) => entry.id === item.id);
      if (!existing) return [...current, item];
      return current.map((entry) => (entry.id === item.id ? { ...entry, quantity: entry.quantity + item.quantity } : entry));
    });
    setCartOpen(true);
    toast.success(`${item.label} added to cart`);
  };

  const checkout = () => {
    if (!currentUser) {
      setCartOpen(false);
      navigate('/login');
      return;
    }
    const result = createBookingsFromCart(db, currentUser.id, cart);
    setDb(result.db);
    setCart([]);
    setCartOpen(false);
    toast.success('Booking confirmed successfully!');
    navigate(currentUser.role === 'admin' ? '/admin' : '/dashboard');
  };

  const login = (payload: { email: string; password: string }) => {
    const result = signIn(db, payload.email, payload.password);
    setDb(result.db);
    if (result.error) return result.error;
    toast.success(`Welcome back, ${result.user?.name}!`);
    navigate(result.user?.role === 'admin' ? '/admin' : '/dashboard');
    return null;
  };

  const signup = (payload: { name: string; email: string; password: string; phone: string }) => {
    const result = signUp(db, payload);
    setDb(result.db);
    if (result.error) return result.error;
    toast.success('Account created successfully!');
    navigate('/dashboard');
    return null;
  };

  const logout = () => {
    setDb((current) => signOut(current));
    toast.info('You have been logged out.');
    navigate('/');
  };

  const submitBookingReview = (payload: { bookingId: string; serviceId: string; rating: number; comment: string }) => {
    if (!currentUser) return 'Please login to submit a review.';
    const result = submitReview(db, { ...payload, userId: currentUser.id });
    setDb(result.db);
    if (!result.error) {
      toast.success('Review submitted successfully!');
    }
    return result.error;
  };

  const handleVote = (reviewId: string, helpful: boolean) => {
    if (!currentUser) {
      toast.error('Please login to vote on reviews.');
      return;
    }
    setVotes((current) => toggleReviewVote(current, reviewId, currentUser.id, helpful));
    toast.success(helpful ? 'Marked as helpful' : 'Vote removed');
  };

  if (route === '/login') return <AuthPage onNavigate={navigate} onLogin={login} onSignUp={signup} />;

  if (route === '/dashboard' && currentUser?.role === 'user') {
    return (
      <>
        <UserDashboard
          user={currentUser}
          bookings={userBookings}
          reviews={db.reviews}
          onNavigate={navigate}
          onLogout={logout}
          onUpdateProfile={(payload) => {
            commitDb((current) => updateUserProfile(current, currentUser.id, payload));
            toast.success('Profile updated successfully!');
          }}
          onUpdateBookingStatus={(bookingId, status) => {
            commitDb((current) => updateBookingStatus(current, bookingId, status));
            toast.success(`Booking marked as ${status}`);
          }}
          onOpenReview={(booking) => {
            setReviewTarget(booking);
            setReviewOpen(true);
          }}
        />
        <ReviewDialog booking={reviewTarget} open={reviewOpen} onOpenChange={setReviewOpen} onSubmit={submitBookingReview} />
      </>
    );
  }

  if (route === '/admin' && currentUser?.role === 'admin') {
    return (
      <AdminDashboard
        user={currentUser}
        db={db}
        onNavigate={navigate}
        onLogout={logout}
        onChangeBookingStatus={(bookingId, status) => {
          commitDb((current) => updateBookingStatus(current, bookingId, status));
          toast.success(`Booking status updated to ${status}`);
        }}
        onUpdateService={(serviceId, payload) => {
          commitDb((current) => updateService(current, serviceId, payload));
          toast.success('Service updated');
        }}
      />
    );
  }

  return (
    <>
      <HomePage
        user={currentUser}
        db={db}
        cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
        onOpenCart={() => setCartOpen(true)}
        onNavigate={navigate}
        onBookService={(service) => openBooking(service)}
        onBookProfessional={(service, professional) => openBooking(service, professional)}
        votes={votes}
        onVote={handleVote}
      />
      <CartDialog
        open={cartOpen}
        onOpenChange={setCartOpen}
        items={cart}
        onUpdateQuantity={(id, quantity) => setCart((current) => current.map((item) => (item.id === id ? { ...item, quantity } : item)))}
        onRemove={(id) => setCart((current) => current.filter((item) => item.id !== id))}
        onCheckout={checkout}
      />
      <BookingDialog open={bookingOpen} onOpenChange={setBookingOpen} service={bookingTarget?.service ?? null} professional={bookingTarget?.professional ?? null} onAdd={addToCart} defaultAddress={currentUser?.address ?? null} />
      <SupportChatBot />
    </>
  );
}

export default App;




