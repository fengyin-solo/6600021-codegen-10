<template>
  <div class="min-h-screen p-4 flex flex-col gap-4 max-w-6xl mx-auto">
    <h1 class="text-3xl font-bold text-purple-400">盲文翻译与触觉学习器</h1>

    <div class="bg-gradient-to-r from-purple-900/50 to-indigo-900/50 rounded-xl p-4 border border-purple-700/50">
      <div class="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div class="flex items-center gap-3">
          <div class="text-2xl">🎯</div>
          <div>
            <div class="text-sm text-gray-400">今日进度 · {{ store.todayStr }}</div>
            <div class="text-lg font-bold" :class="store.todayGoalMet ? 'text-green-400' : 'text-purple-300'">
              {{ store.todayProgress.completed }} / {{ store.learningGoal.dailyTarget }} 题
              <span v-if="store.todayGoalMet" class="ml-2 text-sm">✓ 已达成</span>
            </div>
          </div>
        </div>
        <div class="flex gap-4 text-center text-sm">
          <div>
            <div class="text-xl font-bold text-orange-400">{{ store.learningGoal.streakDays }}</div>
            <div class="text-gray-400">连续天数</div>
          </div>
          <div>
            <div class="text-xl font-bold text-blue-400">{{ store.learningGoal.totalCompleted }}</div>
            <div class="text-gray-400">累计练习</div>
          </div>
          <div>
            <div class="text-xl font-bold text-green-400">
              {{ store.learningGoal.totalCompleted ? Math.round(store.learningGoal.totalCorrect / store.learningGoal.totalCompleted * 100) : 0 }}%
            </div>
            <div class="text-gray-400">累计正确率</div>
          </div>
        </div>
      </div>
      <div class="h-3 bg-gray-800 rounded-full overflow-hidden">
        <div class="h-full transition-all duration-500 rounded-full"
          :class="store.todayGoalMet ? 'bg-gradient-to-r from-green-500 to-emerald-400' : 'bg-gradient-to-r from-purple-500 to-indigo-400'"
          :style="{ width: store.todayProgressPercent + '%' }"></div>
      </div>
    </div>

    <div class="flex gap-2">
      <button v-for="t in tabs" :key="t.id" @click="activeTab = t.id"
        class="px-4 py-2 rounded text-sm"
        :class="activeTab === t.id ? 'bg-purple-500 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'">
        {{ t.label }}
      </button>
    </div>

    <!-- Translate -->
    <div v-if="activeTab === 'translate'" class="grid grid-cols-2 gap-4">
      <div class="bg-gray-900 rounded-xl p-4">
        <h3 class="text-purple-300 font-bold mb-2">文本输入</h3>
        <textarea v-model="store.inputText" @input="store.translate()"
          class="w-full h-32 bg-gray-800 rounded p-3 text-white resize-none" placeholder="输入英文文本..." />
      </div>
      <div class="bg-gray-900 rounded-xl p-4">
        <h3 class="text-purple-300 font-bold mb-2">盲文输出</h3>
        <div class="text-4xl tracking-wider text-purple-300 h-16">{{ store.brailleUnicode }}</div>
        <div class="flex flex-wrap gap-2 mt-3">
          <BrailleCell v-for="(dots, i) in store.brailleOutput" :key="i" :dots="dots" :size="40" />
        </div>
      </div>
    </div>

    <!-- Learn -->
    <div v-if="activeTab === 'learn'" class="grid grid-cols-2 gap-4">
      <div class="bg-gray-900 rounded-xl p-4 flex flex-col items-center gap-4">
        <h3 class="text-purple-300 font-bold">猜盲文</h3>
        <div v-if="!store.quizChar">
          <button @click="store.generateQuiz()" class="bg-purple-500 px-6 py-3 rounded-lg text-lg hover:bg-purple-400">
            开始训练
          </button>
        </div>
        <div v-else class="flex flex-col items-center gap-3">
          <div class="text-7xl font-bold text-purple-400">{{ store.quizChar }}</div>
          <div class="text-sm text-gray-400">点击下方 6 点阵选择对应盲文</div>
          <div class="grid grid-cols-2 gap-2 p-4 bg-gray-800 rounded-xl">
            <button v-for="d in 6" :key="d" @click="store.toggleDot(d)"
              class="w-14 h-14 rounded-full border-2 transition-all"
              :class="store.selectedDots.includes(d) ? 'bg-purple-500 border-purple-400 scale-110' : 'bg-gray-700 border-gray-600 hover:border-purple-400'">
              <span class="text-xs">{{ d }}</span>
            </button>
          </div>
          <button @click="store.checkQuizAnswer()" class="bg-purple-500 px-6 py-2 rounded hover:bg-purple-400">确认</button>
        </div>
      </div>
      <div class="bg-gray-900 rounded-xl p-4">
        <div class="flex justify-between mb-2">
          <h3 class="text-purple-300 font-bold">统计</h3>
          <button @click="store.resetScore()" class="text-red-400 text-xs hover:underline">重置</button>
        </div>
        <div class="grid grid-cols-3 gap-2 text-center mb-3">
          <div class="bg-gray-800 rounded p-2">
            <div class="text-2xl font-bold text-green-400">{{ store.score.correct }}</div>
            <div class="text-xs text-gray-400">正确</div>
          </div>
          <div class="bg-gray-800 rounded p-2">
            <div class="text-2xl font-bold text-red-400">{{ store.score.total - store.score.correct }}</div>
            <div class="text-xs text-gray-400">错误</div>
          </div>
          <div class="bg-gray-800 rounded p-2">
            <div class="text-2xl font-bold text-purple-400">{{ store.score.total ? Math.round(store.score.correct / store.score.total * 100) : 0 }}%</div>
            <div class="text-xs text-gray-400">正确率</div>
          </div>
        </div>
        <div class="space-y-1 max-h-48 overflow-y-auto">
          <div v-for="(h, i) in store.history.slice(0, 20)" :key="i"
            class="flex justify-between bg-gray-800 rounded p-2 text-sm"
            :class="h.correct ? 'border-l-4 border-green-500' : 'border-l-4 border-red-500'">
            <span>{{ h.input }}</span><span>{{ h.correct ? '✓' : '✗' }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Reference -->
    <div v-if="activeTab === 'ref'" class="bg-gray-900 rounded-xl p-4">
      <h3 class="text-purple-300 font-bold mb-3">盲文速查表</h3>
      <div class="grid grid-cols-6 md:grid-cols-9 gap-3">
        <div v-for="(dots, char) in brailleMap" :key="char" class="flex flex-col items-center">
          <div class="text-xl font-bold text-purple-400">{{ char }}</div>
          <BrailleCell :dots="dots" :size="30" />
          <div class="text-xs text-gray-500">{{ dots.join(',') }}</div>
        </div>
      </div>
    </div>

    <!-- Goals -->
    <div v-if="activeTab === 'goal'" class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="bg-gray-900 rounded-xl p-5">
        <h3 class="text-purple-300 font-bold mb-4 flex items-center gap-2">
          <span>⚙️</span> 学习目标设置
        </h3>
        <div class="space-y-5">
          <div>
            <label class="block text-sm text-gray-400 mb-2">每日练习量（题）</label>
            <div class="flex items-center gap-3">
              <button @click="adjustTarget(-5)" class="w-10 h-10 bg-gray-800 rounded-lg hover:bg-gray-700 text-xl">-</button>
              <input type="number" v-model.number="dailyTargetInput" @change="saveTarget"
                class="flex-1 bg-gray-800 rounded-lg px-4 py-2 text-center text-xl font-bold text-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                min="1" step="5" />
              <button @click="adjustTarget(5)" class="w-10 h-10 bg-gray-800 rounded-lg hover:bg-gray-700 text-xl">+</button>
            </div>
            <div class="flex gap-2 mt-3">
              <button v-for="preset in [10, 20, 50, 100]" :key="preset" @click="setPresetTarget(preset)"
                class="px-3 py-1 text-sm rounded-lg transition-all"
                :class="store.learningGoal.dailyTarget === preset ? 'bg-purple-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'">
                {{ preset }}题
              </button>
            </div>
          </div>
          <div class="border-t border-gray-800 pt-4">
            <div class="text-sm text-gray-400 mb-2">危险操作</div>
            <button @click="confirmResetProgress" class="px-4 py-2 bg-red-900/50 text-red-400 rounded-lg text-sm hover:bg-red-900 border border-red-800">
              重置所有累计进度
            </button>
          </div>
        </div>
      </div>

      <div class="bg-gray-900 rounded-xl p-5">
        <h3 class="text-purple-300 font-bold mb-4 flex items-center gap-2">
          <span>📊</span> 学习数据统计
        </h3>
        <div class="grid grid-cols-2 gap-3 mb-4">
          <div class="bg-gray-800 rounded-lg p-3 text-center">
            <div class="text-3xl font-bold text-blue-400">{{ store.learningGoal.totalCompleted }}</div>
            <div class="text-xs text-gray-400 mt-1">累计练习题</div>
          </div>
          <div class="bg-gray-800 rounded-lg p-3 text-center">
            <div class="text-3xl font-bold text-green-400">{{ store.learningGoal.totalCorrect }}</div>
            <div class="text-xs text-gray-400 mt-1">累计正确</div>
          </div>
          <div class="bg-gray-800 rounded-lg p-3 text-center">
            <div class="text-3xl font-bold text-orange-400">{{ store.learningGoal.streakDays }}</div>
            <div class="text-xs text-gray-400 mt-1">连续学习天数</div>
          </div>
          <div class="bg-gray-800 rounded-lg p-3 text-center">
            <div class="text-3xl font-bold text-purple-400">
              {{ store.learningGoal.totalCompleted ? Math.round(store.learningGoal.totalCorrect / store.learningGoal.totalCompleted * 100) : 0 }}%
            </div>
            <div class="text-xs text-gray-400 mt-1">总正确率</div>
          </div>
        </div>

        <h4 class="text-sm text-gray-400 mb-2">近 7 天练习量</h4>
        <div class="space-y-2">
          <div v-for="day in last7Days" :key="day.date" class="flex items-center gap-3">
            <div class="w-16 text-xs text-gray-500">{{ day.label }}</div>
            <div class="flex-1 h-5 bg-gray-800 rounded-full overflow-hidden relative">
              <div class="h-full rounded-full transition-all"
                :class="day.completed >= store.learningGoal.dailyTarget ? 'bg-green-500' : 'bg-purple-500'"
                :style="{ width: Math.min(100, store.learningGoal.dailyTarget ? (day.completed / store.learningGoal.dailyTarget * 100) : 0) + '%' }"></div>
              <div class="absolute inset-0 flex items-center justify-center text-xs"
                :class="day.completed >= store.learningGoal.dailyTarget ? 'text-white' : 'text-gray-300'">
                {{ day.completed }} 题
              </div>
            </div>
            <div v-if="day.completed >= store.learningGoal.dailyTarget" class="text-green-400 text-xs w-6">✓</div>
            <div v-else class="w-6"></div>
          </div>
        </div>
      </div>
    </div>

    <button @click="doExport" class="bg-green-700 px-4 py-2 rounded self-start hover:bg-green-600 text-sm">
      导出翻译文本
    </button>

    <!-- 目标达成提醒弹窗 -->
    <div v-if="store.goalJustCompleted"
      class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      @click.self="dismissGoalCompleted">
      <div class="bg-gradient-to-br from-purple-900 to-indigo-900 rounded-2xl p-8 max-w-sm w-full text-center border-2 border-purple-500 shadow-2xl shadow-purple-500/30"
        @click.stop>
        <div class="text-6xl mb-4">🎉</div>
        <h2 class="text-2xl font-bold text-white mb-2">恭喜达成今日目标！</h2>
        <p class="text-purple-200 mb-6">
          今天你完成了 <span class="text-green-400 font-bold">{{ store.todayProgress.completed }}</span> 道练习题，
          继续加油哦～
        </p>
        <div class="flex gap-3 justify-center mb-4 text-sm">
          <div class="bg-black/30 rounded-lg px-3 py-2">
            <div class="text-orange-400 font-bold">🔥 {{ store.learningGoal.streakDays }}天</div>
            <div class="text-purple-300 text-xs">连续学习</div>
          </div>
          <div class="bg-black/30 rounded-lg px-3 py-2">
            <div class="text-green-400 font-bold">
              {{ store.todayProgress.completed ? Math.round(store.todayProgress.correct / store.todayProgress.completed * 100) : 0 }}%
            </div>
            <div class="text-purple-300 text-xs">今日正确率</div>
          </div>
        </div>
        <button @click="dismissGoalCompleted"
          class="w-full py-3 bg-purple-500 hover:bg-purple-400 rounded-xl text-white font-bold transition-colors">
          太棒了！继续挑战
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useBrailleStore } from './store/braille'
import { BRAILLE_MAP } from './utils/braille'
import BrailleCell from './components/BrailleCell.vue'

const store = useBrailleStore()
const brailleMap = BRAILLE_MAP
const tabs = [
  { id: 'translate', label: '翻译模式' },
  { id: 'learn', label: '训练模式' },
  { id: 'ref', label: '速查表' },
  { id: 'goal', label: '学习目标' },
]
const activeTab = ref('translate')

const dailyTargetInput = ref(store.learningGoal.dailyTarget)
watch(() => store.learningGoal.dailyTarget, (v) => { dailyTargetInput.value = v })

const last7Days = computed(() => {
  const days: { date: string; label: string; completed: number; correct: number }[] = []
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const rec = store.learningGoal.dailyProgress.find(p => p.date === dateStr)
    days.push({
      date: dateStr,
      label: i === 0 ? '今天' : weekdays[d.getDay()],
      completed: rec?.completed || 0,
      correct: rec?.correct || 0
    })
  }
  return days
})

function adjustTarget(delta: number) {
  const newVal = Math.max(1, dailyTargetInput.value + delta)
  dailyTargetInput.value = newVal
  saveTarget()
}

function setPresetTarget(val: number) {
  dailyTargetInput.value = val
  saveTarget()
}

function saveTarget() {
  store.setDailyTarget(dailyTargetInput.value)
}

function confirmResetProgress() {
  if (confirm('确定要重置所有累计进度吗？此操作不可撤销！')) {
    store.resetAllProgress()
    dailyTargetInput.value = store.learningGoal.dailyTarget
  }
}

function dismissGoalCompleted() {
  store.resetGoalJustCompleted()
}

function doExport() {
  const text = store.exportPDF()
  const blob = new Blob([text], { type: 'text/plain' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'braille-output.txt'
  a.click()
}
</script>
