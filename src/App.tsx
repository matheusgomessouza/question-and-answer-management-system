import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from '@/layout/Layout'
import { QuestionsPage } from '@/modules/questions/components/QuestionsPage'
import { AnswersPage } from '@/modules/answers/components/AnswersPage'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/questions" replace />} />
        <Route path="/questions" element={<QuestionsPage />} />
        <Route path="/answers" element={<AnswersPage />} />
      </Routes>
    </Layout>
  )
}

export default App
