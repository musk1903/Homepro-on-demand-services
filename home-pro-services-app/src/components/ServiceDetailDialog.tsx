import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { ServiceRecord, ReviewRecord, BookingRecord } from '@/lib/types';

interface ServiceDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: ServiceRecord | null;
  reviews: ReviewRecord[];
  bookings: BookingRecord[];
  rating: number;
  reviewCount: number;
  onBook: () => void;
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} className={`h-4 w-4 ${i < Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}

export function ServiceDetailDialog({
  open,
  onOpenChange,
  service,
  reviews,
  bookings,
  rating,
  reviewCount,
  onBook,
}: ServiceDetailDialogProps) {
  if (!service) return null;

  const serviceReviews = reviews.filter((r) => r.serviceId === service.id);
  const serviceBookings = bookings.filter((b) => b.serviceId === service.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{service.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row">
            <img src={service.image} alt={service.title} className="h-48 w-full rounded-2xl object-cover sm:w-48" />
            <div className="flex-1 space-y-3">
              <p className="text-slate-600 dark:text-slate-300">{service.description}</p>
              <div className="flex flex-wrap gap-2">
                {service.subServices.map((sub) => (
                  <Badge key={sub} variant="secondary">{sub}</Badge>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Stars rating={rating} />
                <span className="text-sm text-slate-500">{rating.toFixed(1)} ({reviewCount} reviews)</span>
              </div>
              <p className="text-2xl font-bold text-sky-700">Rs {service.price}</p>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="mb-3 text-lg font-semibold">What's included</h3>
            <ul className="space-y-2">
              {service.subServices.map((sub) => (
                <li key={sub} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
                  {sub}
                </li>
              ))}
            </ul>
          </div>

          {serviceReviews.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="mb-3 text-lg font-semibold">Customer Reviews</h3>
                <div className="space-y-3">
                  {serviceReviews.slice(0, 3).map((review) => {
                    const booking = serviceBookings.find((b) => b.id === review.bookingId);
                    return (
                      <div key={review.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                        <div className="mb-2 flex items-center justify-between">
                          <Stars rating={review.rating} />
                          <span className="text-xs text-slate-400">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-300">{review.comment}</p>
                        {booking && (
                          <p className="mt-1 text-xs text-slate-400">Verified booking · {booking.date}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
            <Button onClick={onBook} disabled={!service.active}>Book Now</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

