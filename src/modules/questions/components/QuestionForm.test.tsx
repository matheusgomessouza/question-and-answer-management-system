import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QuestionForm } from './QuestionForm'
import { Answer } from '../../answers/types'
import { Question } from '../types'
import { QuestionFormData } from '../validators/questionSchema'

describe('QuestionForm', () => {
  const mockAnswers: Answer[] = [
    { id: '1', description: 'Answer 1', order: 1, active: true },
    { id: '2', description: 'Answer 2', order: 2, active: false },
  ]

  const mockQuestion: Question = {
    id: 'q1',
    description: 'Test Question',
    active: true,
    order: 1,
    answers: [mockAnswers[0]],
  }

  const mockOnSubmit = vi.fn()
  const mockOnCancel = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders empty state when no answers exist', () => {
    render(<QuestionForm answers={[]} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)

    expect(screen.getByText('Nao existem respostas cadastradas ainda.')).toBeInTheDocument()
  })

  it('preselects answers when editing a question', () => {
    render(
      <QuestionForm
        question={mockQuestion}
        answers={mockAnswers}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )

    const answer1Checkbox = screen.getByLabelText(/Answer 1/) as HTMLInputElement
    const answer2Checkbox = screen.getByLabelText(/Answer 2/) as HTMLInputElement

    expect(answer1Checkbox.checked).toBe(true)
    expect(answer2Checkbox.checked).toBe(false)
  })

  it('submits selected answer ids', async () => {
    const user = userEvent.setup()
    mockOnSubmit.mockResolvedValue(undefined)

    render(<QuestionForm answers={mockAnswers} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)

    const descriptionInput = screen.getByPlaceholderText('Enter question description')
    const answer1Checkbox = screen.getByLabelText(/Answer 1/)
    const submitButton = screen.getByRole('button', { name: /create/i })

    await user.type(descriptionInput, 'New Question')
    await user.click(answer1Checkbox)
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledTimes(1)
    })

    const [[submittedData]] = mockOnSubmit.mock.calls as [[QuestionFormData]]
    expect(submittedData.answerIds).toEqual(['1'])
  })
})
