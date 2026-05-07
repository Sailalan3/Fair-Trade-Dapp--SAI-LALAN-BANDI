import React, { useState, useEffect } from "react";
import { Sparkles, TrendingUp, TrendingDown, Minus, AlertTriangle, ChevronDown, ChevronUp, BarChart3, Clock, Zap } from "lucide-react";
import { getAIInsights } from "../utils/aiEngine";
import { useAuth } from "../context/AuthContext";

const TREND_COLORS = {
  good: "text-green-600 bg-green-50",
  warning: "text-amber-600 bg-amber-50",
  bad: "text-red-600 bg-red-50",
  neutral: "text-[#2a7c7c] bg-[#e6f3f3]",
};

const TREND_ICONS = {
  good: TrendingUp,
  warning: AlertTriangle,
  bad: TrendingDown,
  neutral: Minus,
};

export default function AIInsightsPanel({ compact = false }) {
  const { user } = useAuth();
  const [insights, setInsights] = useState([]);
  const [expanded, setExpanded] = useState(!compact);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    refreshInsights();
    // Auto-refresh every 30s
    const interval = setInterval(refreshInsights, 30000);
    return () => clearInterval(interval);
  }, [user?.email]);

  const refreshInsights = () => {
    const data = getAIInsights(user?.email);
    setInsights(data);
    setLastUpdated(new Date());
  };

  if (insights.length === 0 && compact) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-[#2a7c7c] to-[#1d5c5c] text-white hover:from-[#1d5c5c] hover:to-[#1a4a4a] transition"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-sm">AI Insights & Analytics</h3>
            <p className="text-white/60 text-[10px]">
              {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Analyzing..."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {insights.filter(i => i.trend === "warning" || i.trend === "bad").length > 0 && (
            <span className="px-2 py-0.5 bg-amber-400/20 text-amber-200 text-[10px] font-semibold rounded-full">
              {insights.filter(i => i.trend === "warning" || i.trend === "bad").length} alert{insights.filter(i => i.trend === "warning" || i.trend === "bad").length > 1 ? "s" : ""}
            </span>
          )}
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Insights Grid */}
      {expanded && (
        <div className="p-4">
          {insights.length === 0 ? (
            <div className="text-center py-6">
              <BarChart3 className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">No insights available yet. Add products and transactions to generate analytics.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {insights.map((insight, i) => {
                const TrendIcon = TREND_ICONS[insight.trend] || Minus;
                const colorClass = TREND_COLORS[insight.trend] || TREND_COLORS.neutral;
                return (
                  <div key={i} className="border border-gray-100 rounded-xl p-4 hover:shadow-md transition group">
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-2xl">{insight.icon}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${colorClass}`}>
                        <TrendIcon className="w-3 h-3 inline mr-0.5" />
                        {insight.trend === "good" ? "Good" : insight.trend === "warning" ? "Alert" : insight.trend === "bad" ? "Critical" : "Info"}
                      </span>
                    </div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{insight.title}</h4>
                    <p className="text-lg font-bold text-[#2c3e50] mt-0.5">{insight.value}</p>
                    <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">{insight.description}</p>

                    {/* Stage distribution chart */}
                    {insight.type === "distribution" && insight.data && (
                      <div className="mt-3 space-y-1.5">
                        {Object.entries(insight.data).slice(0, 5).map(([stage, count]) => {
                          const max = Math.max(...Object.values(insight.data));
                          const pct = (count / max) * 100;
                          return (
                            <div key={stage} className="flex items-center gap-2">
                              <span className="text-[10px] text-gray-500 w-20 truncate">{stage}</span>
                              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-[#2a7c7c] rounded-full transition-all" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="text-[10px] font-semibold text-gray-600 w-6 text-right">{count}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Refresh button */}
          <div className="flex items-center justify-center mt-3">
            <button onClick={refreshInsights}
              className="flex items-center gap-1.5 text-[11px] text-[#2a7c7c] hover:text-[#1d5c5c] font-medium transition">
              <Zap className="w-3 h-3" /> Refresh Insights
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
