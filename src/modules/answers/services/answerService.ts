import { api } from '@/shared/utils/api'
import { Answer, CreateAnswerInput, UpdateAnswerInput } from '../types'

export const answerService = {
  async getAll(): Promise<Answer[]> {
    const { data } = await api.get('/answers')
    return data.data
  },

  async getById(id: string): Promise<Answer> {
    const { data } = await api.get(`/answers/${id}`)
    return data.data
  },

  async create(input: CreateAnswerInput): Promise<Answer> {
    const { data } = await api.post('/answers', input)
    return data.data
  },

  async update(id: string, input: UpdateAnswerInput): Promise<Answer> {
    const { data } = await api.put(`/answers/${id}`, input)
    return data.data
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/answers/${id}`)
  },
}
