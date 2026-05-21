import { useMemo, useState } from 'react';
import { ThumbsUp, Filter } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { ReviewRecord, BookingRecord, UserRecord, ServiceRecord, ReviewVote } from '@/lib/types';
import { getReviewVoteCount, getUserVoteForReview } from '@/lib/storage';

interface ReviewsSectionProps {
  reviews: ReviewRecord[];
  bookings: BookingRecord[];
  users: UserRecord[];
  services: ServiceRecord[];
  votes: ReviewVote[];
  currentUser: UserRecord | null;
  onVote: (reviewId: string, helpful: boolean) => void;
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className={`h-4 w-4 ${i < Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
          viewBox="0 0 24 24"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}

export function ReviewsSection({ reviews, bookings, users, services, votes, currentUser, onVote }: ReviewsSectionProps) {
  const [filterService, setFilterService] = useState<string>('all');
  const [filterRating, setFilterRating] = useState<number | null>(null);

  const distribution = useMemo(() => {
    const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
      const key = Math.min(5, Math.max(1, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5;
      dist[key]++;
    });
    return dist;
  }, [reviews]);

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 0;
    return reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  }, [reviews]);

  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      const serviceMatch = filterService === 'all' || r.serviceId === filterService;
      const ratingMatch = filterRating === null || Math.round(r.rating) === filterRating;
      return serviceMatch && ratingMatch;
    });
  }, [reviews, filterService, filterRating]);

  return (
    <section id="reviews" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-600">Verified feedback</p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">Customer Reviews</h2>
        </div>
      </div>

      {/* Summary Card */}
      <Card className="mb-8 rounded-[28px] border border-slate-200 shadow-sm dark:border-slate-700">
        <CardContent className="p-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="text-5xl font-bold text-slate-900 dark:text-white">{averageRating.toFixed(1)}</div>
                <div>
                  <Stars rating={averageRating} />
                  <p className="mt-1 text-sm text-slate-500">Based on {reviews.length} reviews</p>
                </div>
              </div>
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = distribution[star as 1 | 2 | 3 | 4 | 5];
                  const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                  return (
                    <div key={star} className="flex items-center gap-3">
                      <span className="w-3 text-sm text-slate-600 dark:text-slate-300">{star}</span>
                      <svg className="h-4 w-4 fill-amber-400 text-amber-400" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                        <div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${percentage}%` }} />
                      </div>
                      <span className="w-8 text-right text-xs text-slate-500">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-200">Filter by service</p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={filterService === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterService('all')}
                    className="rounded-full"
                  >
                    All
                  </Button>
                  {services.map((service) => (
                    <Button
                      key={service.id}
                      variant={filterService === service.id ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilterService(service.id)}
                      className="rounded-full"
                    >
                      {service.title}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-200">Filter by rating</p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={filterRating === null ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterRating(null)}
                    className="rounded-full"
                  >
                    All
                  </Button>
                  {[5, 4, 3, 2, 1].map((r) => (
                    <Button
                      key={r}
                      variant={filterRating === r ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilterRating(r)}
                      className="rounded-full"
                    >
                      {r} ★
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reviews Grid */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {filteredReviews.map((review) => {
          const booking = bookings.find((b) => b.id === review.bookingId);
          const reviewer = users.find((u) => u.id === review.userId);
          const service = services.find((s) => s.id === review.serviceId);
          const voteCount = getReviewVoteCount(votes, review.id);
          const userVote = currentUser ? getUserVoteForReview(votes, review.id, currentUser.id) : null;

          return (
            <Card key={review.id} className="rounded-[28px] border border-slate-200 shadow-sm dark:border-slate-700">
              <CardContent className="space-y-4 p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-100 text-sm font-bold text-sky-700 dark:bg-sky-900 dark:text-sky-300">
                        {(reviewer?.name ?? 'U').charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{reviewer?.name ?? 'User'}</p>
                        {service && <p className="text-xs text-slate-500">{service.title}</p>}
                      </div>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-amber-600">
                    {review.rating.toFixed(1)}
                  </Badge>
                </div>

                <Stars rating={review.rating} />
                <p className="text-slate-600 dark:text-slate-300">{review.comment}</p>

                {booking && (
                  <p className="text-xs text-slate-400">Verified booking · {booking.date}</p>
                )}

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => currentUser && onVote(review.id, true)}
                    disabled={!currentUser}
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                      userVote === true
                        ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                    } ${!currentUser ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title={currentUser ? 'Mark as helpful' : 'Login to vote'}
                  >
                    <ThumbsUp className="h-3.5 w-3.5" />
                    Helpful ({voteCount.helpful})
                  </button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredReviews.length === 0 && (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-900">
          <Filter className="mx-auto mb-2 h-8 w-8 text-slate-400" />
          <p>No reviews match your filters.</p>
        </div>
      )}
    </section>
  );
}

