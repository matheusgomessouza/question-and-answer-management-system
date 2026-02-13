import { Answer } from '../types'
import { Button } from '@/shared/components/Button'
import { Card } from '@/shared/components/Card'

interface AnswerListProps {
  answers: Answer[]
  onEdit: (answer: Answer) => void
  onDelete: (id: string) => void
  isDeleting: boolean
}

export function AnswerList({ answers, onEdit, onDelete, isDeleting }: AnswerListProps) {
  const sortedAnswers = [...answers].sort((a, b) => a.order - b.order)

  if (answers.length === 0) {
    return (
      <Card>
        <p className="text-center text-gray-500 py-8">
          No answers found. Create your first answer to get started.
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {sortedAnswers.map(answer => (
        <Card key={answer.id} className="hover:shadow-xl transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-500">#{answer.order}</span>
                <h3 className="text-lg font-medium text-gray-800">{answer.description}</h3>
                {!answer.active && (
                  <span className="px-2 py-1 text-xs font-medium text-red-600 bg-red-100 rounded-full">
                    Inactive
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="secondary" onClick={() => onEdit(answer)} disabled={isDeleting}>
                Edit
              </Button>
              <Button
                variant="danger"
                onClick={() => onDelete(answer.id)}
                disabled={isDeleting}
                isLoading={isDeleting}
              >
                Delete
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
