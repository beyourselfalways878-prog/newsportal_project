import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  MapPin, 
  Trophy, 
  TrendingUp, 
  Users, 
  Calendar,
  Cloud,
  Activity,
  Target,
  Award,
  MessageSquare,
  BarChart3,
  Clock,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { getMatchDetail, generateMatchAnalysis, getPlayerInsights } from '@/lib/sportsService';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const MatchDetailPage = () => {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const fetchMatchDetail = async () => {
      try {
        setLoading(true);
        const data = await getMatchDetail(matchId);
        setMatch(data);
      } catch (error) {
        console.error('Error fetching match details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMatchDetail();
  }, [matchId]);

  const handleGenerateAnalysis = async () => {
    if (!match || aiAnalysis) return;
    
    try {
      setLoadingAnalysis(true);
      const analysis = await generateMatchAnalysis(match);
      setAiAnalysis(analysis);
    } catch (error) {
      console.error('Error generating analysis:', error);
    } finally {
      setLoadingAnalysis(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-16 w-16 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-lg text-gray-600">मैच विवरण लोड हो रहा है...</p>
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-lg text-gray-600">मैच नहीं मिला</p>
          <Button onClick={() => navigate('/')} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            होम पेज पर जाएं
          </Button>
        </div>
      </div>
    );
  }

  const isCricket = match.sport === 'Cricket';
  const isFootball = match.sport === 'Football';

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      <Header
        darkMode={darkMode}
        toggleDarkMode={() => setDarkMode(!darkMode)}
        onLogoClick={() => navigate('/')}
        currentContent={{
          searchPlaceholder: 'खोजें...',
          toggleTheme: 'थीम बदलें',
          siteName: '24x7 Indian News'
        }}
      />

      <div className="bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen py-8">
        <div className="container mx-auto px-4">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            वापस जाएं
          </Button>

          {/* Match Header */}
          <Card className="mb-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
            <CardHeader>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Trophy className="h-6 w-6" />
                  <CardTitle className="text-2xl">{match.tournament}</CardTitle>
                </div>
                {match.isLive && (
                  <Badge className="bg-red-500 text-white px-3 py-1 animate-pulse">
                    <span className="relative flex h-2 w-2 mr-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                    </span>
                    LIVE
                  </Badge>
                )}
              </div>
              
              {/* Score Display */}
              <div className="grid grid-cols-3 gap-4 items-center my-8">
                {/* Team 1 */}
                <div className="text-center">
                  <div className="text-4xl mb-2">{match.team1.flag}</div>
                  <h3 className="text-xl font-bold mb-2">{match.team1.name}</h3>
                  <div className="text-4xl font-bold">
                    {match.team1.score}
                  </div>
                  {match.team1.overs && (
                    <div className="text-sm opacity-90 mt-1">
                      ({match.team1.overs} overs)
                    </div>
                  )}
                </div>

                {/* VS */}
                <div className="text-center">
                  <div className="text-3xl font-bold opacity-75">VS</div>
                  {match.isLive && (
                    <Activity className="h-6 w-6 mx-auto mt-2 animate-pulse" />
                  )}
                </div>

                {/* Team 2 */}
                <div className="text-center">
                  <div className="text-4xl mb-2">{match.team2.flag}</div>
                  <h3 className="text-xl font-bold mb-2">{match.team2.name}</h3>
                  <div className="text-4xl font-bold">
                    {match.team2.score}
                  </div>
                  {match.team2.overs && (
                    <div className="text-sm opacity-90 mt-1">
                      ({match.team2.overs} overs)
                    </div>
                  )}
                </div>
              </div>

              {/* Match Status */}
              <div className="text-center">
                <CardDescription className="text-white text-lg font-semibold">
                  {match.status}
                </CardDescription>
                <div className="flex items-center justify-center space-x-4 mt-3 text-sm">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    {match.venue.name}, {match.venue.city}
                  </div>
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    {match.matchType}
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* AI Analysis Section */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="mr-2 h-5 w-5" />
                AI द्वारा मैच विश्लेषण
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!aiAnalysis ? (
                <div className="text-center py-8">
                  <Button
                    onClick={handleGenerateAnalysis}
                    disabled={loadingAnalysis}
                    className="bg-gradient-to-r from-blue-600 to-purple-600"
                  >
                    {loadingAnalysis ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        विश्लेषण तैयार हो रहा है...
                      </>
                    ) : (
                      <>
                        <TrendingUp className="mr-2 h-4 w-4" />
                        AI विश्लेषण देखें
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="prose max-w-none">
                  <p className="text-gray-700 leading-relaxed">{aiAnalysis}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tabs for detailed information */}
          <Tabs defaultValue="scorecard" className="w-full">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
              <TabsTrigger value="scorecard">स्कोरकार्ड</TabsTrigger>
              <TabsTrigger value="commentary">कमेंट्री</TabsTrigger>
              <TabsTrigger value="venue">स्टेडियम</TabsTrigger>
              {isFootball && <TabsTrigger value="stats">आंकड़े</TabsTrigger>}
              <TabsTrigger value="previous">पिछले मैच</TabsTrigger>
            </TabsList>

            {/* Scorecard Tab */}
            <TabsContent value="scorecard" className="space-y-6">
              {isCricket && match.scorecard?.innings?.map((inning, idx) => (
                <Card key={idx}>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Target className="mr-2 h-5 w-5" />
                      {inning.team} Innings - {inning.total} ({inning.overs} overs)
                    </CardTitle>
                    <CardDescription>Extras: {inning.extras}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* Batting */}
                    <div className="mb-6">
                      <h4 className="font-semibold text-lg mb-3">बल्लेबाज</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="text-left p-2">Batsman</th>
                              <th className="text-right p-2">R</th>
                              <th className="text-right p-2">B</th>
                              <th className="text-right p-2">4s</th>
                              <th className="text-right p-2">6s</th>
                              <th className="text-right p-2">SR</th>
                              <th className="text-left p-2">Dismissal</th>
                            </tr>
                          </thead>
                          <tbody>
                            {inning.battingStats.map((bat, i) => (
                              <tr key={i} className="border-b hover:bg-gray-50">
                                <td className="p-2 font-medium">{bat.player}</td>
                                <td className="text-right p-2 font-bold">{bat.runs}</td>
                                <td className="text-right p-2">{bat.balls}</td>
                                <td className="text-right p-2">{bat.fours}</td>
                                <td className="text-right p-2">{bat.sixes}</td>
                                <td className="text-right p-2">{bat.sr}</td>
                                <td className="text-left p-2 text-gray-600 text-xs">{bat.status}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Bowling */}
                    {inning.bowlingStats.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-lg mb-3">गेंदबाज</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-100">
                              <tr>
                                <th className="text-left p-2">Bowler</th>
                                <th className="text-right p-2">O</th>
                                <th className="text-right p-2">M</th>
                                <th className="text-right p-2">R</th>
                                <th className="text-right p-2">W</th>
                                <th className="text-right p-2">Econ</th>
                              </tr>
                            </thead>
                            <tbody>
                              {inning.bowlingStats.map((bowl, i) => (
                                <tr key={i} className="border-b hover:bg-gray-50">
                                  <td className="p-2 font-medium">{bowl.bowler}</td>
                                  <td className="text-right p-2">{bowl.overs}</td>
                                  <td className="text-right p-2">{bowl.maidens}</td>
                                  <td className="text-right p-2">{bowl.runs}</td>
                                  <td className="text-right p-2 font-bold">{bowl.wickets}</td>
                                  <td className="text-right p-2">{bowl.economy}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              {isFootball && match.scorecard && (
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Goals */}
                  <Card>
                    <CardHeader>
                      <CardTitle>गोल</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2">{match.team1.name}</h4>
                        {match.scorecard.team1Goals?.map((goal, i) => (
                          <div key={i} className="flex items-center justify-between py-2 border-b">
                            <div>
                              <p className="font-medium">{goal.player}</p>
                              <p className="text-sm text-gray-600">{goal.type}</p>
                            </div>
                            <Badge variant="secondary">{goal.minute}</Badge>
                          </div>
                        ))}
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">{match.team2.name}</h4>
                        {match.scorecard.team2Goals?.map((goal, i) => (
                          <div key={i} className="flex items-center justify-between py-2 border-b">
                            <div>
                              <p className="font-medium">{goal.player}</p>
                              <p className="text-sm text-gray-600">{goal.type}</p>
                            </div>
                            <Badge variant="secondary">{goal.minute}</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Statistics */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <BarChart3 className="mr-2 h-5 w-5" />
                        मैच आंकड़े
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {Object.entries(match.scorecard.statistics).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between py-2 border-b">
                          <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                          <div className="flex items-center space-x-4">
                            <span className="font-semibold">
                              {typeof value === 'object' ? value.team1 : value}
                            </span>
                            {typeof value === 'object' && (
                              <>
                                <span className="text-gray-400">-</span>
                                <span className="font-semibold">{value.team2}</span>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Player of the Match */}
              {match.playerOfMatch && (
                <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Award className="mr-2 h-5 w-5 text-yellow-600" />
                      मैन ऑफ द मैच
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-4">
                      <div className="flex-1">
                        <h4 className="text-xl font-bold text-yellow-800">{match.playerOfMatch.name}</h4>
                        <p className="text-gray-700 mt-1">{match.playerOfMatch.performance}</p>
                        <p className="text-sm text-gray-600 mt-2">{match.playerOfMatch.reason}</p>
                      </div>
                      <Trophy className="h-16 w-16 text-yellow-600" />
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Commentary Tab */}
            <TabsContent value="commentary">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MessageSquare className="mr-2 h-5 w-5" />
                    लाइव कमेंट्री
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {match.commentary?.map((comment, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <Badge variant="secondary" className="mt-1">
                          {isCricket ? comment.over : comment.minute}
                        </Badge>
                        <div className="flex-1">
                          {isCricket && comment.bowler && (
                            <p className="text-sm text-gray-600 mb-1">{comment.bowler}</p>
                          )}
                          <p className="text-gray-800">{comment.description}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Venue Tab */}
            <TabsContent value="venue">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MapPin className="mr-2 h-5 w-5" />
                    स्टेडियम की जानकारी
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-gray-600 mb-1">स्टेडियम</h4>
                        <p className="text-xl font-bold">{match.venue.name}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-600 mb-1">शहर</h4>
                        <p className="text-lg">{match.venue.city}, {match.venue.country}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-600 mb-1">क्षमता</h4>
                        <p className="text-lg flex items-center">
                          <Users className="mr-2 h-4 w-4" />
                          {match.venue.capacity} दर्शक
                        </p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-gray-600 mb-1">पिच की स्थिति</h4>
                        <p className="text-lg">{match.venue.pitch}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-600 mb-1">मौसम</h4>
                        <p className="text-lg flex items-center">
                          <Cloud className="mr-2 h-4 w-4" />
                          {match.venue.weather}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Previous Matches Tab */}
            <TabsContent value="previous">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="mr-2 h-5 w-5" />
                    पिछले मैच
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {match.previousMatches?.map((prev, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center space-x-4 flex-1">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">{prev.date}</span>
                          <span className="font-medium">{prev.team1} vs {prev.team2}</span>
                        </div>
                        <div className="text-right">
                          <Badge
                            variant={prev.winner === match.team1.shortName || prev.winner === match.team1.name ? 'default' : 'secondary'}
                          >
                            {prev.winner === 'Draw' ? 'Draw' : `${prev.winner} won`}
                          </Badge>
                          {prev.winner !== 'Draw' && (
                            <p className="text-sm text-gray-600 mt-1">{prev.margin}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Football Stats Tab */}
            {isFootball && (
              <TabsContent value="stats">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <BarChart3 className="mr-2 h-5 w-5" />
                      विस्तृत आंकड़े
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {Object.entries(match.scorecard.statistics).map(([key, value]) => (
                        <div key={key}>
                          <div className="flex justify-between mb-2">
                            <span className="font-medium capitalize">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                            <div className="flex space-x-4">
                              <span className="font-bold">
                                {typeof value === 'object' ? value.team1 : value}
                              </span>
                              {typeof value === 'object' && value.team2 && (
                                <span className="font-bold">{value.team2}</span>
                              )}
                            </div>
                          </div>
                          {typeof value === 'object' && typeof value.team1 === 'number' && (
                            <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="absolute left-0 h-full bg-blue-600 rounded-full"
                                style={{
                                  width: `${(value.team1 / (value.team1 + value.team2)) * 100}%`
                                }}
                              />
                              <div
                                className="absolute right-0 h-full bg-red-600 rounded-full"
                                style={{
                                  width: `${(value.team2 / (value.team1 + value.team2)) * 100}%`
                                }}
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default MatchDetailPage;
