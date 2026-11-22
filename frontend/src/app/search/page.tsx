'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from "next/link";
import { apiFetch } from '../../lib/api';
import { Search, User, Briefcase, FileText, Building } from 'lucide-react';
import { resolveMediaUrl } from '@/lib/media';
import RecommendedJobs from '@/components/RecommendedJobs';
import SuggestedPeopleCard from '@/components/SuggestedPeopleCard';
import SponsorCard from '@/components/SponsorCard';
import { clearAuth, getToken } from '@/lib/auth';

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [recommendedJobs, setRecommendedJobs] = useState<any[]>([]);
  const [suggestedPeople, setSuggestedPeople] = useState<any[]>([]);
  const [me, setMe] = useState<any>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      clearAuth();
      router.replace('/auth/login');
      return;
    }

    Promise.all([
      apiFetch('/jobs/recommended').catch(() => []),
      apiFetch('/users/suggested?limit=8').catch(() => []),
      apiFetch('/profile/me').catch(() => null),
    ])
      .then(([jobs, people, profile]) => {
        setRecommendedJobs(Array.isArray(jobs) ? jobs : []);
        setSuggestedPeople(Array.isArray(people) ? people : []);
        setMe(profile);
      })
      .catch(() => {
        setRecommendedJobs([]);
        setSuggestedPeople([]);
        setMe(null);
      });
  }, [router]);
  
  async function doSearch() {
    if (!query.trim()) return;
    const token = getToken();
    if (!token) {
      clearAuth();
      router.replace('/auth/login');
      return;
    }
    
    setIsSearching(true);
    try {
      const data = await apiFetch(`/search?query=${encodeURIComponent(query)}`);
      setResults(data);
    } catch (error) {
      console.error('Search failed:', error);
      const message = error instanceof Error ? error.message : String(error);
      if (message.startsWith("401")) {
        clearAuth();
        router.replace('/auth/login');
      }
    } finally {
      setIsSearching(false);
    }
  }
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      doSearch();
    }
  };
  
  return (
    <div className="w-full py-6 px-0 sm:px-2">
      <div className="grid gap-6 lg:grid-cols-12">
        <section className="lg:col-span-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-3">Search</h1>
            <p className="text-gray-600">Find people, posts, jobs, and more</p>
          </div>

          <div className="mb-8">
            <div className="relative max-w-2xl">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400" />
              </div>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                placeholder="Search for people, posts, jobs..."
              />
              <button
                onClick={doSearch}
                disabled={isSearching || !query.trim()}
                className="absolute right-2 top-2 px-4 py-1.5 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSearching ? 'Searching...' : 'Search'}
              </button>
            </div>
          </div>

          {results && (
            <div className="space-y-6">
              {results.users && results.users.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-emerald-700" />
                    People
                  </h2>

                  <div className="grid md:grid-cols-2 gap-4">
                    {results.users.map((user: any) => (
                      <div
                        key={user.id}
                        className="p-4 border border-slate-200 bg-white rounded-lg hover:shadow-md hover:border-emerald-300 transition-all"
                      >
                        <Link href={`/profile/${user.id}`} className="flex items-center gap-3">
                          <img
                            src={resolveMediaUrl(user.image_url || user.imageUrl || user.avatar) || "/default-avatar.svg"}
                            alt={user.display_name || "user"}
                            className="w-12 h-12 rounded-full object-cover border border-slate-200"
                          />

                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {user.display_name || user.displayName || user.displayname || user.username}
                            </h3>
                            <p className="text-sm text-gray-600">{user.headline}</p>
                          </div>
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {results.posts && results.posts.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-emerald-700" />
                    Posts
                  </h2>
                  <div className="space-y-4">
                    {results.posts.map((post: any, idx: number) => (
                      <div key={post.id || post.ID || idx} className="p-4 border border-slate-200 bg-white rounded-lg hover:shadow-md hover:border-emerald-300 transition-all">
                        <p className="text-gray-800 mb-2">{post.content}</p>
                        <div className="text-sm text-gray-500">
                          By {post.author_name}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {results.jobs && results.jobs.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-emerald-700" />
                    Jobs
                  </h2>
                  <div className="grid gap-4">
                    {results.jobs.map((job: any) => (
                      <Link href={`/jobs/${job.id}`} key={job.id} className="block p-4 border border-slate-200 bg-white rounded-lg hover:shadow-md hover:border-emerald-300 transition-all">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-900">{job.title}</h3>
                            <div className="flex items-center gap-2 text-gray-600">
                              <Building className="w-4 h-4" />
                              {job.company}
                            </div>
                          </div>
                          <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm">
                            {job.type || job.employment_type || "Job"}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {Object.keys(results).length === 0 && (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">No results found for &quot;{query}&quot;</div>
                  <p className="text-gray-600">Try different keywords or check your spelling</p>
                </div>
              )}
            </div>
          )}
        </section>

        <aside className="hidden lg:block lg:col-span-4 space-y-6">
          <RecommendedJobs jobs={recommendedJobs} profile={me} />
          <SponsorCard
            title="Sponsored: Premium Talent Search"
            description="Unlock deeper filters, verified candidate signals, and smarter outreach templates."
            cta="Explore Hiring Tools"
            href="/jobs"
          />
          <SuggestedPeopleCard users={suggestedPeople} />
        </aside>

        <section className="lg:hidden space-y-6">
          <RecommendedJobs jobs={recommendedJobs.slice(0, 4)} profile={me} />
          <SponsorCard
            title="Sponsored: Premium Talent Search"
            description="Unlock deeper filters, verified candidate signals, and smarter outreach templates."
            cta="Explore Hiring Tools"
            href="/jobs"
          />
          <SuggestedPeopleCard users={suggestedPeople} />
        </section>
      </div>
    </div>
  );
}
