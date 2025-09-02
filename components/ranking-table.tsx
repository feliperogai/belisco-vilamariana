"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Trophy, TrendingUp, ChevronDown, ChevronUp } from "lucide-react"
import { useState } from "react"
import { Button } from "./ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import type { Player, Match } from "../lib/types"

interface RankingTableProps {
  players: Player[]
  matches: Match[]
}

export function RankingTable({ players, matches }: RankingTableProps) {
  const [showAllPlayers, setShowAllPlayers] = useState(false)
  const [activeTab, setActiveTab] = useState("geral")

  // Função para calcular vitórias por tipo de partida
  const calculateVictoriesByType = (playerName: string) => {
    let individualWins = 0
    let duplaWins = 0

    matches.forEach(match => {
      if (!match.players || !match.winner) return

      const winners = Array.isArray(match.winner) ? match.winner : [match.winner]
      const isPlayerWinner = winners.includes(playerName)
      
      if (isPlayerWinner) {
        if (match.type === 'individual') {
          individualWins++
        } else if (match.type === 'dupla') {
          duplaWins++
        }
      }
    })

    return { individualWins, duplaWins }
  }

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

    // Calcular rating mensal (sistema melhorado) - começando de 1000
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
      monthlyRating, // total no mês (1000 + pontos do mês) para divisões
      monthlyPoints, // pontos acumulados no mês para exibição/ordenação
      monthlyWinRate: monthlyMatches > 0 ? monthlyWins / monthlyMatches : 0,
      totalMVPCount,
      mvpHistory
    }
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

  // Ranking geral (histórico completo) - calculado baseado nas partidas reais
  const generalPlayers = players.map(player => {
    const stats = getPlayerGeneralStats(player.name)
    return {
      ...player,
      calculatedRating: stats.totalPoints,
      calculatedMatches: stats.totalMatches,
      calculatedWins: stats.totalWins,
      calculatedWinRate: stats.winRate
    }
  }).sort((a, b) => {
    // Sort by calculated rating first, then by win rate, then by total wins
    if (b.calculatedRating !== a.calculatedRating) {
      return b.calculatedRating - a.calculatedRating
    }

    if (b.calculatedWinRate !== a.calculatedWinRate) {
      return b.calculatedWinRate - a.calculatedWinRate
    }

    return b.calculatedWins - a.calculatedWins
  })

  const sortedPlayers = generalPlayers

  // Ranking mensal (mês atual)
  const monthlyPlayers = players.map(player => {
    const stats = getPlayerMonthlyStats(player.name)
    return {
      ...player,
      monthlyRating: stats.monthlyRating, // total 1000+ para divisão
      monthlyPoints: stats.monthlyPoints, // pontos do mês
      monthlyWins: stats.monthlyWins,
      monthlyMatches: stats.monthlyMatches,
      monthlyWinRate: stats.monthlyWinRate,
      totalMVPCount: stats.totalMVPCount
    }
  }).sort((a, b) => {
    // Ordenar por pontos do mês, depois por vitórias no mês
    if (b.monthlyPoints !== a.monthlyPoints) {
      return b.monthlyPoints - a.monthlyPoints
    }
    return b.monthlyWins - a.monthlyWins
  })

  // MVP mensal (primeiro colocado do ranking mensal)
  const monthlyMVP = monthlyPlayers.length > 0 ? monthlyPlayers[0] : null

  // Jogadores a serem exibidos (top 10 ou todos)
  const displayedPlayers = showAllPlayers ? sortedPlayers : sortedPlayers.slice(0, 10)
  const displayedMonthlyPlayers = showAllPlayers ? monthlyPlayers : monthlyPlayers.slice(0, 10)

  // Função para obter cor do rating
  const getRatingColor = (rating: number) => {
    if (rating >= 8000) return "text-red-400"
    if (rating >= 6000) return "text-purple-400"
    if (rating >= 4000) return "text-blue-400"
    if (rating >= 2000) return "text-yellow-400"
    if (rating >= 1000) return "text-gray-300"
    return "text-gray-400"
  }

  // Função para determinar cores das barras baseada no desempenho
  const getWinRateBarColors = (winRate: number) => {
    if (winRate >= 70) {
      return "from-green-500 to-emerald-500"
    } else if (winRate >= 50) {
      return "from-yellow-500 to-orange-500"
    } else if (winRate >= 30) {
      return "from-orange-500 to-red-500"
    } else {
      return "from-red-500 to-pink-500"
    }
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

  if (players.length === 0) {
    return (
      <Card className="bg-gray-800/95 border-gray-600/50 shadow-xl">
        <CardContent className="text-center py-8">
          <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50 text-gray-400" />
          <p className="text-gray-200">Nenhum jogador cadastrado ainda.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Sistema de Abas */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-gray-800/95 border-gray-600/50 shadow-lg">
          <TabsTrigger
            value="geral"
            className="data-[state=active]:bg-green-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 text-gray-200 hover:text-white hover:bg-gray-700"
          >
            🏆 Ranking Geral
          </TabsTrigger>
          <TabsTrigger
            value="mensal"
            className="data-[state=active]:bg-green-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 text-gray-200 hover:text-white hover:bg-gray-700"
          >
            📅 Ranking Mensal
          </TabsTrigger>
        </TabsList>

        {/* Aba Ranking Geral */}
        <TabsContent value="geral" className="space-y-6">
      <Card className="bg-gray-800/95 border-gray-600/50 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-400 drop-shadow-sm">
                <Trophy className="h-5 w-5 text-green-400" />Ranking Geral
          </CardTitle>
          <CardDescription className="text-gray-200">
                Classificação baseada nos pontos acumulados e desempenho histórico completo
                {!showAllPlayers && players.length > 10 && (
                  <span className="block mt-1 text-sm text-gray-400">
                    Mostrando os 10 primeiros de {players.length} jogadores
                  </span>
                )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
                {displayedPlayers.map((player, index) => {
              const position = index + 1
              const winRate = player.calculatedWinRate * 100 // Usar win rate calculado
                   const stats = getPlayerDetailedStats(player.name)
                   const isMVP = monthlyMVP && player.id === monthlyMVP.id
                   const monthlyStats = getPlayerMonthlyStats(player.name)
                   const winRateBarColors = getWinRateBarColors(winRate)

              return (
                <div
                  key={player.id}
                       className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 rounded-lg border transition-all duration-200 ${
                         position === 1
                           ? 'bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border-yellow-500/50 shadow-lg'
                           : position === 2
                           ? 'bg-gradient-to-r from-gray-400/20 to-slate-400/20 border-gray-400/50 shadow-md'
                           : position === 3
                           ? 'bg-gradient-to-r from-amber-600/20 to-orange-600/20 border-amber-500/50 shadow-md'
                           : 'bg-gray-700/50 border-gray-600/50 hover:bg-gray-700/70'
                       }`}
                     >
                       {/* Posição e Nome */}
                       <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto mb-3 sm:mb-0">
                         <div className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full font-bold text-base sm:text-lg flex-shrink-0 ${
                           position === 1
                             ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-yellow-900'
                             : position === 2
                             ? 'bg-gradient-to-r from-gray-400 to-slate-400 text-gray-800'
                             : position === 3
                             ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-amber-900'
                             : 'bg-gray-600 text-gray-200'
                         }`}>
                           {position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : position}
                      </div>

                         {/* Nome e MVP */}
                         <div className="flex flex-col min-w-0 flex-1">
                           <div className="flex flex-wrap items-center gap-2">
                             <span className="font-semibold text-white text-sm sm:text-base truncate">{player.name}</span>
                             {isMVP && (
                               <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs px-2 py-1 flex-shrink-0">
                                 🏆 MVP
                               </Badge>
                             )}
                             {monthlyStats.totalMVPCount > 0 && (
                               <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-2 py-1 flex-shrink-0">
                                 ⭐ {monthlyStats.totalMVPCount}x MVP
                               </Badge>
                             )}
                        </div>
                           <div className="flex items-center gap-2 mt-1">
                             {getDivisionBadge(player.calculatedRating)}
                        </div>
                      </div>
                    </div>

                       {/* Estatísticas */}
                       <div className="grid grid-cols-3 sm:flex sm:items-center gap-3 sm:gap-6 text-xs sm:text-sm w-full sm:w-auto">
                         <div className="text-center">
                           <div className="text-gray-300 text-xs">Pontos</div>
                           <div className={`font-bold ${getRatingColor(player.calculatedRating)} text-sm`}>
                             {player.calculatedRating.toLocaleString()}
                    </div>
                  </div>

                         <div className="text-center">
                           <div className="text-gray-300 text-xs">Partidas</div>
                           <div className="font-bold text-white text-sm">{player.calculatedMatches}</div>
                         </div>

                         <div className="text-center">
                           <div className="text-gray-300 text-xs">Vitórias</div>
                           <div className="font-bold text-green-400 text-sm">{player.calculatedWins}</div>
                    </div>

                         <div className="text-center">
                           <div className="text-gray-300 text-xs">Taxa</div>
                           <div className="font-bold text-blue-400 text-sm">{winRate.toFixed(1)}%</div>
                           <div className="w-full bg-gray-700 rounded-full h-2 mt-1.5 border border-gray-600 shadow-inner overflow-hidden">
                             <div className="flex h-full">
                               {/* Barra de vitórias (verde) */}
                               <div 
                                 className={`bg-gradient-to-r ${winRateBarColors} h-full transition-all duration-300`}
                                 style={{ width: `${player.calculatedWins > 0 ? (player.calculatedWins / player.calculatedMatches) * 100 : 0}%` }}
                               />
                               {/* Barra de derrotas (vermelho) */}
                               <div 
                                 className="bg-gray-600 h-full transition-all duration-300"
                                 style={{ width: `${player.calculatedMatches > 0 ? ((player.calculatedMatches - player.calculatedWins) / player.calculatedMatches) * 100 : 0}%` }}
                               />
                             </div>
                           </div>
                         </div>

                         <div className="text-center">
                           <div className="text-gray-300 text-xs">Individual</div>
                           <div className="font-bold text-yellow-400 text-sm">{stats.individualWins}</div>
                         </div>

                         <div className="text-center">
                           <div className="text-gray-300 text-xs">Dupla</div>
                           <div className="font-bold text-purple-400 text-sm">{stats.duplaWins}</div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

              {/* Botão Mostrar Mais */}
              {players.length > 10 && (
                <div className="mt-6 text-center">
                  <Button
                    onClick={() => setShowAllPlayers(!showAllPlayers)}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-all duration-200"
                  >
                    {showAllPlayers ? (
                      <>
                        <ChevronUp className="h-4 w-4 mr-2" />
                        Mostrar Menos
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4 mr-2" />
                        Mostrar Todos ({players.length} jogadores)
                      </>
                    )}
                  </Button>
                </div>
              )}
        </CardContent>
      </Card>
        </TabsContent>

        {/* Aba Ranking Mensal */}
        <TabsContent value="mensal" className="space-y-6">
        <Card className="bg-gray-800/95 border-gray-600/50 shadow-xl">
          <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-400 drop-shadow-sm">
                <TrendingUp className="h-5 w-5 text-blue-400" />Ranking Mensal
            </CardTitle>
              <CardDescription className="text-gray-200">
                Classificação do mês atual baseada nos pontos conquistados - MVP ganha símbolo especial
                {!showAllPlayers && monthlyPlayers.length > 10 && (
                  <span className="text-sm text-gray-400">
                    Mostrando os 10 primeiros de {monthlyPlayers.length} jogadores
                  </span>
                )}
              </CardDescription>
          </CardHeader>
          <CardContent>
              <div className="space-y-4">
                {displayedMonthlyPlayers.map((player, index) => {
                  const position = index + 1
                  const monthlyWinRate = player.monthlyMatches > 0 ? (player.monthlyWins / player.monthlyMatches) * 100 : 0
                  const isMVP = position === 1
                  const monthlyStats = getPlayerMonthlyStats(player.name)
                  const winRateBarColors = getWinRateBarColors(monthlyWinRate)

                  return (
                    <div
                      key={player.id}
                      className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 rounded-lg border transition-all duration-200 ${
                        position === 1
                          ? 'bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border-yellow-500/50 shadow-lg'
                          : position === 2
                          ? 'bg-gradient-to-r from-gray-400/20 to-slate-400/20 border-gray-400/50 shadow-md'
                          : position === 3
                          ? 'bg-gradient-to-r from-amber-600/20 to-orange-600/20 border-amber-500/50 shadow-md'
                          : 'bg-gray-700/50 border-gray-600/50 hover:bg-gray-700/70'
                      }`}
                    >
                      {/* Posição e Nome */}
                      <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto mb-3 sm:mb-0">
                        <div className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full font-bold text-base sm:text-lg flex-shrink-0 ${
                          position === 1
                            ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-yellow-900'
                            : position === 2
                            ? 'bg-gradient-to-r from-gray-400 to-slate-400 text-gray-800'
                            : position === 3
                            ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-amber-900'
                            : 'bg-gray-600 text-gray-200'
                        }`}>
                          {position === 1 ? '🏆' : position === 2 ? '🥈' : position === 3 ? '🥉' : position}
                        </div>

                        {/* Nome e MVP */}
                        <div className="flex flex-col min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-white text-sm sm:text-base truncate">{player.name}</span>
                            {isMVP && (
                              <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs px-2 py-1 animate-pulse flex-shrink-0">
                                🏆 MVP DO MÊS
                              </Badge>
                            )}
                            {monthlyStats.totalMVPCount > 0 && (
                              <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-2 py-1 flex-shrink-0">
                                ⭐ {monthlyStats.totalMVPCount}x MVP
                            </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            {getDivisionBadge(player.rating)}
                          </div>
                        </div>
                      </div>

                      {/* Estatísticas Mensais */}
                      <div className="grid grid-cols-3 sm:flex sm:items-center gap-3 sm:gap-6 text-xs sm:text-sm w-full sm:w-auto">
                        <div className="text-center">
                          <div className="text-gray-300 text-xs">Pontos no Mês</div>
                          <div className={`font-bold ${getRatingColor(player.monthlyPoints)} text-sm`}>
                            {player.monthlyPoints.toLocaleString()}
                            </div>
                          </div>
                        
                        <div className="text-center">
                          <div className="text-gray-300 text-xs">Partidas</div>
                          <div className="font-bold text-white text-sm">{player.monthlyMatches}</div>
                        </div>

                        <div className="text-center">
                          <div className="text-gray-300 text-xs">Vitórias</div>
                          <div className="font-bold text-green-400 text-sm">{player.monthlyWins}</div>
                        </div>

                        <div className="text-center">
                          <div className="text-gray-300 text-xs">Taxa</div>
                          <div className="font-bold text-blue-400 text-sm">{monthlyWinRate.toFixed(1)}%</div>
                          <div className="w-full bg-gray-700 rounded-full h-2 mt-1.5 border border-gray-600 shadow-inner overflow-hidden">
                            <div className="flex h-full">
                              {/* Barra de vitórias (verde) */}
                              <div 
                                className={`bg-gradient-to-r ${winRateBarColors} h-full transition-all duration-300`}
                                style={{ width: `${player.monthlyWins > 0 ? (player.monthlyWins / player.monthlyMatches) * 100 : 0}%` }}
                              />
                              {/* Barra de derrotas (vermelho) */}
                              <div 
                                className="bg-gray-600 h-full transition-all duration-300"
                                style={{ width: `${player.monthlyMatches > 0 ? ((player.monthlyMatches - player.monthlyWins) / player.monthlyMatches) * 100 : 0}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="text-center">
                          <div className="text-gray-300 text-xs">Pontos Totais</div>
                          <div className={`font-bold ${getRatingColor(player.rating)} text-sm`}>
                            {player.rating.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Botão Mostrar Mais */}
              {monthlyPlayers.length > 10 && (
                <div className="mt-6 text-center">
                  <Button
                    onClick={() => setShowAllPlayers(!showAllPlayers)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-all duration-200"
                  >
                    {showAllPlayers ? (
                      <>
                        <ChevronUp className="h-4 w-4 mr-2" />
                        Mostrar Menos
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4 mr-2" />
                        Mostrar Todos ({monthlyPlayers.length} jogadores)
                      </>
                    )}
                  </Button>
            </div>
              )}
          </CardContent>
        </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
