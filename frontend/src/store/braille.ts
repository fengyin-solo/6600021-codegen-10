import { ref, computed, watch } from 'vue'
import { defineStore } from 'pinia'
import { BRAILLE_MAP, textToBraille, brailleToText, dotsToUnicode } from '../utils/braille'
import type { LearnMode, LearningGoal, DailyProgress } from '../types'

const GOAL_STORAGE_KEY = 'braille-learning-goal'

function getTodayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function daysBetween(a: string, b: string): number {
  const da = new Date(a).getTime()
  const db = new Date(b).getTime()
  return Math.round((db - da) / (1000 * 60 * 60 * 24))
}

function loadGoal(): LearningGoal {
  try {
    const raw = localStorage.getItem(GOAL_STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return {
    dailyTarget: 20,
    totalCompleted: 0,
    totalCorrect: 0,
    streakDays: 0,
    lastActiveDate: '',
    dailyProgress: []
  }
}

export const useBrailleStore = defineStore('braille', () => {
  const inputText = ref('')
  const brailleOutput = ref<number[][]>([])
  const learnMode = ref<LearnMode>('charToBraille')
  const quizChar = ref('')
  const selectedDots = ref<number[]>([])
  const score = ref({ correct: 0, total: 0 })
  const history = ref<{ input: string; correct: boolean }[]>([])
  const learningGoal = ref<LearningGoal>(loadGoal())
  const goalJustCompleted = ref(false)

  const brailleUnicode = computed(() =>
    brailleOutput.value.map(d => dotsToUnicode(d)).join('')
  )

  const todayStr = computed(() => getTodayStr())

  const todayProgress = computed<DailyProgress>(() => {
    const today = getTodayStr()
    const found = learningGoal.value.dailyProgress.find(p => p.date === today)
    return found || { date: today, completed: 0, correct: 0 }
  })

  const todayProgressPercent = computed(() => {
    if (learningGoal.value.dailyTarget <= 0) return 0
    return Math.min(100, Math.round(todayProgress.value.completed / learningGoal.value.dailyTarget * 100))
  })

  const todayGoalMet = computed(() =>
    todayProgress.value.completed >= learningGoal.value.dailyTarget
  )

  watch(learningGoal, (val) => {
    try {
      localStorage.setItem(GOAL_STORAGE_KEY, JSON.stringify(val))
    } catch {}
  }, { deep: true })

  function setDailyTarget(target: number) {
    learningGoal.value.dailyTarget = Math.max(1, Math.floor(target))
  }

  function recordPractice(correct: boolean) {
    const today = getTodayStr()
    const g = learningGoal.value
    let todayRec = g.dailyProgress.find(p => p.date === today)
    if (!todayRec) {
      todayRec = { date: today, completed: 0, correct: 0 }
      g.dailyProgress.push(todayRec)
    }
    const prevCompleted = todayRec.completed
    todayRec.completed++
    if (correct) todayRec.correct++
    g.totalCompleted++
    if (correct) g.totalCorrect++

    if (g.lastActiveDate !== today) {
      if (g.lastActiveDate && daysBetween(g.lastActiveDate, today) === 1) {
        g.streakDays++
      } else if (!g.lastActiveDate || daysBetween(g.lastActiveDate, today) > 1) {
        g.streakDays = 1
      }
      g.lastActiveDate = today
    }

    if (g.dailyProgress.length > 60) {
      g.dailyProgress = g.dailyProgress.slice(-60)
    }

    if (prevCompleted < g.dailyTarget && todayRec.completed >= g.dailyTarget) {
      goalJustCompleted.value = true
    }
  }

  function resetGoalJustCompleted() {
    goalJustCompleted.value = false
  }

  function resetAllProgress() {
    learningGoal.value = {
      dailyTarget: learningGoal.value.dailyTarget,
      totalCompleted: 0,
      totalCorrect: 0,
      streakDays: 0,
      lastActiveDate: '',
      dailyProgress: []
    }
  }

  function translate() {
    brailleOutput.value = textToBraille(inputText.value)
  }

  function reverseTranslate() {
    // Simple: take selectedDots and find matching char
    return brailleToText(selectedDots.value)
  }

  function generateQuiz() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    quizChar.value = chars[Math.floor(Math.random() * chars.length)]
    selectedDots.value = []
  }

  function toggleDot(dot: number) {
    const idx = selectedDots.value.indexOf(dot)
    if (idx >= 0) selectedDots.value.splice(idx, 1)
    else selectedDots.value.push(dot)
  }

  function checkQuizAnswer() {
    const correct = JSON.stringify([...selectedDots.value].sort()) === JSON.stringify([...(BRAILLE_MAP[quizChar.value] || [])].sort())
    score.value.total++
    if (correct) score.value.correct++
    history.value.unshift({ input: quizChar.value, correct })
    recordPractice(correct)
    if (navigator.vibrate) navigator.vibrate(correct ? 100 : [100, 50, 100])
    generateQuiz()
  }

  function resetScore() {
    score.value = { correct: 0, total: 0 }
    history.value = []
  }

  function exportPDF(): string {
    const lines = inputText.value.toUpperCase().split('')
    let out = '盲文翻译输出\n\n'
    for (const ch of lines) {
      const dots = BRAILLE_MAP[ch] || []
      out += `${ch} → [${dots.join(',')}] ${dotsToUnicode(dots)}\n`
    }
    return out
  }

  return {
    inputText, brailleOutput, learnMode, quizChar, selectedDots, score, history,
    brailleUnicode, translate, reverseTranslate, generateQuiz, toggleDot,
    checkQuizAnswer, resetScore, exportPDF,
    learningGoal, goalJustCompleted, todayStr, todayProgress, todayProgressPercent, todayGoalMet,
    setDailyTarget, resetGoalJustCompleted, resetAllProgress
  }
})
