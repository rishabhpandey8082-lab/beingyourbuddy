import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import GuestModeBanner from "@/components/GuestModeBanner";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import AISearch from "./pages/AISearch";
import LanguageLearning from "./pages/LanguageLearning";
import IELTSPractice from "./pages/IELTSPractice";
import GoetheExam from "./pages/GoetheExam";
import InterviewPractice from "./pages/InterviewPractice";
import BlitixKids from "./pages/BlitixKids";
import About from "./pages/About";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <GuestModeBanner />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/search" element={<AISearch />} />
            <Route path="/language" element={<LanguageLearning />} />
            <Route path="/ielts" element={<IELTSPractice />} />
            <Route path="/goethe" element={<GoetheExam />} />
            <Route path="/interview" element={<InterviewPractice />} />
            <Route path="/kids" element={<BlitixKids />} />
            <Route path="/about" element={<About />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
