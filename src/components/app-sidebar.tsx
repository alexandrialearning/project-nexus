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
  FileText
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
  assignedSyllabi
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

        {/* ── Mis Recursos Asignados ────────────────────────────────── */}
        {assignedSyllabi && assignedSyllabi.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-gray-500 uppercase text-[10px] tracking-widest px-4 pt-2 pb-2 flex items-center gap-1.5">
              <BookOpen className="w-3 h-3" />
              Syllabus Escolar
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {assignedSyllabi.map((s: string, idx: number) => (
                  <SidebarMenuItem key={idx}>
                    <SidebarMenuButton className="text-[#80E0BE] hover:bg-white/5 h-12 border border-[#80E0BE]/20 rounded-xl px-4 group mb-2 cursor-default">
                      <div className="flex flex-col items-start overflow-hidden">
                        <span className="text-[10px] text-white/30 uppercase font-mono group-hover:text-[#80E0BE]/50 transition-colors">Recurso Asignado</span>
                        <span className="font-bold text-sm truncate w-full">{s.replace(/_/g, " ")}</span>
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarSeparator className="bg-white/5 mx-4" />

        <SidebarGroup>
          <SidebarGroupLabel className="text-gray-500 uppercase text-[10px] tracking-widest px-4 pt-2 pb-2">Configuración</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton className="text-gray-300 hover:text-white">
                  <BrainCircuit className="w-4 h-4" />
                  <span>Tipo de Aprendizaje</span>
                  <select
                    onChange={(e) => onLearningChange(e.target.value)}
                    className="ml-auto bg-transparent text-xs text-amber-400 outline-none border-none cursor-pointer"
                  >
                    <option value="1">Kinestésico</option>
                    <option value="2">Visual</option>
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
