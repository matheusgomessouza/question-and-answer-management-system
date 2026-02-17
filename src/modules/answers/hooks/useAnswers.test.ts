import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAnswers } from './useAnswers'
import { answerService } from '../services/answerService'
import { Answer, CreateAnswerInput, UpdateAnswerInput } from '../types'
import { ReactNode, createElement } from 'react'

vi.mock('../services/answerService')

describe('useAnswers', () => {
  let queryClient: QueryClient

  const mockAnswers: Answer[] = [
    { id: '1', description: 'Answer 1', active: true, order: 1 },
    { id: '2', description: 'Answer 2', active: false, order: 2 },
  ]

  const mockAnswer: Answer = {
    id: '1',
    description: 'Test answer',
    active: true,
    order: 1,
  }

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    vi.clearAllMocks()
  })

  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)

  describe('Query - Fetching Answers', () => {
    it('should fetch answers on mount', async () => {
      vi.mocked(answerService.getAll).mockResolvedValue(mockAnswers)

      const { result } = renderHook(() => useAnswers(), { wrapper })

      expect(result.current.isLoading).toBe(true)

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.answers).toEqual(mockAnswers)
      expect(answerService.getAll).toHaveBeenCalledOnce()
    })

    it('should return empty array when no answers', async () => {
      vi.mocked(answerService.getAll).mockResolvedValue([])

      const { result } = renderHook(() => useAnswers(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.answers).toEqual([])
    })

    it('should handle fetch error', async () => {
      const error = new Error('Network error')
      vi.mocked(answerService.getAll).mockRejectedValue(error)

      const { result } = renderHook(() => useAnswers(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error).toBeDefined()
      expect(result.current.answers).toEqual([])
    })

    it('should fetch data with correct query key', async () => {
      vi.mocked(answerService.getAll).mockResolvedValue(mockAnswers)

      const { result } = renderHook(() => useAnswers(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(answerService.getAll).toHaveBeenCalled()
      expect(result.current.answers).toEqual(mockAnswers)
    })
  })

  describe('Mutation - Create Answer', () => {
    it('should create answer with correct data', async () => {
      vi.mocked(answerService.getAll).mockResolvedValue([])
      vi.mocked(answerService.create).mockResolvedValue(mockAnswer)

      const { result } = renderHook(() => useAnswers(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const input: CreateAnswerInput = {
        description: 'New answer',
        active: true,
        order: 1,
      }

      await result.current.createAnswer(input)

      await waitFor(() => {
        expect(result.current.isCreating).toBe(false)
      })

      expect(answerService.create).toHaveBeenCalledWith(input)
      expect(answerService.create).toHaveBeenCalledOnce()
    })

    it('should invalidate answers query after successful creation', async () => {
      vi.mocked(answerService.getAll).mockResolvedValue([])
      vi.mocked(answerService.create).mockResolvedValue(mockAnswer)

      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

      const { result } = renderHook(() => useAnswers(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const input: CreateAnswerInput = {
        description: 'New answer',
        active: true,
        order: 1,
      }

      await result.current.createAnswer(input)

      await waitFor(() => {
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['answers'] })
      })
    })

    it('should handle create error', async () => {
      vi.mocked(answerService.getAll).mockResolvedValue([])
      const error = new Error('Failed to create')
      vi.mocked(answerService.create).mockRejectedValue(error)

      const { result } = renderHook(() => useAnswers(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const input: CreateAnswerInput = {
        description: 'New answer',
        active: true,
        order: 1,
      }

      await expect(result.current.createAnswer(input)).rejects.toThrow('Failed to create')

      expect(result.current.isCreating).toBe(false)
    })

    it('should create answer with optional fields', async () => {
      vi.mocked(answerService.getAll).mockResolvedValue([])
      vi.mocked(answerService.create).mockResolvedValue(mockAnswer)

      const { result } = renderHook(() => useAnswers(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const input: CreateAnswerInput = {
        description: 'New answer',
      }

      await result.current.createAnswer(input)

      expect(answerService.create).toHaveBeenCalledWith(input)
    })
  })

  describe('Mutation - Update Answer', () => {
    it('should update answer with correct id and data', async () => {
      vi.mocked(answerService.getAll).mockResolvedValue(mockAnswers)
      const updatedAnswer: Answer = { ...mockAnswer, description: 'Updated answer' }
      vi.mocked(answerService.update).mockResolvedValue(updatedAnswer)

      const { result } = renderHook(() => useAnswers(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const input: UpdateAnswerInput = {
        description: 'Updated answer',
      }

      await result.current.updateAnswer({ id: '1', input })

      await waitFor(() => {
        expect(result.current.isUpdating).toBe(false)
      })

      expect(answerService.update).toHaveBeenCalledWith('1', input)
      expect(answerService.update).toHaveBeenCalledOnce()
    })

    it('should invalidate answers query after successful update', async () => {
      vi.mocked(answerService.getAll).mockResolvedValue(mockAnswers)
      const updatedAnswer: Answer = { ...mockAnswer, description: 'Updated' }
      vi.mocked(answerService.update).mockResolvedValue(updatedAnswer)

      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

      const { result } = renderHook(() => useAnswers(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const input: UpdateAnswerInput = {
        description: 'Updated answer',
      }

      await result.current.updateAnswer({ id: '1', input })

      await waitFor(() => {
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['answers'] })
      })
    })

    it('should handle update error', async () => {
      vi.mocked(answerService.getAll).mockResolvedValue(mockAnswers)
      const error = new Error('Failed to update')
      vi.mocked(answerService.update).mockRejectedValue(error)

      const { result } = renderHook(() => useAnswers(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const input: UpdateAnswerInput = {
        description: 'Updated answer',
      }

      await expect(result.current.updateAnswer({ id: '1', input })).rejects.toThrow(
        'Failed to update'
      )

      expect(result.current.isUpdating).toBe(false)
    })

    it('should update answer with partial data', async () => {
      vi.mocked(answerService.getAll).mockResolvedValue(mockAnswers)
      const updatedAnswer: Answer = { ...mockAnswer, active: false }
      vi.mocked(answerService.update).mockResolvedValue(updatedAnswer)

      const { result } = renderHook(() => useAnswers(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const input: UpdateAnswerInput = {
        active: false,
      }

      await result.current.updateAnswer({ id: '1', input })

      expect(answerService.update).toHaveBeenCalledWith('1', input)
    })

    it('should update multiple fields at once', async () => {
      vi.mocked(answerService.getAll).mockResolvedValue(mockAnswers)
      const updatedAnswer: Answer = {
        ...mockAnswer,
        description: 'New description',
        active: false,
        order: 5,
      }
      vi.mocked(answerService.update).mockResolvedValue(updatedAnswer)

      const { result } = renderHook(() => useAnswers(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const input: UpdateAnswerInput = {
        description: 'New description',
        active: false,
        order: 5,
      }

      await result.current.updateAnswer({ id: '1', input })

      expect(answerService.update).toHaveBeenCalledWith('1', input)
    })
  })

  describe('Mutation - Delete Answer', () => {
    it('should delete answer with correct id', async () => {
      vi.mocked(answerService.getAll).mockResolvedValue(mockAnswers)
      vi.mocked(answerService.delete).mockResolvedValue(undefined)

      const { result } = renderHook(() => useAnswers(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await result.current.deleteAnswer('1')

      await waitFor(() => {
        expect(result.current.isDeleting).toBe(false)
      })

      expect(answerService.delete).toHaveBeenCalledWith('1')
      expect(answerService.delete).toHaveBeenCalledOnce()
    })

    it('should invalidate both answers and questions queries after deletion', async () => {
      vi.mocked(answerService.getAll).mockResolvedValue(mockAnswers)
      vi.mocked(answerService.delete).mockResolvedValue(undefined)

      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

      const { result } = renderHook(() => useAnswers(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await result.current.deleteAnswer('1')

      await waitFor(() => {
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['answers'] })
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['questions'] })
      })

      // Verify it was called exactly twice
      expect(invalidateSpy).toHaveBeenCalledTimes(2)
    })

    it('should handle delete error', async () => {
      vi.mocked(answerService.getAll).mockResolvedValue(mockAnswers)
      const error = new Error('Failed to delete')
      vi.mocked(answerService.delete).mockRejectedValue(error)

      const { result } = renderHook(() => useAnswers(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await expect(result.current.deleteAnswer('1')).rejects.toThrow('Failed to delete')

      expect(result.current.isDeleting).toBe(false)
    })

    it('should delete different answers independently', async () => {
      vi.mocked(answerService.getAll).mockResolvedValue(mockAnswers)
      vi.mocked(answerService.delete).mockResolvedValue(undefined)

      const { result } = renderHook(() => useAnswers(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await result.current.deleteAnswer('1')
      expect(answerService.delete).toHaveBeenCalledWith('1')

      await result.current.deleteAnswer('2')
      expect(answerService.delete).toHaveBeenCalledWith('2')

      expect(answerService.delete).toHaveBeenCalledTimes(2)
    })
  })

  describe('Mutation States', () => {
    it('should have correct initial mutation states', async () => {
      vi.mocked(answerService.getAll).mockResolvedValue(mockAnswers)

      const { result } = renderHook(() => useAnswers(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.isCreating).toBe(false)
      expect(result.current.isUpdating).toBe(false)
      expect(result.current.isDeleting).toBe(false)
    })

    it('should handle multiple mutations sequentially', async () => {
      vi.mocked(answerService.getAll).mockResolvedValue([])
      vi.mocked(answerService.create).mockResolvedValue(mockAnswer)
      vi.mocked(answerService.update).mockResolvedValue(mockAnswer)
      vi.mocked(answerService.delete).mockResolvedValue(undefined)

      const { result } = renderHook(() => useAnswers(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Create
      await result.current.createAnswer({ description: 'New', active: true, order: 1 })
      expect(result.current.isCreating).toBe(false)

      // Update
      await result.current.updateAnswer({ id: '1', input: { description: 'Updated' } })
      expect(result.current.isUpdating).toBe(false)

      // Delete
      await result.current.deleteAnswer('1')
      expect(result.current.isDeleting).toBe(false)
    })
  })

  describe('Return Values', () => {
    it('should return all expected properties', async () => {
      vi.mocked(answerService.getAll).mockResolvedValue(mockAnswers)

      const { result } = renderHook(() => useAnswers(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current).toHaveProperty('answers')
      expect(result.current).toHaveProperty('isLoading')
      expect(result.current).toHaveProperty('error')
      expect(result.current).toHaveProperty('createAnswer')
      expect(result.current).toHaveProperty('updateAnswer')
      expect(result.current).toHaveProperty('deleteAnswer')
      expect(result.current).toHaveProperty('isCreating')
      expect(result.current).toHaveProperty('isUpdating')
      expect(result.current).toHaveProperty('isDeleting')
    })

    it('should return functions for all mutations', async () => {
      vi.mocked(answerService.getAll).mockResolvedValue(mockAnswers)

      const { result } = renderHook(() => useAnswers(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(typeof result.current.createAnswer).toBe('function')
      expect(typeof result.current.updateAnswer).toBe('function')
      expect(typeof result.current.deleteAnswer).toBe('function')
    })
  })

  describe('Edge Cases', () => {
    it('should handle rapid successive mutations', async () => {
      vi.mocked(answerService.getAll).mockResolvedValue([])
      vi.mocked(answerService.create).mockResolvedValue(mockAnswer)

      const { result } = renderHook(() => useAnswers(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Fire multiple creates
      const promises = [
        result.current.createAnswer({ description: 'Answer 1', active: true, order: 1 }),
        result.current.createAnswer({ description: 'Answer 2', active: true, order: 2 }),
        result.current.createAnswer({ description: 'Answer 3', active: true, order: 3 }),
      ]

      await Promise.all(promises)

      expect(answerService.create).toHaveBeenCalledTimes(3)
    })

    it('should handle empty string in description', async () => {
      vi.mocked(answerService.getAll).mockResolvedValue([])
      vi.mocked(answerService.create).mockResolvedValue({
        ...mockAnswer,
        description: '',
      })

      const { result } = renderHook(() => useAnswers(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await result.current.createAnswer({ description: '', active: true, order: 1 })

      expect(answerService.create).toHaveBeenCalledWith({
        description: '',
        active: true,
        order: 1,
      })
    })

    it('should handle order value of 0', async () => {
      vi.mocked(answerService.getAll).mockResolvedValue([])
      vi.mocked(answerService.create).mockResolvedValue({
        ...mockAnswer,
        order: 0,
      })

      const { result } = renderHook(() => useAnswers(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await result.current.createAnswer({ description: 'Test', active: true, order: 0 })

      expect(answerService.create).toHaveBeenCalledWith({
        description: 'Test',
        active: true,
        order: 0,
      })
    })
  })
})