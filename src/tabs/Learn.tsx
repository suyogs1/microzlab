import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Target, Play, Award, CheckCircle, AlertCircle, Lightbulb, Zap, Cpu } from 'lucide-react';
import { loadLessons, loadChallenges, runChallenge, getCompletionStatus, saveCompletion, showConfetti, type Challenge } from '../grader/asmGrader';
import { GlassCard } from '../components/ui/GlassCard';
import { GlowTabs } from '../components/ui/GlowTabs';
import { NeonButton } from '../components/ui/NeonButton';
import { TagPill } from '../components/ui/TagPill';
import { PanelHeader } from '../components/ui/PanelHeader';
import { ScrollArea } from '../components/ScrollArea';
import { useDebuggerBus } from '../state/debuggerBus.tsx';
import RetroTerminal from '../components/RetroTerminal';
import { MatrixRain, HolographicBorder, ParticleSystem, GlitchText, NeonCodeBlock, AchievementUnlock, ProgressCelebration } from '../components/SpectacularEffects';
import AIHintSystem from '../components/AIHintSystem';
import ChallengeVisualizer from '../components/ChallengeVisualizer';
import BadgeSystem from '../components/BadgeSystem';
import SpectacularScoring from '../components/SpectacularScoring';
import LiveCodingStats from '../components/LiveCodingStats';

interface LearnProps {
  onOpenInDebugger: (code: string) => void;
}

interface Lesson {
  id: string;
  title: string;
  goals: string[];
  theory: string;
  snippets: Array<{
    label: string;
    source: string;
    watches: string[];
  }>;
  quiz: Array<{
    q: string;
    options: string[];
    answer: number;
  }>;
}

const Learn: React.FC<LearnProps> = ({ onOpenInDebugger }) => {
  const { setPendingLoad } = useDebuggerBus();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [challenges, setChallenges] = useState<Record<string, Challenge[]>>({});
  const [loading, setLoading] = useState(true);
  const [completions, setCompletions] = useState<Record<string, boolean>>({});
  const [selectedTab, setSelectedTab] = useState<'lessons' | 'challenges'>('lessons');
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [challengeCode, setChallengeCode] = useState('');
  const [grading, setGrading] = useState(false);
  const [gradeResult, setGradeResult] = useState<any>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [pendingNavigation, setPendingNavigation] = useState<{ lessonId?: string; challengeId?: string } | null>(null);

  // Spectacular effects state
  const [showMatrixRain, setShowMatrixRain] = useState(false);
  const [showParticles, setShowParticles] = useState(false);
  const [particleType, setParticleType] = useState<'success' | 'error' | 'magic'>('magic');
  const [showScoring, setShowScoring] = useState(false);
  const [currentScore, setCurrentScore] = useState<any>(null);
  const [achievements, setAchievements] = useState<string[]>([]);
  const [showAchievement, setShowAchievement] = useState<any>(null);
  const [attempts, setAttempts] = useState(0);
  const [isTerminalMode, setIsTerminalMode] = useState(true);

  // Lesson-specific effects
  const [showLessonEffects, setShowLessonEffects] = useState(false);
  const [showProgressCelebration, setShowProgressCelebration] = useState(false);
  const [celebrationProgress, setCelebrationProgress] = useState(0);

  // Handle navigation back from debugger with unique lesson/challenge links
  useEffect(() => {
    const handleNavigateToLearn = (event: CustomEvent) => {
      const { lessonId, challengeId } = event.detail || {};

      if (lessonId || challengeId) {
        // Store pending navigation if data isn't loaded yet
        setPendingNavigation({ lessonId, challengeId });

        // Try to navigate immediately if data is available
        if (lessonId && lessons && lessons.length > 0) {
          const lesson = lessons.find(l => l.id === lessonId);
          if (lesson) {
            setSelectedTab('lessons');
            setSelectedLesson(lesson);
            setPendingNavigation(null);

            // Scroll to lesson in sidebar after a short delay
            setTimeout(() => {
              const lessonElement = document.querySelector(`[data-lesson-id="${lessonId}"]`);
              if (lessonElement) {
                lessonElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }, 300);

            // Update URL to maintain unique link
            window.history.pushState({}, '', `#lesson-${lessonId}`);
          }
        } else if (challengeId && challenges && Object.keys(challenges).length > 0) {
          const allChallenges = Object.values(challenges).flat();
          const challenge = allChallenges.find(c => c.id === challengeId);
          if (challenge) {
            setSelectedTab('challenges');
            setSelectedChallenge(challenge);
            setChallengeCode(challenge.starter);
            setPendingNavigation(null);
            // Update URL to maintain unique link
            window.history.pushState({}, '', `#challenge-${challengeId}`);
          }
        }
      }
    };

    window.addEventListener('navigate-to-learn', handleNavigateToLearn as EventListener);
    return () => {
      window.removeEventListener('navigate-to-learn', handleNavigateToLearn as EventListener);
    };
  }, [lessons, challenges]);

  // Apply pending navigation when data becomes available
  useEffect(() => {
    if (pendingNavigation && ((lessons && lessons.length > 0) || (challenges && Object.keys(challenges).length > 0))) {
      const { lessonId, challengeId } = pendingNavigation;

      if (lessonId && lessons && lessons.length > 0) {
        const lesson = lessons.find(l => l.id === lessonId);
        if (lesson) {
          setSelectedTab('lessons');
          setSelectedLesson(lesson);
          setPendingNavigation(null);

          // Scroll to lesson in sidebar
          setTimeout(() => {
            const lessonElement = document.querySelector(`[data-lesson-id="${lessonId}"]`);
            if (lessonElement) {
              lessonElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 300);
        }
      } else if (challengeId && challenges && Object.keys(challenges).length > 0) {
        const allChallenges = Object.values(challenges).flat();
        const challenge = allChallenges.find(c => c.id === challengeId);
        if (challenge) {
          setSelectedTab('challenges');
          setSelectedChallenge(challenge);
          setChallengeCode(challenge.starter);
          setPendingNavigation(null);
        }
      }
    }
  }, [lessons, challenges, pendingNavigation]);

  useEffect(() => {
    loadContent();
    setCompletions(getCompletionStatus());

    // Load quiz answers from localStorage
    try {
      const savedQuizAnswers = localStorage.getItem('asmplay_quiz_answers');
      if (savedQuizAnswers) {
        setQuizAnswers(JSON.parse(savedQuizAnswers));
      }
    } catch (err) {
      console.error('Failed to load quiz answers:', err);
    }

    // Handle direct navigation from URL hash
    const hash = window.location.hash;
    if (hash.startsWith('#lesson-')) {
      const lessonId = hash.replace('#lesson-', '');
      setPendingNavigation({ lessonId });
    } else if (hash.startsWith('#challenge-')) {
      const challengeId = hash.replace('#challenge-', '');
      setPendingNavigation({ challengeId });
    }
  }, []);

  const loadContent = async (): Promise<void> => {
    try {
      console.log('Loading lessons and challenges...');
      const [lessonsData, challengesData] = await Promise.all([
        loadLessons(),
        loadChallenges()
      ]);
      console.log('Lessons loaded:', lessonsData);
      console.log('Challenges loaded:', challengesData);
      console.log('Challenge counts:', {
        beginner: challengesData?.beginner?.length || 0,
        intermediate: challengesData?.intermediate?.length || 0,
        advanced: challengesData?.advanced?.length || 0,
        expert: challengesData?.expert?.length || 0
      });
      setLessons(lessonsData || []);
      setChallenges(challengesData || {});
    } catch (error) {
      console.error('Error loading content:', error);
      setLessons([]);
      setChallenges({});
    } finally {
      setLoading(false);
    }
  };

  const handleTryChallenge = (challenge: Challenge) => {
    setSelectedChallenge(challenge);
    setChallengeCode(challenge.starter);
    setGradeResult(null);

    // Load in debugger with challenge-specific setup
    setPendingLoad({
      source: challenge.starter,
      watches: challenge.watches || [],
      breakpoints: challenge.breakpoints || [0], // Set breakpoint at first line
      asserts: challenge.asserts || [],
      cursorLine: 0,
      challengeId: challenge.id,
      challengeTitle: challenge.title
    });

    onOpenInDebugger(challenge.starter);
  };

  const handleGradeChallenge = async (): Promise<void> => {
    if (!selectedChallenge) return;

    setGrading(true);
    setGradeResult(null);
    setAttempts(prev => prev + 1);

    // Start matrix rain effect during grading
    setShowMatrixRain(true);

    try {
      const result = await runChallenge(challengeCode, selectedChallenge);
      setGradeResult(result);

      // Calculate spectacular score
      const score = {
        correctness: result.passed ? 60 : (result.results.filter(r => r.ok).length / result.results.length) * 60,
        efficiency: Math.max(0, 20 - (result.steps || 0) / 50),
        codeStyle: challengeCode.includes(';') ? 20 : 15, // Simple style check
        total: 0,
        grade: 'F'
      };
      score.total = score.correctness + score.efficiency + score.codeStyle;

      if (score.total >= 90) score.grade = 'A+';
      else if (score.total >= 85) score.grade = 'A';
      else if (score.total >= 80) score.grade = 'B+';
      else if (score.total >= 75) score.grade = 'B';
      else if (score.total >= 70) score.grade = 'C+';
      else if (score.total >= 65) score.grade = 'C';
      else if (score.total >= 60) score.grade = 'D';

      setCurrentScore(score);

      if (result.passed) {
        saveCompletion(selectedChallenge.id);
        setCompletions(prev => ({ ...prev, [selectedChallenge.id]: true }));

        // Spectacular success effects with enhanced particles
        setParticleType('success');
        setShowParticles(true);
        showConfetti();

        // Enhanced matrix rain for success
        setTimeout(() => {
          setShowMatrixRain(false);
          setShowMatrixRain(true);
        }, 500);

        // Check for achievements
        const newAchievements = checkAchievements();
        if (newAchievements.length > 0) {
          setShowAchievement({
            title: "Code Master!",
            description: "Challenge completed successfully!",
            icon: "🏆"
          });
        }

        // Show Mystery Box completion for challenge #24
        if (selectedChallenge.id === 'mystery_box_ultimate') {
          setTimeout(() => {
            setShowAchievement({
              title: "LEGENDARY STATUS ACHIEVED!",
              description: "You have conquered the Mystery Box!",
              icon: "👑"
            });
          }, 2000);
        }

        setTimeout(() => {
          setShowScoring(true);
        }, 1000);
      } else {
        // Error effects
        setParticleType('error');
        setShowParticles(true);
        setTimeout(() => setShowParticles(false), 3000);
      }
    } catch (err) {
      setGradeResult({
        passed: false,
        results: [],
        error: err instanceof Error ? err.message : 'Grading failed'
      });
      setParticleType('error');
      setShowParticles(true);
    } finally {
      setGrading(false);
      setTimeout(() => setShowMatrixRain(false), 2000);
    }
  };

  const checkAchievements = (): void => {
    // Simple achievement checking
    const completedCount = Object.keys(completions).length;
    const newAchievements: string[] = [];

    if (completedCount >= 5 && !achievements.includes('speedster')) {
      newAchievements.push('speedster');
    }
    if (completedCount >= 10 && !achievements.includes('perfectionist')) {
      newAchievements.push('perfectionist');
    }
    if (completedCount >= 24 && !achievements.includes('champion')) {
      newAchievements.push('champion');
    }

    setAchievements(prev => [...prev, ...newAchievements]);
    return newAchievements;
  };

  const calculateLessonProgress = (lesson: Lesson) => {
    const quizProgress = lesson.quiz.length > 0 ?
      lesson.quiz.filter((_, index) => {
        const key = `${lesson.id}_${index}`;
        const userAnswer = quizAnswers[key];
        return userAnswer !== undefined && userAnswer === lesson.quiz[index]?.answer;
      }).length / lesson.quiz.length : 1;

    // Check if all examples have been run through (stored in completions)
    const examplesProgress = completions[`lesson_${lesson.id}_examples`] ? 1 : 0;

    // Lesson progress is based on quiz completion and examples being run
    // If there's a quiz, it's 70% quiz + 30% examples
    // If no quiz, it's 100% examples
    const totalProgress = lesson.quiz.length > 0 ?
      (quizProgress * 0.7 + examplesProgress * 0.3) :
      examplesProgress;

    return Math.round(totalProgress * 100);
  };

  const handleLessonSelect = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setShowLessonEffects(true);

    // Trigger particle effects
    setParticleType('magic');
    setShowParticles(true);
    setTimeout(() => setShowParticles(false), 2000);

    // Scroll to lesson in sidebar
    setTimeout(() => {
      const lessonElement = document.querySelector(`[data-lesson-id="${lesson.id}"]`);
      if (lessonElement) {
        lessonElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);

    window.history.pushState({}, '', `#lesson-${lesson.id}`);
  };



  const handleQuizAnswer = (lessonId: string, questionIndex: number, answer: number) => {
    const key = `${lessonId}_${questionIndex}`;
    setQuizAnswers(prev => ({ ...prev, [key]: answer }));

    // Save quiz progress to localStorage
    try {
      const quizData = JSON.parse(localStorage.getItem('asmplay_quiz_answers') || '{}');
      quizData[key] = answer;
      localStorage.setItem('asmplay_quiz_answers', JSON.stringify(quizData));
    } catch (err) {
      console.error('Failed to save quiz answer:', err);
    }

    // Check if lesson is now complete and show celebration
    if (selectedLesson) {
      const newProgress = calculateLessonProgress(selectedLesson);
      if (newProgress === 100 && !showProgressCelebration) {
        setCelebrationProgress(newProgress);
        setShowProgressCelebration(true);
      }
    }
  };

  const handleExampleRun = (lessonId: string) => {
    // Mark examples as run for this lesson
    saveCompletion(`lesson_${lessonId}_examples`);
    setCompletions(prev => ({ ...prev, [`lesson_${lessonId}_examples`]: true }));

    // Show success particles
    setParticleType('success');
    setShowParticles(true);
    setTimeout(() => setShowParticles(false), 1500);

    // Check if lesson is now complete and show celebration
    if (selectedLesson) {
      setTimeout(() => {
        const newProgress = calculateLessonProgress(selectedLesson);
        if (newProgress === 100 && !showProgressCelebration) {
          setCelebrationProgress(newProgress);
          setShowProgressCelebration(true);
        }
      }, 100);
    }
  };

  const checkQuizComplete = (lesson: Lesson) => {
    const quizDone = lesson.quiz.every((_, index) => {
      const key = `${lesson.id}_${index}`;
      const userAnswer = quizAnswers[key];
      return userAnswer !== undefined && userAnswer === lesson.quiz[index]?.answer;
    });

    // Also check if examples have been run through
    const examplesRun = completions[`lesson_${lesson.id}_examples`] || false;

    return quizDone && examplesRun;
  };

  const tabs = [
    {
      id: 'lessons' as const,
      label: `Lessons (${lessons ? lessons.length : 0})`,
      icon: <BookOpen className="w-4 h-4" />,
    },
    {
      id: 'challenges' as const,
      label: `Challenges (${challenges ? Object.values(challenges).flat().length : 0})`,
      icon: <Target className="w-4 h-4" />,
    },
  ];

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center relative overflow-hidden">
        <ParticleSystem isActive={true} type="magic" intensity={0.5} />
        <div className="text-center space-y-6 z-10">
          <motion.div
            animate={{
              rotate: 360,
              scale: [1, 1.1, 1]
            }}
            transition={{
              rotate: { duration: 2, repeat: Infinity, ease: "linear" },
              scale: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
            }}
            className="w-16 h-16 mx-auto relative"
          >
            <div className="absolute inset-0 border-4 border-accent/30 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
            <div className="absolute inset-2 border-2 border-accent2/50 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <GlitchText
              text="Loading Assembly Universe..."
              className="text-xl font-bold bg-gradient-to-r from-accent to-accent2 bg-clip-text text-transparent"
              glitchIntensity={0.1}
            />
            <motion.p
              className="text-slate-400 mt-2"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              Initializing lessons and challenges...
            </motion.p>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-edge/50">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-accent to-accent2 bg-clip-text text-transparent mb-2">
              Learn Assembly
            </h1>
            <p className="text-slate-400">Master assembly programming with interactive lessons and challenges</p>
          </div>

          <GlowTabs
            tabs={tabs}
            activeTab={selectedTab}
            onTabChange={setSelectedTab}
          />
        </motion.div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <AnimatePresence mode="wait">
          {selectedTab === 'lessons' && (
            <motion.div
              key="lessons"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="h-full flex min-h-0"
            >
              {/* Lesson List */}
              <div className="w-80 border-r border-edge/50 flex flex-col min-h-0 relative">
                <HolographicBorder><div /></HolographicBorder>
                <ScrollArea className="flex-1 p-4" data-testid="lesson-list">
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6"
                  >
                    <h3 className="font-semibold text-slate-200 mb-2 flex items-center">
                      <BookOpen className="w-4 h-4 mr-2 text-accent" />
                      Interactive Lessons
                    </h3>
                    <div className="text-xs text-slate-400 mb-3">
                      Progress: {lessons ? Math.round((Object.keys(completions).filter(id =>
                        lessons.some(l => l.id === id) || id.includes('lesson_') && id.includes('_examples')).length / (lessons.length * 2)) * 100) : 0}%
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2 mb-4 overflow-hidden relative">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{
                          width: lessons ? `${Math.round((Object.keys(completions).filter(id =>
                            lessons.some(l => l.id === id) || id.includes('lesson_') && id.includes('_examples')).length / (lessons.length * 2)) * 100)}%` : '0%'
                        }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className="bg-gradient-to-r from-accent via-accent2 to-accent h-2 rounded-full relative"
                      >
                        <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer rounded-full" />
                      </motion.div>
                    </div>
                  </motion.div>

                  <div className="space-y-3">
                    {lessons && lessons.map((lesson, index) => {
                      const progress = calculateLessonProgress(lesson);
                      const isCompleted = checkQuizComplete(lesson);
                      const isSelected = selectedLesson?.id === lesson.id;

                      return (
                        <motion.div
                          key={lesson.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="relative"
                        >
                          <motion.button
                            onClick={() => handleLessonSelect(lesson)}
                            data-testid="lesson-card"
                            data-lesson-id={lesson.id}
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            className={`w-full text-left p-4 rounded-xl border transition-all duration-300 relative overflow-hidden ${isSelected
                                ? 'bg-gradient-to-br from-accent/20 to-accent2/20 border-accent/50 text-accent shadow-neon-md'
                                : 'bg-gradient-to-br from-panel/50 to-panel/30 border-edge/50 text-slate-300 hover:from-panel hover:to-panel/70 hover:border-accent/30 hover:shadow-neon-sm'
                              }`}
                          >
                            {/* Animated background effect */}
                            {isSelected && (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="absolute inset-0 bg-gradient-to-r from-accent/10 via-transparent to-accent2/10"
                              />
                            )}

                            <div className="relative z-10">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <span className="text-xs font-mono bg-accent/20 text-accent px-2 py-0.5 rounded">
                                      L{index + 1}
                                    </span>
                                    {isCompleted && (
                                      <motion.div
                                        initial={{ scale: 0, rotate: -180 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{ type: "spring", bounce: 0.6, delay: 0.2 }}
                                        className="relative"
                                      >
                                        <CheckCircle className="w-4 h-4 text-ok drop-shadow-lg" />
                                        <motion.div
                                          animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                                          transition={{ duration: 2, repeat: Infinity }}
                                          className="absolute inset-0 rounded-full bg-ok/30"
                                        />
                                      </motion.div>
                                    )}
                                  </div>
                                  <div className="font-medium text-sm leading-tight">{lesson.title}</div>
                                </div>

                                <div className="text-right ml-2">
                                  <div className="text-xs text-slate-400 mb-1">{progress}%</div>
                                  <div className="w-12 bg-slate-700 rounded-full h-1.5 overflow-hidden">
                                    <motion.div
                                      initial={{ width: 0 }}
                                      animate={{ width: `${progress}%` }}
                                      transition={{ duration: 0.8, delay: index * 0.1 }}
                                      className={`h-1.5 rounded-full relative ${progress === 100 ? 'bg-gradient-to-r from-ok to-emerald-400' :
                                          progress >= 70 ? 'bg-gradient-to-r from-accent to-accent2' :
                                            progress >= 40 ? 'bg-gradient-to-r from-warn to-orange-400' :
                                              'bg-gradient-to-r from-slate-500 to-slate-400'
                                        }`}
                                    >
                                      {progress === 100 && (
                                        <div className="absolute inset-0 bg-white/30 animate-pulse rounded-full" />
                                      )}
                                      {progress > 0 && (
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer rounded-full" />
                                      )}
                                    </motion.div>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-400">
                                  {lesson.goals.length} goals • {lesson.quiz.length} questions
                                </span>
                                <span className="text-slate-500">
                                  {lesson.snippets.length} examples
                                </span>
                              </div>
                            </div>
                          </motion.button>
                        </motion.div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>

              {/* Lesson Content */}
              <div className="flex-1 flex flex-col min-h-0">
                <ScrollArea className="flex-1">
                  {selectedLesson ? (
                    <div className="p-6 max-w-4xl space-y-6 relative">
                      {/* Animated background particles */}
                      {showLessonEffects && (
                        <ParticleSystem
                          type="magic"
                          intensity={0.3}
                          className="absolute inset-0 pointer-events-none"
                        />
                      )}

                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative z-10"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <GlitchText
                              text={selectedLesson.title}
                              className="text-3xl font-bold bg-gradient-to-r from-accent via-accent2 to-accent bg-clip-text text-transparent"
                              glitchIntensity={0.1}
                            />
                            <div className="flex items-center space-x-3 mt-2">
                              <div className="text-sm text-slate-400">
                                Progress: {calculateLessonProgress(selectedLesson)}%
                              </div>
                              <div className="w-32 bg-slate-700 rounded-full h-2 overflow-hidden relative">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${calculateLessonProgress(selectedLesson)}%` }}
                                  transition={{ duration: 1.5, ease: "easeOut" }}
                                  className="bg-gradient-to-r from-accent via-accent2 to-accent h-2 rounded-full relative"
                                >
                                  <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
                                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer rounded-full" />
                                  {calculateLessonProgress(selectedLesson) === 100 && (
                                    <motion.div
                                      animate={{ scale: [1, 1.1, 1] }}
                                      transition={{ duration: 1, repeat: Infinity }}
                                      className="absolute inset-0 bg-ok/30 rounded-full"
                                    />
                                  )}
                                </motion.div>
                              </div>
                            </div>
                          </div>

                          {checkQuizComplete(selectedLesson) && (
                            <motion.div
                              initial={{ scale: 0, rotate: -180 }}
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{ type: "spring", bounce: 0.6, delay: 0.3 }}
                            >
                              <TagPill variant="success" className="shadow-neon-sm">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Mastered!
                              </TagPill>
                            </motion.div>
                          )}
                        </div>
                      </motion.div>

                      {/* Goals */}
                      <GlassCard>
                        <PanelHeader
                          title="Learning Goals"
                          icon={<Target className="w-4 h-4" />}
                        />
                        <div className="p-4">
                          <ul className="space-y-2">
                            {selectedLesson.goals.map((goal, index) => (
                              <motion.li
                                key={index}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="flex items-start space-x-2 text-slate-300"
                              >
                                <div className="w-2 h-2 bg-accent rounded-full mt-2 flex-shrink-0" />
                                <span>{goal}</span>
                              </motion.li>
                            ))}
                          </ul>
                        </div>
                      </GlassCard>

                      {/* Theory */}
                      <GlassCard>
                        <PanelHeader
                          title="Theory"
                          icon={<BookOpen className="w-4 h-4" />}
                        />
                        <div className="p-4">
                          <p className="text-slate-300 leading-relaxed">{selectedLesson.theory}</p>
                        </div>
                      </GlassCard>

                      {/* Code Snippets */}
                      <GlassCard>
                        <PanelHeader
                          title="Interactive Examples"
                          subtitle={`${selectedLesson.snippets.length} examples`}
                          icon={<Play className="w-4 h-4" />}
                        />
                        <div className="p-4 space-y-4">
                          {selectedLesson.snippets.map((snippet, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                              data-testid="lesson-snippet"
                              className="bg-edge/30 rounded-xl border border-edge/50 overflow-hidden"
                            >
                              <div className="px-4 py-3 border-b border-edge/50 flex items-center justify-between">
                                <h4 className="font-medium text-slate-200">{snippet.label}</h4>
                                <NeonButton
                                  size="sm"
                                  data-testid="snippet-debug-btn"
                                  onClick={() => {
                                    // Mark examples as run for this lesson
                                    handleExampleRun(selectedLesson.id);

                                    // Load in debugger with lesson-specific setup
                                    setPendingLoad({
                                      source: snippet.source,
                                      watches: snippet.watches || [],
                                      breakpoints: [0], // Set breakpoint at first line
                                      cursorLine: 0,
                                      lessonId: selectedLesson.id,
                                      lessonTitle: selectedLesson.title
                                    });
                                    onOpenInDebugger(snippet.source);
                                  }}
                                >
                                  <Play className="w-3 h-3 mr-1" />
                                  Debug
                                </NeonButton>
                              </div>
                              <div className="p-4">
                                <pre className="text-sm font-mono text-accent bg-bg/50 p-3 rounded-lg overflow-x-auto border border-edge/30">
                                  {snippet.source}
                                </pre>
                                {snippet.watches.length > 0 && (
                                  <div className="mt-3 flex items-center space-x-2">
                                    <TagPill variant="accent" size="sm">Watch</TagPill>
                                    <span className="text-sm text-slate-400">
                                      {snippet.watches.join(', ')}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </GlassCard>

                      {/* Quiz */}
                      {selectedLesson.quiz.length > 0 && (
                        <GlassCard>
                          <PanelHeader
                            title="Knowledge Check"
                            subtitle={`${selectedLesson.quiz.length} questions`}
                            icon={<AlertCircle className="w-4 h-4" />}
                          />
                          <div className="p-4 space-y-6">
                            {selectedLesson.quiz.map((question, qIndex) => {
                              const key = `${selectedLesson.id}_${qIndex}`;
                              const userAnswer = quizAnswers[key];
                              const isCorrect = userAnswer === question.answer;
                              const hasAnswered = userAnswer !== undefined;

                              return (
                                <motion.div
                                  key={qIndex}
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: qIndex * 0.1 }}
                                  className="bg-edge/30 rounded-xl border border-edge/50 p-4"
                                >
                                  <h4 className="font-medium text-slate-200 mb-4">
                                    {qIndex + 1}. {question.q}
                                  </h4>
                                  <div className="space-y-2">
                                    {question.options.map((option, oIndex) => (
                                      <button
                                        key={oIndex}
                                        onClick={() => handleQuizAnswer(selectedLesson.id, qIndex, oIndex)}
                                        className={`w-full text-left p-3 rounded-lg border transition-all duration-200 ${hasAnswered
                                            ? oIndex === question.answer
                                              ? 'bg-ok/20 border-ok/50 text-ok'
                                              : userAnswer === oIndex && !isCorrect
                                                ? 'bg-danger/20 border-danger/50 text-danger'
                                                : 'bg-slate-700/30 border-slate-600/50 text-slate-500'
                                            : userAnswer === oIndex
                                              ? 'bg-accent/20 border-accent/50 text-accent'
                                              : 'bg-panel/50 border-edge/50 text-slate-300 hover:bg-panel hover:border-accent/30'
                                          }`}
                                        disabled={hasAnswered}
                                      >
                                        <span className="font-mono text-sm mr-2">
                                          {String.fromCharCode(65 + oIndex)}.
                                        </span>
                                        {option}
                                      </button>
                                    ))}
                                  </div>
                                  {hasAnswered && (
                                    <motion.div
                                      initial={{ opacity: 0, scale: 0.9 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      className={`mt-3 flex items-center space-x-2 ${isCorrect ? 'text-ok' : 'text-danger'
                                        }`}
                                    >
                                      {isCorrect ? (
                                        <CheckCircle className="w-4 h-4" />
                                      ) : (
                                        <AlertCircle className="w-4 h-4" />
                                      )}
                                      <span className="text-sm font-medium">
                                        {isCorrect ? 'Correct!' : 'Incorrect. Try again!'}
                                      </span>
                                    </motion.div>
                                  )}
                                </motion.div>
                              );
                            })}

                            {checkQuizComplete(selectedLesson) && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="p-4 bg-ok/20 border border-ok/50 rounded-xl"
                              >
                                <div className="flex items-center text-ok">
                                  <Award className="w-5 h-5 mr-2" />
                                  <span className="font-medium">Lesson completed! Great job!</span>
                                </div>
                              </motion.div>
                            )}
                          </div>
                        </GlassCard>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center space-y-4"
                      >
                        <div className="w-16 h-16 bg-accent/20 rounded-2xl flex items-center justify-center mx-auto">
                          <BookOpen className="w-8 h-8 text-accent" />
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-slate-200 mb-2">Choose a Lesson</h3>
                          <p className="text-slate-400">Select a lesson from the sidebar to start learning</p>
                        </div>
                      </motion.div>
                    </div>
                  )}
                </ScrollArea>
              </div>
            </motion.div>
          )}

          {selectedTab === 'challenges' && (
            <motion.div
              key="challenges"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="h-full flex min-h-0"
            >
              {/* Challenge List */}
              <div className="w-80 border-r border-edge/50 flex flex-col min-h-0">
                <ScrollArea className="flex-1 p-4" data-testid="challenge-list">
                  {challenges && Object.entries(challenges).map(([tier, tierChallenges]) => (
                    <div key={tier} className="mb-6">
                      <h3 className="font-semibold text-slate-200 mb-3 capitalize flex items-center">
                        <Target className="w-4 h-4 mr-2 text-accent2" />
                        {tier} ({tierChallenges ? tierChallenges.length : 0})
                      </h3>
                      <div className="space-y-2">
                        {tierChallenges && tierChallenges.map((challenge, index) => (
                          <motion.button
                            key={challenge.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            onClick={() => {
                              setSelectedChallenge(challenge);
                              window.history.pushState({}, '', `#challenge-${challenge.id}`);
                            }}
                            data-testid="challenge-card"
                            className={`w-full text-left p-3 rounded-xl border transition-all duration-200 ${selectedChallenge?.id === challenge.id
                                ? 'bg-accent2/20 border-accent2/50 text-accent2 shadow-neon-sm'
                                : 'bg-panel/50 border-edge/50 text-slate-300 hover:bg-panel hover:border-accent2/30'
                              }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium">{challenge.title}</div>
                                <div className="text-sm opacity-70">
                                  {challenge.asserts.length} tests
                                </div>
                              </div>
                              {completions[challenge.id] && (
                                <Award className="w-5 h-5 text-warn" />
                              )}
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  ))}
                </ScrollArea>
              </div>

              {/* Challenge Content */}
              <div className="flex-1 flex flex-col min-h-0 relative">
                {/* Matrix Rain Background Effect */}
                <MatrixRain isActive={showMatrixRain} />

                {/* Particle Effects */}
                <ParticleSystem isActive={showParticles} type={particleType} />

                <ScrollArea className="flex-1">
                  {selectedChallenge ? (
                    <div className="p-6 max-w-6xl space-y-6">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-between"
                      >
                        <div>
                          <h2 className="text-3xl font-bold mb-2">
                            <GlitchText text={selectedChallenge.title} />
                          </h2>
                          <div className="flex items-center gap-3">
                            {completions[selectedChallenge.id] && (
                              <TagPill variant="warning">
                                <Award className="w-3 h-3 mr-1" />
                                Completed
                              </TagPill>
                            )}
                            <TagPill variant="accent">
                              {selectedChallenge.difficulty}
                            </TagPill>
                            <TagPill variant="secondary">
                              {selectedChallenge.category}
                            </TagPill>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setIsTerminalMode(!isTerminalMode)}
                            className="px-3 py-1 bg-purple-600/20 border border-purple-500/30 rounded text-purple-300 text-sm hover:bg-purple-600/30 transition-colors"
                          >
                            {isTerminalMode ? '📟 Terminal Mode' : '📝 Simple Mode'}
                          </motion.button>
                        </div>
                      </motion.div>

                      <HolographicBorder>
                        <div className="p-6">
                          <div className="flex items-center gap-3 mb-4">
                            <Target className="w-5 h-5 text-cyan-400" />
                            <h3 className="text-xl font-bold text-cyan-300">Mission Briefing</h3>
                          </div>
                          <p className="text-slate-300 leading-relaxed mb-4">{selectedChallenge.prompt}</p>
                          {selectedChallenge.realWorldContext && (
                            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
                              <div className="text-blue-300 font-medium mb-1">🌍 Real-World Application</div>
                              <div className="text-slate-400 text-sm">{selectedChallenge.realWorldContext}</div>
                            </div>
                          )}
                        </div>
                      </HolographicBorder>

                      {/* AI Hint System */}
                      <AIHintSystem
                        challenge={selectedChallenge}
                        userCode={challengeCode}
                        attempts={attempts}
                        onHintUsed={(hint) => console.log('Hint used:', hint)}
                      />

                      {/* Algorithm Visualization */}
                      {selectedChallenge.visualization && (
                        <ChallengeVisualizer
                          type={selectedChallenge.visualization}
                          isActive={grading}
                        />
                      )}

                      <HolographicBorder>
                        <div className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <Cpu className="w-5 h-5 text-green-400" />
                              <h3 className="text-xl font-bold text-green-300">Code Terminal</h3>
                            </div>
                            <div className="flex space-x-2">
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleTryChallenge(selectedChallenge)}
                                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded font-semibold text-white flex items-center gap-2"
                              >
                                <Zap className="w-4 h-4" />
                                Debug Mode
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleGradeChallenge}
                                disabled={grading}
                                className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 rounded font-semibold text-white disabled:opacity-50 flex items-center gap-2"
                              >
                                {grading ? (
                                  <>
                                    <Cpu className="w-4 h-4 animate-spin" />
                                    Analyzing...
                                  </>
                                ) : (
                                  <>
                                    <Target className="w-4 h-4" />
                                    Grade Solution
                                  </>
                                )}
                              </motion.button>
                            </div>
                          </div>

                          {isTerminalMode ? (
                            <RetroTerminal
                              value={challengeCode}
                              onChange={setChallengeCode}
                              onRun={handleGradeChallenge}
                              isRunning={grading}
                              title={`CHALLENGE: ${selectedChallenge.id.toUpperCase()}`}
                            />
                          ) : (
                            <div className="bg-slate-900 rounded-lg border border-slate-600 overflow-hidden">
                              <div className="bg-slate-800 px-4 py-2 border-b border-slate-600">
                                <span className="text-slate-300 font-mono text-sm">assembly_solution.asm</span>
                              </div>
                              <textarea
                                value={challengeCode}
                                onChange={(e) => setChallengeCode(e.target.value)}
                                className="w-full h-64 p-4 font-mono text-sm bg-transparent border-none text-slate-200 placeholder-slate-400 focus:outline-none resize-none"
                                placeholder="Write your solution here..."
                              />
                            </div>
                          )}
                        </div>
                      </HolographicBorder>

                      {/* Starter Code Display */}
                      {selectedChallenge.starter && (
                        <HolographicBorder>
                          <div className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                              <Lightbulb className="w-5 h-5 text-yellow-400" />
                              <h3 className="text-xl font-bold text-yellow-300">Starter Template</h3>
                            </div>
                            <NeonCodeBlock code={selectedChallenge.starter} />
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => setChallengeCode(selectedChallenge.starter)}
                              className="mt-3 px-4 py-2 bg-yellow-600/20 border border-yellow-500/30 rounded text-yellow-300 hover:bg-yellow-600/30 transition-colors"
                            >
                              Load Starter Code
                            </motion.button>
                          </div>
                        </HolographicBorder>
                      )}

                      {gradeResult && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          <GlassCard className={gradeResult.passed ? 'border-ok/50' : 'border-danger/50'}>
                            <div className="p-4">
                              <div className="flex items-center mb-4">
                                {gradeResult.passed ? (
                                  <CheckCircle className="w-6 h-6 text-ok mr-3" />
                                ) : (
                                  <AlertCircle className="w-6 h-6 text-danger mr-3" />
                                )}
                                <span className={`font-medium text-lg ${gradeResult.passed ? 'text-ok' : 'text-danger'
                                  }`}>
                                  {gradeResult.passed ? 'Challenge Passed!' : 'Challenge Failed'}
                                </span>
                              </div>

                              {gradeResult.error && (
                                <div className="mb-4 p-3 bg-danger/20 border border-danger/50 rounded-lg">
                                  <div className="text-danger text-sm">
                                    <strong>Error:</strong> {gradeResult.error}
                                  </div>
                                </div>
                              )}

                              {gradeResult.results && gradeResult.results.length > 0 && (
                                <div className="space-y-2 mb-4">
                                  {gradeResult.results.map((result: any, index: number) => (
                                    <div key={index} className="flex items-center space-x-2">
                                      {result.ok ? (
                                        <CheckCircle className="w-4 h-4 text-ok" />
                                      ) : (
                                        <AlertCircle className="w-4 h-4 text-danger" />
                                      )}
                                      <span className={`text-sm ${result.ok ? 'text-ok' : 'text-danger'
                                        }`}>
                                        {result.detail || `Test ${index + 1}`}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {gradeResult.steps && (
                                <TagPill variant="accent" size="sm">
                                  Executed in {gradeResult.steps} steps
                                </TagPill>
                              )}
                            </div>
                          </GlassCard>
                        </motion.div>
                      )}

                      {selectedChallenge.hints.length > 0 && (
                        <GlassCard>
                          <PanelHeader
                            title="Hints"
                            subtitle={`${selectedChallenge.hints.length} hints available`}
                            icon={<Lightbulb className="w-4 h-4" />}
                          />
                          <div className="p-4">
                            <ul className="space-y-3">
                              {selectedChallenge.hints.map((hint, index) => (
                                <motion.li
                                  key={index}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: index * 0.1 }}
                                  className="flex items-start space-x-3 text-slate-300"
                                >
                                  <div className="w-6 h-6 bg-warn/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <span className="text-warn text-xs font-bold">{index + 1}</span>
                                  </div>
                                  <span>{hint}</span>
                                </motion.li>
                              ))}
                            </ul>
                          </div>
                        </GlassCard>
                      )}
                      {/* Live Coding Stats */}
                      <LiveCodingStats
                        code={challengeCode}
                        isActive={!!selectedChallenge}
                        onStatsUpdate={(stats) => console.log('Stats updated:', stats)}
                      />

                      {/* Badge System */}
                      <BadgeSystem
                        earnedBadges={achievements}
                        onBadgeClick={(badge) => console.log('Badge clicked:', badge)}
                      />

                      {/* Gold Standard Solution (only after completion) */}
                      {completions[selectedChallenge.id] && selectedChallenge.goldStandardSolution && (
                        <HolographicBorder>
                          <div className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                              <Award className="w-5 h-5 text-yellow-400" />
                              <h3 className="text-xl font-bold text-yellow-300">🏆 Gold Standard Solution</h3>
                            </div>
                            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4 mb-4">
                              <p className="text-yellow-200 text-sm">
                                Congratulations! Here's how a master would solve this challenge:
                              </p>
                            </div>
                            <NeonCodeBlock code={selectedChallenge.goldStandardSolution} />
                          </div>
                        </HolographicBorder>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full relative">
                      <ParticleSystem isActive={true} type="magic" />
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center space-y-6 z-10"
                      >
                        <motion.div
                          animate={{
                            scale: [1, 1.1, 1],
                            rotate: [0, 5, -5, 0]
                          }}
                          transition={{ duration: 4, repeat: Infinity }}
                          className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto shadow-2xl shadow-purple-500/50"
                        >
                          <Target className="w-12 h-12 text-white" />
                        </motion.div>
                        <div>
                          <h3 className="text-2xl font-bold text-transparent bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text mb-3">
                            Choose Your Challenge
                          </h3>
                          <p className="text-slate-400 text-lg">Select a challenge from the sidebar to begin your assembly journey</p>
                          <div className="mt-6 grid grid-cols-2 gap-4 max-w-md mx-auto">
                            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 text-center">
                              <div className="text-blue-400 font-bold text-lg">{challenges.beginner?.length || 0}</div>
                              <div className="text-blue-300 text-sm">Beginner</div>
                            </div>
                            <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3 text-center">
                              <div className="text-green-400 font-bold text-lg">{challenges.intermediate?.length || 0}</div>
                              <div className="text-green-300 text-sm">Intermediate</div>
                            </div>
                            <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-3 text-center">
                              <div className="text-orange-400 font-bold text-lg">{challenges.advanced?.length || 0}</div>
                              <div className="text-orange-300 text-sm">Advanced</div>
                            </div>
                            <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-3 text-center">
                              <div className="text-purple-400 font-bold text-lg">{challenges.expert?.length || 0}</div>
                              <div className="text-purple-300 text-sm">Expert</div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  )}
                </ScrollArea>

                {/* Spectacular Scoring Modal */}
                <SpectacularScoring
                  score={currentScore}
                  isVisible={showScoring}
                  onAnimationComplete={() => setShowScoring(false)}
                />

                {/* Progress Celebration */}
                <ProgressCelebration
                  isVisible={showProgressCelebration}
                  progress={celebrationProgress}
                  title={selectedLesson?.title || 'Lesson Complete!'}
                  onComplete={() => setShowProgressCelebration(false)}
                />

                {/* Achievement Unlock Animation */}
                <AchievementUnlock
                  isVisible={!!showAchievement}
                  title={showAchievement?.title || ''}
                  description={showAchievement?.description || ''}
                  icon={showAchievement?.icon || '🏆'}
                  onClose={() => setShowAchievement(null)}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Learn;