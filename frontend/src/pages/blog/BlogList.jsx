/**
 * Blog List - Public page showing published blog posts
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/landing/Header';
import FooterSection from '@/components/landing/FooterSection';
import Seo from '@/components/Seo';
import { BreadcrumbSchema } from '@/components/seo/index';
import { getPublishedBlogs } from '@/services/blogService';
import { Calendar, Clock, User, ArrowRight } from 'lucide-react';
import '@/styles/LandingPage.css';

const CATEGORIES = ['All', 'Student', 'Parents', 'Tutor'];

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function getReadingTime(content) {
  const wordsPerMinute = 200;
  const wordCount = (content || '').split(/\s+/).length;
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
}

export default function BlogList() {
  const [blogs, setBlogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 0, totalCount: 0 });
  const [activeCategory, setActiveCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBlogs = async (page = 1, category = activeCategory) => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, limit: 12 };
      if (category !== 'All') params.category = category;
      const data = await getPublishedBlogs(params);
      setBlogs(data.blogs || []);
      setPagination(data.pagination || { page: 1, totalPages: 0, totalCount: 0 });
    } catch (err) {
      setError(err.message || 'Failed to load blogs');
      setBlogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs(1);
  }, [activeCategory]);

  const handleCategoryChange = (category) => {
    setActiveCategory(category);
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= pagination.totalPages) {
      fetchBlogs(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden flex flex-col">
      <Seo
        title="Blog | Best Choice Tutors"
        description="Read the Best Choice Tutors blog for expert advice on tutoring, study tips, exam preparation, and guidance for parents, students, and tutors."
        ogTitle="Best Choice Tutors Blog"
        ogDescription="Expert advice on tutoring, study tips, exam preparation, and more."
      />
      <BreadcrumbSchema />
      <Header />

      <main className="flex-1">
        {/* Hero section */}
        <section className="bg-gradient-to-br from-[#0F2442] via-[#112D4E] to-[#1A365D] text-white py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">Our Blog</h1>
            <p className="mt-4 text-lg text-white/80 max-w-2xl mx-auto">
              Expert advice, study tips, and insights for students, parents, and tutors.
            </p>
          </div>
        </section>

        {/* Category filter */}
        <section className="py-8 px-4 sm:px-6 lg:px-8 bg-white border-b border-slate-100">
          <div className="max-w-6xl mx-auto flex flex-wrap gap-2 justify-center">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                  activeCategory === cat
                    ? 'bg-[#4FD1C5] text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat === 'All' ? 'All Posts' : cat}
              </button>
            ))}
          </div>
        </section>

        {/* Blog grid */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
          <div className="max-w-6xl mx-auto">
            {error && (
              <div className="text-center py-12">
                <p className="text-red-600">{error}</p>
                <button
                  onClick={() => fetchBlogs()}
                  className="mt-4 px-6 py-2 bg-[#4FD1C5] text-white rounded-lg font-medium hover:bg-[#38B2AC]"
                >
                  Try Again
                </button>
              </div>
            )}

            {loading && (
              <div className="text-center py-12">
                <div className="animate-spin h-8 w-8 border-4 border-[#4FD1C5] border-t-transparent rounded-full mx-auto"></div>
                <p className="mt-4 text-slate-500">Loading articles...</p>
              </div>
            )}

            {!loading && !error && blogs.length === 0 && (
              <div className="text-center py-12">
                <p className="text-slate-500 text-lg">No articles found in this category.</p>
                <p className="text-slate-400 mt-2">Check back soon for new content.</p>
              </div>
            )}

            {!loading && blogs.length > 0 && (
              <>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {blogs.map((blog) => (
                    <article
                      key={blog._id}
                      className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col"
                    >
                      <div className="p-6 flex-1 flex flex-col">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#4FD1C5]/10 text-[#1A365D]">
                            {blog.category}
                          </span>
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(blog.publishedAt || blog.createdAt)}
                          </span>
                        </div>

                        <Link to={`/blog/${blog.slug}`} className="group">
                          <h2 className="text-lg font-bold text-[#1A365D] group-hover:text-[#4FD1C5] transition-colors line-clamp-2">
                            {blog.title}
                          </h2>
                        </Link>

                        <p className="mt-2 text-sm text-slate-600 line-clamp-3 flex-1">
                          {blog.excerpt}
                        </p>

                        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                          <div className="flex items-center gap-3 text-xs text-slate-400">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {blog.author}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {getReadingTime(blog.excerpt)} min read
                            </span>
                          </div>
                          <Link
                            to={`/blog/${blog.slug}`}
                            className="text-sm font-medium text-[#4FD1C5] hover:text-[#38B2AC] flex items-center gap-1"
                          >
                            Read More
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex justify-center items-center gap-3 mt-10">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page <= 1}
                      className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-slate-500">
                      Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page >= pagination.totalPages}
                      className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </main>

      <FooterSection />
    </div>
  );
}

