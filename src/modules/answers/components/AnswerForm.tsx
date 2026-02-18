import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Answer } from '../types'
import { answerFormSchema, AnswerFormData } from '../validators/answerSchema'
import { Button } from '@/shared/components/Button'
import { Input } from '@/shared/components/Input'

interface AnswerFormProps {
  answer?: Answer
  onSubmit: (data: AnswerFormData) => Promise<void>
  onCancel: () => void
  existingAnswers?: Array<Pick<Answer, 'id' | 'order'>>
}

export function AnswerForm({ answer, onSubmit, onCancel, existingAnswers = [] }: AnswerFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const schema = useMemo(
    () =>
      answerFormSchema.superRefine((data, ctx) => {
        const hasDuplicateOrder = existingAnswers.some(
          existing => existing.order === data.order && existing.id !== answer?.id
        )

        if (hasDuplicateOrder) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['order'],
            message: 'Order already in use',
          })
        }
      }),
    [existingAnswers, answer?.id]
  )

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<AnswerFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      description: answer?.description || '',
      active: answer?.active ?? true,
      order: answer?.order ?? 0,
    },
  })

  const handleFormSubmit = async (data: AnswerFormData) => {
    setSubmitError(null)
    setSuccessMessage(null)
    try {
      await onSubmit(data)
      if (answer?.active === true && data.active === false) {
        setSuccessMessage('Answer deactivated. Associated questions have been updated.')
      }
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

      setSubmitError(message || 'Failed to save answer. Please try again.')
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
      {successMessage && (
        <div
          role="status"
          className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700"
        >
          {successMessage}
        </div>
      )}
      <Input
        label="Description"
        {...register('description')}
        error={errors.description?.message}
        placeholder="Enter answer description"
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

      <Input
        label="Order"
        type="number"
        {...register('order', { valueAsNumber: true })}
        error={errors.order?.message}
        min="0"
      />

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" isLoading={isSubmitting}>
          {answer ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  )
}
