import { api } from '@/shared/utils/api'
import { Question, CreateQuestionInput, UpdateQuestionInput } from '../types'

export const questionService = {
  async getAll(): Promise<Question[]> {
    const { data } = await api.get('/questions')
    return data.data
  },

  async getById(id: string): Promise<Question> {
    const { data } = await api.get(`/questions/${id}`)
    return data.data
  },

  async create(input: CreateQuestionInput): Promise<Question> {
    const { data } = await api.post('/questions', input)
    return data.data
  },

  async update(id: string, input: UpdateQuestionInput): Promise<Question> {
    const { data } = await api.put(`/questions/${id}`, input)
    return data.data
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/questions/${id}`)
  },

  async associateAnswers(id: string, answerIds: string[]): Promise<Question> {
    const { data } = await api.post(`/questions/${id}/answers`, { answerIds })
    return data.data
  },
}
