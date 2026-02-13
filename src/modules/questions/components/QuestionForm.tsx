import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Question } from '../types'
import { Answer } from '../../answers/types'
import { questionFormSchema, QuestionFormData } from '../validators/questionSchema'
import { Button } from '@/shared/components/Button'
import { Input } from '@/shared/components/Input'

interface QuestionFormProps {
  question?: Question
  answers: Answer[]
  onSubmit: (data: QuestionFormData) => Promise<void>
  onCancel: () => void
}

export function QuestionForm({ question, answers, onSubmit, onCancel }: QuestionFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<QuestionFormData>({
    resolver: zodResolver(questionFormSchema),
    defaultValues: {
      description: question?.description || '',
      active: question?.active ?? true,
      order: question?.order ?? 0,
      answerIds: question?.answerIds || [],
    },
  })

  const sortedAnswers = [...answers].sort((a, b) => a.order - b.order)

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Description"
        {...register('description')}
        error={errors.description?.message}
        placeholder="Enter question description"
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

      <div className="space-y-2">
        <label className="label-field">Associated Answers</label>
        <div className="border border-gray-300 rounded-lg p-4 max-h-64 overflow-y-auto space-y-2">
          {sortedAnswers.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              No answers available. Create answers first.
            </p>
          ) : (
            sortedAnswers.map(answer => (
              <div key={answer.id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={`answer-${answer.id}`}
                  value={answer.id}
                  {...register('answerIds')}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <label
                  htmlFor={`answer-${answer.id}`}
                  className="text-sm text-gray-700 cursor-pointer flex-1"
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
          {question ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  )
}
