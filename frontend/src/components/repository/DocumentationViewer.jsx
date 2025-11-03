import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Download, Copy, CheckCircle, AlertCircle, FileText, Code, Book, ArrowLeft, ExternalLink } from 'lucide-react'
import { repositoryService } from '@/services/repositoryService'
import { cn } from '@/lib/utils'

const DocumentationViewer = ({ jobId, onClose }) => {
  const [state, setState] = useState({
    loading: true,
    error: null,
    content: null,
    repository: null
  })

  useEffect(() => {
    fetchDocumentationContent()
  }, [jobId])

  const fetchDocumentationContent = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))
      const data = await repositoryService.getDocumentationContent(jobId)
      console.log('Documentation content received:', data) // Debug log
      setState(prev => ({
        ...prev,
        loading: false,
        content: data.content,
        repository: data.repository
      }))
    } catch (error) {
      console.error('Failed to fetch documentation content:', error)
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to load documentation'
      }))
    }
  }

  const handleDownload = () => {
    if (!state.content) return
    
    const content = JSON.stringify(state.content, null, 2)
    const blob = new Blob([content], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `documentation-${state.repository?.name || 'repo'}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      // You could add a toast notification here
    } catch (error) {
      console.error('Failed to copy text:', error)
    }
  }

  const renderDocumentationItem = (doc, index) => {
    const iconMap = {
      'function': Code,
      'class': Book,
      'method': Code,
      'property': FileText
    }
    
    const Icon = iconMap[doc.type] || Code

    return (
      <motion.div
        key={index}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className="bg-card border rounded-lg p-4 space-y-3"
      >
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-card-foreground">{doc.name}</h3>
          <span className="text-xs text-muted-foreground">
            Line {doc.line}
          </span>
        </div>
        
        <div className="bg-muted rounded p-3">
          <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-mono">
            {doc.generated_doc || doc.doc || 'No documentation available'}
          </pre>
        </div>
        
        <button
          onClick={() => handleCopy(doc.generated_doc || doc.doc || '')}
          className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
        >
          <Copy className="w-3 h-3" />
          Copy
        </button>
      </motion.div>
    )
  }

  const renderFileDocumentation = (fileDoc, fileIndex) => {
    return (
      <motion.div
        key={fileIndex}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: fileIndex * 0.1 }}
        className="space-y-4"
      >
        <div className="border-b pb-2">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {fileDoc.file_name || fileDoc.file}
          </h2>
          <p className="text-sm text-muted-foreground">
            {fileDoc.file_path || 'Path not available'}
          </p>
        </div>

        <div className="space-y-4">
          {fileDoc.documentation && fileDoc.documentation.length > 0 ? (
            fileDoc.documentation.map((doc, docIndex) => 
              renderDocumentationItem(doc, docIndex)
            )
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="w-8 h-8 mx-auto mb-2" />
              <p>No documentation items found for this file</p>
            </div>
          )}
        </div>
      </motion.div>
    )
  }

  if (state.loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-background rounded-lg p-8 max-w-md w-full mx-4"
        >
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
            <span>Loading documentation...</span>
          </div>
        </motion.div>
      </div>
    )
  }

  if (state.error) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-background rounded-lg p-8 max-w-md w-full mx-4"
        >
          <div className="flex items-center gap-3 text-destructive">
            <AlertCircle className="w-6 h-6" />
            <div>
              <h3 className="font-semibold">Error Loading Documentation</h3>
              <p className="text-sm">{state.error}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="mt-4 w-full bg-primary text-primary-foreground py-2 px-4 rounded-lg hover:bg-primary/90"
          >
            Close
          </button>
        </motion.div>
      </div>
    )
  }

  const { content, repository } = state

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-background rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h1 className="text-2xl font-bold">Generated Documentation</h1>
            {repository && (
              <p className="text-muted-foreground">
                Repository: {repository.name}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!content ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No documentation content available</h3>
              <p className="text-muted-foreground">The documentation generation may not have completed successfully.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Debug info - remove in production */}
              <details className="bg-muted p-4 rounded-lg">
                <summary className="cursor-pointer font-mono text-sm">Debug: Content structure</summary>
                <pre className="mt-2 text-xs overflow-auto max-h-40">
                  {JSON.stringify(content, null, 2)}
                </pre>
              </details>

              {/* Handle different content structures */}
              {content.files && Array.isArray(content.files) ? (
                content.files.map((fileDoc, fileIndex) => 
                  renderFileDocumentation(fileDoc, fileIndex)
                )
              ) : Array.isArray(content) ? (
                content.map((fileDoc, fileIndex) => 
                  renderFileDocumentation(fileDoc, fileIndex)
                )
              ) : content.documentation ? (
                <div className="space-y-4">
                  {content.documentation.map((doc, docIndex) => 
                    renderDocumentationItem(doc, docIndex)
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Unexpected content format</h3>
                  <p className="text-muted-foreground">
                    The documentation content has an unexpected structure.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {content?.stats && (
          <div className="border-t p-4">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Files processed: {content.stats.files_processed || 0}</span>
              <span>Functions: {content.stats.total_functions || 0}</span>
              <span>Classes: {content.stats.total_classes || 0}</span>
              <span>Documentation items: {content.stats.documentation_items || 0}</span>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default DocumentationViewer
