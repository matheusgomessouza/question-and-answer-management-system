export type UUID = string

export interface Answer {
  id: UUID
  description: string
  active: boolean
  order: number
}

export interface Question {
  id: UUID
  description: string
  active: boolean
  order: number
  answerIds: UUID[]
}

export interface CreateQuestionInput {
  description: string
  active?: boolean
  order?: number
  answerIds?: UUID[]
}

export interface UpdateQuestionInput {
  description?: string
  active?: boolean
  order?: number
  answerIds?: UUID[]
}
