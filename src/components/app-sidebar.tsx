import * as React from "react"
import logoUrl from "@/assets/logo.png";
import {
  Trash2,
  BrainCircuit,
  Settings,
  LogOut,
  PlusCircle,
  MessageSquare,
  BookOpen,
  FileText,
  RefreshCw,
  AlertCircle
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";

export function AppSidebar({
  onClearHistory,
  onLearningChange,
  conversations,
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  assignedSyllabi,
  userEmail,
  MASTER_API_URL
}: any) {
  const handleLogout = () => {
    signOut(auth);
  };

  return (
    <Sidebar className="bg-zinc-950 border-r border-white/5">
      <SidebarHeader className="px-6 pb-0 pt-0 border-b border-white/5 overflow-hidden">
        <div className="flex items-center justify-center w-full -mt-4 md:-mt-10 -mb-4 md:-mb-10">
          <img src={logoUrl} alt="Alexandr.ia Logo" className="h-[150px] md:h-[200px] w-full object-contain object-top opacity-100" />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-gray-500 uppercase text-[10px] tracking-widest px-4 pt-2 pb-2">Chats</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={onNewConversation} className="text-[#80E0BE] hover:text-[#5bc4a0] hover:bg-white/5 font-bold">
                  <PlusCircle className="w-4 h-4" />
                  <span>Nueva Conversación</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {conversations?.map((conv: any) => (
                <SidebarMenuItem key={conv.id} className="group relative">
                  <SidebarMenuButton
                    onClick={() => onSelectConversation(conv.id)}
                    className={`text-gray-300 hover:text-white pr-8 ${currentConversationId === conv.id ? 'bg-white/10 text-white' : ''}`}
                  >
                    <MessageSquare className="shrink-0 w-4 h-4" />
                    <span className="truncate block flex-1 overflow-hidden whitespace-nowrap text-ellipsis">{conv.title}</span>
                  </SidebarMenuButton>
                  <button
                    onClick={(e) => onDeleteConversation(conv.id, e)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Borrar chat"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="bg-white/5 mx-4" />

        {/* ── BIBLIOTECA ASIGNADA (MÁS VISIBLE) ───────────────────────── */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[#80E0BE] uppercase text-[10px] font-bold tracking-[0.2em] px-4 pt-4 pb-2 flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5" />
            Biblioteca Asignada
          </SidebarGroupLabel>
          <SidebarGroupContent className="px-2">
            <SidebarMenu>
              {assignedSyllabi && assignedSyllabi.length > 0 ? (
                assignedSyllabi.map((s: any, idx: number) => (
                  <SidebarMenuItem key={idx} className="mb-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <SidebarMenuButton className="h-16 w-full bg-gradient-to-br from-white/10 to-transparent hover:from-[#80E0BE]/20 border border-white/10 hover:border-[#80E0BE]/40 rounded-2xl px-4 flex items-center gap-3 transition-all group">
                          <div className="bg-[#80E0BE]/20 p-2 rounded-xl text-[#80E0BE] group-hover:scale-110 transition-transform">
                            <BookOpen className="w-5 h-5" />
                          </div>
                          <div className="flex flex-col items-start overflow-hidden">
                            <span className="text-[9px] text-white/40 uppercase tracking-widest font-bold">Ver libros de:</span>
                            <span className="font-bold text-sm text-white truncate w-full">{s.temario.replace(/_/g, " ")}</span>
                          </div>
                        </SidebarMenuButton>
                      </DialogTrigger>
                      
                      <DialogContent className="bg-zinc-950 border-white/10 text-white max-w-2xl max-h-[80vh] overflow-y-auto backdrop-blur-xl shadow-[0_0_100px_-20px_rgba(128,224,190,0.2)]">
                        <DialogHeader className="border-b border-white/5 pb-4 mb-4 flex flex-row items-center justify-between">
                          <DialogTitle className="text-[#80E0BE] text-xl flex items-center gap-3">
                            <div className="bg-[#80E0BE]/10 p-2 rounded-lg">
                              <BookOpen className="w-6 h-6" />
                            </div>
                            {s.temario.replace(/_/g, " ")}
                          </DialogTitle>
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (!MASTER_API_URL) return;
                              try {
                                const response = await fetch(`${MASTER_API_URL}/user/syllabus/sync`, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    user_id: userEmail || "anonymous",
                                    syllabus_prefix: s.temario + "/"
                                  })
                                });
                                const data = await response.json();
                                alert(data.message || "Sincronización iniciada");
                              } catch (err) {
                                alert("Error al sincronizar");
                              }
                            }}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#80E0BE]/10 text-[#80E0BE] hover:bg-[#80E0BE]/20 transition-all text-xs font-bold uppercase tracking-wider"
                            title="Haz clic aquí después de subir nuevos PDFs para que la IA los pueda leer"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            Sincronizar IA
                          </button>
                        </DialogHeader>
                        
                        <div className="grid gap-3">
                          {s.archivos && s.archivos.length > 0 ? (
                            s.archivos.map((archivo: any) => (
                              <a 
                                key={archivo.archivo} 
                                href={archivo.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-[#80E0BE]/30 hover:bg-white/10 transition-all flex items-center gap-4 group"
                              >
                                <div className="p-3 rounded-xl bg-red-500/10 text-red-400 group-hover:scale-110 transition-transform">
                                  <FileText size={24} />
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-bold text-sm text-white group-hover:text-[#80E0BE] transition-colors">{archivo.nombre}</h4>
                                  <p className="text-[10px] text-white/40 uppercase tracking-tight mt-1">PDF Asignado • Clic para abrir</p>
                                </div>
                              </a>
                            ))
                          ) : (
                            <div className="text-center py-10 space-y-2">
                               <AlertCircle className="w-10 h-10 text-white/10 mx-auto" />
                               <p className="text-sm text-white/50 italic">No se encontraron archivos en este temario.</p>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </SidebarMenuItem>
                ))
              ) : (
                <div className="px-4 py-6 border border-dashed border-white/10 rounded-2xl text-center space-y-2 opacity-50">
                  <p className="text-[10px] text-white/40 uppercase tracking-widest">Buscando recursos...</p>
                  <div className="h-1 w-20 bg-white/5 mx-auto rounded-full overflow-hidden">
                    <div className="h-full w-1/2 bg-[#80E0BE] animate-shimmer"></div>
                  </div>
                </div>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="bg-white/5 mx-4" />

        <SidebarGroup>
          <SidebarGroupLabel className="text-gray-500 uppercase text-[10px] tracking-widest px-4 pt-2 pb-2">Configuración</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton className="text-gray-300 hover:text-white h-auto py-2 flex-col items-start gap-2">
                  <div className="flex items-center gap-2 w-full">
                    <BrainCircuit className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="text-xs">Estilo de Aprendizaje</span>
                  </div>
                  <select
                    onChange={(e) => onLearningChange(e.target.value)}
                    className="w-full bg-white/5 text-xs text-amber-400 outline-none border border-white/10 rounded-lg px-2 py-1.5 cursor-pointer"
                  >
                    <option value="auto">🤖 Modo Adaptativo (IA)</option>
                    <optgroup label="── Percepción Sensorial">
                      <option value="visual">🖼️ Visual</option>
                      <option value="auditivo">🎧 Auditivo (Aural)</option>
                      <option value="lectura_escritura">📝 Lectura/Escritura</option>
                      <option value="kinestesico">🤸 Kinestésico</option>
                    </optgroup>
                    <optgroup label="── Procesamiento Cognitivo">
                      <option value="activo">⚡ Activo</option>
                      <option value="reflexivo">🔍 Reflexivo</option>
                      <option value="teorico">📐 Teórico</option>
                      <option value="pragmatico">🔧 Pragmático</option>
                    </optgroup>
                  </select>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="bg-white/5 mx-4" />

        <SidebarGroup>
          <SidebarGroupLabel className="text-gray-500 uppercase text-[10px] tracking-widest px-4 pt-6 pb-2">Acciones</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>

              <SidebarMenuItem>
                <SidebarMenuButton onClick={onClearHistory} className="text-gray-300 hover:text-red-400">
                  <Trash2 className="w-4 h-4" />
                  <span>Limpiar Historial</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-white/5">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} className="text-gray-500 hover:text-white w-full">
              <LogOut className="w-4 h-4" />
              <span>Cerrar Sesión</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
