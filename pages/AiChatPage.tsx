import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAppContext, Page } from '../context/AppContext';
import { AiMessage, OnboardingQuestion, RelationshipType } from '../types';
import { geminiService } from '../services/geminiService';

const OnboardingHeader: React.FC = () => {
  const { onboardingProgress } = useAppContext();
  return (
    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
      <p className="text-sm text-center text-gray-600 dark:text-gray-300 mb-2">Onboarding Progress</p>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
        <div className="bg-rose-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${onboardingProgress}%` }}></div>
      </div>
    </div>
  );
};

const PostOnboardingHeader: React.FC = () => {
    const { user } = useAppContext();
    return (
        <div className="p-4 bg-gradient-to-r from-rose-50 to-teal-50 dark:from-gray-800 dark:to-slate-800 border-b border-rose-200 dark:border-gray-700 animate-fade-in">
            <div className="flex items-center gap-4">
                <img src={user?.avatar} alt="your avatar" className="w-12 h-12 rounded-full border-2 border-white dark:border-gray-300 shadow-md"/>
                <div>
                    <h2 className="font-bold text-lg text-gray-800 dark:text-white">Welcome back, {user?.name}!</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Your journey continues. Chat more to refine your matches.</p>
                </div>
            </div>
        </div>
    );
};

const AiChatPage: React.FC = () => {
  const {
    user,
    onboardingProgress,
    updateOnboardingProgress,
    completeOnboarding,
    updateUserTagsInProfile,
    aiChatMessages,
    addAiChatMessage,
    updateAiChatMessage,
    setAiChatMessages,
    onboardingStep,
    updateOnboardingStep,
    userTags,
    updateUserTags,
    selectedRelationshipGoal,
    setSelectedRelationshipGoal,
  } = useAppContext();

  // Local state for this component only
  const [onboardingQuestions, setOnboardingQuestions] = useState<OnboardingQuestion[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [userInput, setUserInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiChatMessages, isTyping]);

  const handleOnboardingAnswer = useCallback((questionIndex: number, answer: string) => {
    updateAiChatMessage(`q-${questionIndex}`, { options: undefined });
    addAiChatMessage({ id: Date.now().toString(), sender: 'user', text: answer });
    
    const newTags = { ...userTags };
    newTags.positive.push(answer.toLowerCase().replace(/\s+/g, '-'));
    updateUserTags(newTags);

    const nextOnboardingStep = onboardingStep + 1;
    updateOnboardingStep(nextOnboardingStep);
    const totalSteps = onboardingQuestions.length + 1;
    updateOnboardingProgress((nextOnboardingStep / totalSteps) * 100);

    const nextQuestionIndex = questionIndex + 1;

    setIsTyping(true);
    setTimeout(() => {
        setIsTyping(false);
        if (nextQuestionIndex < onboardingQuestions.length) {
            addAiChatMessage({
                id: `q-${nextQuestionIndex}`,
                sender: 'ai',
                text: onboardingQuestions[nextQuestionIndex].question,
                options: onboardingQuestions[nextQuestionIndex].options,
                onOptionSelect: (option) => handleOnboardingAnswer(nextQuestionIndex, option),
            });
        } else {
            completeOnboarding(selectedRelationshipGoal!, newTags);
            addAiChatMessage({
                id: 'onboarding-complete',
                sender: 'ai',
                text: "Perfect, that's everything for now! I've unlocked the Explore and Chat tabs for you. Go ahead and tap on Explore to see who you could match with!",
            });
        }
    }, 1000);
  }, [updateAiChatMessage, addAiChatMessage, userTags, updateUserTags, onboardingStep, updateOnboardingStep, updateOnboardingProgress, onboardingQuestions, completeOnboarding, selectedRelationshipGoal]);

  const handleRelationshipTypeSelect = useCallback(async (type: RelationshipType) => {
    setSelectedRelationshipGoal(type);
    updateAiChatMessage('initial', { options: undefined });
    addAiChatMessage({ id: Date.now().toString(), sender: 'user', text: type });
    setIsTyping(true);
    const questions = await geminiService.getOnboardingQuestions(type);
    setOnboardingQuestions(questions);
    
    const initialTags = {
        positive: [type.toLowerCase().replace(' ', '-')],
        negative: []
    };
    updateUserTags(initialTags);
    
    if (questions.length > 0) {
      setTimeout(() => {
        setIsTyping(false);
        addAiChatMessage({
          id: `q-0`,
          sender: 'ai',
          text: questions[0].question,
          options: questions[0].options,
          onOptionSelect: (option) => handleOnboardingAnswer(0, option),
        });
        updateOnboardingStep(1);
        const totalSteps = questions.length + 1;
        updateOnboardingProgress((1 / totalSteps) * 100);
      }, 1000);
    } else {
        setIsTyping(false);
        completeOnboarding(type, initialTags);
        addAiChatMessage({
           id: 'onboarding-complete',
           sender: 'ai',
           text: "Perfect, that's everything for now! I've unlocked the Explore and Chat tabs for you. Go ahead and tap on Explore to see who you could match with!",
        });
    }
  }, [setSelectedRelationshipGoal, updateAiChatMessage, addAiChatMessage, updateUserTags, handleOnboardingAnswer, updateOnboardingStep, updateOnboardingProgress, completeOnboarding]);

  const initialQuestion = useMemo((): AiMessage => ({
    id: 'initial',
    sender: 'ai',
    text: "Welcome! I'm here to help you find a connection. What kind of relationship are you looking for?",
    options: Object.values(RelationshipType),
    onOptionSelect: (option) => handleRelationshipTypeSelect(option as RelationshipType),
  }), [handleRelationshipTypeSelect]);

  useEffect(() => {
    if (user && aiChatMessages.length === 0) {
        if (!user.onboardingCompleted) {
            setAiChatMessages([initialQuestion]);
        } else {
            addAiChatMessage({
                id: 'post-onboarding-welcome',
                sender: 'ai',
                text: `Welcome back, ${user.name}! You can continue our chat to refine your profile, or head to the Explore page to see your matches.`,
            });
        }
    }
  }, [user, aiChatMessages.length, setAiChatMessages, addAiChatMessage, initialQuestion]);

  const handleFreeformSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!userInput.trim() || isTyping || !user) return;
      
      const userMessageText = userInput.trim();
      const userMessage: AiMessage = { id: Date.now().toString(), sender: 'user', text: userMessageText };
      
      addAiChatMessage(userMessage);
      setUserInput('');
      setIsTyping(true);
      
      // Update profile tags in the background. Pass existing tags to get more relevant new tags.
      geminiService.analyzeTextForTags(userMessageText).then(newTags => {
  
        if (newTags.positive.length > 0 || newTags.negative.length > 0) {
          updateUserTagsInProfile(newTags);
        }
      });

      // Generate a dynamic follow-up question from the AI
      try {
        // Pass the full conversation including the new user message for context
        const fullConversation = [...aiChatMessages, userMessage];
        const followUpQuestion = await geminiService.generateFollowUpQuestion(fullConversation);
        
        addAiChatMessage({
            id: `response-${Date.now()}`,
            sender: 'ai',
            text: followUpQuestion,
        });
      } catch (error) {
          console.error("Failed to get AI response:", error);
          // Add a generic fallback message in case of an error
          addAiChatMessage({
              id: `error-${Date.now()}`,
              sender: 'ai',
              text: "I had a little trouble thinking of a response. Could you tell me something else interesting about yourself?",
          });
      } finally {
        setIsTyping(false);
      }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {user?.onboardingCompleted ? <PostOnboardingHeader /> : <OnboardingHeader />}
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {aiChatMessages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`flex items-end gap-2 max-w-sm ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
              {msg.sender === 'ai' && <img src="https://picsum.photos/seed/ai/200" alt="AI" className="w-8 h-8 rounded-full"/>}
              <div className={`px-4 py-2 rounded-2xl ${msg.sender === 'user' ? 'bg-rose-500 text-white rounded-br-none' : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-none shadow-sm'}`}>
                <p>{msg.text}</p>
              </div>
            </div>
            {msg.options && (
              <div className="flex flex-wrap gap-2 mt-3 ml-10">
                {msg.options.map((option) => (
                  <button
                    key={option}
                    onClick={() => msg.onOptionSelect?.(option)}
                    className="bg-white dark:bg-gray-700 text-rose-500 dark:text-rose-400 border border-rose-300 dark:border-gray-600 px-3 py-1.5 rounded-full text-sm hover:bg-rose-50 dark:hover:bg-gray-600 transition"
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        {isTyping && (
          <div className="flex items-end gap-2 max-w-sm">
            <img src="https://picsum.photos/seed/ai/200" alt="AI" className="w-8 h-8 rounded-full"/>
            <div className="px-4 py-2 rounded-2xl bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-none shadow-sm">
              <div className="flex items-center space-x-1">
                <span className="h-2 w-2 bg-rose-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="h-2 w-2 bg-rose-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="h-2 w-2 bg-rose-400 rounded-full animate-bounce"></span>
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {user?.onboardingCompleted && (
        <div className="p-4 bg-white dark:bg-black border-t border-gray-200 dark:border-gray-700">
          <form onSubmit={handleFreeformSubmit} className="flex items-center gap-2">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Tell me more about you..."
              className="flex-1 w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-full focus:outline-none focus:ring-2 focus:ring-rose-400 text-gray-800 dark:text-gray-200"
              disabled={isTyping}
            />
            <button type="submit" disabled={isTyping || !userInput.trim()} className="p-2 bg-rose-500 text-white rounded-full disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-rose-600 transition">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default AiChatPage;