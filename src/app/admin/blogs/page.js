import { AdminPageHeader } from '@/components/admin/DataTable';
import BlogsManager from '@/components/admin/BlogsManager';
import { getAdminBlogs } from '@/lib/blogs';

export default async function AdminBlogsPage() {
  const posts = await getAdminBlogs();

  return (
    <div>
      <AdminPageHeader
        title="Blogs"
        subtitle="Write articles for /blogs, edit them, or keep them as drafts until they're ready."
        count={posts.length}
      />
      <BlogsManager posts={posts} />
    </div>
  );
}
