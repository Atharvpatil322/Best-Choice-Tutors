/**
 * Blog Detail - Single blog post page with SEO and Article Schema
 */

import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Header from '@/components/landing/Header';
import FooterSection from '@/components/landing/FooterSection';
import Seo from '@/components/Seo';
import { ArticleSchema } from '@/components/seo/index';
import { DecodedImage } from '@/components/DecodedImage';
import { getBlogBySlug } from '@/services/blogService';
import { isHtmlContent, sanitizeBlogHtml } from '@/utils/blogContent';
import { Calendar, Clock, User, ArrowLeft, Share2 } from 'lucide-react';
import '@/styles/LandingPage.css';
import '@/styles/BlogContent.css';

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

export default function BlogDetail() {
  const { slug } = useParams();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    getBlogBySlug(slug)
      .then((data) => {
        setBlog(data.blog || null);
      })
      .catch((err) => {
        setError(err.message || 'Blog not found');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [slug]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: blog?.title || 'Best Choice Tutors',
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full overflow-x-hidden flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-[#4FD1C5] border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-4 text-slate-500">Loading article...</p>
          </div>
        </main>
        <FooterSection />
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="min-h-screen w-full overflow-x-hidden flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center py-20 px-4">
          <div className="text-center max-w-md">
            <h1 className="text-2xl font-bold text-[#1A365D] mb-3">Article Not Found</h1>
            <p className="text-slate-600 mb-6">{error || 'This article could not be found.'}</p>
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#4FD1C5] text-white rounded-xl font-medium hover:bg-[#38B2AC] transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Blog
            </Link>
          </div>
        </main>
        <FooterSection />
      </div>
    );
  }

  const readingTime = getReadingTime(blog.content);
  const siteUrl = 'https://bestchoicetutors.com';
  const articleUrl = `${siteUrl}/blog/${blog.slug}`;

  return (
    <div className="min-h-screen w-full overflow-x-hidden flex flex-col">
      <Seo
        title={`${blog.title} | Best Choice Tutors`}
        description={blog.excerpt}
        ogTitle={blog.title}
        ogDescription={blog.excerpt}
        ogType="article"
        ogUrl={articleUrl}
      />
      <ArticleSchema
        url={articleUrl}
        headline={blog.title}
        description={blog.excerpt}
        imageUrl={blog.imageUrl || undefined}
        authorName={blog.author || 'Best Choice Tutors'}
        datePublished={blog.publishedAt || blog.createdAt}
        dateModified={blog.updatedAt}
      />
      <Header />

      <main className="flex-1">
        {/* Back link */}
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-8">
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-[#4FD1C5] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to all articles
          </Link>
        </div>

        {/* Article header */}
        <article className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          <header className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-sm font-semibold px-3 py-1 rounded-full bg-[#4FD1C5]/10 text-[#1A365D]">
                {blog.category}
              </span>
              <span className="text-sm text-slate-400">·</span>
              <span className="text-sm text-slate-400 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {readingTime} min read
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1A365D] leading-tight">
              {blog.title}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-500">
              <span className="flex items-center gap-1.5">
                <User className="h-4 w-4" />
                {blog.author}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {formatDate(blog.publishedAt || blog.createdAt)}
              </span>
              <button
                onClick={handleShare}
                className="ml-auto flex items-center gap-1.5 text-[#4FD1C5] hover:text-[#38B2AC] font-medium"
              >
                <Share2 className="h-4 w-4" />
                Share
              </button>
            </div>
          </header>

          {/* Cover image. Rendered only when the post has one, so posts without
              an image keep their existing layout unchanged. */}
          {blog.imageUrl && (
            <DecodedImage
              src={blog.imageUrl}
              alt={blog.imageAlt || blog.title}
              loading="eager"
              className="w-full rounded-2xl border border-slate-200 object-cover mb-8"
            />
          )}

          {/* Article content - rendered as HTML from the Markdown content */}
          <div
            className="prose prose-slate max-w-none prose-headings:text-[#1A365D] prose-a:text-[#4FD1C5] prose-strong:text-[#1A365D] prose-li:marker:text-[#4FD1C5]"
            style={{ wordBreak: 'break-word' }}
          >
            {/* Posts written in the editor are stored as HTML and rendered as
                such, which is what allows tables, images and code blocks to
                appear. Older posts are still markdown-ish plain text, so they
                keep the line-by-line rendering below. */}
            {isHtmlContent(blog.content) ? (
              <div
                className="blog-rich-content"
                dangerouslySetInnerHTML={{ __html: sanitizeBlogHtml(blog.content) }}
              />
            ) : (
              blog.content.split('\n').map((line, i) => {
              if (line.startsWith('## ')) {
                return (
                  <h2 key={i} className="text-2xl font-bold text-[#1A365D] mt-8 mb-4">
                    {line.replace('## ', '')}
                  </h2>
                );
              }
              if (line.startsWith('### ')) {
                return (
                  <h3 key={i} className="text-xl font-bold text-[#1A365D] mt-6 mb-3">
                    {line.replace('### ', '')}
                  </h3>
                );
              }
              if (line.startsWith('**') && line.endsWith('**')) {
                return (
                  <p key={i} className="font-bold text-[#1A365D] mb-2">
                    {line.replace(/\*\*/g, '')}
                  </p>
                );
              }
              if (line.startsWith('- ')) {
                return (
                  <li key={i} className="text-slate-700 ml-6 mb-1 list-disc">
                    {line.replace('- ', '')}
                  </li>
                );
              }
              if (line.startsWith('* ')) {
                return (
                  <li key={i} className="text-slate-700 ml-6 mb-1 list-disc">
                    {line.replace('* ', '')}
                  </li>
                );
              }
              if (line.match(/^\d+\.\s/)) {
                return (
                  <li key={i} className="text-slate-700 ml-6 mb-1 list-decimal">
                    {line.replace(/^\d+\.\s/, '')}
                  </li>
                );
              }
              // Convert inline markdown links to anchor tags
              const processedLine = line.replace(
                /\[([^\]]+)\]\(([^)]+)\)/g,
                (_, text, url) =>
                  `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-[#4FD1C5] hover:text-[#38B2AC] underline">${text}</a>`
              );
              if (line.trim() === '') {
                return <div key={i} className="h-4" />;
              }
              // Check if line contains bold markers
              if (line.includes('**')) {
                const parts = line.split(/(\*\*[^*]+\*\*)/g);
                return (
                  <p key={i} className="text-slate-700 mb-3 leading-relaxed">
                    {parts.map((part, j) => {
                      if (part.startsWith('**') && part.endsWith('**')) {
                        return (
                          <strong key={j} className="font-bold text-[#1A365D]">
                            {part.slice(2, -2)}
                          </strong>
                        );
                      }
                      return <span key={j} dangerouslySetInnerHTML={{ __html: part }} />;
                    })}
                  </p>
                );
              }
              return (
                <p key={i} className="text-slate-700 mb-3 leading-relaxed" dangerouslySetInnerHTML={{ __html: processedLine }} />
              );
              })
            )}
          </div>

          {/* Article footer */}
          <div className="mt-12 pt-6 border-t border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="text-sm text-slate-500">
                Written by <span className="font-medium text-[#1A365D]">{blog.author}</span>
              </div>
              <button
                onClick={handleShare}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#4FD1C5]/10 text-[#1A365D] rounded-xl font-medium hover:bg-[#4FD1C5]/20 transition-colors"
              >
                <Share2 className="h-4 w-4" />
                Share this article
              </button>
            </div>
          </div>
        </article>

        {/* CTA Section */}
        <section className="py-14 px-4 sm:px-6 lg:px-8 bg-slate-50">
          <div className="max-w-3xl mx-auto rounded-3xl bg-gradient-to-br from-[#0F2442] to-[#1A365D] p-8 sm:p-10 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              Ready to find the perfect tutor?
            </h2>
            <p className="text-white/80 mb-6 max-w-lg mx-auto">
              Browse our verified tutors, compare profiles, and book your first session today.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                to="/onboarding"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-[#0F2442] bg-white hover:bg-white/90 transition-colors"
              >
                Book a Tutor
              </Link>
              <Link
                to="/register?role=tutor"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white border border-white/60 hover:bg-white/10 transition-colors"
              >
                Become a Tutor
              </Link>
            </div>
          </div>
        </section>
      </main>

      <FooterSection />
    </div>
  );
}

