import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { questionService } from '../services/questionService'
import { CreateQuestionInput, UpdateQuestionInput } from '../types'

export function useQuestions() {
  const queryClient = useQueryClient()

  const { data: questions = [], isLoading, error } = useQuery({
    queryKey: ['questions'],
    queryFn: questionService.getAll,
  })

  const createMutation = useMutation({
    mutationFn: (input: CreateQuestionInput) => questionService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateQuestionInput }) =>
      questionService.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => questionService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] })
    },
  })

  const associateMutation = useMutation({
    mutationFn: ({ id, answerIds }: { id: string; answerIds: string[] }) =>
      questionService.associateAnswers(id, answerIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] })
    },
  })

  return {
    questions,
    isLoading,
    error,
    createQuestion: createMutation.mutateAsync,
    updateQuestion: updateMutation.mutateAsync,
    deleteQuestion: deleteMutation.mutateAsync,
    associateAnswers: associateMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  }
}
