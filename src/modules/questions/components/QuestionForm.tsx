import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CreateQuestionInput, Question, UpdateQuestionInput } from '../types'
import { Answer } from '../../answers/types'
import { questionFormSchema, QuestionFormData } from '../validators/questionSchema'
import { Button } from '@/shared/components/Button'
import { Input } from '@/shared/components/Input'

interface QuestionFormProps {
  question?: Question
  answers: Answer[]
  onSubmit: (data: CreateQuestionInput | UpdateQuestionInput) => Promise<void>
  onCancel: () => void
  existingQuestions?: Array<Pick<Question, 'id' | 'order'>>
}

export function QuestionForm({
  question,
  answers,
  onSubmit,
  onCancel,
  existingQuestions = [],
}: QuestionFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null)
  const isEditingInactiveQuestion = !!question && !question.active

  const schema = useMemo(
    () =>
      questionFormSchema.superRefine((data, ctx) => {
        const hasDuplicateOrder = existingQuestions.some(
          existing => existing.order === data.order && existing.id !== question?.id
        )

        if (hasDuplicateOrder) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['order'],
            message: 'Order already in use',
          })
        }

        const hasInactiveAnswers = data.answerIds.some(answerId => {
          const answer = answers.find(a => a.id === answerId)
          return answer && !answer.active
        })

        if (hasInactiveAnswers) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['answerIds'],
            message: 'Cannot associate inactive answers with a question',
          })
        }

        if (isEditingInactiveQuestion) {
          const selectedAnswerIds = [...data.answerIds].sort()
          const currentAnswerIds = [...(question?.answers?.map(answer => answer.id) || [])].sort()
          const answersWereChanged = JSON.stringify(selectedAnswerIds) !== JSON.stringify(currentAnswerIds)

          if (data.description !== question?.description) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['description'],
              message: 'Inactive questions can only be activated first',
            })
          }

          if (data.order !== question?.order) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['order'],
              message: 'Inactive questions can only be activated first',
            })
          }

          if (answersWereChanged) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['answerIds'],
              message: 'Inactive questions can only be activated first',
            })
          }
        }
      }),
    [existingQuestions, question, answers, isEditingInactiveQuestion]
  )

  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<QuestionFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      description: question?.description || '',
      active: question?.active ?? true,
      order: question?.order ?? 0,
      answerIds: question?.answers?.map(answer => answer.id) || [],
    },
  })

  const sortedAnswers = [...answers].sort((a, b) => a.order - b.order)
  const isActive = watch('active')

  const handleFormSubmit = async (data: QuestionFormData) => {
    setSubmitError(null)
    try {
      if (isEditingInactiveQuestion) {
        if (!data.active) {
          setError('active', {
            type: 'manual',
            message: 'Activate this question to continue',
          })
          return
        }

        await onSubmit({ active: true })
        return
      }

      await onSubmit(data)
    } catch (error) {
      const response = (error as { response?: { status?: number; data?: { message?: string } } })
        ?.response
      const message = response?.data?.message

      if (response?.status === 409) {
        setError('order', {
          type: 'server',
          message: message || 'Order already in use',
        })
        return
      }

      if (response?.status === 400) {
        if (message?.includes('Inactive questions can only be activated')) {
          setSubmitError(message)
        } else {
          setError('answerIds', {
            type: 'server',
            message: message || 'Cannot associate inactive answers with a question',
          })
        }
        return
      }

      setSubmitError(message || 'Failed to save question. Please try again.')
    }
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      {submitError && (
        <div
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {submitError}
        </div>
      )}

      {isEditingInactiveQuestion && (
        <div
          role="status"
          className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800"
        >
          This question is inactive. First activate and save it. You can edit description, order, and answers after activation.
        </div>
      )}

      <Input
        label="Description"
        {...register('description')}
        error={errors.description?.message}
        placeholder="Enter question description"
        disabled={isEditingInactiveQuestion}
        autoFocus
      />

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="active"
          {...register('active')}
          className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
        />
        <label htmlFor="active" className="text-sm font-medium text-gray-700">
          Active
        </label>
      </div>
      {errors.active && (
        <p className="text-sm text-red-600" role="alert">
          {errors.active.message}
        </p>
      )}

      <Input
        label="Order"
        type="number"
        {...register('order', { valueAsNumber: true })}
        error={errors.order?.message}
        disabled={isEditingInactiveQuestion}
        min="0"
      />

      <div className="space-y-2">
        <label className="label-field">Associated Answers</label>
        <div className="border border-gray-300 rounded-lg p-4 max-h-64 overflow-y-auto space-y-2">
          {sortedAnswers.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              No answers available yet.
            </p>
          ) : (
            sortedAnswers.map(answer => (
              <div key={answer.id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  disabled={isEditingInactiveQuestion || !answer.active}
                  id={`answer-${answer.id}`}
                  value={answer.id}
                  {...register('answerIds')}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <label
                  htmlFor={`answer-${answer.id}`}
                  className={`text-sm flex-1 ${
                    !answer.active ? 'text-gray-500 cursor-not-allowed' : 'text-gray-700 cursor-pointer'
                  }`}
                >
                  {answer.description}
                  {!answer.active && (
                    <span className="ml-2 text-xs text-red-600">(Inactive)</span>
                  )}
                </label>
              </div>
            ))
          )}
        </div>
        {errors.answerIds && (
          <p className="text-sm text-red-600" role="alert">
            {errors.answerIds.message}
          </p>
        )}
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" isLoading={isSubmitting}>
          {isEditingInactiveQuestion ? (isActive ? 'Activate' : 'Activate to Continue') : question ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  )
}
