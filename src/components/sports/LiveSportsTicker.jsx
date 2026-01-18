import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Trophy, Clock, TrendingUp } from 'lucide-react';
import { getLiveMatches } from '@/lib/sportsService';

const LiveSportsTicker = () => {
  const [matches, setMatches] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const data = await getLiveMatches();
        setMatches(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching matches:', error);
        setLoading(false);
      }
    };

    fetchMatches();
    const interval = setInterval(fetchMatches, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (matches.length > 0) {
      const ticker = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % matches.length);
      }, 5000); // Change match every 5 seconds

      return () => clearInterval(ticker);
    }
  }, [matches]);

  const handleMatchClick = (matchId) => {
    navigate(`/match/${matchId}`);
  };

  if (loading || matches.length === 0) {
    return (
      <div className="bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 text-white py-2">
        <div className="container mx-auto px-4 flex items-center justify-center">
          <Clock className="h-4 w-4 animate-spin mr-2" />
          <span className="text-sm">लाइव स्कोर लोड हो रहा है...</span>
        </div>
      </div>
    );
  }

  const currentMatch = matches[currentIndex];

  return (
    <div className="bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 text-white py-2.5 cursor-pointer hover:opacity-90 transition-opacity overflow-hidden">
      <div className="container mx-auto px-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="flex items-center justify-between"
            onClick={() => handleMatchClick(currentMatch.id)}
          >
            {/* Left Section - Sport & Tournament */}
            <div className="flex items-center space-x-2 min-w-0 flex-1">
              <Trophy className="h-4 w-4 flex-shrink-0 animate-pulse" />
              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 min-w-0">
                <span className="font-bold text-xs sm:text-sm flex-shrink-0">
                  {currentMatch.sport}
                </span>
                <span className="text-xs opacity-90 truncate">
                  {currentMatch.tournament}
                </span>
              </div>
            </div>

            {/* Center Section - Score */}
            <div className="flex items-center space-x-3 px-4 min-w-0 flex-1 justify-center">
              <div className="text-right">
                <div className="font-semibold text-sm sm:text-base flex items-center justify-end space-x-1">
                  <span className="hidden sm:inline">{currentMatch.team1.name}</span>
                  <span className="sm:hidden">{currentMatch.team1.shortName}</span>
                  <span>{currentMatch.team1.flag}</span>
                </div>
                <div className="text-xl sm:text-2xl font-bold">
                  {currentMatch.team1.score}
                  {currentMatch.team1.overs && (
                    <span className="text-xs sm:text-sm ml-1">
                      ({currentMatch.team1.overs})
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-center">
                <span className="text-xs font-semibold opacity-75">vs</span>
                {currentMatch.isLive && (
                  <span className="relative flex h-2 w-2 mt-1">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                )}
              </div>

              <div className="text-left">
                <div className="font-semibold text-sm sm:text-base flex items-center space-x-1">
                  <span>{currentMatch.team2.flag}</span>
                  <span className="hidden sm:inline">{currentMatch.team2.name}</span>
                  <span className="sm:hidden">{currentMatch.team2.shortName}</span>
                </div>
                <div className="text-xl sm:text-2xl font-bold">
                  {currentMatch.team2.score}
                  {currentMatch.team2.overs && (
                    <span className="text-xs sm:text-sm ml-1">
                      ({currentMatch.team2.overs})
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right Section - Status */}
            <div className="flex items-center space-x-2 min-w-0 flex-1 justify-end">
              {currentMatch.isLive && (
                <TrendingUp className="h-4 w-4 flex-shrink-0 animate-bounce" />
              )}
              <div className="text-right">
                <div className="text-xs sm:text-sm font-semibold">
                  {currentMatch.isLive ? (
                    <span className="bg-red-500 px-2 py-1 rounded-full text-xs">LIVE</span>
                  ) : (
                    <span className="opacity-90">Finished</span>
                  )}
                </div>
                <div className="text-xs opacity-90 hidden sm:block truncate max-w-xs">
                  {currentMatch.status}
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Pagination Dots */}
        <div className="flex justify-center space-x-1 mt-2">
          {matches.map((_, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(index);
              }}
              className={`h-1.5 rounded-full transition-all ${
                index === currentIndex
                  ? 'w-6 bg-white'
                  : 'w-1.5 bg-white/50 hover:bg-white/75'
              }`}
              aria-label={`View match ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default LiveSportsTicker;
