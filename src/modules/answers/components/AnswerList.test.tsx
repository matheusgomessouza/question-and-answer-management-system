import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AnswerList } from './AnswerList'
import { Answer } from '../types'

describe('AnswerList', () => {
  const mockAnswers: Answer[] = [
    { id: '1', order: 1, description: 'First answer', active: true },
    { id: '2', order: 2, description: 'Second answer', active: false },
    { id: '3', order: 3, description: 'Third answer', active: true },
  ]

  const mockOnEdit = vi.fn()
  const mockOnDelete = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render empty state when no answers are provided', () => {
      render(
        <AnswerList
          answers={[]}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          isDeleting={false}
        />
      )

      expect(screen.getByText(/No answers found/i)).toBeInTheDocument()
      expect(screen.getByText(/Create your first answer to get started/i)).toBeInTheDocument()
    })

    it('should render all answers provided', () => {
      render(
        <AnswerList
          answers={mockAnswers}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          isDeleting={false}
        />
      )

      expect(screen.getByText('First answer')).toBeInTheDocument()
      expect(screen.getByText('Second answer')).toBeInTheDocument()
      expect(screen.getByText('Third answer')).toBeInTheDocument()
    })

    it('should render answers with their order numbers', () => {
      render(
        <AnswerList
          answers={mockAnswers}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          isDeleting={false}
        />
      )

      expect(screen.getByText('#1')).toBeInTheDocument()
      expect(screen.getByText('#2')).toBeInTheDocument()
      expect(screen.getByText('#3')).toBeInTheDocument()
    })

    it('should render Edit and Delete buttons for each answer', () => {
      render(
        <AnswerList
          answers={mockAnswers}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          isDeleting={false}
        />
      )

      const editButtons = screen.getAllByRole('button', { name: /Edit/i })
      const deleteButtons = screen.getAllByRole('button', { name: /Delete/i })

      expect(editButtons).toHaveLength(3)
      expect(deleteButtons).toHaveLength(3)
    })
  })

  describe('Sorting', () => {
    it('should render answers sorted by order ascending', () => {
      const unorderedAnswers: Answer[] = [
        { id: '3', order: 3, description: 'Third', active: true },
        { id: '1', order: 1, description: 'First', active: true },
        { id: '2', order: 2, description: 'Second', active: true },
      ]

      render(
        <AnswerList
          answers={unorderedAnswers}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          isDeleting={false}
        />
      )

      const descriptions = screen.getAllByText(/First|Second|Third/).map(el => el.textContent)
      expect(descriptions).toEqual(['First', 'Second', 'Third'])
    })

    it('should not mutate the original answers array', () => {
      const originalAnswers = [...mockAnswers]

      render(
        <AnswerList
          answers={mockAnswers}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          isDeleting={false}
        />
      )

      expect(mockAnswers).toEqual(originalAnswers)
    })
  })

  describe('Status badges', () => {
    it('should show Inactive badge for inactive answers', () => {
      render(
        <AnswerList
          answers={mockAnswers}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          isDeleting={false}
        />
      )

      const inactiveBadges = screen.getAllByText('Inactive')
      expect(inactiveBadges).toHaveLength(1)
    })

    it('should not show Inactive badge for active answers', () => {
      const activeAnswers: Answer[] = [
        { id: '1', order: 1, description: 'Active answer', active: true },
      ]

      render(
        <AnswerList
          answers={activeAnswers}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          isDeleting={false}
        />
      )

      expect(screen.queryByText('Inactive')).not.toBeInTheDocument()
    })

    it('should display Inactive badge with correct styling', () => {
      render(
        <AnswerList
          answers={mockAnswers}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          isDeleting={false}
        />
      )

      const badge = screen.getByText('Inactive')
      expect(badge).toHaveClass('text-red-600', 'bg-red-100')
    })
  })

  describe('User interactions', () => {
    it('should call onEdit with correct answer when Edit button is clicked', async () => {
      const user = userEvent.setup()
      render(
        <AnswerList
          answers={mockAnswers}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          isDeleting={false}
        />
      )

      const editButtons = screen.getAllByRole('button', { name: /Edit/i })
      await user.click(editButtons[0])

      expect(mockOnEdit).toHaveBeenCalledTimes(1)
      expect(mockOnEdit).toHaveBeenCalledWith(mockAnswers[0])
    })

    it('should call onEdit for different answers when their Edit buttons are clicked', async () => {
      const user = userEvent.setup()
      render(
        <AnswerList
          answers={mockAnswers}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          isDeleting={false}
        />
      )

      const editButtons = screen.getAllByRole('button', { name: /Edit/i })
      
      await user.click(editButtons[1])
      expect(mockOnEdit).toHaveBeenCalledWith(mockAnswers[1])

      await user.click(editButtons[2])
      expect(mockOnEdit).toHaveBeenCalledWith(mockAnswers[2])
    })

    it('should call onDelete with correct answer id when Delete button is clicked', async () => {
      const user = userEvent.setup()
      render(
        <AnswerList
          answers={mockAnswers}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          isDeleting={false}
        />
      )

      const deleteButtons = screen.getAllByRole('button', { name: /Delete/i })
      await user.click(deleteButtons[0])

      expect(mockOnDelete).toHaveBeenCalledTimes(1)
      expect(mockOnDelete).toHaveBeenCalledWith('1')
    })

    it('should not call handlers when buttons are disabled', async () => {
      const user = userEvent.setup()
      render(
        <AnswerList
          answers={mockAnswers}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          isDeleting={true}
        />
      )

      const editButtons = screen.getAllByRole('button', { name: /Edit/i })
      // When isDeleting is true, delete buttons show "Loading..." instead of "Delete"
      const deleteButtons = screen.getAllByRole('button', { name: /Loading/i })

      await user.click(editButtons[0])
      await user.click(deleteButtons[0])

      expect(mockOnEdit).not.toHaveBeenCalled()
      expect(mockOnDelete).not.toHaveBeenCalled()
    })
  })

  describe('Delete state', () => {
    it('should disable all Edit buttons when isDeleting is true', () => {
      render(
        <AnswerList
          answers={mockAnswers}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          isDeleting={true}
        />
      )

      const editButtons = screen.getAllByRole('button', { name: /Edit/i })
      editButtons.forEach(btn => expect(btn).toBeDisabled())
    })

    it('should disable all Delete buttons when isDeleting is true', () => {
      render(
        <AnswerList
          answers={mockAnswers}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          isDeleting={true}
        />
      )

      // When isDeleting is true, delete buttons show "Loading..." instead of "Delete"
      const deleteButtons = screen.getAllByRole('button', { name: /Loading/i })
      deleteButtons.forEach(btn => expect(btn).toBeDisabled())
    })

    it('should show loading state on all Delete buttons when isDeleting is true', () => {
      render(
        <AnswerList
          answers={mockAnswers}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          isDeleting={true}
        />
      )

      // When isDeleting is true, delete buttons show "Loading..." instead of "Delete"
      const deleteButtons = screen.getAllByRole('button', { name: /Loading/i })
      deleteButtons.forEach(btn => {
        expect(btn).toHaveAttribute('aria-busy', 'true')
      })
    })

    it('should not show loading state on Delete buttons when isDeleting is false', () => {
      render(
        <AnswerList
          answers={mockAnswers}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          isDeleting={false}
        />
      )

      const deleteButtons = screen.getAllByRole('button', { name: /Delete/i })
      deleteButtons.forEach(btn => {
        expect(btn).toHaveAttribute('aria-busy', 'false')
      })
    })

    it('should enable all buttons when isDeleting is false', () => {
      render(
        <AnswerList
          answers={mockAnswers}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          isDeleting={false}
        />
      )

      const editButtons = screen.getAllByRole('button', { name: /Edit/i })
      const deleteButtons = screen.getAllByRole('button', { name: /Delete/i })

      editButtons.forEach(btn => expect(btn).not.toBeDisabled())
      deleteButtons.forEach(btn => expect(btn).not.toBeDisabled())
    })
  })

  describe('Accessibility', () => {
    it('should render buttons with proper roles', () => {
      render(
        <AnswerList
          answers={mockAnswers}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          isDeleting={false}
        />
      )

      const editButtons = screen.getAllByRole('button', { name: /Edit/i })
      const deleteButtons = screen.getAllByRole('button', { name: /Delete/i })

      expect(editButtons).toHaveLength(3)
      expect(deleteButtons).toHaveLength(3)
    })

    it('should have proper aria-busy attribute on delete buttons', () => {
      const { rerender } = render(
        <AnswerList
          answers={mockAnswers}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          isDeleting={false}
        />
      )

      const deleteButtons = screen.getAllByRole('button', { name: /Delete/i })
      deleteButtons.forEach(btn => {
        expect(btn).toHaveAttribute('aria-busy', 'false')
      })

      rerender(
        <AnswerList
          answers={mockAnswers}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          isDeleting={true}
        />
      )

      // When isDeleting is true, delete buttons show "Loading..." instead of "Delete"
      const deletingButtons = screen.getAllByRole('button', { name: /Loading/i })
      deletingButtons.forEach(btn => {
        expect(btn).toHaveAttribute('aria-busy', 'true')
      })
    })
  })

  describe('Edge cases', () => {
    it('should handle single answer correctly', () => {
      const singleAnswer: Answer[] = [
        { id: '1', order: 1, description: 'Only answer', active: true },
      ]

      render(
        <AnswerList
          answers={singleAnswer}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          isDeleting={false}
        />
      )

      expect(screen.getByText('Only answer')).toBeInTheDocument()
      expect(screen.getAllByRole('button', { name: /Edit/i })).toHaveLength(1)
      expect(screen.getAllByRole('button', { name: /Delete/i })).toHaveLength(1)
    })

    it('should handle answers with same order numbers', () => {
      const sameOrderAnswers: Answer[] = [
        { id: '1', order: 1, description: 'First', active: true },
        { id: '2', order: 1, description: 'Second', active: true },
      ]

      render(
        <AnswerList
          answers={sameOrderAnswers}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          isDeleting={false}
        />
      )

      expect(screen.getByText('First')).toBeInTheDocument()
      expect(screen.getByText('Second')).toBeInTheDocument()
    })

    it('should handle long descriptions gracefully', () => {
      const longDescriptionAnswer: Answer[] = [
        { 
          id: '1', 
          order: 1, 
          description: 'This is a very long description that tests how the component handles lengthy text content and whether it displays properly without breaking the layout',
          active: true 
        },
      ]

      render(
        <AnswerList
          answers={longDescriptionAnswer}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          isDeleting={false}
        />
      )

      expect(screen.getByText(/This is a very long description/)).toBeInTheDocument()
    })
  })
})