import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QuestionList } from './QuestionList'
import { Question } from '../types'
import { Answer } from '../../answers/types'

interface QuestionListProps {
  questions: Question[]
  answers: Answer[]
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
    { id: 'a3', description: 'Maintained by Meta', active: false, order: 3 },
  ]

  const mockQuestion: Question = {
    id: 'q1',
    description: 'What is React?',
    order: 1,
    active: true,
    answerIds: ['a1', 'a2'],
  }

  const mockQuestionInactive: Question = {
    id: 'q2',
    description: 'What is Vue?',
    order: 2,
    active: false,
    answerIds: [],
  }

  const mockQuestionWithManyAnswers: Question = {
    id: 'q3',
    description: 'JavaScript frameworks?',
    order: 3,
    active: true,
    answerIds: ['a1', 'a2', 'a3'],
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render empty state when no questions', () => {
      render(
        <QuestionList
          questions={[]}
          answers={[]}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          isDeleting={false}
        />
      )

      expect(screen.getByText(/No questions found/i)).toBeInTheDocument()
      expect(screen.getByText(/Create your first question to get started/i)).toBeInTheDocument()
    })

    it('should render single question with all details', () => {
      render(
        <QuestionList
          questions={[mockQuestion]}
          answers={mockAnswers}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          isDeleting={false}
        />
      )

      expect(screen.getByRole('heading', { level: 3, name: 'What is React?' })).toBeInTheDocument()
      expect(screen.getByText('#1')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Edit/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Delete/i })).toBeInTheDocument()
    })

    it('should render multiple questions', () => {
      render(
        <QuestionList
          questions={[mockQuestion, mockQuestionInactive, mockQuestionWithManyAnswers]}
          answers={mockAnswers}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          isDeleting={false}
        />
      )

      expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(3)
      expect(screen.getByText('What is React?')).toBeInTheDocument()
      expect(screen.getByText('What is Vue?')).toBeInTheDocument()
      expect(screen.getByText('JavaScript frameworks?')).toBeInTheDocument()
    })

    it('should display question order number for each question', () => {
      render(
        <QuestionList
          questions={[mockQuestion, mockQuestionInactive]}
          answers={[]}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          isDeleting={false}
        />
      )

      expect(screen.getByText('#1')).toBeInTheDocument()
      expect(screen.getByText('#2')).toBeInTheDocument()
    })

    it('should show hover effect classes on cards', () => {
      const { container } = render(
        <QuestionList
          questions={[mockQuestion]}
          answers={[]}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          isDeleting={false}
        />
      )

      const card = container.querySelector('.hover\\:shadow-xl')
      expect(card).toBeInTheDocument()
    })
  })

  describe('Sorting', () => {
    it('should display questions sorted by order ascending', () => {
      const unorderedQuestions: Question[] = [
        { ...mockQuestion, id: 'q3', description: 'Third', order: 3 },
        { ...mockQuestion, id: 'q1', description: 'First', order: 1 },
        { ...mockQuestion, id: 'q2', description: 'Second', order: 2 },
      ]

      render(
        <QuestionList
          questions={unorderedQuestions}
          answers={[]}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          isDeleting={false}
        />
      )

      const headings = screen.getAllByRole('heading', { level: 3 })
      expect(headings[0]).toHaveTextContent('First')
      expect(headings[1]).toHaveTextContent('Second')
      expect(headings[2]).toHaveTextContent('Third')
    })

    it('should not mutate the original questions array', () => {
      const unorderedQuestions: Question[] = [
        { ...mockQuestion, id: 'q3', order: 3 },
        { ...mockQuestion, id: 'q1', order: 1 },
        { ...mockQuestion, id: 'q2', order: 2 },
      ]
      const originalOrder = [...unorderedQuestions]

      render(
        <QuestionList
          questions={unorderedQuestions}
          answers={[]}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          isDeleting={false}
        />
      )

      expect(unorderedQuestions).toEqual(originalOrder)
    })
  })

  describe('Status badges', () => {
    it('should show Inactive badge for inactive questions', () => {
      render(
        <QuestionList
          questions={[mockQuestionInactive]}
          answers={[]}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          isDeleting={false}
        />
      )

      const badge = screen.getByText('Inactive')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('text-red-600', 'bg-red-100')
    })

    it('should not show Inactive badge for active questions', () => {
      render(
        <QuestionList
          questions={[mockQuestion]}
          answers={[]}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          isDeleting={false}
        />
      )

      expect(screen.queryByText('Inactive')).not.toBeInTheDocument()
    })

    it('should correctly display badges for mixed active/inactive questions', () => {
      render(
        <QuestionList
          questions={[mockQuestion, mockQuestionInactive]}
          answers={[]}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          isDeleting={false}
        />
      )

      const badges = screen.getAllByText('Inactive')
      expect(badges).toHaveLength(1)
    })
  })

  describe('User interactions', () => {
    it('should call onEdit with correct question when Edit button is clicked', async () => {
      const user = userEvent.setup()
      render(
        <QuestionList
          questions={[mockQuestion]}
          answers={[]}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          isDeleting={false}
        />
      )

      await user.click(screen.getByRole('button', { name: /Edit/i }))

      expect(mockOnEdit).toHaveBeenCalledTimes(1)
      expect(mockOnEdit).toHaveBeenCalledWith(mockQuestion)
    })

    it('should call onDelete with correct question ID when Delete button is clicked', async () => {
      const user = userEvent.setup()
      render(
        <QuestionList
          questions={[mockQuestion]}
          answers={[]}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          isDeleting={false}
        />
      )

      await user.click(screen.getByRole('button', { name: /Delete/i }))

      expect(mockOnDelete).toHaveBeenCalledTimes(1)
      expect(mockOnDelete).toHaveBeenCalledWith('q1')
    })

    it('should call onEdit with correct question when multiple questions present', async () => {
      const user = userEvent.setup()
      render(
        <QuestionList
          questions={[mockQuestion, mockQuestionInactive]}
          answers={[]}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          isDeleting={false}
        />
      )

      const editButtons = screen.getAllByRole('button', { name: /Edit/i })
      await user.click(editButtons[1])

      expect(mockOnEdit).toHaveBeenCalledWith(mockQuestionInactive)
    })

    it('should call onDelete with correct ID when multiple questions present', async () => {
      const user = userEvent.setup()
      render(
        <QuestionList
          questions={[mockQuestion, mockQuestionInactive]}
          answers={[]}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          isDeleting={false}
        />
      )

      const deleteButtons = screen.getAllByRole('button', { name: /Delete/i })
      await user.click(deleteButtons[0])

      expect(mockOnDelete).toHaveBeenCalledWith('q1')
    })
  })

  describe('Delete state', () => {
    it('should disable Edit button when isDeleting is true', () => {
      render(
        <QuestionList
          questions={[mockQuestion]}
          answers={[]}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          isDeleting={true}
        />
      )

      expect(screen.getByRole('button', { name: /Edit/i })).toBeDisabled()
    })

    it('should disable Delete button when isDeleting is true', () => {
      render(
        <QuestionList
          questions={[mockQuestion]}
          answers={[]}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          isDeleting={true}
        />
      )

      expect(screen.getByRole('button', { name: /Loading/i })).toBeDisabled()
    })

    it('should show loading state on Delete button when isDeleting is true', () => {
      render(
        <QuestionList
          questions={[mockQuestion]}
          answers={[]}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          isDeleting={true}
        />
      )

      expect(screen.getByRole('button', { name: /Loading/i })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /^Delete$/i })).not.toBeInTheDocument()
    })

    it('should disable all buttons for all questions when isDeleting is true', () => {
      render(
        <QuestionList
          questions={[mockQuestion, mockQuestionInactive]}
          answers={[]}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          isDeleting={true}
        />
      )

      const editButtons = screen.getAllByRole('button', { name: /Edit/i })
      const loadingButtons = screen.getAllByRole('button', { name: /Loading/i })

      editButtons.forEach(button => expect(button).toBeDisabled())
      loadingButtons.forEach(button => expect(button).toBeDisabled())
    })

    it('should enable buttons when isDeleting is false', () => {
      render(
        <QuestionList
          questions={[mockQuestion]}
          answers={[]}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          isDeleting={false}
        />
      )

      expect(screen.getByRole('button', { name: /Edit/i })).not.toBeDisabled()
      expect(screen.getByRole('button', { name: /Delete/i })).not.toBeDisabled()
    })
  })

  describe('Associated answers', () => {
    it('should display associated answers with correct descriptions', () => {
      render(
        <QuestionList
          questions={[mockQuestion]}
          answers={mockAnswers}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          isDeleting={false}
        />
      )

      expect(screen.getByText('Associated Answers (2):')).toBeInTheDocument()
      expect(screen.getByText('A JavaScript library')).toBeInTheDocument()
      expect(screen.getByText('For building user interfaces')).toBeInTheDocument()
    })

    it('should display correct answer count in Associated Answers label', () => {
      render(
        <QuestionList
          questions={[mockQuestionWithManyAnswers]}
          answers={mockAnswers}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          isDeleting={false}
        />
      )

      expect(screen.getByText('Associated Answers (3):')).toBeInTheDocument()
    })

    it('should display "Unknown" for missing answers', () => {
      const questionWithMissingAnswer: Question = {
        ...mockQuestion,
        answerIds: ['a1', 'nonexistent-id'],
      }

      render(
        <QuestionList
          questions={[questionWithMissingAnswer]}
          answers={mockAnswers}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          isDeleting={false}
        />
      )

      expect(screen.getByText('Unknown')).toBeInTheDocument()
      expect(screen.getByText('A JavaScript library')).toBeInTheDocument()
    })

    it('should not display answers section when answerIds is empty', () => {
      render(
        <QuestionList
          questions={[mockQuestionInactive]}
          answers={mockAnswers}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          isDeleting={false}
        />
      )

      expect(screen.queryByText(/Associated Answers/i)).not.toBeInTheDocument()
    })

    it('should display all answers when question has many associated answers', () => {
      render(
        <QuestionList
          questions={[mockQuestionWithManyAnswers]}
          answers={mockAnswers}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          isDeleting={false}
        />
      )

      expect(screen.getByText('A JavaScript library')).toBeInTheDocument()
      expect(screen.getByText('For building user interfaces')).toBeInTheDocument()
      expect(screen.getByText('Maintained by Meta')).toBeInTheDocument()
    })

    it('should handle question with all answers missing', () => {
      const questionWithAllMissingAnswers: Question = {
        ...mockQuestion,
        answerIds: ['missing1', 'missing2', 'missing3'],
      }

      render(
        <QuestionList
          questions={[questionWithAllMissingAnswers]}
          answers={mockAnswers}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          isDeleting={false}
        />
      )

      const unknownElements = screen.getAllByText('Unknown')
      expect(unknownElements).toHaveLength(3)
    })

    it('should display answers in correct order from answerIds array', () => {
      const questionWithReorderedAnswers: Question = {
        ...mockQuestion,
        answerIds: ['a2', 'a1'], // Reversed order
      }

      render(
        <QuestionList
          questions={[questionWithReorderedAnswers]}
          answers={mockAnswers}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          isDeleting={false}
        />
      )

      const answerSpans = screen.getAllByText(/^(A JavaScript library|For building user interfaces)$/)
      expect(answerSpans[0]).toHaveTextContent('For building user interfaces')
      expect(answerSpans[1]).toHaveTextContent('A JavaScript library')
    })
  })

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(
        <QuestionList
          questions={[mockQuestion, mockQuestionInactive]}
          answers={[]}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          isDeleting={false}
        />
      )

      const headings = screen.getAllByRole('heading', { level: 3 })
      expect(headings).toHaveLength(2)
    })

    it('should have accessible button labels', () => {
      render(
        <QuestionList
          questions={[mockQuestion]}
          answers={[]}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          isDeleting={false}
        />
      )

      expect(screen.getByRole('button', { name: /Edit/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Delete/i })).toBeInTheDocument()
    })

    it('should have proper card structure for each question', () => {
      const { container } = render(
        <QuestionList
          questions={[mockQuestion, mockQuestionInactive]}
          answers={[]}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          isDeleting={false}
        />
      )

      // Card component should be rendered for each question
      const cards = container.querySelectorAll('.space-y-3 > div')
      expect(cards.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('Edge cases', () => {
    it('should handle question with order value of 0', () => {
      const questionWithZeroOrder: Question = {
        ...mockQuestion,
        order: 0,
      }

      render(
        <QuestionList
          questions={[questionWithZeroOrder]}
          answers={[]}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          isDeleting={false}
        />
      )

      expect(screen.getByText('#0')).toBeInTheDocument()
    })

    it('should handle question with negative order value', () => {
      const questionWithNegativeOrder: Question = {
        ...mockQuestion,
        order: -1,
      }

      render(
        <QuestionList
          questions={[questionWithNegativeOrder]}
          answers={[]}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          isDeleting={false}
        />
      )

      expect(screen.getByText('#-1')).toBeInTheDocument()
    })

    it('should handle questions with same order numbers', () => {
      const questions: Question[] = [
        { ...mockQuestion, id: 'q1', description: 'First', order: 1 },
        { ...mockQuestion, id: 'q2', description: 'Second', order: 1 },
        { ...mockQuestion, id: 'q3', description: 'Third', order: 1 },
      ]

      render(
        <QuestionList
          questions={questions}
          answers={[]}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          isDeleting={false}
        />
      )

      const headings = screen.getAllByRole('heading', { level: 3 })
      expect(headings).toHaveLength(3)
      expect(screen.getAllByText('#1')).toHaveLength(3)
    })

    it('should handle very long question descriptions gracefully', () => {
      const questionWithLongDescription: Question = {
        ...mockQuestion,
        description: 'A'.repeat(500),
      }

      render(
        <QuestionList
          questions={[questionWithLongDescription]}
          answers={[]}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          isDeleting={false}
        />
      )

      expect(screen.getByText('A'.repeat(500))).toBeInTheDocument()
    })

    it('should handle empty answers array when question has answerIds', () => {
      render(
        <QuestionList
          questions={[mockQuestion]}
          answers={[]}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          isDeleting={false}
        />
      )

      // Should show Unknown for all answerIds since answers array is empty
      const unknownElements = screen.getAllByText('Unknown')
      expect(unknownElements).toHaveLength(2)
    })
  })
})