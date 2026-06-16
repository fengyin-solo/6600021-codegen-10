export interface BrailleChar {
  char: string
  dots: number[]  // 1-6 active dots
  unicode: string
}

export type LearnMode = 'charToBraille' | 'brailleToChar' | 'dictation'

export interface DailyProgress {
  date: string
  completed: number
  correct: number
}

export interface LearningGoal {
  dailyTarget: number
  totalCompleted: number
  totalCorrect: number
  streakDays: number
  lastActiveDate: string
  dailyProgress: DailyProgress[]
}
