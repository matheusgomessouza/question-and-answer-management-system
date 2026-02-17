import { api } from '@/shared/utils/api'
import { Answer, CreateAnswerInput, UpdateAnswerInput } from '../types'

export const answerService = {
  async getAll(): Promise<Answer[]> {
    const response = await api.get('/answers')
    return response.data
  },

  async getById(id: string): Promise<Answer> {
    const response = await api.get(`/answers/${id}`)
    return response.data
  },

  async create(input: CreateAnswerInput): Promise<Answer> {
    const response = await api.post('/answers', input)
    return response.data
  },

  async update(id: string, input: UpdateAnswerInput): Promise<Answer> {
    const response = await api.put(`/answers/${id}`, input)
    return response.data
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/answers/${id}`)
  },
}
