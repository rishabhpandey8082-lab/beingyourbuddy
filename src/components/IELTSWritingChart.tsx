import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { RefreshCw, Download, ZoomIn, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface IELTSWritingChartProps {
  chartType: "bar" | "line" | "pie" | "table" | "process" | "map";
  topic: string;
  onChartGenerated?: (description: string) => void;
}

// Sample chart data for each type
const chartConfigs: Record<string, { prompt: string; description: string }> = {
  bar: {
    prompt: "A professional bar chart showing internet usage statistics across 4 countries (USA, UK, Germany, Japan) from 2010 to 2020, with clear axis labels, legend, and percentage values. Clean white background, professional academic style suitable for IELTS exam.",
    description: "The bar chart compares the percentage of households with internet access in four countries (USA, UK, Germany, and Japan) between 2010 and 2020."
  },
  line: {
    prompt: "A professional line graph showing population growth trends in 3 cities over 50 years from 1970 to 2020, with multiple colored lines, clear grid, axis labels and legend. Clean academic style for IELTS exam.",
    description: "The line graph illustrates the population growth in three major cities over a 50-year period from 1970 to 2020."
  },
  pie: {
    prompt: "Two professional pie charts comparing household energy consumption by sector in 2000 vs 2020, showing heating, cooling, appliances, and lighting percentages. Clean academic style with clear labels for IELTS exam.",
    description: "The pie charts compare the distribution of household energy consumption across different sectors in 2000 and 2020."
  },
  table: {
    prompt: "A professional data table showing student enrollment numbers across 5 university faculties for years 2018-2022, with clear headers, rows, and columns. Academic style suitable for IELTS exam.",
    description: "The table shows the number of students enrolled in five different university faculties from 2018 to 2022."
  },
  process: {
    prompt: "A professional process diagram showing the stages of recycling plastic bottles, with arrows, numbered steps, and clear labels. Clean academic infographic style for IELTS exam.",
    description: "The diagram illustrates the process of recycling plastic bottles, from collection to the production of new products."
  },
  map: {
    prompt: "Two professional maps showing the development of a town center in 1990 and 2020, showing buildings, roads, parks, and facilities. Clean architectural style suitable for IELTS exam.",
    description: "The maps compare the layout of a town center in 1990 and 2020, showing significant changes in infrastructure and land use."
  }
};

const IELTSWritingChart = ({ chartType, topic, onChartGenerated }: IELTSWritingChartProps) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    generateChart();
  }, [chartType, topic]);

  const generateChart = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        // Use placeholder for non-authenticated users
        setImageUrl(null);
        onChartGenerated?.(chartConfigs[chartType]?.description || "Chart data visualization");
        setIsLoading(false);
        return;
      }

      const config = chartConfigs[chartType] || chartConfigs.bar;
      
      // Use Lovable AI Gateway to generate chart
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image-preview",
          messages: [
            {
              role: "user",
              content: config.prompt
            }
          ],
          modalities: ["image", "text"]
        })
      });

      if (!response.ok) {
        throw new Error("Failed to generate chart");
      }

      const data = await response.json();
      const generatedImageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

      if (generatedImageUrl) {
        setImageUrl(generatedImageUrl);
        onChartGenerated?.(config.description);
      } else {
        // Fallback to description only
        onChartGenerated?.(config.description);
      }
    } catch (err) {
      console.error("Chart generation error:", err);
      setError("Could not generate chart. Using description instead.");
      onChartGenerated?.(chartConfigs[chartType]?.description || "Chart visualization");
    } finally {
      setIsLoading(false);
    }
  };

  const downloadChart = () => {
    if (imageUrl) {
      const link = document.createElement("a");
      link.href = imageUrl;
      link.download = `ielts-chart-${chartType}.png`;
      link.click();
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative aspect-video bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-2xl overflow-hidden border border-border">
        {isLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Generating chart...</p>
          </div>
        ) : imageUrl ? (
          <motion.img
            src={imageUrl}
            alt={`IELTS Writing Task 1 ${chartType} chart`}
            className={`w-full h-full object-contain cursor-zoom-in transition-transform ${
              isZoomed ? "scale-150" : ""
            }`}
            onClick={() => setIsZoomed(!isZoomed)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <span className="text-4xl">
                {chartType === "bar" ? "📊" : 
                 chartType === "line" ? "📈" : 
                 chartType === "pie" ? "🥧" : 
                 chartType === "table" ? "📋" :
                 chartType === "process" ? "🔄" : "🗺️"}
              </span>
            </div>
            <div className="max-w-md">
              <h3 className="font-semibold text-lg mb-2 capitalize">{chartType} Chart</h3>
              <p className="text-sm text-muted-foreground">
                {chartConfigs[chartType]?.description || "Visualize and analyze the data presented."}
              </p>
            </div>
            {error && (
              <p className="text-xs text-amber-600">{error}</p>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl"
          onClick={generateChart}
          disabled={isLoading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Generate New Chart
        </Button>
        {imageUrl && (
          <>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={() => setIsZoomed(!isZoomed)}
            >
              <ZoomIn className="w-4 h-4 mr-2" />
              {isZoomed ? "Zoom Out" : "Zoom In"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={downloadChart}
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default IELTSWritingChart;
