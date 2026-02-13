import { Question } from '../types'
import { Answer } from '../../answers/types'
import { Button } from '@/shared/components/Button'
import { Card } from '@/shared/components/Card'

interface QuestionListProps {
  questions: Question[]
  answers: Answer[]
  onEdit: (question: Question) => void
  onDelete: (id: string) => void
  isDeleting: boolean
}

export function QuestionList({ questions, answers, onEdit, onDelete, isDeleting }: QuestionListProps) {
  const sortedQuestions = [...questions].sort((a, b) => a.order - b.order)

  const getAnswerById = (id: string) => answers.find(a => a.id === id)

  if (questions.length === 0) {
    return (
      <Card>
        <p className="text-center text-gray-500 py-8">
          No questions found. Create your first question to get started.
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {sortedQuestions.map(question => (
        <Card key={question.id} className="hover:shadow-xl transition-shadow duration-200">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-500">#{question.order}</span>
                  <h3 className="text-lg font-medium text-gray-800">{question.description}</h3>
                  {!question.active && (
                    <span className="px-2 py-1 text-xs font-medium text-red-600 bg-red-100 rounded-full">
                      Inactive
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="secondary" onClick={() => onEdit(question)} disabled={isDeleting}>
                  Edit
                </Button>
                <Button
                  variant="danger"
                  onClick={() => onDelete(question.id)}
                  disabled={isDeleting}
                  isLoading={isDeleting}
                >
                  Delete
                </Button>
              </div>
            </div>

            {question.answerIds.length > 0 && (
              <div className="border-t border-gray-200 pt-3">
                <p className="text-sm font-medium text-gray-600 mb-2">
                  Associated Answers ({question.answerIds.length}):
                </p>
                <div className="flex flex-wrap gap-2">
                  {question.answerIds.map(answerId => {
                    const answer = getAnswerById(answerId)
                    return (
                      <span
                        key={answerId}
                        className="px-3 py-1 text-sm bg-primary-100 text-primary-700 rounded-full"
                      >
                        {answer?.description || 'Unknown'}
                      </span>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  )
}
