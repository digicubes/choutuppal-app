'use client'

import React, { useState } from 'react'
import NewsView from '@/components/news-view'
import BlogView from '@/components/blog-view'
import { useAppConfig } from '@/hooks/use-app-config'
import { Newspaper, FileText } from 'lucide-react'

type SubTab = 'news' | 'blog'

export function UpdatesView() {
  const [activeTab, setActiveTab] = useState<SubTab>('news')
  const { config } = useAppConfig()

  return (
    <div className="w-full flex flex-col min-h-screen">
      {/* Top Tab Menu */}
      <div className="sticky top-14 md:top-0 z-40 bg-white border-b border-gray-100 shadow-sm overflow-x-auto">
        <div className="flex items-center min-w-max p-2 gap-2 max-w-3xl mx-auto">
          {config.enableBlog && (
            <>
              <button
                onClick={() => setActiveTab('news')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  activeTab === 'news'
                    ? 'bg-blue-50 text-[#4169E1] border border-blue-200'
                    : 'text-gray-500 hover:bg-gray-50 border border-transparent'
                }`}
              >
                <Newspaper className="w-4 h-4" />
                Local News
              </button>

              <button
                onClick={() => setActiveTab('blog')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  activeTab === 'blog'
                    ? 'bg-blue-50 text-[#4169E1] border border-blue-200'
                    : 'text-gray-500 hover:bg-gray-50 border border-transparent'
                }`}
              >
                <FileText className="w-4 h-4" />
                Blog
              </button>
            </>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 w-full bg-gray-50/30">
        {activeTab === 'news' && <NewsView />}
        {activeTab === 'blog' && <BlogView />}
      </div>
    </div>
  )
}
