import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode, createElement } from 'react'
import { useQuestions } from './useQuestions'
import { questionService } from '../services/questionService'
import { Question, CreateQuestionInput, UpdateQuestionInput } from '../types'

vi.mock('../services/questionService')

describe('useQuestions', () => {
  let queryClient: QueryClient

  const mockQuestion: Question = {
    id: '1',
    description: 'Question 1',
    active: true,
    order: 1,
      answers: [],
  }

  const mockQuestions: Question[] = [
    mockQuestion,
    {
      id: '2',
      description: 'Question 2',
      active: false,
      order: 2,
        answers: [],
    },
  ]

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    vi.clearAllMocks()
  })

  afterEach(() => {
    queryClient.clear()
  })

  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)

  describe('Query', () => {
    it('should fetch questions on mount and return them with loading state', async () => {
      vi.mocked(questionService.getAll).mockResolvedValue(mockQuestions)

      const { result } = renderHook(() => useQuestions(), { wrapper })

      expect(result.current.isLoading).toBe(true)
      expect(result.current.questions).toEqual([])

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.questions).toEqual(mockQuestions)
      expect(result.current.error).toBe(null)
      expect(questionService.getAll).toHaveBeenCalledTimes(1)
    })

    it('should handle error state when fetching fails', async () => {
      const mockError = new Error('Failed to fetch questions')
      vi.mocked(questionService.getAll).mockRejectedValue(mockError)

      const { result } = renderHook(() => useQuestions(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error).toBeTruthy()
      expect(result.current.questions).toEqual([])
    })

    it('should return empty array when no questions exist', async () => {
      vi.mocked(questionService.getAll).mockResolvedValue([])

      const { result } = renderHook(() => useQuestions(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.questions).toEqual([])
    })
  })

  describe('Create Mutation', () => {
    it('should create a question and invalidate queries', async () => {
      const newQuestionInput: CreateQuestionInput = {
        description: 'New Question',
        active: true,
        order: 3,
      }
      const createdQuestion: Question = {
        id: '3',
        ...newQuestionInput,
        active: true,
        order: 3,
          answers: [],
      }

      vi.mocked(questionService.getAll).mockResolvedValue(mockQuestions)
      vi.mocked(questionService.create).mockResolvedValue(createdQuestion)

      const { result } = renderHook(() => useQuestions(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.isCreating).toBe(false)

      const resultQuestion = await result.current.createQuestion(newQuestionInput)

      expect(resultQuestion).toEqual(createdQuestion)
      expect(questionService.create).toHaveBeenCalledWith(newQuestionInput)
      expect(questionService.create).toHaveBeenCalledTimes(1)

      await waitFor(() => {
        expect(result.current.isCreating).toBe(false)
      })

      // Verifica que a query foi invalidada chamando getAll novamente
      await waitFor(() => {
        expect(questionService.getAll).toHaveBeenCalledTimes(2)
      })
    })

    it('should handle create mutation error', async () => {
      const mockError = new Error('Failed to create')
      vi.mocked(questionService.getAll).mockResolvedValue([])
      vi.mocked(questionService.create).mockRejectedValue(mockError)

      const { result } = renderHook(() => useQuestions(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await expect(
        result.current.createQuestion({ description: 'New Question' })
      ).rejects.toThrow('Failed to create')

      expect(result.current.isCreating).toBe(false)
    })
  })

  describe('Update Mutation', () => {
    it('should update a question and invalidate queries', async () => {
      const updateInput: UpdateQuestionInput = {
        description: 'Updated Question',
        active: false,
      }
      const updatedQuestion: Question = {
        ...mockQuestion,
        ...updateInput,
        description: 'Updated Question',
        active: false,
      }

      vi.mocked(questionService.getAll).mockResolvedValue(mockQuestions)
      vi.mocked(questionService.update).mockResolvedValue(updatedQuestion)

      const { result } = renderHook(() => useQuestions(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.isUpdating).toBe(false)

      const resultQuestion = await result.current.updateQuestion({
        id: '1',
        input: updateInput,
      })

      expect(resultQuestion).toEqual(updatedQuestion)
      expect(questionService.update).toHaveBeenCalledWith('1', updateInput)
      expect(questionService.update).toHaveBeenCalledTimes(1)

      await waitFor(() => {
        expect(result.current.isUpdating).toBe(false)
      })

      await waitFor(() => {
        expect(questionService.getAll).toHaveBeenCalledTimes(2)
      })
    })

    it('should handle update mutation error', async () => {
      const mockError = new Error('Failed to update')
      vi.mocked(questionService.getAll).mockResolvedValue([])
      vi.mocked(questionService.update).mockRejectedValue(mockError)

      const { result } = renderHook(() => useQuestions(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await expect(
        result.current.updateQuestion({ id: '1', input: { description: 'Updated' } })
      ).rejects.toThrow('Failed to update')

      expect(result.current.isUpdating).toBe(false)
    })
  })

  describe('Delete Mutation', () => {
    it('should delete a question and invalidate queries', async () => {
      vi.mocked(questionService.getAll).mockResolvedValue(mockQuestions)
      vi.mocked(questionService.delete).mockResolvedValue(undefined)

      const { result } = renderHook(() => useQuestions(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await result.current.deleteQuestion('1')

      expect(questionService.delete).toHaveBeenCalledWith('1')
      expect(questionService.delete).toHaveBeenCalledTimes(1)

      await waitFor(() => {
        expect(result.current.isDeleting).toBe(false)
      })

      await waitFor(() => {
        expect(questionService.getAll).toHaveBeenCalledTimes(2)
      })
    })

    it('should handle delete mutation error', async () => {
      const mockError = new Error('Failed to delete')
      vi.mocked(questionService.getAll).mockResolvedValue([])
      vi.mocked(questionService.delete).mockRejectedValue(mockError)

      const { result } = renderHook(() => useQuestions(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await expect(result.current.deleteQuestion('1')).rejects.toThrow('Failed to delete')

      expect(result.current.isDeleting).toBe(false)
    })
  })

  describe('Combined Behavior', () => {
    it('should handle multiple mutations sequentially', async () => {
      const newQuestion: Question = {
        id: '3',
        description: 'New',
        active: true,
        order: 3,
          answers: [],
      }

      vi.mocked(questionService.getAll).mockResolvedValue(mockQuestions)
      vi.mocked(questionService.create).mockResolvedValue(newQuestion)
      vi.mocked(questionService.delete).mockResolvedValue(undefined)

      const { result } = renderHook(() => useQuestions(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await result.current.createQuestion({ description: 'New' })
      await result.current.deleteQuestion('1')

      expect(questionService.create).toHaveBeenCalledTimes(1)
      expect(questionService.delete).toHaveBeenCalledTimes(1)
      expect(questionService.getAll).toHaveBeenCalledTimes(3) // initial + 2 invalidations
    })
  })
})