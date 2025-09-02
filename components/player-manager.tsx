"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { Plus, User, Trophy, Users, Calendar, BarChart3, X, ChevronRight, ChevronUp, ChevronDown, Star } from "lucide-react"
import type { Player, Match } from "../lib/types"

interface PlayerManagerProps {
  players: Player[]
  matches: Match[]
  onAddPlayer: (name: string) => void
  isAdmin: boolean
}

export function PlayerManager({ players, matches, onAddPlayer, isAdmin }: PlayerManagerProps) {
  const [newPlayerName, setNewPlayerName] = useState("")
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [showAllPlayers, setShowAllPlayers] = useState(false)
  const [showAllDivisions, setShowAllDivisions] = useState(false)

  const handleAddPlayer = () => {
    if (newPlayerName.trim() && !players.some((p) => p.name.toLowerCase() === newPlayerName.toLowerCase())) {
      onAddPlayer(newPlayerName.trim())
      setNewPlayerName("")
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddPlayer()
    }
  }

  const openPlayerDetails = (player: Player) => {
    setSelectedPlayer(player)
    setShowDetails(true)
  }

  const closePlayerDetails = () => {
    setShowDetails(false)
    setSelectedPlayer(null)
  }

  // Função para calcular estatísticas gerais do jogador (histórico completo)
  const getPlayerGeneralStats = (playerName: string) => {
    let totalWins = 0
    let totalMatches = 0
    let totalPoints = 1000 // Começa com 1000

    matches.forEach(match => {
      if (!match.players || !match.winner) return

      const isPlayerInMatch = match.players.includes(playerName)
      if (!isPlayerInMatch) return

      totalMatches++
      
      const winners = Array.isArray(match.winner) ? match.winner : [match.winner]
      const isPlayerWinner = winners.includes(playerName)
      
      if (isPlayerWinner) {
        totalWins++
        totalPoints += 50 // +50 por vitória
      } else {
        totalPoints = Math.max(1000, totalPoints - 20) // -20 por derrota, mínimo 1000
      }
    })

    return {
      totalWins,
      totalMatches,
      totalPoints,
      winRate: totalMatches > 0 ? totalWins / totalMatches : 0
    }
  }

  // Organizar jogadores por pontos calculados - do maior para o menor
  const playersWithCalculatedStats = players.map(player => {
    const stats = getPlayerGeneralStats(player.name)
    return {
      ...player,
      calculatedRating: stats.totalPoints,
      calculatedMatches: stats.totalMatches,
      calculatedWins: stats.totalWins,
      calculatedWinRate: stats.winRate
    }
  })

  const sortedPlayers = [...playersWithCalculatedStats].sort((a, b) => b.calculatedRating - a.calculatedRating)
  
  // Limitar para mostrar apenas os 10 primeiros ou todos se expandido
  const displayedPlayers = showAllPlayers ? sortedPlayers : sortedPlayers.slice(0, 10)

  // Função para calcular estatísticas detalhadas do jogador
  const getPlayerDetailedStats = (playerName: string) => {
    let individualWins = 0
    let duplaWins = 0
    let individualMatches = 0
    let duplaMatches = 0

    matches.forEach(match => {
      if (!match.players || !match.winner) return

      const isPlayerInMatch = match.players.includes(playerName)
      if (!isPlayerInMatch) return

      const winners = Array.isArray(match.winner) ? match.winner : [match.winner]
      const isPlayerWinner = winners.includes(playerName)

      if (match.type === 'individual') {
        individualMatches++
        if (isPlayerWinner) individualWins++
      } else if (match.type === 'dupla') {
        duplaMatches++
        if (isPlayerWinner) duplaWins++
      }
    })

    return { 
      individualWins, 
      duplaWins, 
      individualMatches, 
      duplaMatches,
      totalWins: individualWins + duplaWins,
      totalMatches: individualMatches + duplaMatches
    }
  }

  // Função para obter histórico de partidas do jogador
  const getPlayerMatchHistory = (playerName: string) => {
    const playerMatches = matches.filter(match => 
      match.players && match.players.includes(playerName)
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return playerMatches.map(match => {
      const winners = Array.isArray(match.winner) ? match.winner : [match.winner]
      const isPlayerWinner = winners.includes(playerName)
      const matchDate = new Date(match.date)
      const adjustedDate = new Date(matchDate.getTime() - (3 * 60 * 60 * 1000))
      
      return {
        ...match,
        isWinner: isPlayerWinner,
        formattedDate: adjustedDate.toLocaleDateString('pt-BR'),
        formattedTime: adjustedDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      }
    })
  }

  // Função para calcular estatísticas mensais do jogador
  const getPlayerMonthlyStats = (playerName: string) => {
    // Usar o mesmo padrão de fuso horário das partidas (UTC-3)
    const now = new Date()
    const adjustedNow = new Date(now.getTime() - (3 * 60 * 60 * 1000))
    const currentMonth = adjustedNow.getMonth()
    const currentYear = adjustedNow.getFullYear()
    
    let monthlyWins = 0
    let monthlyMatches = 0
    let monthlyRating = 1000
    let totalMVPCount = 0
    let mvpHistory: { month: string, year: number, wins: number }[] = []

    // Calcular estatísticas do mês atual
    matches.forEach(match => {
      if (!match.players || !match.winner || !match.date) return

      // Aplicar o mesmo ajuste de fuso horário usado nas partidas (UTC-3)
      const matchDate = new Date(match.date)
      const adjustedMatchDate = new Date(matchDate.getTime() - (3 * 60 * 60 * 1000))
      const matchMonth = adjustedMatchDate.getMonth()
      const matchYear = adjustedMatchDate.getFullYear()

      // Verificar se a partida é do mês atual
      if (matchMonth === currentMonth && matchYear === currentYear) {
        const isPlayerInMatch = match.players.includes(playerName)
        if (!isPlayerInMatch) return

        monthlyMatches++
        
        const winners = Array.isArray(match.winner) ? match.winner : [match.winner]
        const isPlayerWinner = winners.includes(playerName)
        
        if (isPlayerWinner) {
          monthlyWins++
        }
      }
    })

    // Calcular pontos mensais (apenas os pontos conquistados no mês)
    const monthlyPoints = (monthlyWins * 50) - ((monthlyMatches - monthlyWins) * 20)
    monthlyRating = Math.max(1000, 1000 + monthlyPoints)

    // Calcular histórico de MVP
    const allMonths = new Set<string>()
    matches.forEach(match => {
      if (!match.date) return
      // Aplicar o mesmo ajuste de fuso horário usado nas partidas (UTC-3)
      const matchDate = new Date(match.date)
      const adjustedMatchDate = new Date(matchDate.getTime() - (3 * 60 * 60 * 1000))
      const monthKey = `${adjustedMatchDate.getMonth()}-${adjustedMatchDate.getFullYear()}`
      allMonths.add(monthKey)
    })

    // Para cada mês, verificar se o jogador foi MVP
    allMonths.forEach(monthKey => {
      const [monthStr, yearStr] = monthKey.split('-')
      const month = parseInt(monthStr)
      const year = parseInt(yearStr)
      
      // Calcular ranking daquele mês
      const monthPlayers = players.map(player => {
        let monthWins = 0
        let monthMatches = 0
        let monthRating = 1000

        matches.forEach(match => {
          if (!match.players || !match.winner || !match.date) return

          // Aplicar o mesmo ajuste de fuso horário usado nas partidas (UTC-3)
          const matchDate = new Date(match.date)
          const adjustedMatchDate = new Date(matchDate.getTime() - (3 * 60 * 60 * 1000))
          const matchMonth = adjustedMatchDate.getMonth()
          const matchYear = adjustedMatchDate.getFullYear()

          if (matchMonth === month && matchYear === year) {
            const isPlayerInMatch = match.players.includes(player.name)
            if (!isPlayerInMatch) return

            monthMatches++
            
            const winners = Array.isArray(match.winner) ? match.winner : [match.winner]
            const isPlayerWinner = winners.includes(player.name)
            
            if (isPlayerWinner) {
              monthWins++
            }
          }
        })

        monthRating = Math.max(1000, 1000 + (monthWins * 50) - ((monthMatches - monthWins) * 20))

        return {
          ...player,
          monthStats: { monthWins, monthMatches, monthRating }
        }
      }).sort((a, b) => {
        if (b.monthStats.monthRating !== a.monthStats.monthRating) {
          return b.monthStats.monthRating - a.monthStats.monthRating
        }
        if (b.monthStats.monthWins !== a.monthStats.monthWins) {
          return b.monthStats.monthWins - a.monthStats.monthWins
        }
        return 0
      })

      // Verificar se o jogador foi MVP naquele mês
      if (monthPlayers.length > 0 && monthPlayers[0].name === playerName) {
        totalMVPCount++
        const monthName = new Date(year, month).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
        mvpHistory.push({
          month: monthName,
          year,
          wins: monthPlayers[0].monthStats.monthWins
        })
      }
    })

    return { 
      monthlyWins, 
      monthlyMatches, 
      monthlyRating, // rating total (1000 + pontos do mês)
      monthlyPoints, // pontos conquistados no mês
      monthlyWinRate: monthlyMatches > 0 ? monthlyWins / monthlyMatches : 0,
      totalMVPCount,
      mvpHistory
    }
  }

  // Função para verificar se o jogador é MVP do mês
  const isPlayerMVP = (playerName: string) => {
    const monthlyPlayers = players.map(player => {
      const monthlyStats = getPlayerMonthlyStats(player.name)
      return {
        ...player,
        monthlyStats
      }
    }).sort((a, b) => {
      if (b.monthlyStats.monthlyRating !== a.monthlyStats.monthlyRating) {
        return b.monthlyStats.monthlyRating - a.monthlyStats.monthlyRating
      }
      if (b.monthlyStats.monthlyWinRate !== a.monthlyStats.monthlyWinRate) {
        return b.monthlyStats.monthlyWinRate - a.monthlyStats.monthlyWinRate
      }
      return b.monthlyStats.monthlyWins - a.monthlyStats.monthlyWins
    })

    return monthlyPlayers.length > 0 && monthlyPlayers[0].name === playerName
  }

  // Sistema de divisões baseado em pontos - nova hierarquia
  const getRankingDivision = (rating: number) => {
    if (rating >= 8000) return { name: "Lendário", tier: "", color: "from-red-600 to-orange-600", borderColor: "border-red-400", icon: "👑" }
    if (rating >= 7300) return { name: "Grão-Mestre", tier: "I", color: "from-yellow-600 to-orange-600", borderColor: "border-yellow-400", icon: "🔱" }
    if (rating >= 7000) return { name: "Grão-Mestre", tier: "II", color: "from-yellow-500 to-orange-500", borderColor: "border-yellow-400", icon: "🔱" }
    if (rating >= 6700) return { name: "Grão-Mestre", tier: "III", color: "from-yellow-400 to-orange-400", borderColor: "border-yellow-400", icon: "🔱" }
    if (rating >= 6400) return { name: "Mestre", tier: "I", color: "from-orange-600 to-red-600", borderColor: "border-orange-400", icon: "🔶" }
    if (rating >= 6100) return { name: "Mestre", tier: "II", color: "from-orange-500 to-red-500", borderColor: "border-orange-400", icon: "🔶" }
    if (rating >= 5800) return { name: "Mestre", tier: "III", color: "from-orange-400 to-red-400", borderColor: "border-orange-400", icon: "🔶" }
    if (rating >= 5500) return { name: "Platina", tier: "I", color: "from-purple-600 to-pink-600", borderColor: "border-purple-400", icon: "💎" }
    if (rating >= 5200) return { name: "Platina", tier: "II", color: "from-purple-500 to-pink-500", borderColor: "border-purple-400", icon: "💎" }
    if (rating >= 4900) return { name: "Platina", tier: "III", color: "from-purple-400 to-pink-400", borderColor: "border-purple-400", icon: "💎" }
    if (rating >= 4600) return { name: "Diamante", tier: "I", color: "from-blue-600 to-cyan-600", borderColor: "border-blue-400", icon: "💠" }
    if (rating >= 4300) return { name: "Diamante", tier: "II", color: "from-blue-500 to-cyan-500", borderColor: "border-blue-400", icon: "💠" }
    if (rating >= 4000) return { name: "Diamante", tier: "III", color: "from-blue-400 to-cyan-400", borderColor: "border-blue-400", icon: "💠" }
    if (rating >= 3700) return { name: "Ouro", tier: "I", color: "from-yellow-600 to-amber-600", borderColor: "border-yellow-400", icon: "🥇" }
    if (rating >= 3400) return { name: "Ouro", tier: "II", color: "from-yellow-500 to-amber-500", borderColor: "border-yellow-400", icon: "🥇" }
    if (rating >= 3100) return { name: "Ouro", tier: "III", color: "from-yellow-400 to-amber-400", borderColor: "border-yellow-400", icon: "🥇" }
    if (rating >= 2800) return { name: "Prata", tier: "I", color: "from-gray-400 to-slate-400", borderColor: "border-gray-300", icon: "🥈" }
    if (rating >= 2500) return { name: "Prata", tier: "II", color: "from-gray-500 to-slate-500", borderColor: "border-gray-300", icon: "🥈" }
    if (rating >= 2200) return { name: "Prata", tier: "III", color: "from-gray-600 to-slate-600", borderColor: "border-gray-300", icon: "🥈" }
    if (rating >= 1900) return { name: "Bronze", tier: "I", color: "from-amber-600 to-orange-600", borderColor: "border-amber-400", icon: "🥉" }
    if (rating >= 1600) return { name: "Bronze", tier: "II", color: "from-amber-500 to-orange-500", borderColor: "border-amber-400", icon: "🥉" }
    if (rating >= 1300) return { name: "Bronze", tier: "III", color: "from-amber-400 to-orange-400", borderColor: "border-amber-400", icon: "🥉" }
    return { name: "Iniciante", tier: "", color: "from-gray-600 to-gray-700", borderColor: "border-gray-500", icon: "🐣" }
  }

  const getDivisionBadge = (rating: number) => {
    const division = getRankingDivision(rating)
    return (
      <Badge 
        variant="outline" 
        className={`${division.borderColor} bg-gradient-to-r ${division.color} text-white shadow-md text-xs font-bold`}
      >
        {division.icon} {division.name} {division.tier}
      </Badge>
    )
  }

  // Função para obter a próxima divisão
  const getNextDivision = (rating: number) => {
    const currentDivision = getRankingDivision(rating)
    if (currentDivision.name === "Iniciante") return { name: "Bronze", tier: "III", minRating: 1300, icon: "🥉" }
    if (currentDivision.name === "Bronze" && currentDivision.tier === "III") return { name: "Bronze", tier: "II", minRating: 1600, icon: "🥉" }
    if (currentDivision.name === "Bronze" && currentDivision.tier === "II") return { name: "Bronze", tier: "I", minRating: 1900, icon: "🥉" }
    if (currentDivision.name === "Bronze" && currentDivision.tier === "I") return { name: "Prata", tier: "III", minRating: 2200, icon: "🥈" }
    if (currentDivision.name === "Prata" && currentDivision.tier === "III") return { name: "Prata", tier: "II", minRating: 2500, icon: "🥈" }
    if (currentDivision.name === "Prata" && currentDivision.tier === "II") return { name: "Prata", tier: "I", minRating: 2800, icon: "🥈" }
    if (currentDivision.name === "Prata" && currentDivision.tier === "I") return { name: "Ouro", tier: "III", minRating: 3100, icon: "🥇" }
    if (currentDivision.name === "Ouro" && currentDivision.tier === "III") return { name: "Ouro", tier: "II", minRating: 3400, icon: "🥇" }
    if (currentDivision.name === "Ouro" && currentDivision.tier === "II") return { name: "Ouro", tier: "I", minRating: 3700, icon: "🥇" }
    if (currentDivision.name === "Ouro" && currentDivision.tier === "I") return { name: "Diamante", tier: "III", minRating: 4000, icon: "💠" }
    if (currentDivision.name === "Diamante" && currentDivision.tier === "III") return { name: "Diamante", tier: "II", minRating: 4300, icon: "💠" }
    if (currentDivision.name === "Diamante" && currentDivision.tier === "II") return { name: "Diamante", tier: "I", minRating: 4600, icon: "💠" }
    if (currentDivision.name === "Diamante" && currentDivision.tier === "I") return { name: "Platina", tier: "III", minRating: 4900, icon: "💎" }
    if (currentDivision.name === "Platina" && currentDivision.tier === "III") return { name: "Platina", tier: "II", minRating: 5200, icon: "💎" }
    if (currentDivision.name === "Platina" && currentDivision.tier === "II") return { name: "Platina", tier: "I", minRating: 5500, icon: "💎" }
    if (currentDivision.name === "Platina" && currentDivision.tier === "I") return { name: "Mestre", tier: "III", minRating: 5800, icon: "🔶" }
    if (currentDivision.name === "Mestre" && currentDivision.tier === "III") return { name: "Mestre", tier: "II", minRating: 6100, icon: "🔶" }
    if (currentDivision.name === "Mestre" && currentDivision.tier === "II") return { name: "Mestre", tier: "I", minRating: 6400, icon: "🔶" }
    if (currentDivision.name === "Mestre" && currentDivision.tier === "I") return { name: "Grão-Mestre", tier: "III", minRating: 6700, icon: "🔱" }
    if (currentDivision.name === "Grão-Mestre" && currentDivision.tier === "III") return { name: "Grão-Mestre", tier: "II", minRating: 7000, icon: "🔱" }
    if (currentDivision.name === "Grão-Mestre" && currentDivision.tier === "II") return { name: "Grão-Mestre", tier: "I", minRating: 7300, icon: "🔱" }
    if (currentDivision.name === "Grão-Mestre" && currentDivision.tier === "I") return { name: "Lendário", tier: "", minRating: 8000, icon: "👑" }
    return null
  }

  // Função para obter a divisão mínima de um rating
  const getDivisionMinRating = (rating: number) => {
    const currentDivision = getRankingDivision(rating)
    if (currentDivision.name === "Iniciante") return 1000
    if (currentDivision.name === "Bronze" && currentDivision.tier === "III") return 1300
    if (currentDivision.name === "Bronze" && currentDivision.tier === "II") return 1600
    if (currentDivision.name === "Bronze" && currentDivision.tier === "I") return 1900
    if (currentDivision.name === "Prata" && currentDivision.tier === "III") return 2200
    if (currentDivision.name === "Prata" && currentDivision.tier === "II") return 2500
    if (currentDivision.name === "Prata" && currentDivision.tier === "I") return 2800
    if (currentDivision.name === "Ouro" && currentDivision.tier === "III") return 3100
    if (currentDivision.name === "Ouro" && currentDivision.tier === "II") return 3400
    if (currentDivision.name === "Ouro" && currentDivision.tier === "I") return 3700
    if (currentDivision.name === "Diamante" && currentDivision.tier === "III") return 4000
    if (currentDivision.name === "Diamante" && currentDivision.tier === "II") return 4300
    if (currentDivision.name === "Diamante" && currentDivision.tier === "I") return 4600
    if (currentDivision.name === "Platina" && currentDivision.tier === "III") return 4900
    if (currentDivision.name === "Platina" && currentDivision.tier === "II") return 5200
    if (currentDivision.name === "Platina" && currentDivision.tier === "I") return 5500
    if (currentDivision.name === "Mestre" && currentDivision.tier === "III") return 5800
    if (currentDivision.name === "Mestre" && currentDivision.tier === "II") return 6100
    if (currentDivision.name === "Mestre" && currentDivision.tier === "I") return 6400
    if (currentDivision.name === "Grão-Mestre" && currentDivision.tier === "III") return 6700
    if (currentDivision.name === "Grão-Mestre" && currentDivision.tier === "II") return 7000
    if (currentDivision.name === "Grão-Mestre" && currentDivision.tier === "I") return 7300
    if (currentDivision.name === "Lendário") return 8000
    return 1000 // Valor padrão para divisões inferiores
  }

  return (
    <div className="space-y-6">
      {/* Add Player Form */}
      <Card className="bg-gray-800/95 border-gray-600/50 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-400 drop-shadow-sm">
            <Plus className="h-5 w-5 text-green-400" />Adicionar Novo Jogador
          </CardTitle>
          <CardDescription className="text-gray-200">
            {isAdmin 
              ? "Digite o nome do jogador para adicioná-lo ao sistema"
              : "Acesso restrito a administradores."
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder={isAdmin ? "Nome do jogador" : "Campo bloqueado para usuários"}
                value={newPlayerName}
                onChange={(e) => isAdmin && setNewPlayerName(e.target.value)}
                onKeyPress={isAdmin ? handleKeyPress : undefined}
                className={`flex-1 bg-gray-700/90 border-gray-500 text-white placeholder:text-gray-300 focus:border-green-400 focus:ring-2 focus:ring-green-400/20 transition-all duration-200 shadow-inner ${
                  !isAdmin ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                disabled={!isAdmin}
              />
              <Button
                onClick={handleAddPlayer}
                disabled={!isAdmin || !newPlayerName.trim() || players.some((p) => p.name.toLowerCase() === newPlayerName.toLowerCase())}
                className={`shadow-lg hover:shadow-xl transition-all duration-200 ${
                  isAdmin 
                    ? 'bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed' 
                    : 'bg-gray-600 cursor-not-allowed opacity-50'
                }`}
              >
                <Plus className="h-4 w-4 mr-2" />
                {isAdmin ? 'Adicionar' : 'Bloqueado'}
              </Button>
            </div>

            {players.some((p) => p.name.toLowerCase() === newPlayerName.toLowerCase()) && isAdmin && (
              <p className="text-sm text-red-400 mt-2 animate-pulse">Este jogador já existe!</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Players List */}
      <Card className="bg-gray-800/95 border-gray-600/50 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-400 drop-shadow-sm">
            <User className="h-5 w-5 text-green-400" />Jogadores Cadastrados ({players.length})
          </CardTitle>
          <CardDescription className="text-gray-200">
            Lista de jogadores organizados por pontos (maior para menor)
            {!showAllPlayers && players.length > 10 && (
              <span className="block mt-1 text-sm text-gray-400">
                Mostrando os 10 primeiros de {players.length} jogadores
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {players.length === 0 ? (
            <div className="text-center py-8 text-gray-300">
              <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum jogador cadastrado ainda.</p>
              <p className="text-sm text-gray-400">Adicione o primeiro jogador acima!</p>
            </div>
          ) : (
            <div className="max-h-64 sm:max-h-80 md:max-h-96 overflow-y-auto pr-2 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-2">
                {displayedPlayers.map((player) => (
                <div
                  key={player.id}
                    className={`p-4 border rounded-lg bg-gradient-to-br from-gray-700/80 to-gray-800/80 hover:from-gray-600/80 hover:to-gray-700/80 hover:shadow-lg hover:border-green-400/30 transition-all duration-300 backdrop-blur-sm ${
                      isPlayerMVP(player.name) ? 'border-yellow-400/50 shadow-lg' : 'border-gray-600/50'
                    }`}
                  >
                    {/* Header da Box - Nome e Divisão */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-green-400 drop-shadow-sm text-lg truncate">
                          {player.name}
                        </h3>
                      </div>
                      <div className="flex flex-col items-end gap-2 ml-3">
                        {getDivisionBadge(player.calculatedRating)}
                        <Badge variant="secondary" className="bg-green-600/90 text-white shadow-md text-sm font-medium">
                          {player.calculatedRating} pts
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Seção de Conquistas - MVP e Estatísticas */}
                    {(() => {
                      const monthlyStats = getPlayerMonthlyStats(player.name)
                      const isCurrentMVP = isPlayerMVP(player.name)
                      const hasAchievements = isCurrentMVP || monthlyStats.totalMVPCount > 0
                      
                      if (hasAchievements) {
                        return (
                          <div className="mb-4 p-3 bg-gray-600/20 rounded-lg border border-gray-500/30">
                            <div className="flex items-center justify-center gap-2 flex-wrap">
                              {isCurrentMVP && (
                                <Badge variant="outline" className="border-yellow-400/70 text-yellow-400 bg-yellow-400/10 text-xs font-bold px-3 py-1.5">
                                  🏆 MVP
                                </Badge>
                              )}
                              {monthlyStats.totalMVPCount > 0 && (
                                <Badge variant="outline" className="border-yellow-400/50 text-yellow-300 bg-yellow-400/5 text-xs font-bold px-3 py-1.5">
                                  🏆 {monthlyStats.totalMVPCount}x MVP
                                </Badge>
                              )}
                            </div>
                          </div>
                        )
                      }
                      return null
                    })()}
                    
                    {/* Botão de Ação - Sempre na mesma posição */}
                    <Button
                      onClick={() => openPlayerDetails(player)}
                      variant="outline"
                      className="w-full border-green-400/50 text-green-400 hover:bg-green-400/10 hover:border-green-400 transition-all duration-200 font-medium py-2"
                    >
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Ver Detalhes
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Botão Mostrar Mais/Menos */}
          {players.length > 10 && (
            <div className="flex justify-center mt-6">
              <Button
                onClick={() => setShowAllPlayers(!showAllPlayers)}
                variant="outline"
                className="border-green-400/50 text-green-400 hover:bg-green-400/10 hover:border-green-400 transition-all duration-200"
              >
                {showAllPlayers ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-2" />
                    Mostrar Menos
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-2" />
                    Mostrar Mais ({players.length - 10} jogadores restantes)
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Player Details Modal */}
      {showDetails && selectedPlayer && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800/95 border border-gray-600/50 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            {/* Content */}
            <div className="p-4 overflow-y-auto max-h-[90vh]">
              {/* Nome e Botão Fechar */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-green-400/20 rounded-full">
                    <User className="h-6 w-6 text-green-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-green-400 drop-shadow-sm">{selectedPlayer.name}</h2>
                    <p className="text-gray-300 text-xs">Perfil do Jogador</p>
                  </div>
                </div>
                <Button
                  onClick={closePlayerDetails}
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white hover:bg-gray-700/50 p-1"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Status, Pontos e Divisão */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-6">
                {/* Status MVP */}
                <div className="text-center p-2 bg-gradient-to-br from-yellow-900/30 to-amber-900/30 border border-yellow-400/30 rounded-lg">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Trophy className="h-3 w-3 text-yellow-400" />
                    <span className="text-xs font-bold text-yellow-400">
                      {isPlayerMVP(selectedPlayer.name) ? "🏆 MVP" : "⭐ Status"}
                    </span>
                  </div>
                  <p className="text-yellow-200 text-xs">
                    {isPlayerMVP(selectedPlayer.name) 
                      ? "Destacado" 
                      : "Em busca"
                    }
                  </p>
                </div>

                {/* Pontos */}
                <div className="text-center p-2 bg-gradient-to-br from-green-900/30 to-emerald-900/30 border border-green-400/30 rounded-lg">
                  <div className="text-lg font-bold text-green-400 mb-1">{getPlayerGeneralStats(selectedPlayer.name).totalPoints}</div>
                  <div className="text-xs text-gray-300">Pontos</div>
                </div>

                {/* Divisão */}
                <div className="text-center p-2 bg-gradient-to-br from-purple-900/30 to-pink-900/30 border border-purple-400/30 rounded-lg">
                  <div className="text-xl mb-1">{getRankingDivision(getPlayerGeneralStats(selectedPlayer.name).totalPoints).icon}</div>
                  <div className="text-xs font-bold text-purple-400">
                    {getRankingDivision(getPlayerGeneralStats(selectedPlayer.name).totalPoints).name} {getRankingDivision(getPlayerGeneralStats(selectedPlayer.name).totalPoints).tier}
                  </div>
                </div>

                {/* Membro Desde */}
                <div className="text-center p-2 bg-gradient-to-br from-blue-900/30 to-cyan-900/30 border border-blue-400/30 rounded-lg">
                  <div className="text-lg font-bold text-blue-400 mb-1">
                    {new Date(selectedPlayer.created_at).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
                  </div>
                  <div className="text-xs text-gray-300">Membro Desde</div>
                </div>
              </div>

              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-gray-700/50 border border-gray-600/50">
                  <TabsTrigger value="overview" className="data-[state=active]:bg-green-600/20 data-[state=active]:text-green-400">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Visão Geral
                  </TabsTrigger>
                  <TabsTrigger value="individual" className="data-[state=active]:bg-blue-600/20 data-[state=active]:text-blue-400">
                    <User className="h-4 w-4 mr-2" />
                    Individual
                  </TabsTrigger>
                  <TabsTrigger value="dupla" className="data-[state=active]:bg-purple-600/20 data-[state=active]:text-purple-400">
                    <Users className="h-4 w-4 mr-2" />
                    Dupla
                  </TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="mt-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-gray-700/50 border-gray-600/50">
                      <CardContent className="p-4 text-center">
                        <Trophy className="h-8 w-8 mx-auto mb-2 text-yellow-400" />
                        <div className="text-2xl font-bold text-green-400">{getPlayerGeneralStats(selectedPlayer.name).totalWins}</div>
                        <div className="text-sm text-gray-300">Vitórias Totais</div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-gray-700/50 border-gray-600/50">
                      <CardContent className="p-4 text-center">
                        <Calendar className="h-8 w-8 mx-auto mb-2 text-blue-400" />
                        <div className="text-2xl font-bold text-blue-400">{getPlayerGeneralStats(selectedPlayer.name).totalMatches}</div>
                        <div className="text-sm text-gray-300">Partidas Totais</div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-gray-700/50 border-gray-600/50">
                      <CardContent className="p-4 text-center">
                        <BarChart3 className="h-8 w-8 mx-auto mb-2 text-purple-400" />
                        <div className="text-2xl font-bold text-purple-400">
                          {(getPlayerGeneralStats(selectedPlayer.name).winRate * 100).toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-300">Taxa de Vitória</div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Estatísticas por tipo */}
                  <Card className="bg-gray-700/50 border-gray-600/50">
                    <CardHeader>
                      <CardTitle className="text-green-400">Estatísticas por Tipo de Partida</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {(() => {
                          const stats = getPlayerDetailedStats(selectedPlayer.name)
                          return (
                            <>
                              <div className="space-y-3">
                                <h4 className="text-blue-400 font-semibold flex items-center gap-2">
                                  <User className="h-4 w-4" />
                                  Partidas Individuais
                                </h4>
                                <div className="space-y-2">
                                  <div className="flex justify-between">
                                    <span className="text-gray-300">Partidas:</span>
                                    <span className="font-medium text-blue-400">{stats.individualMatches}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-300">Vitórias:</span>
                                    <span className="font-medium text-green-400">{stats.individualWins}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-300">Taxa:</span>
                                    <span className="font-medium text-purple-400">
                                      {stats.individualMatches > 0 ? ((stats.individualWins / stats.individualMatches) * 100).toFixed(1) : 0}%
                                    </span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="space-y-3">
                                <h4 className="text-purple-400 font-semibold flex items-center gap-2">
                                  <Users className="h-4 w-4" />
                                  Partidas em Dupla
                                </h4>
                                <div className="space-y-2">
                    <div className="flex justify-between">
                                    <span className="text-gray-300">Partidas:</span>
                                    <span className="font-medium text-purple-400">{stats.duplaMatches}</span>
                    </div>
                    <div className="flex justify-between">
                                    <span className="text-gray-300">Vitórias:</span>
                                    <span className="font-medium text-green-400">{stats.duplaWins}</span>
                    </div>
                    <div className="flex justify-between">
                                    <span className="text-gray-300">Taxa:</span>
                                    <span className="font-medium text-purple-400">
                                      {stats.duplaMatches > 0 ? ((stats.duplaWins / stats.duplaMatches) * 100).toFixed(1) : 0}%
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </>
                          )
                        })()}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Status MVP e Estatísticas Mensais */}
                  <Card className="bg-gray-700/50 border-gray-600/50">
                    <CardHeader>
                      <CardTitle className="text-yellow-400 flex items-center gap-2">
                        <Trophy className="h-5 w-5" />
                        Status Mensal
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {(() => {
                        const monthlyStats = getPlayerMonthlyStats(selectedPlayer.name)
                        const isMVP = isPlayerMVP(selectedPlayer.name)
                        
                        return (
                          <div className="space-y-6">
                            {/* Status MVP - Box Principal */}
                            {isMVP && (
                              <div className="relative overflow-hidden bg-gradient-to-br from-yellow-900/60 via-amber-900/40 to-yellow-800/60 border-2 border-yellow-400/50 rounded-xl p-6 text-center shadow-2xl">
                                {/* Efeito de brilho */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400/10 to-transparent animate-pulse"></div>
                                
                                {/* Conteúdo MVP */}
                                <div className="relative z-10">
                                  <div className="flex items-center justify-center gap-3 mb-4">
                                    <div className="p-3 bg-yellow-400/20 rounded-full">
                                      <Trophy className="h-10 w-10 text-yellow-400 fill-yellow-400 drop-shadow-lg" />
                                    </div>
                                    <div>
                                      <h3 className="text-2xl font-bold text-yellow-300 drop-shadow-lg">
                                        🏆 MVP DO MÊS! 🏆
                                      </h3>
                                      <p className="text-yellow-200 text-sm font-medium">
                                        Jogador Destacado
                                      </p>
                                    </div>
                                  </div>
                                  
                                  <div className="bg-yellow-400/10 rounded-lg p-4 border border-yellow-400/30">
                                    <p className="text-yellow-100 text-base leading-relaxed">
                                      Parabéns! Você é o jogador com melhor desempenho este mês, 
                                      demonstrando excelência e consistência em suas partidas!
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {/* Histórico de MVPs - Box Secundário */}
                            {monthlyStats.totalMVPCount > 0 && (
                              <div className="bg-gradient-to-r from-yellow-900/30 to-amber-900/30 border border-yellow-400/40 rounded-xl p-5">
                                <div className="flex items-center justify-center gap-3 mb-4">
                                  <div className="p-2 bg-yellow-400/20 rounded-full">
                                    <Star className="h-6 w-6 text-yellow-400" />
                                  </div>
                                  <div className="text-center">
                                    <h4 className="text-xl font-bold text-yellow-300">
                                      🏆 {monthlyStats.totalMVPCount}x MVP
                                    </h4>
                                    <p className="text-yellow-200 text-sm">
                                      Conquistas Históricas
                                    </p>
                                  </div>
                                </div>
                                
                                {monthlyStats.mvpHistory.length > 0 && (
                                  <div className="space-y-3">
                                    <p className="text-yellow-200 text-sm text-center font-medium">
                                      Histórico de Conquistas:
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                      {monthlyStats.mvpHistory
                                        .sort((a, b) => b.year - a.year || new Date(b.month).getMonth() - new Date(a.month).getMonth())
                                        .map((mvp, index) => (
                                          <div key={index} className="flex items-center justify-between bg-yellow-400/20 rounded-lg px-4 py-3 border border-yellow-400/30 hover:bg-yellow-400/30 transition-all duration-200">
                                            <div className="flex items-center gap-2">
                                              <span className="text-yellow-400 text-lg">⭐</span>
                                              <span className="text-yellow-200 text-sm font-medium">{mvp.month}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                              <span className="text-yellow-300 text-sm">{mvp.wins}</span>
                                              <span className="text-yellow-200 text-xs">vitórias</span>
                                            </div>
                                          </div>
                                        ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {/* Estatísticas Mensais - Grid Responsivo */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div className="text-center p-4 bg-gradient-to-br from-green-900/30 to-emerald-900/30 border border-green-400/30 rounded-xl hover:bg-green-900/40 transition-all duration-200">
                                <div className="text-3xl font-bold text-green-400 mb-1">{monthlyStats.monthlyWins}</div>
                                <div className="text-sm text-gray-300 font-medium">Vitórias</div>
                                <div className="text-xs text-green-300">do Mês</div>
                              </div>
                              
                              <div className="text-center p-4 bg-gradient-to-br from-blue-900/30 to-cyan-900/30 border border-blue-400/30 rounded-xl hover:bg-blue-900/40 transition-all duration-200">
                                <div className="text-3xl font-bold text-blue-400 mb-1">{monthlyStats.monthlyMatches}</div>
                                <div className="text-sm text-gray-300 font-medium">Partidas</div>
                                <div className="text-xs text-blue-300">do Mês</div>
                              </div>
                              
                              <div className="text-center p-4 bg-gradient-to-br from-purple-900/30 to-pink-900/30 border border-purple-400/30 rounded-xl hover:bg-purple-900/40 transition-all duration-200">
                                <div className="text-3xl font-bold text-purple-400 mb-1">
                                  {(monthlyStats.monthlyWinRate * 100).toFixed(1)}%
                                </div>
                                <div className="text-sm text-gray-300 font-medium">Taxa</div>
                                <div className="text-xs text-purple-300">de Vitória</div>
                              </div>
                              
                              <div className="text-center p-4 bg-gradient-to-br from-yellow-900/30 to-amber-900/30 border border-yellow-400/30 rounded-xl hover:bg-yellow-900/40 transition-all duration-200">
                                <div className="text-3xl font-bold text-yellow-400 mb-1">{monthlyStats.monthlyPoints}</div>
                                <div className="text-sm text-gray-300 font-medium">Pontos</div>
                                <div className="text-xs text-yellow-300">Mensais</div>
                              </div>
                            </div>
                          </div>
                        )
                      })()}
                    </CardContent>
                  </Card>

                  {/* Sistema de Divisões */}
                  <Card className="bg-gray-700/50 border-gray-600/50">
                    <CardHeader>
                      <CardTitle className="text-purple-400 flex items-center gap-2">
                        <Trophy className="h-5 w-5" />
                        Sistema de Divisões
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {(() => {
                        const playerStats = getPlayerGeneralStats(selectedPlayer.name)
                        const currentDivision = getRankingDivision(playerStats.totalPoints)
                        const nextDivision = getNextDivision(playerStats.totalPoints)
                        
                        return (
                          <div className="space-y-4">
                            {/* Divisão Atual */}
                            <div className="text-center p-4 bg-gradient-to-r from-purple-900/20 to-pink-900/20 border border-purple-400/30 rounded-lg">
                              <div className="text-3xl mb-2">{currentDivision.icon}</div>
                              <div className="text-xl font-bold text-purple-400">
                                {currentDivision.name} {currentDivision.tier}
                              </div>
                              <div className="text-sm text-gray-300 mt-1">
                                {playerStats.totalPoints} pontos
                              </div>
                            </div>
                            
                            {/* Progresso para próxima divisão */}
                            {nextDivision && (
                              <div className="bg-gray-600/30 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-gray-300 text-sm">Progresso para {nextDivision.name} {nextDivision.tier}</span>
                                  <span className="text-purple-400 text-sm font-medium">
                                    {playerStats.totalPoints}/{nextDivision.minRating} pts
                                  </span>
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-2">
                                  <div 
                                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                                    style={{ 
                                      width: `${Math.min(100, Math.max(0, ((playerStats.totalPoints - getDivisionMinRating(playerStats.totalPoints)) / Math.max(1, (nextDivision.minRating - getDivisionMinRating(playerStats.totalPoints)))) * 100))}%` 
                                    }}
                                  ></div>
                                </div>
                                <div className="text-xs text-gray-400 mt-1">
                                  Faltam {Math.max(0, nextDivision.minRating - playerStats.totalPoints)} pontos para subir
                                </div>
                              </div>
                            )}
                            
                            {/* Todas as Divisões */}
                            <div className="space-y-2">
                              <h4 className="text-gray-300 font-medium text-sm">Todas as Divisões:</h4>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                {[
                                  { name: "Iniciante", min: 1000, icon: "🐣" },
                                  { name: "Bronze III", min: 1300, icon: "🥉" },
                                  { name: "Bronze II", min: 1600, icon: "🥉" },
                                  { name: "Bronze I", min: 1900, icon: "🥉" },
                                  { name: "Prata III", min: 2200, icon: "🥈" },
                                  { name: "Prata II", min: 2500, icon: "🥈" },
                                  { name: "Prata I", min: 2800, icon: "🥈" },
                                  { name: "Ouro III", min: 3100, icon: "🥇" },
                                  { name: "Ouro II", min: 3400, icon: "🥇" },
                                  { name: "Ouro I", min: 3700, icon: "🥇" },
                                  { name: "Diamante III", min: 4000, icon: "💠" },
                                  { name: "Diamante II", min: 4300, icon: "💠" },
                                  { name: "Diamante I", min: 4600, icon: "💠" },
                                  { name: "Platina III", min: 4900, icon: "💎" },
                                  { name: "Platina II", min: 5200, icon: "💎" },
                                  { name: "Platina I", min: 5500, icon: "💎" },
                                  { name: "Mestre III", min: 5800, icon: "🔶" },
                                  { name: "Mestre II", min: 6100, icon: "🔶" },
                                  { name: "Mestre I", min: 6400, icon: "🔶" },
                                  { name: "Grão-Mestre III", min: 6700, icon: "🔱" },
                                  { name: "Grão-Mestre II", min: 7000, icon: "🔱" },
                                  { name: "Grão-Mestre I", min: 7300, icon: "🔱" },
                                  { name: "Lendário", min: 8000, icon: "👑" }
                                ].slice(0, showAllDivisions ? undefined : 10).map((division, index) => (
                                  <div 
                                    key={index}
                                    className={`p-2 rounded text-center ${
                                      playerStats.totalPoints >= division.min 
                                        ? 'bg-green-900/30 border border-green-500/30 text-green-300' 
                                        : 'bg-gray-700/30 text-gray-400'
                                    }`}
                                  >
                                    <div className="text-lg">{division.icon}</div>
                                    <div className="font-medium">{division.name}</div>
                                    <div className="text-xs opacity-75">{division.min}+ pts</div>
                                  </div>
                                ))}
                              </div>
                              
                              {/* Botão Ver Mais */}
                              {!showAllDivisions && (
                                <Button
                                  onClick={() => setShowAllDivisions(true)}
                                  className="w-full bg-purple-600 hover:bg-purple-500 text-white text-sm py-2"
                                >
                                  Ver Todas as Divisões
                                </Button>
                              )}
                              
                              {showAllDivisions && (
                                <Button
                                  onClick={() => setShowAllDivisions(false)}
                                  className="w-full bg-gray-600 hover:bg-gray-500 text-white text-sm py-2"
                                >
                                  Mostrar Menos
                                </Button>
                              )}
                            </div>
                          </div>
                        )
                      })()}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Individual Tab */}
                <TabsContent value="individual" className="mt-6">
                  <Card className="bg-gray-700/50 border-gray-600/50">
                    <CardHeader>
                      <CardTitle className="text-blue-400 flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Histórico de Partidas Individuais
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {(() => {
                        const stats = getPlayerDetailedStats(selectedPlayer.name)
                        const individualMatches = getPlayerMatchHistory(selectedPlayer.name).filter(match => match.type === 'individual')
                        
                        if (individualMatches.length === 0) {
                          return (
                            <div className="text-center py-8 text-gray-400">
                              <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                              <p>Nenhuma partida individual encontrada.</p>
                            </div>
                          )
                        }

                        return (
                          <div className="space-y-3">
                            {individualMatches.map((match) => (
                              <div
                                key={match.id}
                                className={`p-4 border rounded-lg transition-all duration-200 ${
                                  match.isWinner
                                    ? "border-green-500/50 bg-green-500/10"
                                    : "border-red-500/50 bg-red-500/10"
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Badge
                                        variant="outline"
                                        className={`${
                                          match.isWinner
                                            ? "border-green-400/70 text-green-400 bg-green-400/10"
                                            : "border-red-400/70 text-red-400 bg-red-400/10"
                                        }`}
                                      >
                                        {match.isWinner ? "Vitória" : "Derrota"}
                                      </Badge>
                                      <div className="text-xs text-gray-400">
                                        📅 {match.formattedDate} 🕐 {match.formattedTime}
                                      </div>
                                    </div>
                                    <div className="text-sm">
                                      <span className="font-medium text-gray-200">
                                        {match.isWinner ? "Venceu:" : "Perdeu:"}
                                      </span>
                                      <span className="text-gray-100 ml-2 font-semibold">
                                        {match.players.filter(p => p !== selectedPlayer.name).join(" e ")}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="text-right text-xs text-gray-400">
                                    Partida #{match.id}
                    </div>
                  </div>
                </div>
              ))}
            </div>
                        )
                      })()}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Dupla Tab */}
                <TabsContent value="dupla" className="mt-6">
                  <Card className="bg-gray-700/50 border-gray-600/50">
                    <CardHeader>
                      <CardTitle className="text-purple-400 flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Histórico de Partidas em Dupla
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {(() => {
                        const stats = getPlayerDetailedStats(selectedPlayer.name)
                        const duplaMatches = getPlayerMatchHistory(selectedPlayer.name).filter(match => match.type === 'dupla')
                        
                        if (duplaMatches.length === 0) {
                          return (
                            <div className="text-center py-8 text-gray-400">
                              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                              <p>Nenhuma partida em dupla encontrada.</p>
                            </div>
                          )
                        }

                        return (
                          <div className="space-y-3">
                            {duplaMatches.map((match) => {
                              const winners = Array.isArray(match.winner) ? match.winner : [match.winner]
                              const losers = match.players.filter(p => !winners.includes(p))
                              
                              // Time do jogador selecionado (incluindo ele mesmo)
                              const playerTeam = match.players.filter(p => p === selectedPlayer.name || winners.includes(p) === match.isWinner)
                              
                              // Time oponente (excluindo o jogador selecionado e seu time)
                              const opponentTeam = match.players.filter(p => !playerTeam.includes(p))
                              
                              return (
                                <div
                                  key={match.id}
                                  className={`p-4 border rounded-lg transition-all duration-200 ${
                                    match.isWinner
                                      ? "border-green-500/50 bg-green-500/10"
                                      : "border-red-500/50 bg-red-500/10"
                                  }`}
                                >
                                  <div className="space-y-3">
                                    {/* Header com resultado e data */}
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                      <div className="flex items-center gap-2">
                                        <Badge
                                          variant="outline"
                                          className={`${
                                            match.isWinner
                                              ? "border-green-400/70 text-green-400 bg-green-400/10"
                                              : "border-red-400/70 text-red-400 bg-red-400/10"
                                          }`}
                                        >
                                          {match.isWinner ? "Vitória" : "Derrota"}
                                        </Badge>
                                        <div className="text-xs text-gray-400">
                                          📅 {match.formattedDate} 🕐 {match.formattedTime}
                                        </div>
                                      </div>
                                      
                                      <div className="text-xs text-gray-400 self-end sm:self-auto">
                                        Partida #{match.id}
                                      </div>
                                    </div>
                                    
                                    {/* Times organizados verticalmente */}
                                    <div className="space-y-2">
                                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                        <span className="font-medium text-gray-200 text-sm whitespace-nowrap">
                                          {match.isWinner ? "Venceu:" : "Perdeu:"}
                                        </span>
                                        <span className="text-gray-100 font-semibold break-words">
                                          {playerTeam.join(" e ")}
                                        </span>
                                      </div>
                                      
                                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                        <span className="font-medium text-gray-200 text-sm whitespace-nowrap">
                                          {match.isWinner ? "contra" : "para"}
                                        </span>
                                        <span className="text-gray-100 font-semibold break-words">
                                          {opponentTeam.join(" e ")}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )
                      })()}
        </CardContent>
      </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
