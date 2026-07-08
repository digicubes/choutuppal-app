import re

def update_agent_dashboard():
    with open('src/components/agent-dashboard.tsx', 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Imports
    if "AgentNewsForm" not in content:
        content = content.replace("import Papa from 'papaparse'", 
            "import Papa from 'papaparse'\nimport { AgentNewsForm } from '@/components/agent-news-form'\nimport { AgentBlogForm } from '@/components/agent-blog-form'")

    # 2. Add to activeTab types
    content = content.replace("useState<'overview' | 'add_listing' | 'bulk_upload' | 'portfolio' | 'earnings'>",
                              "useState<'overview' | 'add_listing' | 'bulk_upload' | 'portfolio' | 'earnings' | 'add_news' | 'add_blog'>")

    # 3. Add to NAV_ITEMS
    nav_items_target = "{ id: 'add_listing', icon: Plus, label: editingListingId ? 'Edit Listing' : 'Add Listing' },"
    nav_items_replacement = nav_items_target + "\n      { id: 'add_news', icon: FileText, label: 'Add News' },\n      { id: 'add_blog', icon: Edit2, label: 'Add Blog' },"
    if "id: 'add_news'" not in content:
        content = content.replace(nav_items_target, nav_items_replacement)

    # 4. Render conditions
    render_target = "{activeTab === 'bulk_upload' && ("
    render_replacement = """{activeTab === 'add_news' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6 max-w-3xl mx-auto">
                <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.05)] border border-gray-100 p-6 md:p-8">
                  <h2 className="text-2xl font-black text-gray-900 mb-6 pb-4 border-b border-gray-100">Add Local News</h2>
                  <AgentNewsForm onSuccess={() => setActiveTab('portfolio')} />
                </div>
              </motion.div>
            )}

            {activeTab === 'add_blog' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6 max-w-3xl mx-auto">
                <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.05)] border border-gray-100 p-6 md:p-8">
                  <h2 className="text-2xl font-black text-gray-900 mb-6 pb-4 border-b border-gray-100">Add Blog Post</h2>
                  <AgentBlogForm onSuccess={() => setActiveTab('portfolio')} />
                </div>
              </motion.div>
            )}

            """ + render_target
    if "activeTab === 'add_news'" not in content:
        content = content.replace(render_target, render_replacement)
        
    # 5. Fetch News and Blogs in SWR
    swr_target = "const { data: citiesData } = useSWR('/api/cities', fetcher)"
    swr_replacement = """const { data: newsData } = useSWR('/api/admin/news', fetcher)
    const { data: blogsData } = useSWR('/api/blogs?all=true', fetcher)
    const myNews = Array.isArray(newsData) ? newsData.filter(n => n.authorId === user?.id) : []
    const myBlogs = Array.isArray(blogsData) ? blogsData.filter(b => b.authorId === user?.id) : []
    
    """ + swr_target
    if "myNews =" not in content:
        content = content.replace(swr_target, swr_replacement)
        
    # 6. Add Portfolio Sections
    portfolio_target = "</div>\n                ) : listingsData?.listings?.length > 0 ? ("
    
    portfolio_replacement = """</div>
                ) : (
                  <div className="space-y-12">
                    {/* Listings */}
                    <div>
                      <h3 className="text-lg font-bold text-gray-800 mb-4">Listings</h3>
                      {listingsData?.listings?.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                          {listingsData.listings.map((listing: UserListing) => (
                            <div key={listing.id} className="border border-gray-200 rounded-xl overflow-hidden shadow-sm flex flex-col bg-white hover:shadow-md transition-shadow">
                              <div className="h-36 bg-gray-100 relative group">
                                {listing.coverImage ? (
                                  <Image src={listing.coverImage} alt={listing.name} fill className="object-cover transition-transform group-hover:scale-105" />
                                ) : (
                                  <div className="flex h-full items-center justify-center text-gray-400 bg-gray-50"><ImageIcon className="size-8" /></div>
                                )}
                                <div className="absolute top-2 right-2 flex gap-2">
                                  <button onClick={() => { setEditingListingId(listing.id); setActiveTab('add_listing'); }} className="p-2 bg-white/90 backdrop-blur rounded-full text-blue-600 hover:bg-blue-50 shadow-sm transition-colors">
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button onClick={() => handleDeleteListing(listing.id)} className="p-2 bg-white/90 backdrop-blur rounded-full text-red-600 hover:bg-red-50 shadow-sm transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                              <div className="p-4 flex-1 flex flex-col">
                                <div className="flex justify-between items-start mb-2">
                                  <h3 className="font-bold text-gray-900 line-clamp-1">{listing.name}</h3>
                                </div>
                                <div className="flex items-center text-sm text-gray-500 mb-2 gap-1"><MapPin className="w-3.5 h-3.5"/> <span className="line-clamp-1">{listing.address || 'No address'}</span></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200"><p className="text-gray-500">No listings assigned to you yet.</p></div>
                      )}
                    </div>

                    {/* News */}
                    <div>
                      <h3 className="text-lg font-bold text-gray-800 mb-4">News</h3>
                      {myNews.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                          {myNews.map((news: any) => (
                            <div key={news.id} className="border border-gray-200 rounded-xl overflow-hidden shadow-sm flex flex-col bg-white">
                              <div className="h-36 bg-gray-100 relative group">
                                {news.imageUrl ? (
                                  <Image src={news.imageUrl} alt={news.title} fill className="object-cover transition-transform group-hover:scale-105" />
                                ) : (
                                  <div className="flex h-full items-center justify-center text-gray-400 bg-gray-50"><ImageIcon className="size-8" /></div>
                                )}
                                <div className="absolute top-2 right-2 flex gap-2">
                                  <button onClick={async () => {
                                      if(confirm('Delete this news?')) {
                                          await fetch('/api/admin/news?id=' + news.id, { method: 'DELETE' });
                                          mutateListings(); // trigger re-render
                                      }
                                  }} className="p-2 bg-white/90 backdrop-blur rounded-full text-red-600 hover:bg-red-50 shadow-sm transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                              <div className="p-4"><h3 className="font-bold text-gray-900 line-clamp-2">{news.title}</h3></div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200"><p className="text-gray-500">You haven't posted any news yet.</p></div>
                      )}
                    </div>

                    {/* Blogs */}
                    <div>
                      <h3 className="text-lg font-bold text-gray-800 mb-4">Blogs</h3>
                      {myBlogs.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                          {myBlogs.map((blog: any) => (
                            <div key={blog.id} className="border border-gray-200 rounded-xl overflow-hidden shadow-sm flex flex-col bg-white">
                              <div className="h-36 bg-gray-100 relative group">
                                {blog.coverImageUrl ? (
                                  <Image src={blog.coverImageUrl} alt={blog.title} fill className="object-cover transition-transform group-hover:scale-105" />
                                ) : (
                                  <div className="flex h-full items-center justify-center text-gray-400 bg-gray-50"><ImageIcon className="size-8" /></div>
                                )}
                                <div className="absolute top-2 right-2 flex gap-2">
                                  <button onClick={async () => {
                                      if(confirm('Delete this blog?')) {
                                          await fetch('/api/blogs/' + blog.id, { method: 'DELETE' });
                                          mutateListings(); // trigger re-render
                                      }
                                  }} className="p-2 bg-white/90 backdrop-blur rounded-full text-red-600 hover:bg-red-50 shadow-sm transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                              <div className="p-4"><h3 className="font-bold text-gray-900 line-clamp-2">{blog.title}</h3></div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200"><p className="text-gray-500">You haven't posted any blogs yet.</p></div>
                      )}
                    </div>
                  </div>
                )}
                {/* Ignore old listings map: """
    
    # We replace the entire portfolio listings block with ours
    content = re.sub(
        r"\) : listingsData\?\.listings\?\.length > 0 \? \(\n\s+<div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5\">.*?</div>\n\s+\) : \(\n\s+<div className=\"text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200\">.*?</div>\n\s+\)",
        portfolio_replacement[7:], 
        content, 
        flags=re.DOTALL
    )

    with open('src/components/agent-dashboard.tsx', 'w', encoding='utf-8') as f:
        f.write(content)

update_agent_dashboard()
