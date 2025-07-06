// @ts-nocheck
'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Search, 
  BookOpen, 
  FileText, 
  Star, 
  Eye, 
  ThumbsUp, 
  ThumbsDown,
  Filter,
  Clock,
  User,
  Tag,
  ExternalLink,
  ChevronRight,
  Loader2,
  Plus
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

interface KnowledgeBaseArticle {
  id: string
  title: string
  summary?: string
  category: string
  subCategory?: string
  tags?: string[]
  slug: string
  isPublic: boolean
  requiredRole?: string
  status: string
  publishedAt?: string
  viewCount: number
  helpfulVotes: number
  notHelpfulVotes: number
  avgRating?: number
  createdAt: string
  updatedAt: string
}

interface SearchSuggestions {
  relatedCategories: string[]
  popularTags: string[]
}

const CATEGORIES = [
  'GETTING_STARTED',
  'TECHNICAL_SUPPORT', 
  'BILLING_PAYMENTS',
  'CHILD_SAFETY',
  'VENUE_MANAGEMENT',
  'MOBILE_APP',
  'FACE_RECOGNITION',
  'CAMERAS_HARDWARE',
  'ALERTS_NOTIFICATIONS',
  'TROUBLESHOOTING',
  'API_DOCUMENTATION',
  'BEST_PRACTICES',
  'FAQ',
  'POLICIES',
  'UPDATES'
]

export function KnowledgeBaseInterface() {
  const [articles, setArticles] = useState<KnowledgeBaseArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [searchResults, setSearchResults] = useState<any>(null)
  const [suggestions, setSuggestions] = useState<SearchSuggestions | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0
  })

  const { toast } = useToast()

  useEffect(() => {
    if (searchQuery.trim()) {
      performSearch()
    } else {
      fetchArticles()
    }
  }, [searchQuery, selectedCategory, pagination.page])

  const fetchArticles = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString()
      })

      if (selectedCategory) params.append('category', selectedCategory)

      const response = await fetch(`/api/support/knowledge-base?${params}`)
      if (!response.ok) throw new Error('Failed to fetch articles')

      const data = await response.json()
      setArticles(data.articles)
      setPagination(prev => ({
        ...prev,
        total: data.pagination.total,
        pages: data.pagination.pages
      }))
      setSearchResults(null)
    } catch (error) {
      console.error('Error fetching articles:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch knowledge base articles',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const performSearch = async () => {
    try {
      setIsSearching(true)
      const params = new URLSearchParams({
        q: searchQuery.trim(),
        page: pagination.page.toString(),
        limit: pagination.limit.toString()
      })

      if (selectedCategory) params.append('category', selectedCategory)

      const response = await fetch(`/api/support/knowledge-base/search?${params}`)
      if (!response.ok) throw new Error('Search failed')

      const data = await response.json()
      setArticles(data.articles)
      setSearchResults(data)
      setSuggestions(data.suggestions)
      setPagination(prev => ({
        ...prev,
        total: data.pagination.total,
        pages: data.pagination.pages
      }))
    } catch (error) {
      console.error('Error searching articles:', error)
      toast({
        title: 'Error',
        description: 'Search failed. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsSearching(false)
    }
  }

  const submitFeedback = async (articleSlug: string, feedback: any) => {
    try {
      const response = await fetch(`/api/support/knowledge-base/${articleSlug}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(feedback)
      })

      if (!response.ok) throw new Error('Failed to submit feedback')

      toast({
        title: 'Success',
        description: 'Thank you for your feedback!'
      })
    } catch (error) {
      console.error('Error submitting feedback:', error)
      toast({
        title: 'Error',
        description: 'Failed to submit feedback',
        variant: 'destructive'
      })
    }
  }

  const formatCategoryName = (category: string) => {
    return category.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'GETTING_STARTED': 'bg-green-100 text-green-800',
      'TECHNICAL_SUPPORT': 'bg-blue-100 text-blue-800',
      'CHILD_SAFETY': 'bg-red-100 text-red-800',
      'VENUE_MANAGEMENT': 'bg-purple-100 text-purple-800',
      'BILLING_PAYMENTS': 'bg-yellow-100 text-yellow-800',
      'FAQ': 'bg-gray-100 text-gray-800'
    }
    return colors[category] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Knowledge Base</h2>
          <p className="text-gray-600 mt-1">Find answers and learn about mySafePlay<sup>™</sup> features</p>
        </div>
        
        <Button className="flex items-center space-x-2">
          <BookOpen className="h-4 w-4" />
          <span>Browse All Articles</span>
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  placeholder="Search the knowledge base..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 text-lg h-12"
                />
                {isSearching && (
                  <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 animate-spin text-blue-500" />
                )}
              </div>
            </div>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48 h-12">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORIES.map(category => (
                  <SelectItem key={category} value={category}>
                    {formatCategoryName(category)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {searchResults && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-gray-600">
                Found {searchResults.pagination.total} articles for "{searchResults.query}"
              </p>
              
              {suggestions && (suggestions.relatedCategories.length > 0 || suggestions.popularTags.length > 0) && (
                <div className="mt-2 space-y-2">
                  {suggestions.relatedCategories.length > 0 && (
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">Related categories:</span>
                      {suggestions.relatedCategories.slice(0, 3).map(category => (
                        <Button
                          key={category}
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedCategory(category)}
                          className="text-xs"
                        >
                          {formatCategoryName(category)}
                        </Button>
                      ))}
                    </div>
                  )}
                  
                  {suggestions.popularTags.length > 0 && (
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">Popular tags:</span>
                      {suggestions.popularTags.slice(0, 5).map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Featured Categories */}
      {!searchQuery && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {CATEGORIES.slice(0, 8).map((category, index) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setSelectedCategory(category)}>
                <CardContent className="p-4 text-center">
                  <div className="mb-2">
                    <FileText className="h-8 w-8 mx-auto text-blue-500" />
                  </div>
                  <h3 className="font-medium text-sm">{formatCategoryName(category)}</h3>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Articles Grid */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {articles.map((article, index) => (
                <motion.div
                  key={article.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <ArticleCard 
                    article={article} 
                    onFeedback={(feedback) => submitFeedback(article.slug, feedback)}
                  />
                </motion.div>
              ))}
            </div>

            {articles.length === 0 && !loading && (
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No articles found</h3>
                <p className="text-gray-500">
                  {searchQuery 
                    ? "Try adjusting your search terms or browse by category" 
                    : "No articles available in this category"
                  }
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} articles
          </p>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
            >
              Previous
            </Button>
            
            <span className="text-sm text-gray-600">
              Page {pagination.page} of {pagination.pages}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page === pagination.pages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function ArticleCard({ article, onFeedback }: { 
  article: KnowledgeBaseArticle
  onFeedback: (feedback: any) => void 
}) {
  const [showFeedback, setShowFeedback] = useState(false)

  const formatCategoryName = (category: string) => {
    return category.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'GETTING_STARTED': 'bg-green-100 text-green-800',
      'TECHNICAL_SUPPORT': 'bg-blue-100 text-blue-800',
      'CHILD_SAFETY': 'bg-red-100 text-red-800',
      'VENUE_MANAGEMENT': 'bg-purple-100 text-purple-800',
      'BILLING_PAYMENTS': 'bg-yellow-100 text-yellow-800',
      'FAQ': 'bg-gray-100 text-gray-800'
    }
    return colors[category] || 'bg-gray-100 text-gray-800'
  }

  const helpfulPercentage = article.helpfulVotes + article.notHelpfulVotes > 0 
    ? (article.helpfulVotes / (article.helpfulVotes + article.notHelpfulVotes)) * 100 
    : 0

  return (
    <Card className="h-full hover:shadow-lg transition-shadow group">
      <CardContent className="p-6 flex flex-col h-full">
        <div className="flex-1">
          <div className="flex items-start justify-between mb-3">
            <Badge className={getCategoryColor(article.category)}>
              {formatCategoryName(article.category)}
            </Badge>
            <div className="flex items-center space-x-1 text-xs text-gray-500">
              <Eye className="h-3 w-3" />
              <span>{article.viewCount}</span>
            </div>
          </div>
          
          <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
            <a href={`/support/knowledge-base/${article.slug}`} className="line-clamp-2">
              {article.title}
            </a>
          </h3>
          
          {article.summary && (
            <p className="text-gray-600 text-sm mb-3 line-clamp-3">
              {article.summary}
            </p>
          )}
          
          {article.tags && (() => {
            try {
              const parsedTags = JSON.parse(article.tags);
              return Array.isArray(parsedTags);
            } catch {
              return false;
            }
          })() && (
            <div className="flex flex-wrap gap-1 mb-3">
              {(() => {
                try {
                  const parsedTags = JSON.parse(article.tags);
                  return Array.isArray(parsedTags) ? parsedTags.slice(0, 3) : [];
                } catch {
                  return [];
                }
              })().map((tag: string) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
        
        <div className="space-y-3 pt-3 border-t">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center space-x-3">
              {article.avgRating && (
                <div className="flex items-center space-x-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span>{article.avgRating.toFixed(1)}</span>
                </div>
              )}
              
              <div className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>{formatDate(article.updatedAt)}</span>
              </div>
            </div>
            
            <a 
              href={`/support/knowledge-base/${article.slug}`}
              className="flex items-center space-x-1 text-blue-600 hover:text-blue-800"
            >
              <span>Read</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          
          {(article.helpfulVotes > 0 || article.notHelpfulVotes > 0) && (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs">
                <span className="text-gray-500">Helpful:</span>
                <div className="flex items-center space-x-1">
                  <ThumbsUp className="h-3 w-3 text-green-500" />
                  <span>{article.helpfulVotes}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <ThumbsDown className="h-3 w-3 text-red-500" />
                  <span>{article.notHelpfulVotes}</span>
                </div>
                <span className="text-gray-500">({helpfulPercentage.toFixed(0)}% helpful)</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
