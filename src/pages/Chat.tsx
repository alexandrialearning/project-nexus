import { useState, useRef, useEffect, useCallback } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Menu, Loader2, Mic, MicOff, Volume2, MessageCircle } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { User } from "firebase/auth";
import {
  collection, addDoc, query, orderBy, getDocs,
  serverTimestamp, deleteDoc, doc, onSnapshot
} from "firebase/firestore";

type Message = { 
  role: string; 
  content: string; 
  id?: string; 
  visualization?: string; 
};

const ELEVENLABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY;
const ELEVENLABS_VOICE_ID = import.meta.env.VITE_ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM";

import ParticleFlower from "@/components/ParticleFlower";

export default function Chat({ user }: { user: User }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [learningType, setLearningType] = useState("1");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const intensityRef = useRef<number>(0);
  const audioCtxRef = useRef<any>(null);
  const analyserRef = useRef<any>(null);
  const analyzeReqRef = useRef<number | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);

  const [conversations, setConversations] = useState<{ id: string, title: string, timestamp: any }[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [temario, setTemario] = useState<{ temario: string; archivos: { nombre: string; archivo: string; url: string }[] } | null>(null);

  // URL Hardcoded para evitar fallos de configuración
  const MASTER_API_URL = "https://alexandria-v2-master-736878482690.us-central1.run.app";

  useEffect(() => {
    fetch(`${MASTER_API_URL}/temario`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setTemario(data); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const loadConvos = async () => {
      try {
        const ref = collection(db, "users", user.uid, "conversations");
        const q = query(ref, orderBy("timestamp", "desc"));
        const snapshot = await getDocs(q);
        const loaded = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as any));
        setConversations(loaded);
        if (loaded.length > 0) setCurrentConversationId(loaded[0].id);
      } catch (err) { console.warn("Error cargando conversaciones", err); }
    };
    loadConvos();
  }, [user.uid]);

  useEffect(() => {
    if (!currentConversationId) {
      setMessages([]);
      return;
    }
    const ref = collection(db, "users", user.uid, "conversations", currentConversationId, "messages");
    const q = query(ref, orderBy("timestamp", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loaded: Message[] = snapshot.docs.map(d => ({
        id: d.id,
        role: d.data().role,
        content: d.data().content,
        visualization: d.data().visualization,
      }));
      setMessages(loaded);
    });
    return () => unsubscribe();
  }, [currentConversationId, user.uid]);

  const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); };
  useEffect(() => { scrollToBottom(); }, [messages]);

  const saveMessage = async (role: string, content: string, explicitConvId?: string | null, visualization?: string) => {
    try {
      let convId = explicitConvId || currentConversationId;
      if (!convId) {
        const fallbackTitle = content.substring(0, 30);
        const convRef = await addDoc(collection(db, "users", user.uid, "conversations"), {
          title: fallbackTitle,
          timestamp: serverTimestamp()
        });
        convId = convRef.id;
        setCurrentConversationId(convId);
        setConversations(prev => [{ id: convId!, title: fallbackTitle, timestamp: new Date() }, ...prev]);
      }
      const ref = collection(db, "users", user.uid, "conversations", convId!, "messages");
      const docRef = await addDoc(ref, { role, content, visualization: visualization || null, timestamp: serverTimestamp() });
      return { msgId: docRef.id, convId: convId! };
    } catch (err) { return undefined; }
  };

  const sendMessage = async (messageText: string, fromVoice: boolean = false) => {
    if (!messageText.trim() || isLoading) return;
    setIsLoading(true);
    let activeConvId = currentConversationId;
    setMessages(prev => [...prev, { role: "user", content: messageText }]);
    
    try {
        const result = await saveMessage("user", messageText, activeConvId);
        if (result) activeConvId = result.convId;
    } catch(e) {}

    let response;
    try {
      response = await fetch(`${MASTER_API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.email || "anonymous",
          user_question: messageText,
          alexandria_type_learning: parseInt(learningType),
          temario_prefix: temario?.temario ? `${temario.temario}/` : null
        })
      });

      if (!response.ok) {
          const errorBody = await response.json().catch(() => ({ detail: "Cerebro desconectado" }));
          throw new Error(errorBody.detail || `HTTP ${response.status}`);
      }

      const data = await response.json();
      const answerText = data.chatbot_answer;
      const visualization = data.chatbot_answer_visualization;

      await saveMessage("assistant", answerText, activeConvId, visualization);
      if (fromVoice) speakWithElevenLabs(answerText);

    } catch (error: any) {
      console.error("❌ FALLO:", error);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: `❌ ERROR DEL SERVIDOR:\n${error.message || "Error desconocido"}`
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const speakWithElevenLabs = useCallback(async (text: string) => {
    if (!ELEVENLABS_API_KEY) {
      console.warn("ElevenLabs API Key missing");
      return;
    }
    if (isSpeaking) return; // Prevent multiple overlaps
    setIsSpeaking(true);
    try {
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}/stream`, {
        method: "POST",
        headers: { "xi-api-key": ELEVENLABS_API_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ text, model_id: "eleven_multilingual_v2" }),
      });
      
      if (!response.ok) throw new Error("ElevenLabs API failure");
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.crossOrigin = "anonymous";
      audioRef.current = audio;

      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') await ctx.resume();

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const source = ctx.createMediaElementSource(audio);
      source.connect(analyser);
      analyser.connect(ctx.destination);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateIntensity = () => {
        if (!analyserRef.current) return;
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) sum += dataArray[i];
        const average = sum / bufferLength;
        // Non-linear boost for more drama
        const norm = average / 100;
        intensityRef.current = Math.min(1.5, Math.pow(norm, 1.2) * 2); 
        
        if (!audio.paused && !audio.ended) {
          analyzeReqRef.current = requestAnimationFrame(updateIntensity);
        } else {
          intensityRef.current = 0;
        }
      };

      audio.onplay = () => {
        setIsVoiceMode(true);
        updateIntensity();
      };
      audio.onended = () => {
        setIsSpeaking(false);
        setIsVoiceMode(false);
        audioRef.current = null;
        intensityRef.current = 0;
        if (analyzeReqRef.current) cancelAnimationFrame(analyzeReqRef.current);
      };
      
      await audio.play();
    } catch (err) { 
      console.error("ElevenLabs Error:", err);
      setIsSpeaking(false);
      setIsVoiceMode(false);
    }
  }, []);

  const startListening = async () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    
    setIsVoiceMode(true);
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = "es-MX";
    recognition.onstart = () => {
      setIsListening(true);
      // Mic visualization
      navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        micStreamRef.current = stream;
        if (!audioCtxRef.current) {
          audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        const ctx = audioCtxRef.current;
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        const updateIntensity = () => {
          if (!micStreamRef.current) { intensityRef.current = 0; return; }
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < bufferLength; i++) sum += dataArray[i];
          const average = sum / bufferLength;
          intensityRef.current = Math.min(1.5, average / 30);
          analyzeReqRef.current = requestAnimationFrame(updateIntensity);
        };
        updateIntensity();
      }).catch(err => console.error("Mic access denied", err));
    };
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setIsListening(false);
      // Removed setIsVoiceMode(false) - let it stay until speaker finishes
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach(t => t.stop());
        micStreamRef.current = null;
      }
      sendMessage(transcript, true);
    };
    recognition.onerror = () => {
      setIsListening(false);
      // setIsVoiceMode(false) - only close via button or on end speak
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach(t => t.stop());
        micStreamRef.current = null;
      }
    };
    recognition.onend = () => {
      setIsListening(false);
      // setIsVoiceMode(false) - stay active
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach(t => t.stop());
        micStreamRef.current = null;
      }
    };
    recognition.start();
  };

  const stopVoiceMode = () => {
    setIsVoiceMode(false);
    setIsListening(false);
    setIsSpeaking(false);
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch(e) {}
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(t => t.stop());
      micStreamRef.current = null;
    }
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
      } catch(e) {}
    }
    intensityRef.current = 0;
    if (analyzeReqRef.current) cancelAnimationFrame(analyzeReqRef.current);
  };

  const stopListening = () => { setIsListening(false); };
  const stopSpeaking = () => { setIsSpeaking(false); };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input;
    setInput("");
    await sendMessage(text);
  };

  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("¿Estás seguro de que quieres borrar esta conversación?")) return;
    try {
      await deleteDoc(doc(db, "users", user.uid, "conversations", id));
      setConversations(prev => prev.filter(c => c.id !== id));
      if (currentConversationId === id) setCurrentConversationId(null);
    } catch (err) {
      console.error("Error al borrar:", err);
    }
  };

  const handleClearHistory = async () => {
    if (!confirm("¿Estás seguro de que quieres borrar TODO el historial? Esta acción no se puede deshacer.")) return;
    try {
      const ref = collection(db, "users", user.uid, "conversations");
      const snapshot = await getDocs(ref);
      const batch = snapshot.docs.map(d => deleteDoc(d.ref));
      await Promise.all(batch);
      setConversations([]);
      setCurrentConversationId(null);
    } catch (err) {
      console.error("Error al limpiar historial:", err);
    }
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-zinc-950 text-white overflow-hidden">
        <AppSidebar
          onClearHistory={handleClearHistory}
          onLearningChange={setLearningType}
          conversations={conversations}
          currentConversationId={currentConversationId}
          onSelectConversation={setCurrentConversationId}
          onNewConversation={() => setCurrentConversationId(null)}
          onDeleteConversation={handleDeleteConversation}
          temario={temario}
        />

        <main className="flex-1 flex flex-col relative h-full overflow-hidden bg-zinc-950">
          {/* Particles Voice Mode Overlay */}
          <div className={`absolute inset-0 transition-opacity duration-700 bg-zinc-950 z-[100] ${isVoiceMode ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
             {isVoiceMode && <ParticleFlower intensityRef={intensityRef} />}
             <div className="absolute inset-x-0 bottom-0 flex flex-col items-center justify-end pb-24 md:pb-32 h-full pointer-events-none">
                <div className="text-center space-y-8 z-10 px-4 pointer-events-auto">
                  <p className="text-white/40 text-lg md:text-xl font-light tracking-wide italic">
                    {isLoading ? "Pensando..." : "Modo Voz Activado"}
                  </p>
                  <Button 
                    onClick={stopVoiceMode}
                    variant="outline" 
                    className="border-white/20 bg-white/5 hover:bg-[#80E0BE] hover:text-black rounded-full px-10 py-6 text-white transition-all transform hover:scale-105"
                  >
                    Regresar al chat
                  </Button>
                </div>
             </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 md:p-8 relative z-10">
            <div className="max-w-4xl mx-auto space-y-6 pb-36">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex flex-col gap-3 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  {/* Mensaje de Texto (Premium Glassmorphism) */}
                  <div className={`p-5 rounded-2xl whitespace-pre-wrap max-w-[85%] md:max-w-[75%] shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-[#80E0BE] text-black font-semibold' 
                      : 'bg-white/5 text-gray-200 border border-white/10 backdrop-blur-md'
                  }`}>
                    {msg.content}
                  </div>
                  
                  {/* Visualización Anti-Distorsión (Modo Galería) */}
                  {msg.visualization && (
                    <div className="w-full max-w-2xl mt-2 group relative overflow-hidden rounded-2xl border border-white/10 shadow-2xl transition-all duration-500 hover:border-[#80E0BE]/30">
                       <div className="aspect-video w-full bg-black/40 flex items-center justify-center overflow-hidden backdrop-blur-sm">
                         <img 
                            src={msg.visualization} 
                            alt="Visualización educativa" 
                            className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-105 p-2"
                            onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                            }}
                         />
                         {/* Info Overlay */}
                         <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-5 flex items-end justify-between">
                            <span className="text-white/80 text-xs font-light tracking-widest uppercase">Ilustración Educativa HQ</span>
                            <span className="text-[#80E0BE]/60 text-[10px] font-medium uppercase tracking-widest">Alexandr.ia AI</span>
                         </div>
                       </div>
                    </div>
                  )}

                  {/* Botón de Voz Mejorado */}
                  {msg.role === 'assistant' && (
                    <Button 
                      onClick={() => speakWithElevenLabs(msg.content)}
                      disabled={isSpeaking}
                      variant="ghost" 
                      size="sm" 
                      className={`text-white/20 hover:text-[#80E0BE] h-9 px-5 rounded-full flex items-center gap-3 transition-all mt-1 bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/5 group ${isSpeaking ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <Volume2 size={16} className="stroke-[1.5] group-hover:animate-pulse" />
                      <span className="text-[11px] uppercase tracking-widest font-bold">Escuchar Lección</span>
                    </Button>
                  )}
                </div>
              ))}
              {isLoading && <div className="p-4 bg-white/5 rounded-xl animate-pulse text-white/50 text-sm">Alexandría está pensando...</div>}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-4 bg-zinc-950/80 backdrop-blur-md z-20">
            <form onSubmit={handleSend} className="max-w-4xl mx-auto flex gap-2">
              <Button type="button" onClick={startListening} variant="outline" className={`rounded-full w-12 h-12 p-0 border-white/10 transition-colors ${isListening ? 'bg-[#80E0BE] text-black' : 'hover:bg-[#80E0BE] hover:text-black'}`}>
                <Mic size={24} />
              </Button>
              <Input 
                value={input} 
                onChange={(e) => setInput(e.target.value)} 
                placeholder="Pregunta a Alexandr.ia..." 
                className="flex-1 bg-white/5 rounded-full border-none focus-visible:ring-1 focus-visible:ring-[#80E0BE]/50 text-white"
              />
              <Button type="submit" className="bg-[#80E0BE] text-black rounded-full w-12 h-12 p-0 hover:bg-[#60c09e]">
                <Send size={24} />
              </Button>
            </form>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
