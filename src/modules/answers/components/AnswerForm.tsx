import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Answer } from '../types'
import { answerFormSchema, AnswerFormData } from '../validators/answerSchema'
import { Button } from '@/shared/components/Button'
import { Input } from '@/shared/components/Input'

interface AnswerFormProps {
  answer?: Answer
  onSubmit: (data: AnswerFormData) => Promise<void>
  onCancel: () => void
}

export function AnswerForm({ answer, onSubmit, onCancel }: AnswerFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AnswerFormData>({
    resolver: zodResolver(answerFormSchema),
    defaultValues: {
      description: answer?.description || '',
      active: answer?.active ?? true,
      order: answer?.order ?? 0,
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
