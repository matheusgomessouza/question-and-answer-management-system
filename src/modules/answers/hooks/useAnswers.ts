import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { answerService } from '../services/answerService'
import { CreateAnswerInput, UpdateAnswerInput } from '../types'

export function useAnswers() {
  const queryClient = useQueryClient()

  const { data: answers = [], isLoading, error } = useQuery({
    queryKey: ['answers'],
    queryFn: answerService.getAll,
  })

  const createMutation = useMutation({
    mutationFn: (input: CreateAnswerInput) => answerService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['answers'] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateAnswerInput }) =>
      answerService.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['answers'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => answerService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['answers'] })
      queryClient.invalidateQueries({ queryKey: ['questions'] })
    },
  })

  return {
    answers,
    isLoading,
    error,
    createAnswer: createMutation.mutateAsync,
    updateAnswer: updateMutation.mutateAsync,
    deleteAnswer: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  }
}
