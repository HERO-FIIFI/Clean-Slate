import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
})

// Documents
export const uploadDocument = (file) => {
  const form = new FormData()
  form.append('file', file)
  return api.post('/documents/upload', form)
}

export const listDocuments = () => api.get('/documents/')

export const getDocumentStatus = (id) => api.get(`/documents/${id}/status`)

export const getDocumentChunks = (id) => api.get(`/documents/${id}/chunks`)

export const updateDocumentStatus = (id, status) =>
  api.patch(`/documents/${id}/status`, { status })

export const deleteDocument = (filename) => api.delete(`/documents/${filename}`)

// Ollama
export const getOllamaStatus = () => api.get('/ollama/status')

export const pullOllamaModel = () => api.post('/ollama/pull')

// Questions
export const getNextQuestion = (queryString = '') => api.get(`/questions/next${queryString}`)

export const rateConfidence = (questionId, confidenceLevel) =>
  api.post('/questions/rate', { question_id: questionId, confidence_level: confidenceLevel })

export const getPendingCount = (documentId = null) =>
  api.get(documentId ? `/questions/pending?document_id=${documentId}` : '/questions/pending')

export const createQuestion = (documentId, text, context, sourceChunk = null) =>
  api.post('/questions/', { document_id: documentId, text, context, source_chunk: sourceChunk })

// Reviews
export const getReviewStats = (days = 7) => api.get(`/reviews/stats?days=${days}`)

export const getSession = () => api.get('/reviews/session')

export const completeSession = () => api.post('/reviews/session/complete')

// Data management
export const resetAllData = () => api.delete('/data/reset')
export const resetQuestions = () => api.delete('/data/questions')
