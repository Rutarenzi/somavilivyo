import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Play, Pause, Volume2, Square, Settings } from 'lucide-react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ModuleAudioPlayerProps {
  content: string;
  title: string;
  className?: string;
  generatedCode?: string;
}

export function ModuleAudioPlayer({ content, title, className, generatedCode }: ModuleAudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [voiceGender, setVoiceGender] = useState<'male' | 'female'>('female');
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [isContentReady, setIsContentReady] = useState(!generatedCode);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const renderedContentRef = useRef<string>('');

  // Listen for messages from the CodeSandboxRenderer to get actual rendered text
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Listen for sandbox-ready event to enable audio
      if (event.data?.type === 'sandbox-ready' && event.data?.source === 'codesandbox') {
        console.log('🎨 UI Shell content is ready, enabling audio player');
        setIsContentReady(true);
      }
      
      // Extract text content from the rendered sandbox iframe
      if (event.data?.type === 'iframe-content') {
        try {
          const parser = new DOMParser();
          const doc = parser.parseFromString(event.data.html, 'text/html');
          
          // Remove script, style, and code elements
          const elementsToRemove = doc.querySelectorAll('script, style, code, pre');
          elementsToRemove.forEach(el => el.remove());
          
          // Get clean text content
          const textContent = doc.body.textContent || '';
          const cleanedText = textContent
            .replace(/\s+/g, ' ')
            .replace(/\n\s*\n/g, '\n')
            .trim();
          
          renderedContentRef.current = cleanedText;
          console.log('📝 Extracted rendered text from UI Shell:', cleanedText.substring(0, 100) + '...');
        } catch (error) {
          console.error('❌ Failed to extract rendered content:', error);
        }
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [generatedCode]);

  // Extract text from rendered content
  const extractTextFromContent = (): string => {
    // Priority 1: Use rendered UI shell content if available
    if (renderedContentRef.current && renderedContentRef.current.length > 50) {
      console.log('🎯 Using rendered UI shell content for audio');
      return renderedContentRef.current;
    }
    
    // Priority 2: Try to extract from DOM if sandbox hasn't loaded yet
    const sandboxIframe = document.querySelector('iframe[title="Code Sandbox"]') as HTMLIFrameElement;
    if (sandboxIframe?.contentWindow?.document) {
      try {
        const iframeDoc = sandboxIframe.contentWindow.document;
        const body = iframeDoc.body;
        
        // Remove code blocks and scripts
        const codeElements = body.querySelectorAll('script, style, code, pre');
        codeElements.forEach(el => el.remove());
        
        const textContent = body.textContent || '';
        if (textContent.length > 50) {
          console.log('🎯 Extracted text from sandbox iframe directly');
          return textContent.replace(/\s+/g, ' ').trim();
        }
      } catch (error) {
        console.warn('⚠️ Could not access iframe content (CORS):', error);
      }
    }
    
    // Fallback: Extract from HTML content (legacy)
    console.log('⚠️ Using fallback HTML extraction');
    const div = document.createElement('div');
    div.innerHTML = content;
    
    const elementsToRemove = div.querySelectorAll('script, style, code, pre');
    elementsToRemove.forEach(el => el.remove());
    
    return (div.textContent || div.innerText || '').replace(/\s+/g, ' ').trim();
  };

  // Check if browser supports speech synthesis
  const isSpeechSupported = 'speechSynthesis' in window;

  const startSpeech = () => {
    if (!isSpeechSupported) {
      toast.error('Text-to-speech is not supported in your browser');
      return;
    }

    try {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const textContent = extractTextFromContent();
      const speechText = `${title}. ${textContent}`;

      console.log('🎙️ Starting speech synthesis for:', speechText.substring(0, 100) + '...');

      const utterance = new SpeechSynthesisUtterance(speechText);
      utteranceRef.current = utterance;

      // Configure voice settings
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      // Use selected voice
      if (selectedVoice) {
        const voice = availableVoices.find(v => v.name === selectedVoice);
        if (voice) {
          utterance.voice = voice;
          console.log('🎙️ Using voice:', voice.name);
        }
      }

      utterance.onstart = () => {
        setIsPlaying(true);
        setIsPaused(false);
        console.log('🎙️ Speech started');
      };

      utterance.onend = () => {
        setIsPlaying(false);
        setIsPaused(false);
        console.log('🎙️ Speech ended');
      };

      utterance.onerror = (event) => {
        console.error('❌ Speech error:', event);
        setIsPlaying(false);
        setIsPaused(false);
        toast.error('Failed to play audio. Please try again.');
      };

      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('❌ Audio generation error:', error);
      toast.error('Failed to generate audio. Please try again.');
    }
  };

  const pauseSpeech = () => {
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
      setIsPlaying(false);
    }
  };

  const resumeSpeech = () => {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsPlaying(true);
    }
  };

  const stopSpeech = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  // Load and filter voices by gender
  const getFilteredVoices = () => {
    const maleKeywords = ['male', 'man', 'david', 'james', 'george', 'arthur', 'daniel', 'paul'];
    const femaleKeywords = ['female', 'woman', 'samantha', 'victoria', 'fiona', 'karen', 'moira', 'tessa', 'kate'];
    
    return availableVoices.filter(voice => {
      const lowerName = voice.name.toLowerCase();
      const lowerLang = voice.lang.toLowerCase();
      
      // Only English voices
      if (!lowerLang.startsWith('en')) return false;
      
      if (voiceGender === 'male') {
        return maleKeywords.some(keyword => lowerName.includes(keyword)) || lowerName.includes('male');
      } else {
        return femaleKeywords.some(keyword => lowerName.includes(keyword)) || lowerName.includes('female');
      }
    });
  };

  // Load voices when component mounts
  useEffect(() => {
    if (isSpeechSupported) {
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          setAvailableVoices(voices);
          
          // Auto-select first voice matching gender preference
          const filteredVoices = voices.filter(voice => {
            const lowerName = voice.name.toLowerCase();
            const lowerLang = voice.lang.toLowerCase();
            if (!lowerLang.startsWith('en')) return false;
            
            const femaleKeywords = ['female', 'woman', 'samantha', 'victoria', 'fiona', 'karen'];
            return femaleKeywords.some(keyword => lowerName.includes(keyword));
          });
          
          const defaultVoice = filteredVoices[0] || voices.find(voice => voice.lang.startsWith('en')) || voices[0];
          
          if (defaultVoice) {
            setSelectedVoice(defaultVoice.name);
          }
        }
      };
      
      // Load voices immediately
      loadVoices();
      
      // Also listen for voices changed event
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);
  
  // Update selected voice when gender changes
  useEffect(() => {
    const filteredVoices = getFilteredVoices();
    if (filteredVoices.length > 0 && !filteredVoices.find(v => v.name === selectedVoice)) {
      setSelectedVoice(filteredVoices[0].name);
    }
  }, [voiceGender]);

  const filteredVoicesList = getFilteredVoices();

  return (
    <Card className={`p-4 md:p-6 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-2 border-indigo-200 shadow-lg ${className}`}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl shadow-md">
              <Volume2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-base md:text-lg">🎧 Listen to this Module</p>
              <p className="text-sm text-gray-600 mt-0.5">
                {!isContentReady 
                  ? "Waiting for personalized content to load..." 
                  : isSpeechSupported 
                    ? "Free browser-powered audio narration" 
                    : "Audio not supported in your browser"}
              </p>
            </div>
          </div>

          {isSpeechSupported && isContentReady && (
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowSettings(!showSettings)}
                variant="outline"
                size="icon"
                className="border-indigo-300 hover:bg-indigo-50"
                title="Voice settings"
              >
                <Settings className="h-4 w-4" />
              </Button>
              
              {!isPlaying && !isPaused ? (
                <Button
                  onClick={startSpeech}
                  variant="default"
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!isContentReady}
                >
                  <Play className="h-4 w-4 mr-2" />
                  {isContentReady ? 'Play Audio' : 'Loading...'}
                </Button>
              ) : isPaused ? (
                <>
                  <Button
                    onClick={resumeSpeech}
                    variant="default"
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Resume
                  </Button>
                  <Button
                    onClick={stopSpeech}
                    variant="outline"
                    size="icon"
                    className="border-indigo-300 hover:bg-indigo-50"
                  >
                    <Square className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={pauseSpeech}
                    variant="default"
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md"
                  >
                    <Pause className="h-4 w-4 mr-2" />
                    Pause
                  </Button>
                  <Button
                    onClick={stopSpeech}
                    variant="outline"
                    size="icon"
                    className="border-indigo-300 hover:bg-indigo-50"
                  >
                    <Square className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Voice Settings Panel */}
        {showSettings && isSpeechSupported && isContentReady && (
          <div className="border-t border-indigo-200 pt-4 animate-in slide-in-from-top-2 duration-200">
            <div className="space-y-4">
              {/* Gender Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Voice Gender</label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={voiceGender === 'female' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setVoiceGender('female')}
                    className={voiceGender === 'female' ? 'bg-indigo-600 hover:bg-indigo-700' : 'border-indigo-300'}
                  >
                    Female Voice
                  </Button>
                  <Button
                    type="button"
                    variant={voiceGender === 'male' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setVoiceGender('male')}
                    className={voiceGender === 'male' ? 'bg-indigo-600 hover:bg-indigo-700' : 'border-indigo-300'}
                  >
                    Male Voice
                  </Button>
                </div>
              </div>

              {/* Voice Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Select Specific Voice</label>
                <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                  <SelectTrigger className="w-full md:w-[300px] bg-white">
                    <SelectValue placeholder="Choose a voice" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredVoicesList.length > 0 ? (
                      filteredVoicesList.map((voice) => (
                        <SelectItem key={voice.name} value={voice.name}>
                          {voice.name} ({voice.lang})
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>
                        No {voiceGender} voices available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  {filteredVoicesList.length} {voiceGender} voice{filteredVoicesList.length !== 1 ? 's' : ''} available
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
