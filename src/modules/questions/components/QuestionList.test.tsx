import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QuestionList } from './QuestionList'
import { Question } from '../types'
import { Answer } from '../../answers/types'

interface QuestionListProps {
  questions: Question[]
  onEdit: (question: Question) => void
  onDelete: (id: string) => void
  isDeleting: boolean
}

describe('QuestionList', () => {
  const mockOnEdit = vi.fn<QuestionListProps['onEdit']>()
  const mockOnDelete = vi.fn<QuestionListProps['onDelete']>()

  const mockAnswers: Answer[] = [
    { id: 'a1', description: 'A JavaScript library', active: true, order: 1 },
    { id: 'a2', description: 'For building user interfaces', active: true, order: 2 },
  ]

  const mockQuestion: Question = {
    id: 'q1',
    description: 'What is React?',
    order: 1,
    active: true,
    answers: mockAnswers,
  }

  const mockQuestionInactive: Question = {
    id: 'q2',
    description: 'What is Vue?',
    order: 2,
    active: false,
    answers: [],
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders empty state when no questions', () => {
    render(
      <QuestionList
        questions={[]}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        isDeleting={false}
      />
    )

    expect(screen.getByText(/No questions found/i)).toBeInTheDocument()
  })

  it('renders associated answers', () => {
    render(
      <QuestionList
        questions={[mockQuestion]}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        isDeleting={false}
      />
    )

    expect(screen.getByText('Associated Answers (2):')).toBeInTheDocument()
    expect(screen.getByText('A JavaScript library')).toBeInTheDocument()
    expect(screen.getByText('For building user interfaces')).toBeInTheDocument()
  })

  it('hides associated answers when none exist', () => {
    render(
      <QuestionList
        questions={[mockQuestionInactive]}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        isDeleting={false}
      />
    )

    expect(screen.queryByText(/Associated Answers/i)).not.toBeInTheDocument()
  })

  it('calls edit and delete handlers', async () => {
    const user = userEvent.setup()
    render(
      <QuestionList
        questions={[mockQuestion]}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        isDeleting={false}
      />
    )

    await user.click(screen.getByRole('button', { name: /Edit/i }))
    await user.click(screen.getByRole('button', { name: /Delete/i }))

    expect(mockOnEdit).toHaveBeenCalledWith(mockQuestion)
    expect(mockOnDelete).toHaveBeenCalledWith('q1')
  })
})
